import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { getHelixSession } from "@/lib/auth";
import { getClasses } from "@/lib/database";
import { createEntityFromSnapshot } from "@/lib/mutations";

export default async function ClassesPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const [classes, session] = await Promise.all([getClasses(), getHelixSession()]);
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const normalized = query.toLowerCase();
  const filteredClasses = classes
    .filter((entry) =>
      [entry.title, entry.department, entry.overview, entry.gradeLevels.join(" "), entry.units.map((unit) => `${unit.title} ${unit.body}`).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  async function createClassAction(formData: FormData) {
    "use server";

    const activeSession = await getHelixSession();
    if (!activeSession) redirect("/login?next=/classes");

    const title = textField(formData, "title");
    const slug = textField(formData, "slug") || slugify(title);
    const snapshot = {
      title,
      slug,
      department: textField(formData, "department") || "Uncategorized",
      gradeLevels: listField(formData, "gradeLevels"),
      overview: textField(formData, "overview"),
      units: [],
      relatedSubjectSlugs: [],
      assignmentSlugs: [],
      resourceSlugs: [],
      published: true,
    };
    const result = await createEntityFromSnapshot({
      entityType: "class",
      snapshot,
      changeSummary: "Created class page.",
      session: activeSession,
    });
    if (!result.ok || !result.slug) redirect(`/classes?error=${encodeURIComponent(result.error ?? "Create failed")}`);
    redirect(`/classes/${result.slug}?edit=1`);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[190px_1fr_280px]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 border-l-4 border-gold bg-white p-4 text-sm">
            <div className="mb-3 font-semibold">Contents</div>
            <ol className="space-y-2 text-muted">
              <li><a href="#definition" className="hover:text-nisky">Definition</a></li>
              <li><a href="#inclusion" className="hover:text-nisky">Inclusion criteria</a></li>
              <li><a href="#directory" className="hover:text-nisky">Class directory</a></li>
            </ol>
          </div>
        </aside>

        <article className="border border-line bg-white p-5 md:p-8">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Database category page</p>
          <h1 className="border-b border-line pb-3 font-serif text-4xl font-semibold">Classes</h1>

          <section id="definition" className="mt-8 border-t border-line pt-5 first:mt-0 first:border-t-0 first:pt-0">
            <h2 className="content-heading">Definition</h2>
            <p className="mt-3 text-muted">
              In the Niskayuna Academic Database, a class is a specific school course offered to students, such as
              Honors Chemistry, English 11, or AP Calculus BC. Class pages define the course context for academic
              information: departments, grade levels, major units, related subjects, assignments, tests, and reusable
              resources.
            </p>
          </section>

          <section id="inclusion" className="mt-8 border-t border-line pt-5">
            <h2 className="content-heading">Inclusion criteria</h2>
            <p className="mt-3 text-muted">
              A page belongs in this section when it describes a course-level academic container rather than a topic,
              a single assignment, or a resource. Course pages should stay constructive and school-appropriate: they
              explain what is studied, how the course is organized, and which database entries connect to it.
            </p>
          </section>

          <section id="directory" className="mt-8 border-t border-line pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="content-heading">Class directory</h2>
                <p className="mt-1 text-sm text-muted">
                  {filteredClasses.length} class{filteredClasses.length === 1 ? "" : "es"} shown
                  {query ? ` for "${query}"` : ""}.
                </p>
              </div>
              <form action="/classes" className="flex w-full max-w-md items-center gap-2 rounded border border-line bg-paper px-3 py-2">
                <input name="q" defaultValue={query} placeholder="Search classes" className="w-full bg-transparent text-sm outline-none" />
                <button className="text-sm font-medium text-nisky">Search</button>
              </form>
            </div>

            <details className="mt-5 border border-gold bg-paper">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-nisky">Add a class</summary>
              {session ? (
                <form action={createClassAction} className="grid gap-3 border-t border-line p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="title" required placeholder="Class title" className="border border-line bg-white px-3 py-2 text-sm" />
                    <input name="slug" placeholder="Slug, optional" className="border border-line bg-white px-3 py-2 text-sm" />
                    <input name="department" placeholder="Department" className="border border-line bg-white px-3 py-2 text-sm" />
                    <input name="gradeLevels" placeholder="Grades, comma-separated" className="border border-line bg-white px-3 py-2 text-sm" />
                  </div>
                  <textarea name="overview" rows={3} placeholder="Short class overview" className="border border-line bg-white px-3 py-2 text-sm" />
                  <button className="w-fit border border-nisky bg-nisky px-4 py-2 text-sm font-medium text-white">Create class</button>
                </form>
              ) : (
                <p className="border-t border-line p-4 text-sm text-muted">
                  <Link href="/login?next=/classes">Log in</Link> as a Helix member to add a class.
                </p>
              )}
            </details>

            <div className="mt-5 divide-y divide-line border border-line">
              {filteredClasses.map((entry) => (
                <Link key={entry.slug} href={`/classes/${entry.slug}`} className="card-link block p-4 hover:bg-paper">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="card-link-heading font-serif text-2xl font-semibold">{entry.title}</h3>
                    </div>
                    <span className="text-sm text-muted">{entry.department} · Grades {entry.gradeLevels.join(", ")}</span>
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
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"><dt className="text-muted">Entity type</dt><dd>Class</dd></div>
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"><dt className="text-muted">Pages</dt><dd>{classes.length}</dd></div>
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"><dt className="text-muted">Purpose</dt><dd>Course organization</dd></div>
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
