import type { AssignmentEntry, ClassEntry, EntityType, PrincipleEntry, ResourceEntry, Revision, SubjectEntry } from "./types";

export type SearchResult = {
  type: string;
  title: string;
  href: string;
  description: string;
  related?: string;
};

export const classes: ClassEntry[] = [];
export const subjects: SubjectEntry[] = [];
export const principles: PrincipleEntry[] = [];
export const assignments: AssignmentEntry[] = [];
export const resources: ResourceEntry[] = [];
export const revisions: Revision[] = [];

export function getClass(slug: string) {
  return classes.find((entry) => entry.slug === slug);
}

export function getSubject(slug: string) {
  return subjects.find((entry) => entry.slug === slug);
}

export function getPrinciple(slug: string) {
  return principles.find((entry) => entry.slug === slug);
}

export function getAssignment(slug: string) {
  return assignments.find((entry) => entry.slug === slug);
}

export function getResource(slug: string) {
  return resources.find((entry) => entry.slug === slug);
}

export function getEntity(type: string, slug: string) {
  if (type === "class" || type === "classes") return getClass(slug);
  if (type === "subject" || type === "subjects") return getSubject(slug);
  if (type === "principle" || type === "principles") return getPrinciple(slug);
  if (type === "assignment" || type === "assignments") return getAssignment(slug);
  if (type === "resource" || type === "resources") return getResource(slug);
  return undefined;
}

export function getEntityRevisions(entityType: EntityType, entityId: string) {
  return revisions.filter((revision) => revision.entityType === entityType && revision.entityId === entityId);
}

export function searchEntries(): SearchResult[] {
  return [];
}
