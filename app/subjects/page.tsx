import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { canModerate, getHelixSession } from "@/lib/auth";
import { getSubjects } from "@/lib/database";
import { createEntityFromSnapshot, deleteEntityPage } from "@/lib/mutations";

export default async function SubjectsPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const [subjects, session] = await Promise.all([getSubjects(), getHelixSession()]);
  const canDelete = canModerate(session);
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const normalized = query.toLowerCase();
  const filteredSubjects = subjects
    .filter((entry) =>
      [entry.title, entry.overview, entry.subtopics.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  async function createSubjectAction(formData: FormData) {
    "use server";

    const activeSession = await getHelixSession();
    if (!activeSession) redirect("/login?next=/subjects");

    const title = textField(formData, "title");
    const slug = textField(formData, "slug") || slugify(title);
    const snapshot = {
      title,
      slug,
      overview: textField(formData, "overview"),
      subtopics: [],
      relatedClassSlugs: listField(formData, "relatedClassSlugs"),
      relatedAssignmentSlugs: [],
      resourceSlugs: [],
      published: true,
    };
    const result = await createEntityFromSnapshot({
      entityType: "subject",
      snapshot,
      changeSummary: "Created subject page.",
      session: activeSession,
    });
    if (!result.ok || !result.slug) redirect(`/subjects?error=${encodeURIComponent(result.error ?? "Create failed")}`);
    redirect(`/subjects/${result.slug}?edit=1`);
  }

  async function deleteSubjectAction(formData: FormData) {
    "use server";

    const activeSession = await getHelixSession();
    if (!canModerate(activeSession)) redirect("/login?next=/subjects");

    await deleteEntityPage({ entityType: "subject", entityId: textField(formData, "entityId") });
    redirect("/subjects");
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Database directory</p>
            <h1 className="font-serif text-4xl font-semibold">Subjects</h1>
            <p className="mt-1 text-sm text-muted">
              {filteredSubjects.length} subject{filteredSubjects.length === 1 ? "" : "s"} shown
              {query ? ` for "${query}"` : ""}.
            </p>
          </div>
          <form action="/subjects" className="flex w-full max-w-md items-center gap-2 rounded border border-line bg-paper px-3 py-2">
            <input name="q" defaultValue={query} placeholder="Search subjects" className="w-full bg-transparent text-sm outline-none" />
            <button className="text-sm font-medium text-nisky">Search</button>
          </form>
        </div>

        <details className="mt-5 border border-gold bg-paper">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-nisky">Add a subject</summary>
          {session ? (
            <form action={createSubjectAction} className="grid gap-3 border-t border-line p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input name="title" required placeholder="Subject title" className="border border-line bg-white px-3 py-2 text-sm" />
                <input name="slug" placeholder="Slug, optional" className="border border-line bg-white px-3 py-2 text-sm" />
              </div>
              <input name="relatedClassSlugs" placeholder="Related class slugs, comma-separated" className="border border-line bg-white px-3 py-2 text-sm" />
              <textarea name="overview" rows={3} placeholder="Short subject overview" className="border border-line bg-white px-3 py-2 text-sm" />
              <button className="w-fit border border-nisky bg-nisky px-4 py-2 text-sm font-medium text-white">Create subject</button>
            </form>
          ) : (
            <p className="border-t border-line p-4 text-sm text-muted">
              <Link href="/login?next=/subjects">Log in</Link> as a Helix member to add a subject.
            </p>
          )}
        </details>

        <div className="mt-5 divide-y divide-line border border-line">
          {filteredSubjects.map((entry) => (
            <div key={entry.slug} className="p-4 hover:bg-paper">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <Link href={`/subjects/${entry.slug}`} className="card-link block">
                  <h2 className="card-link-heading font-serif text-2xl font-semibold">{entry.title}</h2>
                  <span className="mt-1 block text-sm text-muted">{entry.subtopics.length} subtopics</span>
                </Link>
                {canDelete ? (
                  <form action={deleteSubjectAction}>
                    <input type="hidden" name="entityId" value={entry.id} />
                    <button className="border border-nisky px-3 py-1 text-sm font-medium text-nisky hover:bg-nisky hover:text-white">
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function textField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function listField(formData: FormData, key: string) {
  return textField(formData, key).split(",").map((item) => item.trim()).filter(Boolean);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
