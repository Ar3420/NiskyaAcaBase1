import type { EntityType } from "./types";
import type { HelixSession } from "./auth";
import { createSupabaseServiceClient } from "./supabase";

export async function updateEntityFromSnapshot({
  entityType,
  entityId,
  snapshot,
  changeSummary,
  session,
}: {
  entityType: EntityType;
  entityId: string;
  snapshot: Record<string, unknown>;
  changeSummary: string;
  session: HelixSession;
}) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, error: "Supabase service client is not configured." };
  }

  const table = entityTable(entityType);
  const { data: previous, error: previousError } = await supabase.from(table).select("*").eq("id", entityId).maybeSingle();
  if (previousError || !previous) {
    return { ok: false, error: "Could not load the current Supabase row for this page." };
  }

  const update = snapshotToUpdate(entityType, snapshot, session.memberId);
  const { error: updateError } = await supabase.from(table).update(update).eq("id", entityId);
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const revisionRecord = {
    entity_type: entityType,
    entity_id: entityId,
    edited_by_member_id: session.memberId,
    edited_by_display_name: session.displayName,
    edited_by_role: session.roles[0],
    edited_by_status: session.status,
    change_summary: changeSummary || "Updated database page.",
    previous_snapshot_json: previous,
    new_snapshot_json: snapshot,
  };

  const { error: revisionError } = await supabase.from("revisions").insert(revisionRecord);

  if (revisionError) {
    const { error: fallbackRevisionError } = await supabase.from("revisions").insert({
      entity_type: revisionRecord.entity_type,
      entity_id: revisionRecord.entity_id,
      edited_by_member_id: revisionRecord.edited_by_member_id,
      edited_by_display_name: revisionRecord.edited_by_display_name,
      change_summary: revisionRecord.change_summary,
      previous_snapshot_json: revisionRecord.previous_snapshot_json,
      new_snapshot_json: revisionRecord.new_snapshot_json,
    });

    if (fallbackRevisionError) {
      return { ok: false, error: `Saved the page, but failed to record revision: ${fallbackRevisionError.message}` };
    }
  }

  return { ok: true };
}

export async function createEntityFromSnapshot({
  entityType,
  snapshot,
  changeSummary,
  session,
}: {
  entityType: EntityType;
  snapshot: Record<string, unknown>;
  changeSummary: string;
  session: HelixSession;
}) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, error: "Supabase service client is not configured.", slug: undefined as string | undefined };
  }

  const table = entityTable(entityType);
  const insert = snapshotToInsert(entityType, snapshot, session.memberId);
  const { data: created, error: insertError } = await supabase.from(table).insert(insert).select("id, slug").single();
  if (insertError || !created) {
    return { ok: false, error: insertError?.message ?? "Could not create the database page.", slug: undefined as string | undefined };
  }

  await supabase.from("revisions").insert({
    entity_type: entityType,
    entity_id: created.id,
    edited_by_member_id: session.memberId,
    edited_by_display_name: session.displayName,
    edited_by_role: session.roles[0],
    edited_by_status: session.status,
    change_summary: changeSummary || "Created database page.",
    previous_snapshot_json: null,
    new_snapshot_json: snapshot,
  });

  return { ok: true, slug: created.slug as string };
}

function entityTable(entityType: EntityType) {
  if (entityType === "class") return "classes";
  if (entityType === "subject") return "subjects";
  if (entityType === "principle") return "principles";
  if (entityType === "assignment") return "assignments";
  return "resources";
}

function snapshotToInsert(entityType: EntityType, snapshot: Record<string, unknown>, memberId: string) {
  return removeUndefined({
    ...snapshotToUpdate(entityType, snapshot, memberId),
    created_by_member_id: memberId,
  });
}

