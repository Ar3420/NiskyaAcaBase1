import { notFound, redirect } from "next/navigation";
import { AttributedText } from "@/components/AttributedText";
import { DatabasePageLayout, LinkList, Section } from "@/components/DatabasePageLayout";
import { EditableFeatureList } from "@/components/EditableFeatureList";
import { EditableTextArea } from "@/components/EditableTextArea";
import { SpecificityBranch } from "@/components/SpecificityBranch";
import { canModerate, getHelixSession } from "@/lib/auth";
import { getAssignments, getClass, getClasses, getEntityRevisions, getPrinciples, getResources, getSubjects } from "@/lib/database";
import { formatRelatedLinks, parseManualRelatedLinks, referenceTargets, resolveReferences } from "@/lib/editParsing";
import { buildDatabaseLinkTargets } from "@/lib/linkTargets";
import { updateEntityFromSnapshot } from "@/lib/mutations";

export default async function ClassPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ edit?: string; error?: string }> }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const entry = await getClass(slug);
  if (!entry) notFound();
  const isEditing = resolvedSearchParams?.edit === "1";

  const [classes, subjects, principles, assignments, resources, revisions] = await Promise.all([
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getAssignments(),
    getResources(),
    getEntityRevisions("class", entry.id),
  ]);
  const relatedSubjects = subjects.filter((subject) => entry.relatedSubjectSlugs.includes(subject.slug));
  const relatedPrinciples = principles.filter((principle) => principle.relatedClassSlugs.includes(entry.slug));
  const classAssignments = assignments.filter((assignment) => entry.assignmentSlugs.includes(assignment.slug) || assignment.classSlug === entry.slug);
  const classResources = resources.filter((resource) => entry.resourceSlugs.includes(resource.slug) || resource.relatedClassSlugs.includes(entry.slug));
  const linkTargets = buildDatabaseLinkTargets({
    classes,
    subjects,
    principles,
    assignments,
    resources,
    currentHref: `/classes/${entry.slug}`,
  });
  const entityId = entry.id;
  const currentPublished = entry.published;
  const visibleToc = [
    entry.overview || isEditing ? "Overview" : null,
    entry.units.length > 0 || isEditing ? "Units and topics" : null,
    relatedPrinciples.length > 0 || isEditing ? "Principles" : null,
    classAssignments.length > 0 || isEditing ? "Assignments and tests" : null,
    classResources.length > 0 || isEditing ? "Resources" : null,
    relatedSubjects.length + entry.relatedLinks.length > 0 || isEditing ? "Related links" : null,
    "Revision history",
  ].filter((item): item is string => Boolean(item));

  async function saveClassAction(formData: FormData) {
    "use server";

    const session = await getHelixSession();
    if (!session) redirect(`/login?next=/classes/${slug}?edit=1`);

    const snapshot = {
      slug: textField(formData, "slug"),
      title: textField(formData, "title"),
      department: textField(formData, "department"),
      gradeLevels: listField(formData, "gradeLevels"),
      overview: textField(formData, "overview"),
      units: unitTopicField(formData),
      relatedSubjectSlugs: resolveReferences(textField(formData, "relatedSubjectSlugs"), referenceTargets(subjects, "subjects")),
      assignmentSlugs: resolveReferences(textField(formData, "assignmentSlugs"), referenceTargets(assignments, "assignments")),
      resourceSlugs: resolveReferences(textField(formData, "resourceSlugs"), referenceTargets(resources, "resources")),
      relatedLinks: parseManualRelatedLinks(textField(formData, "relatedLinks"), linkTargets),
      published: canModerate(session) ? formData.get("published") === "on" : currentPublished,
    };

    const result = await updateEntityFromSnapshot({
      entityType: "class",
      entityId,
      snapshot,
      changeSummary: textField(formData, "changeSummary"),
      session,
    });

    if (!result.ok) redirect(`/classes/${slug}?edit=1&error=${encodeURIComponent(result.error ?? "Save failed")}`);
    redirect(`/classes/${snapshot.slug}`);
  }

  return (
    <DatabasePageLayout
      title={entry.title}
      entityType="class"
      slug={entry.slug}
      toc={visibleToc}
      infoboxTheme="class"
      infoRows={[
        { label: "Department", value: entry.department },
        { label: "Grades", value: entry.gradeLevels.join(", ") },
        { label: "Specificity", value: "Class" },
        { label: "Status", value: entry.published ? "Published" : "Draft" },
      ]}
      infoboxEditor={
        <>
          <InfoboxInput form="class-edit-form" label="Department" name="department" defaultValue={entry.department} />
          <InfoboxInput form="class-edit-form" label="Grades" name="gradeLevels" defaultValue={entry.gradeLevels.join(", ")} />
          <InfoboxInput form="class-edit-form" label="Related subjects" name="relatedSubjectSlugs" defaultValue={relatedSubjects.map((subject) => subject.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxInput form="class-edit-form" label="Assignments" name="assignmentSlugs" defaultValue={classAssignments.map((assignment) => assignment.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxInput form="class-edit-form" label="Resources" name="resourceSlugs" defaultValue={classResources.map((resource) => resource.title).join(", ")} help="Use page titles, URLs, or slugs." />
          <InfoboxStatic label="Status" value={entry.published ? "Published" : "Draft"} />
        </>
      }
      specificityTree={<SpecificityBranch items={[{ label: entry.title, href: `/classes/${entry.slug}` }]} />}
      related={<LinkList links={[...relatedSubjects.map((subject) => ({ href: `/subjects/${subject.slug}`, label: subject.title })), ...entry.relatedLinks]} />}
      relatedEditor={<RelatedLinksEditor form="class-edit-form" links={entry.relatedLinks} />}
      showRelatedLinks={relatedSubjects.length + entry.relatedLinks.length > 0}
      revisions={revisions}
      isEditing={isEditing}
    >
      {isEditing ? (
        <form id="class-edit-form" action={saveClassAction} className="not-prose grid gap-6">
          {resolvedSearchParams?.error ? <p className="border border-nisky bg-nisky/5 p-3 text-sm text-nisky">{resolvedSearchParams.error}</p> : null}
          <input type="hidden" name="slug" defaultValue={entry.slug} />
          <input type="hidden" name="title" defaultValue={entry.title} />
          <input type="hidden" name="published" value={entry.published ? "on" : ""} />
          <Section title="Overview">
            <EditableTextArea name="overview" defaultValue={entry.overview} rows={6} className="mt-3 w-full border border-line bg-white p-3 text-sm leading-6" />
          </Section>
          <Section title="Units and topics">
            <EditableFeatureList
              items={entry.units}
              titleName="unitTitle"
              bodyName="unitBody"
              headingPlaceholder="New unit or topic heading"
              bodyPlaceholder="Text for this heading"
              addLabel="Add unit or topic"
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
          {entry.units.length > 0 ? (
            <Section title="Units and topics">
              <div className="not-prose mt-4 space-y-4">
                {entry.units.map((unit) => (
                  <section key={unit.title}>
                    <h3 className="font-serif text-xl font-bold leading-snug text-ink">{unit.title}</h3>
                    <div className="mt-1 min-h-10 text-sm leading-6">
                      {unit.body ? (
                        <p><AttributedText revisions={revisions} field="units" itemTitle={unit.title} linkTargets={linkTargets}>{unit.body}</AttributedText></p>
                      ) : (
                        <p className="text-muted">No description has been added for this topic yet.</p>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </Section>
          ) : null}
          {classAssignments.length > 0 ? (
            <section id="assignments-and-tests" className="mt-8 border-t border-line pt-5">
              <h2 className="content-heading">Assignments and tests</h2>
              <div className="mt-3">
              <LinkList links={classAssignments.map((assignment) => ({ href: `/assignments/${assignment.slug}`, label: assignment.title }))} />
              </div>
            </section>
          ) : null}
          {relatedPrinciples.length > 0 ? (
            <section id="principles" className="mt-8 border-t border-line pt-5">
              <h2 className="content-heading">Principles</h2>
              <div className="mt-3">
              <LinkList links={relatedPrinciples.map((principle) => ({ href: `/principles/${principle.slug}`, label: principle.title }))} />
              </div>
            </section>
          ) : null}
          {classResources.length > 0 ? (
            <section id="resources" className="mt-8 border-t border-line pt-5">
              <h2 className="content-heading">Resources</h2>
              <div className="mt-3">
              <LinkList links={classResources.map((resource) => ({ href: `/resources/${resource.slug}`, label: resource.title }))} />
              </div>
            </section>
          ) : null}
        </>
      )}
    </DatabasePageLayout>
  );
}

function textField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function listField(formData: FormData, key: string) {
  return textField(formData, key).split(",").map((item) => item.trim()).filter(Boolean);
}

function unitTopicField(formData: FormData) {
  const titles = formData.getAll("unitTitle").map((item) => String(item).trim());
  const bodies = formData.getAll("unitBody").map((item) => String(item).trim());
  return titles.map((title, index) => ({ title, body: bodies[index] ?? "" })).filter((unit) => unit.title);
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
