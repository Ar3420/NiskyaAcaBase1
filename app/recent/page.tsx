import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { getRecentActivityByType, type RecentActivityEntry } from "@/lib/database";
import type { EntityType } from "@/lib/types";

const sections: { title: string; entityType: EntityType; description: string }[] = [
  { title: "Recently edited classes", entityType: "class", description: "Course pages with the newest revision activity." },
  { title: "Recently edited subjects", entityType: "subject", description: "Subject pages with the newest revision activity." },
  { title: "Recently edited principles", entityType: "principle", description: "Formula, law, theorem, and concept pages with the newest revision activity." },
  { title: "Recently edited assignments", entityType: "assignment", description: "Homework, test, quiz, and assignment pages with the newest revision activity." },
];

export default async function RecentPage() {
  const activityBySection = await Promise.all(
    sections.map(async (section) => ({
      ...section,
      entries: await getRecentActivityByType(section.entityType, 8),
    })),
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Revision activity</p>
        <h1 className="font-serif text-4xl font-semibold">Recent pages</h1>
        <p className="mt-3 max-w-3xl text-muted">
          The newest database pages and edits, grouped by database layer.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {activityBySection.map((section) => (
            <section key={section.entityType} className="border border-line bg-white p-5">
              <h2 className="content-heading">{section.title}</h2>
              <p className="mt-2 text-sm text-muted">{section.description}</p>
              <RecentList entries={section.entries} />
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function RecentList({ entries }: { entries: RecentActivityEntry[] }) {
  if (entries.length === 0) {
    return <p className="mt-4 border border-line bg-paper p-3 text-sm text-muted">No recent revisions recorded yet.</p>;
  }

  return (
    <ul className="mt-4 divide-y divide-line border border-line">
      {entries.map((entry) => (
        <li key={entry.key} className="p-3 text-sm">
          <Link href={entry.href} className="font-serif text-xl font-semibold">
            {entry.title}
          </Link>
          <div className="mt-1 text-muted">
            {entry.action === "created" ? "Added" : "Edited"} on{" "}
            {new Date(entry.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </div>
        </li>
      ))}
    </ul>
  );
}
