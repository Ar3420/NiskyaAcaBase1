import { notFound, redirect } from "next/navigation";
import { AttributedText } from "@/components/AttributedText";
import { DatabasePageLayout, LinkList, Section } from "@/components/DatabasePageLayout";
import { EditableFeatureList } from "@/components/EditableFeatureList";
import { EditableTextArea } from "@/components/EditableTextArea";
import { SpecificityBranch } from "@/components/SpecificityBranch";
import { canModerate, getHelixSession } from "@/lib/auth";
import { getAssignments, getClasses, getEntityRevisions, getPrinciple, getPrinciples, getResources, getSubjects } from "@/lib/database";
import { formatRelatedLinks, parseManualRelatedLinks, referenceTargets, resolveReferences } from "@/lib/editParsing";
import { buildDatabaseLinkTargets } from "@/lib/linkTargets";
import { updateEntityFromSnapshot } from "@/lib/mutations";

export default async function PrinciplePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ edit?: string; error?: string }> }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const entry = await getPrinciple(slug);
  if (!entry) notFound();
  const isEditing = resolvedSearchParams?.edit === "1";

  const [classes, subjects, principles, assignments, resources, revisions] = await Promise.all([
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getAssignments(),
    getResources(),
    getEntityRevisions("principle", entry.id),
  ]);
  const relatedClasses = classes.filter((course) => entry.relatedClassSlugs.includes(course.slug));
  const relatedSubjects = subjects.filter((subject) => entry.relatedSubjectSlugs.includes(subject.slug));
  const relatedAssignments = assignments.filter((assignment) => entry.relatedAssignmentSlugs.includes(assignment.slug) || assignment.relatedPrincipleSlugs.includes(entry.slug));
  const linkedResources = resources.filter((resource) => entry.resourceSlugs.includes(resource.slug));
  const linkTargets = buildDatabaseLinkTargets({
    classes,
    subjects,
    principles,
    assignments,
    resources,
    currentHref: `/principles/${entry.slug}`,
  });
  const entityId = entry.id;
  const currentPublished = entry.published;
  const visibleToc = [
    entry.overview || isEditing ? "Overview" : null,
    entry.details.length > 0 || isEditing ? "Details" : null,
    relatedClasses.length > 0 || isEditing ? "Related classes" : null,
    relatedSubjects.length > 0 || isEditing ? "Related subjects" : null,
    relatedAssignments.length > 0 || isEditing ? "Related assignments" : null,
    linkedResources.length > 0 || isEditing ? "Linked resources" : null,
    relatedSubjects.length + entry.relatedLinks.length > 0 || isEditing ? "Related links" : null,
    "Revision history",
  ].filter((item): item is string => Boolean(item));

  async function savePrincipleAction(formData: FormData) {
    "use server";

    const session = await getHelixSession();
    if (!session) redirect(`/login?next=/principles/${slug}?edit=1`);

    const snapshot = {
      slug: textField(formData, "slug"),
      title: textField(formData, "title"),
      overview: textField(formData, "overview"),
      details: detailField(formData),
      relatedClassSlugs: resolveReferences(textField(formData, "relatedClassSlugs"), referenceTargets(classes, "classes")),
      relatedSubjectSlugs: resolveReferences(textField(formData, "relatedSubjectSlugs"), referenceTargets(subjects, "subjects")),
      relatedAssignmentSlugs: resolveReferences(textField(formData, "relatedAssignmentSlugs"), referenceTargets(assignments, "assignments")),
      resourceSlugs: resolveReferences(textField(formData, "resourceSlugs"), referenceTargets(resources, "resources")),
      relatedLinks: parseManualRelatedLinks(textField(formData, "relatedLinks"), linkTargets),
      published: canModerate(session) ? formData.get("published") === "on" : currentPublished,
    };

    const result = await updateEntityFromSnapshot({
      entityType: "principle",
      entityId,
      snapshot,
      changeSummary: textField(formData, "changeSummary"),
      session,
    });

    if (!result.ok) redirect(`/principles/${slug}?edit=1&error=${encodeURIComponent(result.error ?? "Save failed")}`);
    redirect(`/principles/${snapshot.slug}`);
  }

  return (
    <DatabasePageLayout
      title={entry.title}
      entityType="principle"
      slug={entry.slug}
      toc={visibleToc}
      infoboxTheme="principle"
      infoRows={[
        { label: "Classes", value: relatedClasses.length },
        { label: "Subjects", value: relatedSubjects.length },
        { label: "Specificity", value: "Principle" },
        { label: "Status", value: entry.published ? "Published" : "Draft" },
      ]}
      infoboxEditor={
        <>
          <InfoboxInput form="principle-edit-form" label="Classes" name="relatedClassSlugs" defaultValue={relatedClasses.map((course) => course.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxInput form="principle-edit-form" label="Subjects" name="relatedSubjectSlugs" defaultValue={relatedSubjects.map((subject) => subject.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxInput form="principle-edit-form" label="Assignments" name="relatedAssignmentSlugs" defaultValue={relatedAssignments.map((assignment) => assignment.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxInput form="principle-edit-form" label="Resources" name="resourceSlugs" defaultValue={linkedResources.map((resource) => resource.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxStatic label="Status" value={entry.published ? "Published" : "Draft"} />
        </>
      }
      specificityTree={<SpecificityBranch items={[
        relatedClasses[0] ? { label: relatedClasses[0].title, href: `/classes/${relatedClasses[0].slug}` } : { label: "Class TBD" },
        relatedSubjects[0] ? { label: relatedSubjects[0].title, href: `/subjects/${relatedSubjects[0].slug}` } : { label: "Subject TBD" },
        { label: entry.title, href: `/principles/${entry.slug}` },
      ]} />}
      related={<LinkList links={[...relatedSubjects.map((subject) => ({ href: `/subjects/${subject.slug}`, label: subject.title })), ...entry.relatedLinks]} />}
      relatedEditor={<RelatedLinksEditor form="principle-edit-form" links={entry.relatedLinks} />}
      showRelatedLinks={relatedSubjects.length + entry.relatedLinks.length > 0}
      revisions={revisions}
      isEditing={isEditing}
    >
      {isEditing ? (
        <form id="principle-edit-form" action={savePrincipleAction} className="not-prose grid gap-6">
          {resolvedSearchParams?.error ? <p className="border border-nisky bg-nisky/5 p-3 text-sm text-nisky">{resolvedSearchParams.error}</p> : null}
          <input type="hidden" name="slug" defaultValue={entry.slug} />
          <input type="hidden" name="title" defaultValue={entry.title} />
          <input type="hidden" name="published" value={entry.published ? "on" : ""} />
          <Section title="Overview">
            <EditableTextArea name="overview" defaultValue={entry.overview} rows={6} className="mt-3 w-full border border-line bg-white p-3 text-sm leading-6" />
          </Section>
          <Section title="Details">
            <EditableFeatureList
              items={entry.details}
              titleName="detailTitle"
              bodyName="detailBody"
              headingPlaceholder="New formula, law, or principle detail"
              bodyPlaceholder="Text for this detail"
              addLabel="Add detail"
            />
          </Section>
          <label className="grid gap-2 text-sm font-medium">
            Change summary
            <input name="changeSummary" className="border border-line bg-white px-3 py-2" placeholder="Briefly describe what changed" />
          </label>
          <button className="w-fit border border-nisky bg-nisky px-4 py-2 text-sm font-medium text-white">Save changes</button>
        </form>
      ) : (
        <>
          {entry.overview ? <Section title="Overview"><p><AttributedText revisions={revisions} field="overview" linkTargets={linkTargets}>{entry.overview}</AttributedText></p></Section> : null}
          {entry.details.length > 0 ? (
            <Section title="Details">
              <div className="not-prose mt-5 space-y-6">
                {entry.details.map((detail) => (
                  <section key={detail.title}>
                    <h3 className="font-serif text-2xl font-bold text-ink">{detail.title}</h3>
                    <div className="mt-2 min-h-16 text-sm leading-6">
                      {detail.body ? <p><AttributedText revisions={revisions} field="details" itemTitle={detail.title} linkTargets={linkTargets}>{detail.body}</AttributedText></p> : <p className="text-muted">No description has been added for this detail yet.</p>}
                    </div>
                  </section>
                ))}
              </div>
            </Section>
          ) : null}
          {relatedClasses.length > 0 ? <Section title="Related classes"><LinkList links={relatedClasses.map((course) => ({ href: `/classes/${course.slug}`, label: course.title }))} /></Section> : null}
          {relatedSubjects.length > 0 ? <Section title="Related subjects"><LinkList links={relatedSubjects.map((subject) => ({ href: `/subjects/${subject.slug}`, label: subject.title }))} /></Section> : null}
          {relatedAssignments.length > 0 ? <Section title="Related assignments"><LinkList links={relatedAssignments.map((assignment) => ({ href: `/assignments/${assignment.slug}`, label: assignment.title }))} /></Section> : null}
          {linkedResources.length > 0 ? <Section title="Linked resources"><LinkList links={linkedResources.map((resource) => ({ href: `/resources/${resource.slug}`, label: resource.title }))} /></Section> : null}
        </>
      )}
    </DatabasePageLayout>
  );
}

function textField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function detailField(formData: FormData) {
  const titles = formData.getAll("detailTitle").map((item) => String(item).trim());
  const bodies = formData.getAll("detailBody").map((item) => String(item).trim());
  return titles.map((title, index) => ({ title, body: bodies[index] ?? "" })).filter((detail) => detail.title);
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
