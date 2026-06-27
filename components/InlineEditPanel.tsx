import { redirect } from "next/navigation";
import Link from "next/link";
import { EditableTextArea } from "@/components/EditableTextArea";
import { canEdit, canModerate, getHelixSession } from "@/lib/auth";
import { parseManualRelatedLinks } from "@/lib/editParsing";
import { updateEntityFromSnapshot } from "@/lib/mutations";
import type { AssignmentEntry, ClassEntry, EntityType, PrincipleEntry, ResourceEntry, SubjectEntry } from "@/lib/types";

type EditableEntry = ClassEntry | SubjectEntry | PrincipleEntry | AssignmentEntry | ResourceEntry;

export async function InlineEditPanel({
  entityType,
  entry,
  error,
  formId = `${entityType}-edit-form`,
}: {
  entityType: EntityType;
  entry: EditableEntry;
  error?: string;
  formId?: string;
}) {
  const session = await getHelixSession();
  const allowed = canEdit(session);
  const boardAllowed = canModerate(session);
  const currentPublished = entry.published;
  const entityId = entry.id;

  async function saveAction(formData: FormData) {
    "use server";

    const activeSession = await getHelixSession();
    if (!activeSession) redirect(`/${entityPath(entityType)}/${entry.slug}?edit=1`);

    const snapshot = buildSnapshot(entityType, formData, currentPublished, canModerate(activeSession));
    const changeSummary = String(formData.get("changeSummary") ?? "");
    const result = await updateEntityFromSnapshot({
      entityType,
      entityId,
      snapshot,
      changeSummary,
      session: activeSession,
    });

    if (!result.ok) {
      redirect(`/${entityPath(entityType)}/${entry.slug}?edit=1&error=${encodeURIComponent(result.error ?? "Save failed")}`);
    }

    redirect(`/${entityPath(entityType)}/${snapshot.slug}`);
  }

  return (
    <section className="mb-8 border border-gold bg-paper p-4">
      <div className="flex flex-col gap-2 border-b border-line pb-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Inline editing</p>
          <h2 className="font-serif text-2xl font-semibold">Edit this database page</h2>
          <p className="mt-1 text-sm text-muted">Save changes here without leaving the article. Every save records a revision.</p>
        </div>
        <Link href={`/${entityPath(entityType)}/${entry.slug}`} className="text-sm font-medium text-nisky">
          Close editor
        </Link>
      </div>

      {!allowed ? (
        <p className="mt-4 border border-line bg-white p-4 text-muted">Editing is restricted to logged-in Helix members.</p>
      ) : null}

      {error ? <p className="mt-4 border border-nisky bg-nisky/5 p-3 text-sm text-nisky">{error}</p> : null}

      <form id={formId} action={saveAction} className="mt-5 grid gap-5">
        <div className="grid gap-4 border border-line bg-white p-4">
          <h3 className="font-serif text-xl font-semibold">Page basics</h3>
          <Field label="Title" name="title" defaultValue={entry.title} disabled={!allowed} required />
          <Field label="Slug" name="slug" defaultValue={entry.slug} disabled={!allowed} required />
          <Field label="Change summary" name="changeSummary" defaultValue="" disabled={!allowed} placeholder="Briefly describe what changed" />
        </div>

        {renderEntityFields(entityType, entry, !allowed)}

        <div className="grid gap-3 border border-line bg-white p-4">
          <h3 className="font-serif text-xl font-semibold">Board controls</h3>
          {boardAllowed ? (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input name="published" type="checkbox" defaultChecked={entry.published} disabled={!allowed} />
              Published and visible to public users
            </label>
          ) : (
            <>
              <input type="hidden" name="published" value={entry.published ? "on" : ""} />
              <p className="text-sm text-muted">Only board members, admins, and founders can change publication state.</p>
            </>
          )}
        </div>

        <button
          disabled={!allowed}
          className="w-fit border border-nisky bg-nisky px-4 py-2 text-sm font-medium text-white disabled:border-line disabled:bg-line disabled:text-muted"
        >
          Save edit and create revision
        </button>
      </form>
    </section>
  );
}

