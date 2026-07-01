import type { AssignmentEntry, ClassEntry, EntityType, PrincipleEntry, ResourceEntry, Revision, SubjectEntry } from "./types";
import {
  assignments as seedAssignments,
  classes as seedClasses,
  resources as seedResources,
  revisions as seedRevisions,
  searchEntries as searchSeedEntries,
  principles as seedPrinciples,
  subjects as seedSubjects,
  type SearchResult,
} from "./data";
import { createSupabaseServerClient } from "./supabase";

type ClassRow = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  grade_levels: string[] | null;
  overview: string | null;
  metadata_json: Record<string, unknown> | null;
  published: boolean;
  created_at?: string | null;
};

type SubjectRow = {
  id: string;
  slug: string;
  title: string;
  overview: string | null;
  metadata_json: Record<string, unknown> | null;
  published: boolean;
  created_at?: string | null;
};

type PrincipleRow = {
  id: string;
  slug: string;
  title: string;
  overview: string | null;
  metadata_json: Record<string, unknown> | null;
  published: boolean;
  created_at?: string | null;
};

type AssignmentRow = {
  id: string;
  slug: string;
  title: string;
  assignment_type: AssignmentEntry["assignmentType"];
  class_id: string | null;
  due_date: string | null;
  description: string | null;
  metadata_json: Record<string, unknown> | null;
  published: boolean;
  created_at?: string | null;
  classes?: { slug: string; title: string } | null;
};

type ResourceRow = {
  id: string;
  slug: string;
  title: string;
  resource_type: string | null;
  description: string | null;
  content_body: string | null;
  external_url: string | null;
  file_url: string | null;
  metadata_json: Record<string, unknown> | null;
  published: boolean;
  created_at?: string | null;
};

type RevisionRow = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  edited_by_member_id: string | null;
  edited_by_display_name: string | null;
  edited_by_role?: string | null;
  edited_by_status?: string | null;
  change_summary: string | null;
  previous_snapshot_json: Record<string, unknown> | null;
  new_snapshot_json: Record<string, unknown> | null;
  created_at: string;
};

export type RecentActivityEntry = {
  key: string;
  title: string;
  href: string;
  entityType: EntityType;
  action: "created" | "edited";
  createdAt: string;
};

export async function getClasses(): Promise<ClassEntry[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return seedClasses;

  const { data, error } = await supabase.from("classes").select("*").eq("published", true).order("title");
  if (error || !data) return seedClasses;
  return data.map(mapClassRow);
}

export async function getSubjects(): Promise<SubjectEntry[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return seedSubjects;

  const { data, error } = await supabase.from("subjects").select("*").eq("published", true).order("title");
  if (error || !data) return seedSubjects;
  return data.map(mapSubjectRow);
}

export async function getPrinciples(): Promise<PrincipleEntry[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return seedPrinciples;

  const { data, error } = await supabase.from("principles").select("*").eq("published", true).order("title");
  if (error || !data) return seedPrinciples;
  return data.map(mapPrincipleRow);
}

export async function getAssignments(): Promise<AssignmentEntry[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return seedAssignments;

  const { data, error } = await supabase
    .from("assignments")
    .select("*, classes(slug,title)")
    .eq("published", true)
    .order("due_date");

  if (error || !data) return seedAssignments;
  return data.map((row) => mapAssignmentRow(row as AssignmentRow));
}

export async function getResources(): Promise<ResourceEntry[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return seedResources;

  const { data, error } = await supabase.from("resources").select("*").eq("published", true).order("title");
  if (error || !data) return seedResources;
  return data.map(mapResourceRow);
}

export async function getClass(slug: string) {
  const classes = await getClasses();
  return classes.find((entry) => entry.slug === slug);
}

export async function getSubject(slug: string) {
  const subjects = await getSubjects();
  return subjects.find((entry) => entry.slug === slug);
}

export async function getPrinciple(slug: string) {
  const principles = await getPrinciples();
  return principles.find((entry) => entry.slug === slug);
}

export async function getAssignment(slug: string) {
  const assignments = await getAssignments();
  return assignments.find((entry) => entry.slug === slug);
}

export async function getResource(slug: string) {
  const resources = await getResources();
  return resources.find((entry) => entry.slug === slug);
}

export async function getEntity(type: string, slug: string) {
  if (type === "class" || type === "classes") return getClass(slug);
  if (type === "subject" || type === "subjects") return getSubject(slug);
  if (type === "principle" || type === "principles") return getPrinciple(slug);
  if (type === "assignment" || type === "assignments") return getAssignment(slug);
  if (type === "resource" || type === "resources") return getResource(slug);
  return undefined;
}

