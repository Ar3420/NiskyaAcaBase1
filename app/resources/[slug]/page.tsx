import { notFound } from "next/navigation";
import { AttributedText } from "@/components/AttributedText";
import { DatabasePageLayout, LinkList, Section } from "@/components/DatabasePageLayout";
import { EditableTextArea } from "@/components/EditableTextArea";
import { InlineEditPanel } from "@/components/InlineEditPanel";
import { getAssignments, getClasses, getEntityRevisions, getPrinciples, getResource, getSubjects } from "@/lib/database";
import { formatRelatedLinks } from "@/lib/editParsing";
import { buildDatabaseLinkTargets } from "@/lib/linkTargets";

export default async function ResourcePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ edit?: string; error?: string }> }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const entry = await getResource(slug);
  if (!entry) notFound();

  const [classes, subjects, principles, assignments, revisions] = await Promise.all([
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getAssignments(),
    getEntityRevisions("resource", entry.id),
  ]);
  const relatedClasses = classes.filter((course) => entry.relatedClassSlugs.includes(course.slug));
  const relatedSubjects = subjects.filter((subject) => entry.relatedSubjectSlugs.includes(subject.slug));
  const relatedAssignments = assignments.filter((assignment) => entry.relatedAssignmentSlugs.includes(assignment.slug));
  const linkTargets = buildDatabaseLinkTargets({
    classes,
    subjects,
    principles,
    assignments,
    resources: [entry],
    currentHref: `/resources/${entry.slug}`,
  });
  const isEditing = resolvedSearchParams?.edit === "1";
  const hasContent = Boolean(entry.contentBody.trim());
  const hasDescription = Boolean(entry.description.trim());
  const visibleToc = [
    hasDescription || isEditing ? "Description" : null,
    hasContent || isEditing ? "Content" : null,
    relatedClasses.length > 0 || isEditing ? "Related classes" : null,
    relatedSubjects.length > 0 || isEditing ? "Related subjects" : null,
    relatedAssignments.length > 0 || isEditing ? "Related assignments" : null,
    entry.contributor || isEditing ? "Contributor information" : null,
    relatedClasses.length + entry.relatedLinks.length > 0 || isEditing ? "Related links" : null,
    "Revision history",
  ].filter((item): item is string => Boolean(item));

  return (
    <DatabasePageLayout
      title={entry.title}
      entityType="resource"
      slug={entry.slug}
      toc={visibleToc}
      infoboxTheme="resource"
      infoRows={[
        { label: "Type", value: entry.resourceType },
        { label: "Contributor", value: entry.contributor },
        { label: "Status", value: entry.published ? "Published" : "Draft" },
      ]}
      infoboxEditor={
        <>
          <InfoboxInput form="resource-edit-form" label="Type" name="resourceType" defaultValue={entry.resourceType} />
          <InfoboxInput form="resource-edit-form" label="Contributor" name="contributor" defaultValue={entry.contributor} />
          <InfoboxStatic label="Status" value={entry.published ? "Published" : "Draft"} />
        </>
      }
      related={<LinkList links={[...relatedClasses.map((course) => ({ href: `/classes/${course.slug}`, label: course.title })), ...entry.relatedLinks]} />}
      relatedEditor={<RelatedLinksEditor form="resource-edit-form" links={entry.relatedLinks} />}
      showRelatedLinks={relatedClasses.length + entry.relatedLinks.length > 0}
      revisions={revisions}
      isEditing={isEditing}
      editPanel={<InlineEditPanel entityType="resource" entry={entry} error={resolvedSearchParams?.error} formId="resource-edit-form" />}
    >
      {hasDescription ? <Section title="Description"><p><AttributedText revisions={revisions} field="description" linkTargets={linkTargets}>{entry.description}</AttributedText></p></Section> : null}
      {hasContent ? <Section title="Content"><p><AttributedText revisions={revisions} field="contentBody" linkTargets={linkTargets}>{entry.contentBody}</AttributedText></p></Section> : null}
      {relatedClasses.length > 0 ? <Section title="Related classes"><LinkList links={relatedClasses.map((course) => ({ href: `/classes/${course.slug}`, label: course.title }))} /></Section> : null}
      {relatedSubjects.length > 0 ? <Section title="Related subjects"><LinkList links={relatedSubjects.map((subject) => ({ href: `/subjects/${subject.slug}`, label: subject.title }))} /></Section> : null}
      {relatedAssignments.length > 0 ? <Section title="Related assignments"><LinkList links={relatedAssignments.map((assignment) => ({ href: `/assignments/${assignment.slug}`, label: assignment.title }))} /></Section> : null}
      {entry.contributor ? <Section title="Contributor information"><p>{entry.contributor}</p></Section> : null}
    </DatabasePageLayout>
  );
}

function InfoboxInput({ form, label, name, defaultValue }: { form: string; label: string; name: string; defaultValue: string }) {
  return (
    <label className="grid gap-1">
      <span className="font-medium text-muted">{label}</span>
      <input form={form} name={name} defaultValue={defaultValue} className="border border-line bg-white px-2 py-1" />
    </label>
  );
}

function InfoboxStatic({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="font-medium text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function RelatedLinksEditor({ form, links }: { form: string; links: { label: string; href: string }[] }) {
  return (
    <EditableTextArea
      form={form}
      name="relatedLinks"
      defaultValue={formatRelatedLinks(links)}
      rows={4}
      placeholder="One per line: page title, page URL, or Label | URL"
      className="w-full border border-line bg-white p-3 text-sm leading-6"
    />
  );
}
