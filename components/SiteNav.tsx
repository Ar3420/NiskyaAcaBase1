import Link from "next/link";
import { Search } from "lucide-react";
import { getHelixSession } from "@/lib/auth";
import { TextSizeSelect } from "./TextSizeSelect";

export async function SiteNav({ variant = "logo" }: { variant?: "logo" | "home" }) {
  const session = await getHelixSession();

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center no-underline" aria-label={variant === "home" ? "Current homepage" : "Return to homepage"}>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-nisky shadow-sm"
            aria-hidden="true"
          >
            <span className="h-5 w-5 rounded-full border border-gold bg-white" />
          </span>
        </Link>
        <form action="/search" className="flex w-full max-w-xl items-center gap-2 rounded border border-line bg-paper px-3 py-2">
          <Search className="h-4 w-4 text-muted" aria-hidden="true" />
          <input
            name="q"
            placeholder="Search classes, subjects, principles, assignments, resources"
            className="w-full bg-transparent text-sm outline-none"
          />
        </form>
        <nav className="flex items-center gap-3 text-sm text-muted">
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
