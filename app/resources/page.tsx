import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, LinkIcon } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { getHelixSession } from "@/lib/auth";
import { getAssignments, getClasses, getPrinciples, getResources, getSubjects } from "@/lib/database";
import { parseManualRelatedLinks, referenceTargets, resolveReferences } from "@/lib/editParsing";
import { buildDatabaseLinkTargets } from "@/lib/linkTargets";
import { createEntityFromSnapshot } from "@/lib/mutations";
import type { AssignmentEntry, ClassEntry, ResourceEntry, SubjectEntry } from "@/lib/types";

const resourceTypes = ["notes", "study guide", "practice", "packet", "template", "video", "website", "document", "other"];

type ResourceSearchParams = {
  q?: string;
  type?: string;
  class?: string;
  subject?: string;
  assignment?: string;
};

export default async function ResourcesPage({ searchParams }: { searchParams?: Promise<ResourceSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const selectedType = resolvedSearchParams?.type ?? "";
  const selectedClass = resolvedSearchParams?.class ?? "";
  const selectedSubject = resolvedSearchParams?.subject ?? "";
  const selectedAssignment = resolvedSearchParams?.assignment ?? "";
  const [resources, classes, subjects, principles, assignments, session] = await Promise.all([
    getResources(),
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getAssignments(),
    getHelixSession(),
  ]);
  const linkTargets = buildDatabaseLinkTargets({ classes, subjects, principles, assignments, resources });
  const normalizedQuery = query.toLowerCase();
  const filteredResources = resources
    .filter((entry) => !selectedType || entry.resourceType.toLowerCase() === selectedType.toLowerCase())
    .filter((entry) => !selectedClass || entry.relatedClassSlugs.includes(selectedClass))
    .filter((entry) => !selectedSubject || entry.relatedSubjectSlugs.includes(selectedSubject))
    .filter((entry) => !selectedAssignment || entry.relatedAssignmentSlugs.includes(selectedAssignment))
    .filter((entry) => {
      if (!normalizedQuery) return true;
      return [entry.title, entry.resourceType, entry.description, entry.contentBody, entry.contributor]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  async function createResourceAction(formData: FormData) {
    "use server";

    const activeSession = await getHelixSession();
    if (!activeSession) redirect("/login?next=/resources");

    const title = textField(formData, "title");
    const slug = textField(formData, "slug") || slugify(title);
    const snapshot = {
      title,
      slug,
      resourceType: textField(formData, "resourceType") || "Resource",
      description: textField(formData, "description"),
      contentBody: textField(formData, "contentBody"),
      externalUrl: textField(formData, "externalUrl"),
      fileUrl: textField(formData, "fileUrl"),
      relatedClassSlugs: resolveReferences(textField(formData, "relatedClassSlugs"), referenceTargets(classes, "classes")),
      relatedSubjectSlugs: resolveReferences(textField(formData, "relatedSubjectSlugs"), referenceTargets(subjects, "subjects")),
      relatedAssignmentSlugs: resolveReferences(textField(formData, "relatedAssignmentSlugs"), referenceTargets(assignments, "assignments")),
      relatedLinks: parseManualRelatedLinks(textField(formData, "relatedLinks"), linkTargets),
      contributor: textField(formData, "contributor") || activeSession.displayName || activeSession.memberId,
      published: true,
    };
    const result = await createEntityFromSnapshot({
      entityType: "resource",
      snapshot,
      changeSummary: "Created resource page.",
      session: activeSession,
    });

    if (!result.ok || !result.slug) redirect(`/resources?error=${encodeURIComponent(result.error ?? "Create failed")}`);
    redirect(`/resources/${result.slug}?edit=1`);
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Reusable database materials</p>
            <h1 className="font-serif text-4xl font-semibold">Resources</h1>
            <p className="mt-2 max-w-3xl text-muted">
              Notes, study guides, packets, templates, websites, videos, and other materials connected to classes,
              subjects, assignments, and principles.
            </p>
          </div>
          <div className="text-sm text-muted">
            {filteredResources.length} resource{filteredResources.length === 1 ? "" : "s"} shown
          </div>
        </div>

        <form className="mt-6 grid gap-3 bg-white p-4 md:grid-cols-6">
          <input name="q" defaultValue={query} placeholder="Search resources" className="border border-line bg-paper px-3 py-2 text-sm md:col-span-2" />
          <select name="type" defaultValue={selectedType} className="border border-line bg-paper px-3 py-2 text-sm">
            <option value="">All types</option>
            {resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select name="class" defaultValue={selectedClass} className="border border-line bg-paper px-3 py-2 text-sm">
            <option value="">All classes</option>
            {classes.map((course) => <option key={course.slug} value={course.slug}>{course.title}</option>)}
          </select>
          <select name="subject" defaultValue={selectedSubject} className="border border-line bg-paper px-3 py-2 text-sm">
            <option value="">All subjects</option>
            {subjects.map((subject) => <option key={subject.slug} value={subject.slug}>{subject.title}</option>)}
          </select>
          <button className="border border-nisky bg-nisky px-3 py-2 text-sm font-medium text-white">Apply filters</button>
          <select name="assignment" defaultValue={selectedAssignment} className="border border-line bg-paper px-3 py-2 text-sm md:col-span-2">
            <option value="">All assignments and tests</option>
            {assignments.map((assignment) => <option key={assignment.slug} value={assignment.slug}>{assignment.title}</option>)}
          </select>
        </form>

        <details className="mt-4 border border-gold bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-nisky">Add a resource</summary>
          {session ? (
            <form action={createResourceAction} className="grid gap-3 border-t border-line bg-paper p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <input name="title" required placeholder="Resource title" className="border border-line bg-white px-3 py-2 text-sm" />
                <input name="slug" placeholder="Slug, optional" className="border border-line bg-white px-3 py-2 text-sm" />
                <select name="resourceType" defaultValue="notes" className="border border-line bg-white px-3 py-2 text-sm">
                  {resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input name="externalUrl" placeholder="External URL, optional" className="border border-line bg-white px-3 py-2 text-sm" />
                <input name="fileUrl" placeholder="File URL, optional" className="border border-line bg-white px-3 py-2 text-sm" />
                <input name="contributor" placeholder="Contributor name, optional" className="border border-line bg-white px-3 py-2 text-sm" />
              </div>
              <textarea name="description" rows={3} placeholder="Short resource description" className="border border-line bg-white px-3 py-2 text-sm" />
              <textarea name="contentBody" rows={5} placeholder="Resource notes, summary, usage instructions, or embedded page text" className="border border-line bg-white px-3 py-2 text-sm" />
              <div className="grid gap-3 md:grid-cols-3">
                <input name="relatedClassSlugs" placeholder="Related class links, titles, or slugs" className="border border-line bg-white px-3 py-2 text-sm" />
                <input name="relatedSubjectSlugs" placeholder="Related subject links, titles, or slugs" className="border border-line bg-white px-3 py-2 text-sm" />
                <input name="relatedAssignmentSlugs" placeholder="Related assignment links, titles, or slugs" className="border border-line bg-white px-3 py-2 text-sm" />
              </div>
              <textarea name="relatedLinks" rows={3} placeholder="Related links, one per line: page title, page URL, or Label | URL" className="border border-line bg-white px-3 py-2 text-sm" />
              <button className="w-fit border border-nisky bg-nisky px-4 py-2 text-sm font-medium text-white">Create resource</button>
            </form>
          ) : (
            <p className="border-t border-line p-4 text-sm text-muted">
              <Link href="/login?next=/resources">Log in</Link> as a Helix member to add a resource.
            </p>
          )}
        </details>

        <div className="mt-6 divide-y divide-line bg-white">
          {filteredResources.length === 0 ? (
            <p className="p-4 text-sm text-muted">No resources match the current filters.</p>
          ) : (
            filteredResources.map((entry) => (
              <ResourceRow
                key={entry.id}
                entry={entry}
                classes={classes}
                subjects={subjects}
                assignments={assignments}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function ResourceRow({
  entry,
  classes,
  subjects,
  assignments,
}: {
  entry: ResourceEntry;
  classes: ClassEntry[];
  subjects: SubjectEntry[];
  assignments: AssignmentEntry[];
}) {
  const relatedClasses = classes.filter((course) => entry.relatedClassSlugs.includes(course.slug));
  const relatedSubjects = subjects.filter((subject) => entry.relatedSubjectSlugs.includes(subject.slug));
  const relatedAssignments = assignments.filter((assignment) => entry.relatedAssignmentSlugs.includes(assignment.slug));
  const primaryRelation = [...relatedClasses, ...relatedSubjects, ...relatedAssignments].map((item) => item.title).join(" - ") || "Unlinked";

  return (
    <Link href={`/resources/${entry.slug}`} className="grid gap-2 p-4 hover:bg-paper md:grid-cols-[170px_1fr_190px]">
      <span className="inline-flex items-start gap-2 text-sm font-medium capitalize">
        <FileText className="mt-0.5 h-4 w-4 text-nisky" aria-hidden="true" />
        {entry.resourceType}
      </span>
      <span>
        <strong className="font-serif text-xl">{entry.title}</strong>
        <span className="mt-1 block text-sm text-muted">{entry.description || "No description has been added yet."}</span>
        {entry.externalUrl || entry.fileUrl ? (
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-gold">
            <LinkIcon className="h-3 w-3" aria-hidden="true" />
            {entry.externalUrl ? "External link" : "Attached file"}
          </span>
        ) : null}
      </span>
      <span className="text-sm text-muted">{primaryRelation}</span>
    </Link>
  );
}

function textField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
