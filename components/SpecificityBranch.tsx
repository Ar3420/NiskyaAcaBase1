import Link from "next/link";

export type SpecificityBranchItem = {
  label: string;
  href?: string;
};

export function SpecificityBranch({ items }: { items: SpecificityBranchItem[] }) {
  const visibleItems = items.filter((item) => item.label);
  if (visibleItems.length === 0) return null;

  return (
    <ol className="space-y-1 text-sm">
      {visibleItems.map((item, index) => (
        <li key={`${item.label}-${index}`} className="flex items-start gap-2">
          {index > 0 ? <span className="mt-0.5 text-muted">→</span> : null}
          {item.href ? (
            <Link href={item.href} className="font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-muted">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
