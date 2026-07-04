import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, FileClock, FileText, GitFork, HelpCircle, Library, Sigma } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { SiteNav } from "@/components/SiteNav";
import { getAssignments, getClasses, getPrinciples, getResources, getSubjects } from "@/lib/database";

const navCards = [
  {
    title: "Classes",
    href: "/classes",
    icon: BookOpen,
  },
  {
    title: "Subjects",
    href: "/subjects",
    icon: Library,
  },
  {
    title: "Principles",
    href: "/principles",
    icon: Sigma,
  },
  {
    title: "Homework",
    href: "/homework",
    icon: CalendarDays,
  },
  {
    title: "Tree",
    href: "/tree",
    icon: GitFork,
  },
];

type HomeSearchParams = {
  pageType?: string;
  year?: string;
  class?: string;
  subject?: string;
  pageQuery?: string;
};

export default async function HomePage({ searchParams }: { searchParams?: Promise<HomeSearchParams> }) {
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
      createdAt: entry.createdAt,
    })),
    ...subjects.map((entry) => ({
      type: "subject",
      title: entry.title,
      href: `/subjects/${entry.slug}`,
      meta: `${entry.subtopics.length} subtopics`,
      years: createdYear(entry.createdAt),
      classSlugs: entry.relatedClassSlugs,
      subjectSlugs: [entry.slug],
      createdAt: entry.createdAt,
    })),
    ...principles.map((entry) => ({
      type: "principle",
      title: entry.title,
      href: `/principles/${entry.slug}`,
      meta: `${entry.details.length} details`,
      years: createdYear(entry.createdAt),
      classSlugs: entry.relatedClassSlugs,
      subjectSlugs: entry.relatedSubjectSlugs,
      createdAt: entry.createdAt,
    })),
    ...assignments.map((entry) => ({
      type: "assignment",
      title: entry.title,
      href: `/assignments/${entry.slug}`,
      meta: [entry.assignmentType, entry.dueDate ? `Due ${entry.dueDate}` : ""].filter(Boolean).join(" - "),
      years: [entry.dueDate.slice(0, 4), ...createdYear(entry.createdAt)].filter(Boolean),
      classSlugs: entry.classSlug ? [entry.classSlug] : [],
      subjectSlugs: entry.relatedSubjectSlugs,
      createdAt: entry.createdAt,
    })),
    ...resources.map((entry) => ({
      type: "resource",
      title: entry.title,
      href: `/resources/${entry.slug}`,
      meta: entry.resourceType,
      years: createdYear(entry.createdAt),
      classSlugs: entry.relatedClassSlugs,
      subjectSlugs: entry.relatedSubjectSlugs,
      createdAt: entry.createdAt,
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
      <SiteNav variant="home" />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="bg-white px-5 py-10 text-center">
          <Image
            src="/na-database-logo.png"
            alt="Niskayuna Academic Database logo"
            width={260}
            height={260}
            priority
            className="mx-auto my-8 h-auto w-64"
          />
          <SearchBox large />
          <p className="mt-5 text-lg text-gold/80">A Helix Research and Development academic knowledge project</p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-5">
          {navCards.map(({ title, href, icon: Icon }) => (
            <Link key={href} href={href} className="card-link border border-line bg-white p-5 hover:border-nisky">
              <Icon className="mb-4 h-7 w-7 text-nisky" aria-hidden="true" />
              <h2 className="card-link-heading font-serif text-2xl font-semibold">{title}</h2>
            </Link>
          ))}
          <Link href="/recent" className="card-link border border-line bg-white p-5 hover:border-nisky">
            <FileClock className="mb-4 h-7 w-7 text-nisky" aria-hidden="true" />
            <h2 className="card-link-heading font-serif text-2xl font-semibold">Recent</h2>
          </Link>
        </section>

        <Link
          href="/resources"
          className="card-link mt-4 flex items-center gap-3 border border-line bg-white p-4 text-sm hover:border-nisky"
        >
          <FileText className="h-5 w-5 text-nisky" aria-hidden="true" />
          <span className="card-link-heading font-medium">Resources</span>
        </Link>

        <Link
          href="/guide"
          className="card-link mt-4 flex items-center gap-3 border border-line bg-white p-4 text-sm hover:border-nisky"
        >
          <HelpCircle className="h-5 w-5 text-nisky" aria-hidden="true" />
          <span className="card-link-heading font-medium">Guide</span>
          <span className="text-muted">How to browse, search, edit, link pages, upload resources, and understand revisions.</span>
        </Link>

        <details className="mt-4 border border-line bg-white p-4" open={Boolean(selectedType || selectedYear || selectedClass || selectedSubject || pageQuery)}>
          <summary className="cursor-pointer list-none">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#5f0f17]">All database pages</h2>
                <p className="mt-1 text-sm text-muted">
                  {filteredPages.length} page{filteredPages.length === 1 ? "" : "s"} shown. Click to expand.
                </p>
              </div>
              <FileText className="h-6 w-6 text-nisky" aria-hidden="true" />
            </div>
          </summary>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-muted">Filter the full database by page layer, class, subject, year, or search text.</p>
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
            {filteredPages.slice(0, 30).map((entry) => (
              <Link key={`${entry.type}-${entry.href}`} href={entry.href} className="grid gap-2 py-3 text-sm hover:bg-paper md:grid-cols-[130px_1fr_220px]">
                <span className="capitalize text-muted">{entry.type}</span>
                <span className="font-serif text-xl font-semibold text-ink">{entry.title}</span>
                <span className="text-muted">{entry.meta || "Database page"}</span>
              </Link>
            ))}
            {filteredPages.length === 0 ? <p className="py-3 text-sm text-muted">No database pages match the selected filters.</p> : null}
          </div>
        </details>
      </main>
    </div>
  );
}

function createdYear(value?: string) {
  return value ? [new Date(value).getFullYear().toString()] : [];
}
