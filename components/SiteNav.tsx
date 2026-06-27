import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { getHelixSession } from "@/lib/auth";
import { TextSizeSelect } from "./TextSizeSelect";

export async function SiteNav({ variant = "logo" }: { variant?: "logo" | "home" }) {
  const session = await getHelixSession();

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        {variant === "home" ? (
          <Link href="/" className="font-serif text-xl font-semibold text-ink no-underline">
            Niskayuna Academic Database
          </Link>
        ) : (
          <Link href="/" className="flex items-center no-underline" aria-label="Niskayuna Academic Database home">
            <Image
              src="/na-database-logo.png"
              alt="Niskayuna Academic Database logo"
              width={52}
              height={52}
              className="h-12 w-12 object-contain"
              priority
            />
          </Link>
        )}
        <form action="/search" className="flex w-full max-w-xl items-center gap-2 rounded border border-line bg-paper px-3 py-2">
          <Search className="h-4 w-4 text-muted" aria-hidden="true" />
          <input
            name="q"
            placeholder="Search classes, subjects, principles, assignments, resources"
            className="w-full bg-transparent text-sm outline-none"
          />
        </form>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/classes" className="hover:text-nisky">Classes</Link>
          <Link href="/subjects" className="hover:text-nisky">Subjects</Link>
          <Link href="/principles" className="hover:text-nisky">Principles</Link>
          <Link href="/homework" className="hover:text-nisky">Homework</Link>
          <TextSizeSelect />
          {session ? (
            <Link href="/account" className="rounded border border-line bg-paper px-2 py-1 font-mono text-xs text-ink no-underline">
              {session.memberId}
            </Link>
          ) : (
            <Link href="/login" className="hover:text-nisky">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
