import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

const guideSections = [
  {
    title: "Browse the database",
    body: "Use Classes for course pages, Subjects for broader academic topics, Principles for formulas or specific concepts, Homework for assignments and tests, and Resources for uploaded or linked study materials.",
  },
  {
    title: "Search and filter",
    body: "Use the top search bar for global search. Directory pages include focused filters, and the homepage all-pages panel can filter by type, class, subject, year, or text.",
  },
  {
    title: "Read relations",
    body: "Infobox specificity branches show where a page sits in the database. Classes can connect to many subjects, subjects to many principles, and resources or assignments can connect back to any relevant page.",
  },
  {
    title: "Edit pages",
    body: "Logged-in Helix members can edit database pages inline. Board members get moderation controls such as publication state and deletion from directory pages.",
  },
  {
    title: "Use revisions",
    body: "Newly added text is highlighted by revision. Hover over revision-highlighted text to see who added it and when.",
  },
  {
    title: "Attach resources",
    body: "Resource pages can include external links or uploaded files, including PDFs for lectures, packets, and other digital class materials.",
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Website help</p>
        <h1 className="font-serif text-4xl font-semibold">Guide</h1>
        <p className="mt-3 max-w-3xl text-muted">
          A quick reference for using the Niskayuna Academic Database.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {guideSections.map((section) => (
            <section key={section.title} className="border-l-4 border-gold pl-4">
              <h2 className="font-serif text-2xl font-semibold text-[#5f0f17]">{section.title}</h2>
              <p className="mt-2 text-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/tree" className="border border-line px-4 py-2 hover:bg-paper">Open tree view</Link>
          <Link href="/resources" className="border border-line px-4 py-2 hover:bg-paper">Open resources</Link>
          <Link href="/homework" className="border border-line px-4 py-2 hover:bg-paper">Open homework</Link>
        </div>
      </main>
    </div>
  );
}