export async function getEntityRevisions(entityType: EntityType, entityId: string): Promise<Revision[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return seedRevisions.filter((revision) => revision.entityType === entityType && revision.entityId === entityId);

  const { data, error } = await supabase
    .from("revisions")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error || !data) return seedRevisions.filter((revision) => revision.entityType === entityType && revision.entityId === entityId);
  return data.map(mapRevisionRow);
}

export async function getRecentActivity(limit = 5): Promise<RecentActivityEntry[]> {
  const supabase = createSupabaseServerClient();
  const fallback = seedRevisions
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(revisionToActivity)
    .filter((entry): entry is RecentActivityEntry => Boolean(entry));

  if (!supabase) return dedupeRecentActivity(fallback).slice(0, limit);

  const { data, error } = await supabase
    .from("revisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit * 4);

  if (error || !data) return dedupeRecentActivity(fallback).slice(0, limit);

  const activity = (data as RevisionRow[])
    .map((row) => revisionToActivity(mapRevisionRow(row)))
    .filter((entry): entry is RecentActivityEntry => Boolean(entry));

  return dedupeRecentActivity(activity).slice(0, limit);
}

export async function getRecentActivityByType(entityType: EntityType, limit = 5): Promise<RecentActivityEntry[]> {
  const supabase = createSupabaseServerClient();
  const fallback = seedRevisions
    .filter((revision) => revision.entityType === entityType)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(revisionToActivity)
    .filter((entry): entry is RecentActivityEntry => Boolean(entry));

  if (!supabase) return dedupeRecentActivity(fallback).slice(0, limit);

  const { data, error } = await supabase
    .from("revisions")
    .select("*")
    .eq("entity_type", entityType)
    .order("created_at", { ascending: false })
    .limit(limit * 4);

  if (error || !data) return dedupeRecentActivity(fallback).slice(0, limit);

  const activity = (data as RevisionRow[])
    .map((row) => revisionToActivity(mapRevisionRow(row)))
    .filter((entry): entry is RecentActivityEntry => Boolean(entry));

  return dedupeRecentActivity(activity).slice(0, limit);
}

export async function searchEntries(query: string): Promise<SearchResult[]> {
  const normalized = query.trim().toLowerCase();
  const [classes, subjects, principles, assignments, resources] = await Promise.all([
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getAssignments(),
    getResources(),
  ]);

  const searchable: SearchResult[] = [
    ...classes.map((entry) => ({ type: "Class", title: entry.title, href: `/classes/${entry.slug}`, description: entry.overview })),
    ...subjects.map((entry) => ({ type: "Subject", title: entry.title, href: `/subjects/${entry.slug}`, description: entry.overview })),
    ...principles.map((entry) => ({ type: "Principle", title: entry.title, href: `/principles/${entry.slug}`, description: entry.overview })),
    ...assignments.map((entry) => ({
      type: "Assignment/Test",
      title: entry.title,
      href: `/assignments/${entry.slug}`,
      description: entry.description,
      related: classes.find((course) => course.slug === entry.classSlug)?.title,
    })),
    ...resources.map((entry) => ({ type: "Resource", title: entry.title, href: `/resources/${entry.slug}`, description: entry.description })),
  ];

  if (!normalized) return searchable;
  const results = searchable.filter((entry) =>
    [entry.type, entry.title, entry.description, entry.related ?? ""].join(" ").toLowerCase().includes(normalized),
  );
  return results.length > 0 ? results : searchSeedEntries();
}

function revisionToActivity(revision: Revision): RecentActivityEntry | null {
  const snapshot = revision.newSnapshotJson ?? revision.previousSnapshotJson;
  const slug = stringValue(snapshot?.slug);
  const title = stringValue(snapshot?.title);
  if (!slug || !title) return null;

  return {
    key: `${revision.entityType}:${revision.entityId}`,
    title,
    href: `/${entityPath(revision.entityType)}/${slug}`,
    entityType: revision.entityType,
    action: revision.previousSnapshotJson ? "edited" : "created",
    createdAt: revision.createdAt,
  };
}

function dedupeRecentActivity(entries: RecentActivityEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.key)) return false;
    seen.add(entry.key);
    return true;
  });
}

function entityPath(entityType: EntityType) {
  if (entityType === "class") return "classes";
  if (entityType === "subject") return "subjects";
  if (entityType === "principle") return "principles";
  if (entityType === "assignment") return "assignments";
  return "resources";
}

