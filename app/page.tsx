import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, Files, FileText, HelpCircle, Library, Sigma } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { SiteNav } from "@/components/SiteNav";

const navCards = [
  { title: "Classes", href: "/classes", icon: BookOpen },
  { title: "Subjects", href: "/subjects", icon: Library },
  { title: "Principles", href: "/principles", icon: Sigma },
  { title: "Homework", href: "/homework", icon: CalendarDays },
  { title: "Resources", href: "/resources", icon: FileText },
  { title: "All", href: "/all", icon: Files },
  { title: "Guide", href: "/guide", icon: HelpCircle },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav variant="home" />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="bg-white px-5 py-10 text-center">
          <div className="mx-auto my-8 flex h-72 w-72 items-center justify-center rounded-full border border-gold outline outline-2 outline-offset-3 outline-nisky/80">
            <Image
              src="/na-database-logo.png"
              alt="Niskayuna Academic Database logo"
              width={230}
              height={230}
              priority
              className="h-auto w-56"
            />
          </div>
          <SearchBox large />
          <p className="mt-5 text-lg text-gold/80">By Helix R&amp;D</p>
        </section>

        <section className="mx-auto mt-8 grid max-w-5xl gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {navCards.map(({ title, href, icon: Icon }) => (
            <Link key={href} href={href} aria-label={title} title={title} className="card-link flex aspect-square flex-col items-center justify-center border border-line bg-white p-4 text-center hover:border-nisky">
              <Icon className="h-8 w-8 text-nisky" aria-hidden="true" />
              <span className="sr-only">{title}</span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
