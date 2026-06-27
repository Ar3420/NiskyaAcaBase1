import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { getHelixSession } from "@/lib/auth";
import { getSubjects } from "@/lib/database";
import { createEntityFromSnapshot } from "@/lib/mutations";

export default async function SubjectsPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const [subjects, session] = await Promise.all([getSubjects(), getHelixSession()]);
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

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[190px_1fr_280px]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 border-l-4 border-gold bg-white p-4 text-sm">
            <div className="mb-3 font-semibold">Contents</div>
            <ol className="space-y-2 text-muted">
              <li><a href="#definition" className="hover:text-nisky">Definition</a></li>
              <li><a href="#scope" className="hover:text-nisky">Scope</a></li>
              <li><a href="#directory" className="hover:text-nisky">Subject directory</a></li>
            </ol>
          </div>
        </aside>

        <article className="bg-white p-5 md:p-8">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Database category page</p>
          <h1 className="border-b border-line pb-3 font-serif text-4xl font-semibold">Subjects</h1>

          <section id="definition" className="mt-8 border-t border-line pt-5 first:mt-0 first:border-t-0 first:pt-0">
            <h2 className="content-heading">Definition</h2>
            <p className="mt-3 text-muted">
              In the Niskayuna Academic Database, a subject is an academic concept, skill, topic, or unit of knowledge
              that may appear across one or more classes. Subjects include entries such as Stoichiometry, Trigonometry,
              Primary Source Analysis, and Algorithms.
            </p>
          </section>

          <section id="scope" className="mt-8 border-t border-line pt-5">
            <h2 className="content-heading">Scope</h2>
            <p className="mt-3 text-muted">
              Subject pages should describe what the topic means, what subtopics belong under it, which classes use it,
              and which assignments or resources help students review it. A subject page is not a teacher review,
              private note, or single homework item.
            </p>
          </section>

          <section id="directory" className="mt-8 border-t border-line pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="content-heading">Subject directory</h2>
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
                <Link key={entry.slug} href={`/subjects/${entry.slug}`} className="card-link block p-4 hover:bg-paper">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="card-link-heading font-serif text-2xl font-semibold">{entry.title}</h3>
                    </div>
                    <span className="text-sm text-muted">{entry.subtopics.length} subtopics</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </article>

        <aside>
          <div className="border border-line bg-white">
            <div className="border-b border-line bg-wing/45 px-4 py-3 font-serif text-lg font-semibold">Category infobox</div>
            <dl className="divide-y divide-line text-sm">
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"><dt className="text-muted">Entity type</dt><dd>Subject</dd></div>
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"><dt className="text-muted">Pages</dt><dd>{subjects.length}</dd></div>
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"><dt className="text-muted">Purpose</dt><dd>Topic organization</dd></div>
            </dl>
          </div>
        </aside>
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