function mapClassRow(row: ClassRow): ClassEntry {
  const metadata = row.metadata_json ?? {};
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department ?? "Uncategorized",
    gradeLevels: row.grade_levels ?? [],
    overview: row.overview ?? "",
    units: unitTopics(metadata.units),
    relatedSubjectSlugs: stringArray(metadata.related_subjects),
    assignmentSlugs: stringArray(metadata.assignments),
    resourceSlugs: stringArray(metadata.resources),
    relatedLinks: relatedLinks(metadata.related_links),
    published: row.published,
    createdAt: row.created_at ?? undefined,
  };
}

function mapSubjectRow(row: SubjectRow): SubjectEntry {
  const metadata = row.metadata_json ?? {};
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    overview: row.overview ?? "",
    subtopics: unitTopics(metadata.subtopics),
    relatedClassSlugs: stringArray(metadata.related_classes),
    relatedAssignmentSlugs: stringArray(metadata.related_assignments),
    resourceSlugs: stringArray(metadata.resources),
    relatedLinks: relatedLinks(metadata.related_links),
    published: row.published,
    createdAt: row.created_at ?? undefined,
  };
}

function mapPrincipleRow(row: PrincipleRow): PrincipleEntry {
  const metadata = row.metadata_json ?? {};
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    overview: row.overview ?? "",
    details: unitTopics(metadata.details),
    relatedClassSlugs: stringArray(metadata.related_classes),
    relatedSubjectSlugs: stringArray(metadata.related_subjects),
    relatedAssignmentSlugs: stringArray(metadata.related_assignments),
    resourceSlugs: stringArray(metadata.resources),
    relatedLinks: relatedLinks(metadata.related_links),
    published: row.published,
    createdAt: row.created_at ?? undefined,
  };
}

function mapAssignmentRow(row: AssignmentRow): AssignmentEntry {
  const metadata = row.metadata_json ?? {};
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    assignmentType: row.assignment_type,
    classSlug: row.classes?.slug ?? stringValue(metadata.class_slug) ?? "",
    dueDate: row.due_date ?? "",
    description: row.description ?? "",
    relatedSubjectSlugs: stringArray(metadata.related_subjects),
    relatedPrincipleSlugs: stringArray(metadata.related_principles),
    resourceSlugs: stringArray(metadata.resources),
    relatedLinks: relatedLinks(metadata.related_links),
    published: row.published,
    createdAt: row.created_at ?? undefined,
  };
}

function mapResourceRow(row: ResourceRow): ResourceEntry {
  const metadata = row.metadata_json ?? {};
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    resourceType: row.resource_type ?? "Resource",
    description: row.description ?? "",
    contentBody: row.content_body ?? "",
    externalUrl: row.external_url ?? undefined,
    fileUrl: row.file_url ?? undefined,
    relatedClassSlugs: stringArray(metadata.related_classes),
    relatedSubjectSlugs: stringArray(metadata.related_subjects),
    relatedAssignmentSlugs: stringArray(metadata.related_assignments),
    relatedLinks: relatedLinks(metadata.related_links),
    contributor: stringValue(metadata.contributor) ?? "Unknown contributor",
    published: row.published,
    createdAt: row.created_at ?? undefined,
  };
}

function mapRevisionRow(row: RevisionRow): Revision {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    editedByMemberId: row.edited_by_member_id ?? "unknown-member",
    editedByDisplayName: row.edited_by_display_name ?? "Unknown contributor",
    editedByRole: row.edited_by_role ?? undefined,
    editedByStatus: row.edited_by_status ?? undefined,
    changeSummary: row.change_summary ?? "Updated page.",
    previousSnapshotJson: row.previous_snapshot_json,
    newSnapshotJson: row.new_snapshot_json,
    createdAt: row.created_at,
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function relatedLinks(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const label = stringValue(record.label) ?? stringValue(record.title) ?? "";
      const href = stringValue(record.href) ?? stringValue(record.url) ?? "";
      return label && href ? { label, href } : null;
    })
    .filter((item): item is { label: string; href: string } => Boolean(item));
}

function unitTopics(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return { title: item, body: "" };
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return {
          title: stringValue(record.title) ?? stringValue(record.heading) ?? "",
          body: stringValue(record.body) ?? stringValue(record.description) ?? "",
        };
      }
      return { title: "", body: "" };
    })
    .filter((item) => item.title);
}