function snapshotToUpdate(entityType: EntityType, snapshot: Record<string, unknown>, memberId: string) {
  const base = {
    slug: stringValue(snapshot.slug),
    title: stringValue(snapshot.title),
    metadata_json: snapshotToMetadata(entityType, snapshot),
    updated_by_member_id: memberId,
    published: booleanValue(snapshot.published),
  };

  if (entityType === "class") {
    return removeUndefined({
      ...base,
      department: stringValue(snapshot.department),
      grade_levels: stringArray(snapshot.gradeLevels),
      overview: stringValue(snapshot.overview),
    });
  }

  if (entityType === "subject") {
    return removeUndefined({
      ...base,
      overview: stringValue(snapshot.overview),
    });
  }

  if (entityType === "principle") {
    return removeUndefined({
      ...base,
      overview: stringValue(snapshot.overview),
    });
  }

  if (entityType === "assignment") {
    return removeUndefined({
      ...base,
      assignment_type: stringValue(snapshot.assignmentType),
      due_date: stringValue(snapshot.dueDate),
      description: stringValue(snapshot.description),
    });
  }

  return removeUndefined({
    ...base,
    resource_type: stringValue(snapshot.resourceType),
    description: stringValue(snapshot.description),
    content_body: stringValue(snapshot.contentBody),
    external_url: stringValue(snapshot.externalUrl),
    file_url: stringValue(snapshot.fileUrl),
  });
}

function snapshotToMetadata(entityType: EntityType, snapshot: Record<string, unknown>) {
  if (entityType === "class") {
    return removeUndefined({
      units: unitTopics(snapshot.units),
      related_subjects: stringArray(snapshot.relatedSubjectSlugs),
      assignments: stringArray(snapshot.assignmentSlugs),
      resources: stringArray(snapshot.resourceSlugs),
      related_links: relatedLinks(snapshot.relatedLinks),
    });
  }

  if (entityType === "subject") {
    return removeUndefined({
      subtopics: unitTopics(snapshot.subtopics),
      related_classes: stringArray(snapshot.relatedClassSlugs),
      related_assignments: stringArray(snapshot.relatedAssignmentSlugs),
      resources: stringArray(snapshot.resourceSlugs),
      related_links: relatedLinks(snapshot.relatedLinks),
    });
  }

  if (entityType === "principle") {
    return removeUndefined({
      details: unitTopics(snapshot.details),
      related_classes: stringArray(snapshot.relatedClassSlugs),
      related_subjects: stringArray(snapshot.relatedSubjectSlugs),
      related_assignments: stringArray(snapshot.relatedAssignmentSlugs),
      resources: stringArray(snapshot.resourceSlugs),
      related_links: relatedLinks(snapshot.relatedLinks),
    });
  }

  if (entityType === "assignment") {
    return removeUndefined({
      class_slug: stringValue(snapshot.classSlug),
      related_subjects: stringArray(snapshot.relatedSubjectSlugs),
      related_principles: stringArray(snapshot.relatedPrincipleSlugs),
      resources: stringArray(snapshot.resourceSlugs),
      related_links: relatedLinks(snapshot.relatedLinks),
    });
  }

  return removeUndefined({
    related_classes: stringArray(snapshot.relatedClassSlugs),
    related_subjects: stringArray(snapshot.relatedSubjectSlugs),
    related_assignments: stringArray(snapshot.relatedAssignmentSlugs),
    related_links: relatedLinks(snapshot.relatedLinks),
    contributor: stringValue(snapshot.contributor),
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}

function unitTopics(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  return value
    .map((item) => {
      if (typeof item === "string") return { title: item, body: "" };
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return {
          title: stringValue(record.title) ?? "",
          body: stringValue(record.body) ?? "",
        };
      }
      return { title: "", body: "" };
    })
    .filter((item) => item.title);
}

function relatedLinks(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const label = stringValue(record.label) ?? "";
      const href = stringValue(record.href) ?? "";
      return label && href ? { label, href } : null;
    })
    .filter((item): item is { label: string; href: string } => Boolean(item));
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
