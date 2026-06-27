import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { getHelixSession } from "@/lib/auth";
import { getPrinciples } from "@/lib/database";
import { createEntityFromSnapshot } from "@/lib/mutations";

export default async function PrinciplesPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const [principles, session] = await Promise.all([getPrinciples(), getHelixSession()]);
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const normalized = query.toLowerCase();
  const filteredPrinciples = principles
    .filter((entry) =>
      [entry.title, entry.overview, entry.details.map((detail) => `${detail.title} ${detail.body}`).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  async function createPrincipleAction(formData: FormData) {
    "use server";

    const activeSession = await getHelixSession();
    if (!activeSession) redirect("/login?next=/principles");

    const title = textField(formData, "title");
    const slug = textField(formData, "slug") || slugify(title);
    const snapshot = {
      title,
      slug,
      overview: textField(formData, "overview"),
      details: [],
      relatedClassSlugs: listField(formData, "relatedClassSlugs"),
      relatedSubjectSlugs: listField(formData, "relatedSubjectSlugs"),
      relatedAssignmentSlugs: [],
      resourceSlugs: [],
      published: true,
    };
    const result = await createEntityFromSnapshot({
      entityType: "principle",
      snapshot,
      changeSummary: "Created principle page.",
      session: activeSession,
    });
    if (!result.ok || !result.slug) redirect(`/principles?error=${encodeURIComponent(result.error ?? "Create failed")}`);
    redirect(`/principles/${result.slug}?edit=1`);
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
              <li><a href="#scope" className="hover:text-nisky">Scope</a></li>
              <li><a href="#directory" className="hover:text-nisky">Principle directory</a></li>
            </ol>
          </div>
        </aside>

        <article className="border border-line bg-white p-5 md:p-8">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Database category page</p>
          <h1 className="border-b border-line pb-3 font-serif text-4xl font-semibold">Principles</h1>

          <section id="definition" className="mt-8 border-t border-line pt-5 first:mt-0 first:border-t-0 first:pt-0">
            <h2 className="content-heading">Definition</h2>
            <p className="mt-3 text-muted">
              A principle is a specific formula, law, theorem, rule, definition, or named concept that belongs under a subject.
              Principles are more specific than subjects and are intended for precise entries such as Newton&apos;s second law,
              the quadratic formula, Hardy-Weinberg equilibrium, or Le Chatelier&apos;s principle.
            </p>
          </section>

          <section id="scope" className="mt-8 border-t border-line pt-5">
            <h2 className="content-heading">Scope</h2>
            <p className="mt-3 text-muted">
              Principle pages should explain the exact idea, when it applies, how it connects to classes and subjects,
              and which assignments, tests, or resources use it.
            </p>
          </section>

          <section id="directory" className="mt-8 border-t border-line pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="content-heading">Principle directory</h2>
                <p className="mt-1 text-sm text-muted">
                  {filteredPrinciples.length} principle{filteredPrinciples.length === 1 ? "" : "s"} shown
                  {query ? ` for "${query}"` : ""}.
                </p>
              </div>
              <form action="/principles" className="flex w-full max-w-md items-center gap-2 rounded border border-line bg-paper px-3 py-2">
                <input name="q" defaultValue={query} placeholder="Search principles" className="w-full bg-transparent text-sm outline-none" />
                <button className="text-sm font-medium text-nisky">Search</button>
              </form>
            </div>

            <details className="mt-5 border border-gold bg-paper">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-nisky">Add a principle</summary>
              {session ? (
                <form action={createPrincipleAction} className="grid gap-3 border-t border-line p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="title" required placeholder="Principle title" className="border border-line bg-white px-3 py-2 text-sm" />
                    <input name="slug" placeholder="Slug, optional" className="border border-line bg-white px-3 py-2 text-sm" />
                  </div>
                  <input name="relatedClassSlugs" placeholder="Related class slugs, comma-separated" className="border border-line bg-white px-3 py-2 text-sm" />
                  <input name="relatedSubjectSlugs" placeholder="Related subject slugs, comma-separated" className="border border-line bg-white px-3 py-2 text-sm" />
                  <textarea name="overview" rows={3} placeholder="Short principle overview" className="border border-line bg-white px-3 py-2 text-sm" />
                  <button className="w-fit border border-nisky bg-nisky px-4 py-2 text-sm font-medium text-white">Create principle</button>
                </form>
              ) : (
                <p className="border-t border-line p-4 text-sm text-muted">
                  <Link href="/login?next=/principles">Log in</Link> as a Helix member to add a principle.
                </p>
              )}
            </details>

            <div className="mt-5 divide-y divide-line border border-line">
              {filteredPrinciples.map((entry) => (
                <Link key={entry.slug} href={`/principles/${entry.slug}`} className="card-link block p-4 hover:bg-paper">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="card-link-heading font-serif text-2xl font-semibold">{entry.title}</h3>
                    </div>
                    <span className="text-sm text-muted">{entry.details.length} details</span>
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
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"><dt className="text-muted">Entity type</dt><dd>Principle</dd></div>
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"><dt className="text-muted">Pages</dt><dd>{principles.length}</dd></div>
              <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3"><dt className="text-muted">Specificity</dt><dd>Class - Subject - Principle</dd></div>
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
