import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, FileClock, FileText, Library, Sigma } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { SiteNav } from "@/components/SiteNav";
import { getAssignments, getClasses, getPrinciples, getResources, getSubjects } from "@/lib/database";

const navCards = [
  {
    title: "Classes",
    href: "/classes",
    description: "Browse course pages, departments, units, assignments, and related resources.",
    icon: BookOpen,
  },
  {
    title: "Subjects",
    href: "/subjects",
    description: "Explore academic concept pages with related classes, subtopics, and study materials.",
    icon: Library,
  },
  {
    title: "Principles",
    href: "/principles",
    description: "Open formula, law, theorem, and named-concept pages under subjects.",
    icon: Sigma,
  },
  {
    title: "Homework",
    href: "/homework",
    description: "View assignments and tests as a calendar or filtered workload list.",
    icon: CalendarDays,
  },
];

type HomeSearchParams = {
  pageType?: string;
  year?: string;
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
  const selectedSubject = resolvedSearchParams?.subject ?? "";
  const pageQuery = resolvedSearchParams?.pageQuery?.trim() ?? "";
  const allPages = [
    ...classes.map((entry) => ({
      type: "class",
      title: entry.title,
      href: `/classes/${entry.slug}`,
      meta: [entry.department, entry.gradeLevels.length ? `Grades ${entry.gradeLevels.join(", ")}` : ""].filter(Boolean).join(" - "),
      years: entry.gradeLevels,
      subjectSlugs: entry.relatedSubjectSlugs,
      createdAt: entry.createdAt,
    })),
    ...subjects.map((entry) => ({
      type: "subject",
      title: entry.title,
      href: `/subjects/${entry.slug}`,
      meta: `${entry.subtopics.length} subtopics`,
      years: createdYear(entry.createdAt),
      subjectSlugs: [entry.slug],
      createdAt: entry.createdAt,
    })),
    ...principles.map((entry) => ({
      type: "principle",
      title: entry.title,
      href: `/principles/${entry.slug}`,
      meta: `${entry.details.length} details`,
      years: createdYear(entry.createdAt),
      subjectSlugs: entry.relatedSubjectSlugs,
      createdAt: entry.createdAt,
    })),
    ...assignments.map((entry) => ({
      type: "assignment",
      title: entry.title,
      href: `/assignments/${entry.slug}`,
      meta: [entry.assignmentType, entry.dueDate ? `Due ${entry.dueDate}` : ""].filter(Boolean).join(" - "),
      years: [entry.dueDate.slice(0, 4), ...createdYear(entry.createdAt)].filter(Boolean),
      subjectSlugs: entry.relatedSubjectSlugs,
      createdAt: entry.createdAt,
    })),
    ...resources.map((entry) => ({
      type: "resource",
      title: entry.title,
      href: `/resources/${entry.slug}`,
      meta: entry.resourceType,
      years: createdYear(entry.createdAt),
      subjectSlugs: entry.relatedSubjectSlugs,
      createdAt: entry.createdAt,
    })),
  ];
  const yearOptions = Array.from(new Set(allPages.flatMap((entry) => entry.years))).filter(Boolean).sort();
  const normalizedQuery = pageQuery.toLowerCase();
  const filteredPages = allPages
    .filter((entry) => !selectedType || entry.type === selectedType)
    .filter((entry) => !selectedYear || entry.years.includes(selectedYear))
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
          {navCards.map(({ title, href, description, icon: Icon }) => (
            <Link key={href} href={href} className="card-link border border-line bg-white p-5 hover:border-nisky">
              <Icon className="mb-4 h-7 w-7 text-nisky" aria-hidden="true" />
              <h2 className="card-link-heading font-serif text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </Link>
          ))}
          <Link href="/recent" className="card-link border border-line bg-white p-5 hover:border-nisky">
            <FileClock className="mb-4 h-7 w-7 text-nisky" aria-hidden="true" />
            <h2 className="card-link-heading font-serif text-2xl font-semibold">Recent</h2>
            <p className="mt-2 text-sm text-muted">Review the most recently added or edited classes, subjects, principles, and assignments.</p>
          </Link>
        </section>

        <Link
          href="/resources"
          className="card-link mt-4 flex items-center gap-3 border border-line bg-white p-4 text-sm hover:border-nisky"
        >
          <FileText className="h-5 w-5 text-nisky" aria-hidden="true" />
          <span className="card-link-heading font-medium">Resources</span>
          <span className="text-muted">Reusable notes, study guides, packets, templates, and external links.</span>
        </Link>

        <section className="mt-4 border border-line bg-white p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#5f0f17]">All database pages</h2>
              <p className="mt-1 text-sm text-muted">
                {filteredPages.length} page{filteredPages.length === 1 ? "" : "s"} shown
              </p>
            </div>
            <form className="grid gap-2 md:grid-cols-[1fr_130px_130px_160px_auto]">
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
        </section>
      </main>
    </div>
  );
}

function createdYear(value?: string) {
  return value ? [new Date(value).getFullYear().toString()] : [];
}
