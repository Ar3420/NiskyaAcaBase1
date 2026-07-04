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

        <section className="mx-auto mt-8 grid max-w-5xl gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {navCards.map(({ title, href, icon: Icon }) => (
            <Link key={href} href={href} className="card-link flex aspect-square flex-col items-center justify-center border border-line bg-white p-4 text-center hover:border-nisky">
              <Icon className="mb-3 h-7 w-7 text-nisky" aria-hidden="true" />
              <h2 className="card-link-heading font-serif text-xl font-semibold">{title}</h2>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
