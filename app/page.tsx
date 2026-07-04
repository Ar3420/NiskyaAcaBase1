import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, FileClock, Files, FileText, GitFork, HelpCircle, Library, Sigma } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { SiteNav } from "@/components/SiteNav";

const navCards = [
  { title: "Classes", href: "/classes", icon: BookOpen },
  { title: "Subjects", href: "/subjects", icon: Library },
  { title: "Principles", href: "/principles", icon: Sigma },
  { title: "Homework", href: "/homework", icon: CalendarDays },
  { title: "Resources", href: "/resources", icon: FileText },
  { title: "Recent", href: "/recent", icon: FileClock },
  { title: "Tree", href: "/tree", icon: GitFork },
  { title: "All", href: "/all", icon: Files },
  { title: "Guide", href: "/guide", icon: HelpCircle },
];

export default function HomePage() {
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

        <section className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {navCards.map(({ title, href, icon: Icon }) => (
            <Link key={href} href={href} className="card-link border border-line bg-white p-5 hover:border-nisky">
              <Icon className="mb-4 h-7 w-7 text-nisky" aria-hidden="true" />
              <h2 className="card-link-heading font-serif text-2xl font-semibold">{title}</h2>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
