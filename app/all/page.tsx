import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { getAssignments, getClasses, getPrinciples, getResources, getSubjects } from "@/lib/database";

type AllSearchParams = {
  pageType?: string;
  year?: string;
  class?: string;
  subject?: string;
  pageQuery?: string;
};

export default async function AllPage({ searchParams }: { searchParams?: Promise<AllSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const [classes, subjects, principles, assignments, resources] = await Promise.all([
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getAssignments(),
    getResources(),
  ]);
  const selectedType = resolvedSearchParams?.pageType ?? "";
  const selectedYear = resolvedSearchParams?.year ?? "";
  const selectedClass = resolvedSearchParams?.class ?? "";
  const selectedSubject = resolvedSearchParams?.subject ?? "";
  const pageQuery = resolvedSearchParams?.pageQuery?.trim() ?? "";
  const allPages = [
    ...classes.map((entry) => ({
      type: "class",
      title: entry.title,
      href: `/classes/${entry.slug}`,
      meta: [entry.department, entry.gradeLevels.length ? `Grades ${entry.gradeLevels.join(", ")}` : ""].filter(Boolean).join(" - "),
      years: entry.gradeLevels,
      classSlugs: [entry.slug],
      subjectSlugs: entry.relatedSubjectSlugs,
    })),
    ...subjects.map((entry) => ({
      type: "subject",
      title: entry.title,
      href: `/subjects/${entry.slug}`,
      meta: `${entry.subtopics.length} subtopics`,
      years: createdYear(entry.createdAt),
      classSlugs: entry.relatedClassSlugs,
      subjectSlugs: [entry.slug],
    })),
    ...principles.map((entry) => ({
      type: "principle",
      title: entry.title,
      href: `/principles/${entry.slug}`,
      meta: `${entry.details.length} details`,
      years: createdYear(entry.createdAt),
      classSlugs: entry.relatedClassSlugs,
      subjectSlugs: entry.relatedSubjectSlugs,
    })),
    ...assignments.map((entry) => ({
      type: "assignment",
      title: entry.title,
      href: `/assignments/${entry.slug}`,
      meta: [entry.assignmentType, entry.dueDate ? `Due ${entry.dueDate}` : ""].filter(Boolean).join(" - "),
      years: [entry.dueDate.slice(0, 4), ...createdYear(entry.createdAt)].filter(Boolean),
      classSlugs: entry.classSlug ? [entry.classSlug] : [],
      subjectSlugs: entry.relatedSubjectSlugs,
    })),
    ...resources.map((entry) => ({
      type: "resource",
      title: entry.title,
      href: `/resources/${entry.slug}`,
      meta: entry.resourceType,
      years: createdYear(entry.createdAt),
      classSlugs: entry.relatedClassSlugs,
      subjectSlugs: entry.relatedSubjectSlugs,
    })),
  ];
  const yearOptions = Array.from(new Set(allPages.flatMap((entry) => entry.years))).filter(Boolean).sort();
  const normalizedQuery = pageQuery.toLowerCase();
  const filteredPages = allPages
    .filter((entry) => !selectedType || entry.type === selectedType)
    .filter((entry) => !selectedYear || entry.years.includes(selectedYear))
    .filter((entry) => !selectedClass || entry.classSlugs.includes(selectedClass))
    .filter((entry) => !selectedSubject || entry.subjectSlugs.includes(selectedSubject))
    .filter((entry) => !normalizedQuery || [entry.title, entry.type, entry.meta].join(" ").toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Complete database index</p>
        <h1 className="font-serif text-4xl font-semibold">All</h1>
        <p className="mt-3 max-w-3xl text-muted">
          Browse every database page in one list, filtered by page layer, class, subject, year, or search text.
        </p>

        <section className="mt-8 border border-line bg-white p-4">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#5f0f17]">All database pages</h2>
              <p className="mt-1 text-sm text-muted">
                {filteredPages.length} page{filteredPages.length === 1 ? "" : "s"} shown
              </p>
            </div>
            <form className="grid gap-2 md:grid-cols-[1fr_130px_130px_150px_160px_auto]">
              <input name="pageQuery" defaultValue={pageQuery} placeholder="Search pages" className="border border-line bg-paper px-3 py-2 text-sm" />
              <select name="pageType" defaultValue={selectedType} className="border border-line bg-paper px-3 py-2 text-sm">
                <option value="">All types</option>
                <option value="class">Classes</option>
                <option value="subject">Subjects</option>
                <option value="principle">Principles</option>
                <option value="assignment">Assignments</option>
                <option value="resource">Resources</option>
              </select>
              <select name="year" defaultValue={selectedYear} className="border border-line bg-paper px-3 py-2 text-sm">
                <option value="">All years</option>
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <select name="class" defaultValue={selectedClass} className="border border-line bg-paper px-3 py-2 text-sm">
                <option value="">All classes</option>
                {classes.map((course) => <option key={course.slug} value={course.slug}>{course.title}</option>)}
              </select>
              <select name="subject" defaultValue={selectedSubject} className="border border-line bg-paper px-3 py-2 text-sm">
                <option value="">All subjects</option>
                {subjects.map((subject) => <option key={subject.slug} value={subject.slug}>{subject.title}</option>)}
              </select>
              <button className="border border-nisky bg-nisky px-3 py-2 text-sm font-medium text-white">Filter</button>
            </form>
          </div>

          <div className="mt-4 divide-y divide-line">
            {filteredPages.map((entry) => (
              <Link key={`${entry.type}-${entry.href}`} href={entry.href} className="grid gap-2 py-3 text-sm hover:bg-paper md:grid-cols-[130px_1fr_220px]">
                <span className="capitalize text-muted">{entry.type}</span>
                <span className="font-serif text-xl font-semibold text-ink">{entry.title}</span>
                <span className="text-muted">{entry.meta || "Database page"}</span>
              </Link>
            ))}
            {filteredPages.length === 0 ? <p className="py-3 text-sm text-muted">No database pages match the selected filters.</p> : null}
          </div>
        </section>
      </main>
    </div>
  );
}

function createdYear(value?: string) {
  return value ? [new Date(value).getFullYear().toString()] : [];
}
