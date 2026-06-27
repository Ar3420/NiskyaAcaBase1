import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, FileClock, FileText, Library, Sigma } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { SiteNav } from "@/components/SiteNav";

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav variant="home" />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="border border-line bg-white px-5 py-10 text-center">
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
      </main>
    </div>
  );
}
