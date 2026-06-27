import Link from "next/link";
import type { ReactNode } from "react";
import type { EntityType, Revision } from "@/lib/types";
import { SiteNav } from "./SiteNav";

type InfoRow = {
  label: string;
  value: ReactNode;
};

type InfoboxTheme = "default" | "class" | "subject" | "principle" | "assignment" | "resource";

export function DatabasePageLayout({
  title,
  entityType,
  slug,
  toc,
  infoRows,
  children,
  related,
  relatedEditor,
  showRelatedLinks = true,
  specificityTree,
  infoboxEditor,
  revisions,
  editPanel,
  isEditing = false,
  infoboxTheme = "default",
}: {
  title: string;
  entityType: EntityType;
  slug: string;
  toc: string[];
  infoRows: InfoRow[];
  children: ReactNode;
  related: ReactNode;
  relatedEditor?: ReactNode;
  showRelatedLinks?: boolean;
  specificityTree?: ReactNode;
  infoboxEditor?: ReactNode;
  revisions: Revision[];
  editPanel?: ReactNode;
  isEditing?: boolean;
  infoboxTheme?: InfoboxTheme;
}) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[180px_1fr_280px]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 border-l-4 border-gold bg-white p-4 text-sm">
            <div className="mb-3 font-semibold">Contents</div>
            <ol className="space-y-2 text-muted">
              {toc.map((item) => (
                <li key={item}>
                  <a href={`#${slugifyHeading(item)}`} className="hover:text-nisky">
                    {item}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="border border-line bg-white p-5 md:p-8">
          <div className="mb-4 flex flex-col border-b border-line pb-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Database page</p>
              <h1 className="font-serif text-4xl font-semibold">{title}</h1>
            </div>
            <div className="mt-3 flex gap-1 text-sm md:mt-0">
              <Link className="border border-line bg-paper px-3 py-1" href={`/${entityPath(entityType)}/${slug}`}>
                Read
              </Link>
              <Link
                className={`border border-line px-3 py-1 hover:bg-paper ${isEditing ? "bg-paper text-nisky" : ""}`}
                href={`/${entityPath(entityType)}/${slug}?edit=1`}
              >
                Edit
              </Link>
              <Link className="border border-line px-3 py-1 hover:bg-paper" href={`/history/${entityType}/${slug}`}>
                History
              </Link>
            </div>
          </div>

          {isEditing ? editPanel : null}

          <div className="prose max-w-none prose-headings:font-serif prose-a:text-gold prose-a:underline prose-a:decoration-gold prose-a:underline-offset-4">
            {children}
          </div>

          {isEditing || showRelatedLinks ? (
            <section id="related-links" className="mt-8 border-t border-line pt-5">
              <h2 className="content-heading">Related links</h2>
              <div className="mt-3">{isEditing && relatedEditor ? relatedEditor : related}</div>
            </section>
          ) : null}

          <section id="revision-history" className="mt-8 border-t border-line pt-5">
            <details>
              <summary className="content-heading cursor-pointer list-none">
                Revision history
                <span className="ml-3 align-middle text-sm font-normal text-muted">click to expand</span>
              </summary>
              <RevisionList revisions={revisions} />
            </details>
          </section>
        </article>

        <aside>
          <div className="border border-line bg-white">
            <div className={`border-b border-line px-4 py-3 font-serif text-lg font-semibold ${infoboxHeaderClass(infoboxTheme)}`}>Infobox</div>
            {isEditing && infoboxEditor ? (
              <div className="grid gap-3 p-4 text-sm">
                <div className="font-semibold text-ink">Edit infobox</div>
                {infoboxEditor}
              </div>
            ) : (
              <dl className="divide-y divide-line text-sm">
                {infoRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[105px_1fr] gap-3 px-4 py-3">
                    <dt className="font-medium text-muted">{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {specificityTree ? (
              <div className="border-t border-line px-4 py-3 text-sm">
                <div className="mb-2 font-medium text-muted">Specificity branch</div>
                {specificityTree}
              </div>
            ) : null}
          </div>
        </aside>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section id={slugifyHeading(title)} className="mt-8 border-t border-line pt-5 first:mt-0 first:border-t-0 first:pt-0">
      <h2 className="content-heading">{title}</h2>
      {children}
    </section>
  );
}

export function LinkList({ links }: { links: { href: string; label: string }[] }) {
  if (links.length === 0) return <p className="text-muted">No linked entries yet.</p>;
  return (
    <ul className="list-disc pl-5">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href}>{link.label}</Link>
        </li>
      ))}
    </ul>
  );
}

function RevisionList({ revisions }: { revisions: Revision[] }) {
  if (revisions.length === 0) return <p className="text-muted">No revisions have been recorded for this page yet.</p>;
  return (
    <ul className="mt-3 divide-y divide-line border border-line">
      {revisions.map((revision) => (
        <li key={revision.id} className="p-3 text-sm">
          <div className="font-medium">{revision.changeSummary}</div>
          <div className="text-muted">
            {revision.editedByDisplayName} ({revision.editedByMemberId}) -{" "}
            {new Date(revision.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </div>
          <RevisionAdditions revision={revision} />
        </li>
      ))}
    </ul>
  );
}

function RevisionAdditions({ revision }: { revision: Revision }) {
  const additions = getAddedRevisionValues(revision.previousSnapshotJson, revision.newSnapshotJson);
  if (additions.length === 0) return null;

  return (
    <div className="mt-3 border-l-4 border-nisky bg-nisky/5 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-nisky">Added in this revision</div>
      <dl className="space-y-2">
        {additions.map((addition) => (
          <div key={addition.label}>
            <dt className="font-medium text-ink">{addition.label}</dt>
            <dd className="whitespace-pre-wrap text-nisky">{addition.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function getAddedRevisionValues(previous: Record<string, unknown> | null | undefined, next: Record<string, unknown> | null | undefined) {
  if (!next) return [];
  const previousRecord = previous ?? {};

  return Object.entries(next)
    .filter(([key, value]) => isDisplayableRevisionField(key, value) && JSON.stringify(previousRecord[key]) !== JSON.stringify(value))
    .map(([key, value]) => ({
      label: humanizeField(key),
      value: stringifyRevisionValue(value),
    }))
    .filter((item) => item.value);
}

function isDisplayableRevisionField(key: string, value: unknown) {
  if (["id", "published"].includes(key)) return false;
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "object";
}

function stringifyRevisionValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "title" in item) {
          const record = item as Record<string, unknown>;
          return [record.title, record.body].filter(Boolean).join("\n");
        }
        return JSON.stringify(item);
      })
      .join("\n\n");
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function humanizeField(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function entityPath(entityType: EntityType) {
  if (entityType === "class") return "classes";
  if (entityType === "subject") return "subjects";
  if (entityType === "principle") return "principles";
  if (entityType === "assignment") return "assignments";
  return "resources";
}

function slugifyHeading(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function infoboxHeaderClass(theme: InfoboxTheme) {
  if (theme === "class") return "bg-orange-200 text-orange-950";
  if (theme === "subject") return "bg-red-200 text-red-950";
  if (theme === "principle") return "bg-gold text-ink";
  if (theme === "assignment") return "bg-amber-700 text-white";
  if (theme === "resource") return "bg-red-950 text-white";
  return "bg-wing/45 text-ink";
}
