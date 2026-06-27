import { notFound, redirect } from "next/navigation";
import { AttributedText } from "@/components/AttributedText";
import { DatabasePageLayout, LinkList, Section } from "@/components/DatabasePageLayout";
import { canModerate, getHelixSession } from "@/lib/auth";
import { getAssignments, getClasses, getEntityRevisions, getPrinciples, getResources, getSubject, getSubjects } from "@/lib/database";
import { formatRelatedLinks, parseManualRelatedLinks, referenceTargets, resolveReferences } from "@/lib/editParsing";
import { buildDatabaseLinkTargets } from "@/lib/linkTargets";
import { updateEntityFromSnapshot } from "@/lib/mutations";

export default async function SubjectPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ edit?: string; error?: string }> }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const entry = await getSubject(slug);
  if (!entry) notFound();
  const isEditing = resolvedSearchParams?.edit === "1";

  const [classes, subjects, principles, assignments, resources, revisions] = await Promise.all([
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getAssignments(),
    getResources(),
    getEntityRevisions("subject", entry.id),
  ]);
  const relatedClasses = classes.filter((course) => entry.relatedClassSlugs.includes(course.slug));
  const relatedPrinciples = principles.filter((principle) => principle.relatedSubjectSlugs.includes(entry.slug));
  const relatedAssignments = assignments.filter((assignment) => entry.relatedAssignmentSlugs.includes(assignment.slug));
  const linkedResources = resources.filter((resource) => entry.resourceSlugs.includes(resource.slug));
  const linkTargets = buildDatabaseLinkTargets({
    classes,
    subjects,
    principles,
    assignments,
    resources,
    currentHref: `/subjects/${entry.slug}`,
  });
  const entityId = entry.id;
  const currentPublished = entry.published;

  async function saveSubjectAction(formData: FormData) {
    "use server";

    const session = await getHelixSession();
    if (!session) redirect(`/login?next=/subjects/${slug}?edit=1`);

    const snapshot = {
      slug: textField(formData, "slug"),
      title: textField(formData, "title"),
      overview: textField(formData, "overview"),
      subtopics: topicField(formData),
      relatedClassSlugs: resolveReferences(textField(formData, "relatedClassSlugs"), referenceTargets(classes, "classes")),
      relatedAssignmentSlugs: resolveReferences(textField(formData, "relatedAssignmentSlugs"), referenceTargets(assignments, "assignments")),
      resourceSlugs: resolveReferences(textField(formData, "resourceSlugs"), referenceTargets(resources, "resources")),
      relatedLinks: parseManualRelatedLinks(textField(formData, "relatedLinks"), linkTargets),
      published: canModerate(session) ? formData.get("published") === "on" : currentPublished,
    };

    const result = await updateEntityFromSnapshot({
      entityType: "subject",
      entityId,
      snapshot,
      changeSummary: textField(formData, "changeSummary"),
      session,
    });

    if (!result.ok) redirect(`/subjects/${slug}?edit=1&error=${encodeURIComponent(result.error ?? "Save failed")}`);
    redirect(`/subjects/${snapshot.slug}`);
  }

  return (
    <DatabasePageLayout
      title={entry.title}
      entityType="subject"
      slug={entry.slug}
      toc={["Overview", "Subtopics", "Principles", "Related classes", "Related assignments", "Linked resources", "Related links", "Revision history"]}
      infoboxTheme="subject"
      infoRows={[
        { label: "Classes", value: relatedClasses.length },
        { label: "Subtopics", value: entry.subtopics.length },
        { label: "Specificity", value: "Subject" },
        { label: "Status", value: entry.published ? "Published" : "Draft" },
      ]}
      infoboxEditor={
        <>
          <InfoboxInput form="subject-edit-form" label="Classes" name="relatedClassSlugs" defaultValue={relatedClasses.map((course) => course.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxInput form="subject-edit-form" label="Assignments" name="relatedAssignmentSlugs" defaultValue={relatedAssignments.map((assignment) => assignment.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxInput form="subject-edit-form" label="Resources" name="resourceSlugs" defaultValue={linkedResources.map((resource) => resource.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxStatic label="Subtopics" value={String(entry.subtopics.length)} />
          <InfoboxStatic label="Status" value={entry.published ? "Published" : "Draft"} />
        </>
      }
      specificityTree={<TreeItems items={[relatedClasses[0]?.title ?? "Class TBD", entry.title]} />}
      related={<LinkList links={[...relatedClasses.map((course) => ({ href: `/classes/${course.slug}`, label: course.title })), ...entry.relatedLinks]} />}
      relatedEditor={<RelatedLinksEditor form="subject-edit-form" links={entry.relatedLinks} />}
      revisions={revisions}
      isEditing={isEditing}
    >
      {isEditing ? (
        <form id="subject-edit-form" action={saveSubjectAction} className="not-prose grid gap-6">
          {resolvedSearchParams?.error ? <p className="border border-nisky bg-nisky/5 p-3 text-sm text-nisky">{resolvedSearchParams.error}</p> : null}
          <input type="hidden" name="slug" defaultValue={entry.slug} />
          <input type="hidden" name="title" defaultValue={entry.title} />
          <input type="hidden" name="published" value={entry.published ? "on" : ""} />
          <Section title="Overview">
            <textarea name="overview" defaultValue={entry.overview} rows={6} className="mt-3 w-full border border-line bg-white p-3 text-sm leading-6" />
          </Section>
          <Section title="Subtopics">
            <div className="mt-4 space-y-5">
              {entry.subtopics.map((topic, index) => (
                <section key={`${topic.title}-${index}`}>
                  <input name="topicTitle" defaultValue={topic.title} className="w-full border-0 border-b border-line bg-transparent px-0 py-2 font-serif text-xl font-bold outline-none focus:border-gold" />
                  <textarea name="topicBody" defaultValue={topic.body} rows={5} className="mt-2 w-full border border-line bg-white p-3 text-sm leading-6" />
                </section>
              ))}
              <section>
                <input name="topicTitle" placeholder="New subtopic heading" className="w-full border-0 border-b border-line bg-transparent px-0 py-2 font-serif text-xl font-bold outline-none focus:border-gold" />
                <textarea name="topicBody" placeholder="Text for this subtopic" rows={5} className="mt-2 w-full border border-line bg-white p-3 text-sm leading-6" />
              </section>
            </div>
          </Section>
          <label className="grid gap-2 text-sm font-medium">
            Change summary
            <input name="changeSummary" className="border border-line bg-white px-3 py-2" placeholder="Briefly describe what changed" />
          </label>
          <button className="w-fit border border-nisky bg-nisky px-4 py-2 text-sm font-medium text-white">Save changes</button>
        </form>
      ) : (
        <>
          <Section title="Overview"><p><AttributedText revisions={revisions} field="overview" linkTargets={linkTargets}>{entry.overview}</AttributedText></p></Section>
          <Section title="Subtopics">
            {entry.subtopics.length === 0 ? (
              <p className="text-muted">No subtopics have been added yet.</p>
            ) : (
              <div className="not-prose mt-5 space-y-6">
                {entry.subtopics.map((topic) => (
                  <section key={topic.title}>
                    <h3 className="font-serif text-2xl font-bold text-ink">{topic.title}</h3>
                    <div className="mt-2 min-h-16 text-sm leading-6">
                      {topic.body ? <p><AttributedText revisions={revisions} field="subtopics" itemTitle={topic.title} linkTargets={linkTargets}>{topic.body}</AttributedText></p> : <p className="text-muted">No description has been added for this subtopic yet.</p>}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </Section>
          <Section title="Principles"><LinkList links={relatedPrinciples.map((principle) => ({ href: `/principles/${principle.slug}`, label: principle.title }))} /></Section>
          <Section title="Related classes"><LinkList links={relatedClasses.map((course) => ({ href: `/classes/${course.slug}`, label: course.title }))} /></Section>
          <Section title="Related assignments"><LinkList links={relatedAssignments.map((assignment) => ({ href: `/assignments/${assignment.slug}`, label: assignment.title }))} /></Section>
          <Section title="Linked resources"><LinkList links={linkedResources.map((resource) => ({ href: `/resources/${resource.slug}`, label: resource.title }))} /></Section>
        </>
      )}
    </DatabasePageLayout>
  );
}

function TreeItems({ items }: { items: string[] }) {
  return <ol className="space-y-1 border-l border-line pl-3">{items.map((item) => <li key={item}>{item}</li>)}</ol>;
}

function textField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function topicField(formData: FormData) {
  const titles = formData.getAll("topicTitle").map((item) => String(item).trim());
  const bodies = formData.getAll("topicBody").map((item) => String(item).trim());
  return titles.map((title, index) => ({ title, body: bodies[index] ?? "" })).filter((topic) => topic.title);
}

function InfoboxInput({ form, label, name, defaultValue, help }: { form: string; label: string; name: string; defaultValue: string; help?: string }) {
  return (
    <label className="grid gap-1">
      <span className="font-medium text-muted">{label}</span>
      <input form={form} name={name} defaultValue={defaultValue} className="border border-line bg-white px-2 py-1" />
      {help ? <span className="text-xs text-muted">{help}</span> : null}
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