function renderEntityFields(entityType: EntityType, entry: EditableEntry, disabled: boolean) {
  if (entityType === "class" && "department" in entry) {
    return (
      <div className="grid gap-4 border border-line bg-white p-4">
        <h3 className="font-serif text-xl font-semibold">Class details</h3>
        <Field label="Department" name="department" defaultValue={entry.department} disabled={disabled} />
        <Field label="Grade levels" name="gradeLevels" defaultValue={entry.gradeLevels.join(", ")} disabled={disabled} help="Comma-separated." />
        <TextArea label="Overview" name="overview" defaultValue={entry.overview} disabled={disabled} />
        <TextArea label="Units and topics" name="units" defaultValue={entry.units.map((unit) => `${unit.title}\n${unit.body}`).join("\n\n")} disabled={disabled} help="Heading on first line, description below, blank line between topics." />
        <Field label="Related subject links" name="relatedSubjectSlugs" defaultValue={entry.relatedSubjectSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
        <Field label="Assignment links" name="assignmentSlugs" defaultValue={entry.assignmentSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
        <Field label="Resource links" name="resourceSlugs" defaultValue={entry.resourceSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
      </div>
    );
  }

  if (entityType === "subject" && "subtopics" in entry) {
    return (
      <div className="grid gap-4 border border-line bg-white p-4">
        <h3 className="font-serif text-xl font-semibold">Subject details</h3>
        <TextArea label="Overview" name="overview" defaultValue={entry.overview} disabled={disabled} />
        <TextArea label="Subtopics" name="subtopics" defaultValue={entry.subtopics.map((topic) => `${topic.title}\n${topic.body}`).join("\n\n")} disabled={disabled} help="Heading on first line, description below, blank line between topics." />
        <Field label="Related class links" name="relatedClassSlugs" defaultValue={entry.relatedClassSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
        <Field label="Related assignment links" name="relatedAssignmentSlugs" defaultValue={entry.relatedAssignmentSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
        <Field label="Resource links" name="resourceSlugs" defaultValue={entry.resourceSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
      </div>
    );
  }

  if (entityType === "assignment" && "assignmentType" in entry) {
    return (
      <div className="grid gap-4 border border-line bg-white p-4">
        <h3 className="font-serif text-xl font-semibold">Assignment or test details</h3>
        <TextArea label="Description" name="description" defaultValue={entry.description} disabled={disabled} />
        <Field label="Related subject links" name="relatedSubjectSlugs" defaultValue={entry.relatedSubjectSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
        <Field label="Related principle links" name="relatedPrincipleSlugs" defaultValue={entry.relatedPrincipleSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
        <Field label="Resource links" name="resourceSlugs" defaultValue={entry.resourceSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
      </div>
    );
  }

  if (entityType === "resource" && "resourceType" in entry) {
    return (
      <div className="grid gap-4 border border-line bg-white p-4">
        <h3 className="font-serif text-xl font-semibold">Resource details</h3>
        <TextArea label="Description" name="description" defaultValue={entry.description} disabled={disabled} />
        <TextArea label="Content body" name="contentBody" defaultValue={entry.contentBody} disabled={disabled} />
        <Field label="External URL" name="externalUrl" defaultValue={entry.externalUrl ?? ""} disabled={disabled} />
        <Field label="File URL" name="fileUrl" defaultValue={entry.fileUrl ?? ""} disabled={disabled} />
        <Field label="Related class links" name="relatedClassSlugs" defaultValue={entry.relatedClassSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
        <Field label="Related subject links" name="relatedSubjectSlugs" defaultValue={entry.relatedSubjectSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
        <Field label="Related assignment links" name="relatedAssignmentSlugs" defaultValue={entry.relatedAssignmentSlugs.join(", ")} disabled={disabled} help="Use page URLs or slugs." />
      </div>
    );
  }

  return null;
}

function Field({ label, name, defaultValue, disabled, required = false, type = "text", help, placeholder }: { label: string; name: string; defaultValue: string; disabled: boolean; required?: boolean; type?: string; help?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input name={name} type={type} required={required} disabled={disabled} defaultValue={defaultValue} placeholder={placeholder} className="border border-line bg-white px-3 py-2" />
      {help ? <span className="text-xs font-normal text-muted">{help}</span> : null}
    </label>
  );
}

function TextArea({ label, name, defaultValue, disabled, help }: { label: string; name: string; defaultValue: string; disabled: boolean; help?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <EditableTextArea name={name} disabled={disabled} defaultValue={defaultValue} rows={5} className="border border-line bg-white px-3 py-2" />
      {help ? <span className="text-xs font-normal text-muted">{help}</span> : null}
    </label>
  );
}

function buildSnapshot(entityType: EntityType, formData: FormData, currentPublished: boolean, boardAllowed: boolean) {
  const base = { slug: textField(formData, "slug"), title: textField(formData, "title"), published: boardAllowed ? formData.get("published") === "on" : currentPublished };
  if (entityType === "class") return { ...base, department: textField(formData, "department"), gradeLevels: listField(formData, "gradeLevels"), overview: textField(formData, "overview"), units: unitTopicField(formData, "units"), relatedSubjectSlugs: listField(formData, "relatedSubjectSlugs"), assignmentSlugs: listField(formData, "assignmentSlugs"), resourceSlugs: listField(formData, "resourceSlugs"), relatedLinks: relatedLinksField(formData) };
  if (entityType === "subject") return { ...base, overview: textField(formData, "overview"), subtopics: unitTopicField(formData, "subtopics"), relatedClassSlugs: listField(formData, "relatedClassSlugs"), relatedAssignmentSlugs: listField(formData, "relatedAssignmentSlugs"), resourceSlugs: listField(formData, "resourceSlugs"), relatedLinks: relatedLinksField(formData) };
  if (entityType === "principle") return { ...base, overview: textField(formData, "overview"), details: unitTopicField(formData, "details"), relatedClassSlugs: listField(formData, "relatedClassSlugs"), relatedSubjectSlugs: listField(formData, "relatedSubjectSlugs"), relatedAssignmentSlugs: listField(formData, "relatedAssignmentSlugs"), resourceSlugs: listField(formData, "resourceSlugs"), relatedLinks: relatedLinksField(formData) };
  if (entityType === "assignment") return { ...base, assignmentType: textField(formData, "assignmentType"), classSlug: slugFromReference(textField(formData, "classSlug")), dueDate: textField(formData, "dueDate"), description: textField(formData, "description"), relatedSubjectSlugs: listField(formData, "relatedSubjectSlugs"), relatedPrincipleSlugs: listField(formData, "relatedPrincipleSlugs"), resourceSlugs: listField(formData, "resourceSlugs"), relatedLinks: relatedLinksField(formData) };
  return { ...base, resourceType: textField(formData, "resourceType"), description: textField(formData, "description"), contentBody: textField(formData, "contentBody"), externalUrl: textField(formData, "externalUrl"), fileUrl: textField(formData, "fileUrl"), relatedClassSlugs: listField(formData, "relatedClassSlugs"), relatedSubjectSlugs: listField(formData, "relatedSubjectSlugs"), relatedAssignmentSlugs: listField(formData, "relatedAssignmentSlugs"), contributor: textField(formData, "contributor"), relatedLinks: relatedLinksField(formData) };
}

function textField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function listField(formData: FormData, key: string) {
  return textField(formData, key).split(/[\n,]+/).map((item) => slugFromReference(item.trim())).filter(Boolean);
}

function unitTopicField(formData: FormData, key: string) {
  return textField(formData, key).split(/\n\s*\n/).map((block) => {
    const [title = "", ...bodyLines] = block.split(/\r?\n/);
    return { title: title.trim(), body: bodyLines.join("\n").trim() };
  }).filter((unit) => unit.title);
}

function relatedLinksField(formData: FormData) {
  return parseManualRelatedLinks(textField(formData, "relatedLinks"), []);
}

function slugFromReference(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.pathname.split("/").filter(Boolean).at(-1) ?? "";
  } catch {
    const match = value.match(/^\/(?:classes|subjects|principles|assignments|resources)\/([^/?#]+)$/);
    return match?.[1] ?? value;
  }
}

function entityPath(entityType: EntityType) {
  if (entityType === "class") return "classes";
  if (entityType === "subject") return "subjects";
  if (entityType === "principle") return "principles";
  if (entityType === "assignment") return "assignments";
  return "resources";
}
