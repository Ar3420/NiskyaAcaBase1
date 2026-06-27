export type ReferenceTarget = {
  title: string;
  slug?: string;
  href: string;
};

export function resolveReferences(value: string, targets: ReferenceTarget[]) {
  return splitReferenceInput(value).map((item) => resolveReference(item, targets)).filter(Boolean);
}

export function parseManualRelatedLinks(value: string, targets: ReferenceTarget[]) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart = "", hrefPart = ""] = line.split("|").map((part) => part.trim());
      if (hrefPart) return { label: labelPart, href: normalizeHref(hrefPart) };

      const target = findReferenceTarget(labelPart, targets);
      if (target) return { label: target.title, href: target.href };

      const href = normalizeHref(labelPart);
      return href ? { label: labelFromHref(href), href } : null;
    })
    .filter((link): link is { label: string; href: string } => Boolean(link?.label && link.href));
}

export function formatRelatedLinks(links: { label: string; href: string }[]) {
  return links.map((link) => `${link.label} | ${link.href}`).join("\n");
}

export function referenceTargets<T extends { title: string; slug: string }>(entries: T[], basePath: string): ReferenceTarget[] {
  return entries.map((entry) => ({ title: entry.title, slug: entry.slug, href: `/${basePath}/${entry.slug}` }));
}

function splitReferenceInput(value: string) {
  return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}

function resolveReference(value: string, targets: ReferenceTarget[]) {
  return findReferenceTarget(value, targets)?.slug ?? slugFromHref(value) ?? value;
}

function findReferenceTarget(value: string, targets: ReferenceTarget[]) {
  const normalized = normalizeComparable(value);
  const slug = slugFromHref(value);
  return targets.find((target) =>
    normalizeComparable(target.title) === normalized ||
    (target.slug ? normalizeComparable(target.slug) === normalized : false) ||
    normalizeComparable(target.href) === normalized ||
    (slug ? target.slug === slug : false),
  );
}

function normalizeComparable(value: string) {
  return normalizeHref(value).toLowerCase().replace(/^https?:\/\/[^/]+/, "");
}

function normalizeHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.pathname;
  } catch {
    return trimmed;
  }
}

function slugFromHref(value: string) {
  const href = normalizeHref(value);
  const match = href.match(/^\/(?:classes|subjects|principles|assignments|resources)\/([^/?#]+)$/);
  return match?.[1];
}

function labelFromHref(href: string) {
  const slug = href.split("/").filter(Boolean).at(-1) ?? href;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
