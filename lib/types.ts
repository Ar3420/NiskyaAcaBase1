export type EntityType = "class" | "subject" | "principle" | "assignment" | "resource";

export type Revision = {
  id: string;
  entityType: EntityType;
  entityId: string;
  editedByMemberId: string;
  editedByDisplayName: string;
  editedByRole?: string;
  editedByStatus?: string;
  changeSummary: string;
  previousSnapshotJson?: Record<string, unknown> | null;
  newSnapshotJson?: Record<string, unknown> | null;
  createdAt: string;
};

export type UnitTopic = {
  title: string;
  body: string;
};

export type RelatedLink = {
  label: string;
  href: string;
};

export type ClassEntry = {
  id: string;
  slug: string;
  title: string;
  department: string;
  gradeLevels: string[];
  overview: string;
  units: UnitTopic[];
  relatedSubjectSlugs: string[];
  assignmentSlugs: string[];
  resourceSlugs: string[];
  relatedLinks: RelatedLink[];
  published: boolean;
};

export type SubjectEntry = {
  id: string;
  slug: string;
  title: string;
  overview: string;
  subtopics: UnitTopic[];
  relatedClassSlugs: string[];
  relatedAssignmentSlugs: string[];
  resourceSlugs: string[];
  relatedLinks: RelatedLink[];
  published: boolean;
};

export type PrincipleEntry = {
  id: string;
  slug: string;
  title: string;
  overview: string;
  details: UnitTopic[];
  relatedClassSlugs: string[];
  relatedSubjectSlugs: string[];
  relatedAssignmentSlugs: string[];
  resourceSlugs: string[];
  relatedLinks: RelatedLink[];
  published: boolean;
};

export type AssignmentType = "homework" | "quiz" | "test" | "project" | "lab" | "reading" | "other";

export type AssignmentEntry = {
  id: string;
  slug: string;
  title: string;
  assignmentType: AssignmentType;
  classSlug: string;
  dueDate: string;
  description: string;
  relatedSubjectSlugs: string[];
  relatedPrincipleSlugs: string[];
  resourceSlugs: string[];
  relatedLinks: RelatedLink[];
  published: boolean;
};

export type ResourceEntry = {
  id: string;
  slug: string;
  title: string;
  resourceType: string;
  description: string;
  contentBody: string;
  externalUrl?: string;
  fileUrl?: string;
  relatedClassSlugs: string[];
  relatedSubjectSlugs: string[];
  relatedAssignmentSlugs: string[];
  relatedLinks: RelatedLink[];
  contributor: string;
  published: boolean;
};
