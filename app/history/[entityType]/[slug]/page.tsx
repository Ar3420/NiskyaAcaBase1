import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { getEntity, getEntityRevisions } from "@/lib/database";
import type { EntityType } from "@/lib/types";

const entityTypes = ["class", "subject", "principle", "assignment", "resource"];

export default async function HistoryPage({ params }: { params: Promise<{ entityType: string; slug: string }> }) {
  const { entityType, slug } = await params;
  if (!entityTypes.includes(entityType)) notFound();
  const entry = await getEntity(entityType, slug);
  if (!entry || !("id" in entry)) notFound();
  const revisions = await getEntityRevisions(entityType as EntityType, entry.id);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="border border-line bg-white p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Page-level accountability</p>
          <h1 className="font-serif text-4xl font-semibold">Revision History</h1>
          <p className="mt-2 text-muted">{"title" in entry ? entry.title : slug}</p>
          <div className="mt-6 divide-y divide-line border border-line">
            {revisions.length === 0 ? <p className="p-4 text-muted">No revisions recorded yet.</p> : null}
            {revisions.map((revision) => (
              <article key={revision.id} className="p-4">
                <h2 className="font-medium">{revision.changeSummary}</h2>
                <p className="mt-1 text-sm text-muted">
                  {revision.editedByDisplayName} ({revision.editedByMemberId}) ·{" "}
                  {new Date(revision.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
