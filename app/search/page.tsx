import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { SiteNav } from "@/components/SiteNav";
import { searchEntries } from "@/lib/database";

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q ?? "";
  const results = await searchEntries(query);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-serif text-4xl font-semibold">Search</h1>
        <div className="mt-4"><SearchBox /></div>
        <p className="mt-6 text-sm text-muted">
          {query ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"` : "Showing all searchable entries."}
        </p>
        <div className="mt-4 divide-y divide-line border border-line bg-white">
          {results.map((result) => (
            <Link key={result.href} href={result.href} className="block p-4 hover:bg-paper">
              <div className="text-xs uppercase tracking-[0.12em] text-muted">{result.type}</div>
              <h2 className="font-serif text-2xl font-semibold">{result.title}</h2>
              <p className="mt-1 text-sm text-muted">{result.description}</p>
              {result.related ? <p className="mt-2 text-sm">Related: {result.related}</p> : null}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
