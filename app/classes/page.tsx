import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { canModerate, getHelixSession } from "@/lib/auth";
import { getClasses } from "@/lib/database";
import { createEntityFromSnapshot, deleteEntityPage } from "@/lib/mutations";

export default async function ClassesPage({ searchParams }: { searchParams?: Promise<{ q?: string; department?: string; organization?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const [classes, session] = await Promise.all([getClasses(), getHelixSession()]);
  const canDelete = canModerate(session);
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const selectedDepartment = resolvedSearchParams?.department ?? "";
  const organization = resolvedSearchParams?.organization === "department" ? "department" : "alphabetical";
  const departments = Array.from(new Set(classes.map((entry) => entry.department).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const normalized = query.toLowerCase();
  const filteredClasses = classes
    .filter((entry) => !selectedDepartment || entry.department === selectedDepartment)
    .filter((entry) =>
      [entry.title, entry.department, entry.overview, entry.gradeLevels.join(" "), entry.units.map((unit) => `${unit.title} ${unit.body}`).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    )
    .sort((a, b) => {
      if (organization === "department") {
        const departmentSort = a.department.localeCompare(b.department);
        if (departmentSort !== 0) return departmentSort;
      }
      return a.title.localeCompare(b.title);
    });

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

  async function deleteClassAction(formData: FormData) {
    "use server";

    const activeSession = await getHelixSession();
    if (!canModerate(activeSession)) redirect("/login?next=/classes");

    await deleteEntityPage({ entityType: "class", entityId: textField(formData, "entityId") });
    redirect("/classes");
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Database directory</p>
            <h1 className="font-serif text-4xl font-semibold">Classes</h1>
            <p className="mt-1 text-sm text-muted">
              {filteredClasses.length} class{filteredClasses.length === 1 ? "" : "es"} shown
              {query ? ` for "${query}"` : ""}.
            </p>
          </div>
          <form action="/classes" className="grid w-full max-w-2xl gap-2 rounded border border-line bg-paper p-2 md:grid-cols-[1fr_160px_170px_auto]">
            <input name="q" defaultValue={query} placeholder="Search classes" className="bg-transparent px-1 text-sm outline-none" />
            <select name="department" defaultValue={selectedDepartment} className="border border-line bg-white px-2 py-1 text-sm">
              <option value="">All departments</option>
              {departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
            <select name="organization" defaultValue={organization} className="border border-line bg-white px-2 py-1 text-sm">
              <option value="alphabetical">Alphabetical</option>
              <option value="department">Department based</option>
            </select>
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
          {filteredClasses.map((entry, index) => {
            const showDepartmentMarker = organization === "department" && entry.department !== filteredClasses[index - 1]?.department;
            return (
              <div key={entry.slug} className="p-4 hover:bg-paper">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <Link href={`/classes/${entry.slug}`} className="card-link block">
                    {showDepartmentMarker ? <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{entry.department}</div> : null}
                    <h2 className="card-link-heading font-serif text-2xl font-semibold">{entry.title}</h2>
                    <span className="mt-1 block text-sm text-muted">{entry.department} - Grades {entry.gradeLevels.join(", ")}</span>
                  </Link>
                  {canDelete ? (
                    <form action={deleteClassAction}>
                      <input type="hidden" name="entityId" value={entry.id} />
                      <button className="border border-nisky px-3 py-1 text-sm font-medium text-nisky hover:bg-nisky hover:text-white">
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}
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
