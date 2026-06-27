import { redirect } from "next/navigation";
import type { EntityType } from "@/lib/types";

export default async function EditRedirectPage({ params }: { params: Promise<{ entityType: string; slug: string }> }) {
  const { entityType, slug } = await params;
  const normalizedEntityType = normalizeEntityType(entityType);
  if (!normalizedEntityType) redirect("/");
  redirect(`/${entityPath(normalizedEntityType)}/${slug}?edit=1`);
}

function normalizeEntityType(value: string): EntityType | null {
  if (value === "class" || value === "subject" || value === "principle" || value === "assignment" || value === "resource") return value;
  return null;
}

function entityPath(entityType: EntityType) {
  if (entityType === "class") return "classes";
  if (entityType === "subject") return "subjects";
  if (entityType === "principle") return "principles";
  if (entityType === "assignment") return "assignments";
  return "resources";
}
