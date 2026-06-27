import Link from "next/link";

export function IndexPage({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: { title: string; href: string; description: string; meta?: string }[];
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{eyebrow}</p>
      <h1 className="font-serif text-4xl font-semibold text-ink">{title}</h1>
      <p className="mt-3 max-w-3xl text-muted">{description}</p>
      <div className="mt-8 grid gap-4">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="card-link border border-line bg-white p-5 hover:border-nisky">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="card-link-heading font-serif text-2xl font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </div>
              {item.meta ? <span className="text-sm text-muted">{item.meta}</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
