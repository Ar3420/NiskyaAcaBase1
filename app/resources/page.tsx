import { IndexPage } from "@/components/IndexPage";
import { SiteNav } from "@/components/SiteNav";
import { getResources } from "@/lib/database";

export default async function ResourcesPage() {
  const resources = await getResources();
  return (
    <div className="min-h-screen bg-paper">
      <SiteNav />
      <IndexPage
        eyebrow="Database index"
        title="Resources"
        description="Reusable academic materials including notes, study guides, practice sheets, packets, templates, and external links."
        items={resources.map((entry) => ({
          title: entry.title,
          href: `/resources/${entry.slug}`,
          description: entry.description,
          meta: entry.resourceType,
        }))}
      />
    </div>
  );
}
