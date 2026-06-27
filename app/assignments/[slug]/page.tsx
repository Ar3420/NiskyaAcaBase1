import Link from "next/link";
import { notFound } from "next/navigation";
import { AttributedText } from "@/components/AttributedText";
import { DatabasePageLayout, LinkList, Section } from "@/components/DatabasePageLayout";
import { InlineEditPanel } from "@/components/InlineEditPanel";
import { SpecificityBranch } from "@/components/SpecificityBranch";
import { getAssignment, getClasses, getEntityRevisions, getPrinciples, getResources, getSubjects } from "@/lib/database";
import { formatRelatedLinks } from "@/lib/editParsing";
import { buildDatabaseLinkTargets } from "@/lib/linkTargets";

export default async function AssignmentPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ edit?: string; error?: string }> }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const entry = await getAssignment(slug);
  if (!entry) notFound();

  const [classes, subjects, principles, resources, revisions] = await Promise.all([
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getResources(),
    getEntityRevisions("assignment", entry.id),
  ]);
  const course = classes.find((item) => item.slug === entry.classSlug);
  const relatedSubjects = subjects.filter((subject) => entry.relatedSubjectSlugs.includes(subject.slug));
  const relatedPrinciples = principles.filter((principle) => entry.relatedPrincipleSlugs.includes(principle.slug));
  const linkedResources = resources.filter((resource) => entry.resourceSlugs.includes(resource.slug));
  const linkTargets = buildDatabaseLinkTargets({
    classes,
    subjects,
    principles,
    assignments: [entry],
    resources,
    currentHref: `/assignments/${entry.slug}`,
  });
  const isEditing = resolvedSearchParams?.edit === "1";
  const visibleToc = [
    entry.description || isEditing ? "Description" : null,
    relatedSubjects.length > 0 || isEditing ? "Related subjects" : null,
    relatedPrinciples.length > 0 || isEditing ? "Related principles" : null,
    linkedResources.length > 0 || isEditing ? "Relevant resources" : null,
    relatedSubjects.length + entry.relatedLinks.length > 0 || isEditing ? "Related links" : null,
    "Revision history",
  ].filter((item): item is string => Boolean(item));

  return (
    <DatabasePageLayout
      title={entry.title}
      entityType="assignment"
      slug={entry.slug}
      toc={visibleToc}
      infoboxTheme="assignment"
      infoRows={[
        { label: "Type", value: entry.assignmentType },
        { label: "Class", value: course ? <Link href={`/classes/${course.slug}`}>{course.title}</Link> : "Class TBD" },
        { label: "Date", value: new Date(`${entry.dueDate}T12:00:00`).toLocaleDateString("en-US", { dateStyle: "long" }) },
        { label: "Specificity", value: "Assignment" },
        { label: "Status", value: entry.published ? "Published" : "Draft" },
      ]}
      infoboxEditor={
        <>
          <label className="grid gap-1">
            <span className="font-medium text-muted">Type</span>
            <select form="assignment-edit-form" name="assignmentType" defaultValue={entry.assignmentType} className="border border-line bg-white px-2 py-1">
              {["homework", "quiz", "test", "project", "lab", "reading", "other"].map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <InfoboxInput form="assignment-edit-form" label="Class link" name="classSlug" defaultValue={entry.classSlug ? `/classes/${entry.classSlug}` : ""} />
          <InfoboxInput form="assignment-edit-form" label="Date" name="dueDate" type="date" defaultValue={entry.dueDate} />
          <InfoboxStatic label="Specificity" value="Assignment" />
          <InfoboxStatic label="Status" value={entry.published ? "Published" : "Draft"} />
        </>
      }
      specificityTree={<SpecificityBranch items={[
        course ? { label: course.title, href: `/classes/${course.slug}` } : { label: "Class TBD" },
        relatedSubjects[0] ? { label: relatedSubjects[0].title, href: `/subjects/${relatedSubjects[0].slug}` } : { label: "Subject TBD" },
        relatedPrinciples[0] ? { label: relatedPrinciples[0].title, href: `/principles/${relatedPrinciples[0].slug}` } : { label: "Principle TBD" },
        { label: entry.title, href: `/assignments/${entry.slug}` },
      ]} />}
      related={<LinkList links={[...relatedSubjects.map((subject) => ({ href: `/subjects/${subject.slug}`, label: subject.title })), ...entry.relatedLinks]} />}
      relatedEditor={<RelatedLinksEditor form="assignment-edit-form" links={entry.relatedLinks} />}
      showRelatedLinks={relatedSubjects.length + entry.relatedLinks.length > 0}
      revisions={revisions}
      isEditing={isEditing}
      editPanel={<InlineEditPanel entityType="assignment" entry={entry} error={resolvedSearchParams?.error} formId="assignment-edit-form" />}
    >
      {entry.description ? <Section title="Description"><p><AttributedText revisions={revisions} field="description" linkTargets={linkTargets}>{entry.description}</AttributedText></p></Section> : null}
      {relatedSubjects.length > 0 ? <Section title="Related subjects"><LinkList links={relatedSubjects.map((subject) => ({ href: `/subjects/${subject.slug}`, label: subject.title }))} /></Section> : null}
      {relatedPrinciples.length > 0 ? <Section title="Related principles"><LinkList links={relatedPrinciples.map((principle) => ({ href: `/principles/${principle.slug}`, label: principle.title }))} /></Section> : null}
      {linkedResources.length > 0 ? <Section title="Relevant resources"><LinkList links={linkedResources.map((resource) => ({ href: `/resources/${resource.slug}`, label: resource.title }))} /></Section> : null}
    </DatabasePageLayout>
  );
}

function InfoboxInput({ form, label, name, defaultValue, type = "text" }: { form: string; label: string; name: string; defaultValue: string; type?: string }) {
  return (
    <label className="grid gap-1">
      <span className="font-medium text-muted">{label}</span>
      <input form={form} name={name} type={type} defaultValue={defaultValue} className="border border-line bg-white px-2 py-1" />
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
    <textarea
      form={form}
      name="relatedLinks"
      defaultValue={formatRelatedLinks(links)}
      rows={4}
      placeholder="One per line: page title, page URL, or Label | URL"
      className="w-full border border-line bg-white p-3 text-sm leading-6"
    />
  );
}
