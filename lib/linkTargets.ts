import type { AssignmentEntry, ClassEntry, PrincipleEntry, ResourceEntry, SubjectEntry } from "./types";

export function buildDatabaseLinkTargets({
  classes,
  subjects,
  principles = [],
  assignments,
  resources,
  currentHref,
}: {
  classes: ClassEntry[];
  subjects: SubjectEntry[];
  principles?: PrincipleEntry[];
  assignments: AssignmentEntry[];
  resources: ResourceEntry[];
  currentHref?: string;
}) {
  return [
    ...classes.map((entry) => ({ title: entry.title, href: `/classes/${entry.slug}` })),
    ...subjects.map((entry) => ({ title: entry.title, href: `/subjects/${entry.slug}` })),
    ...principles.map((entry) => ({ title: entry.title, href: `/principles/${entry.slug}` })),
    ...assignments.map((entry) => ({ title: entry.title, href: `/assignments/${entry.slug}` })),
    ...resources.map((entry) => ({ title: entry.title, href: `/resources/${entry.slug}` })),
  ].filter((target) => target.href !== currentHref);
}
