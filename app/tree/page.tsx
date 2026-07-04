import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/SiteNav";
import { getAssignments, getClasses, getPrinciples, getResources, getSubjects } from "@/lib/database";

export default async function TreePage() {
  const [classes, subjects, principles, assignments, resources] = await Promise.all([
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getAssignments(),
    getResources(),
  ]);

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Database relation map</p>
        <h1 className="font-serif text-4xl font-semibold">Tree</h1>
        <p className="mt-3 max-w-3xl text-muted">
          A visual outline of classes, their linked subjects, principles, assignments, and resources.
        </p>

        <div className="mt-8 space-y-6">
          {classes.map((course) => {
            const courseSubjects = subjects.filter((subject) => subject.relatedClassSlugs.includes(course.slug));
            const coursePrinciples = principles.filter((principle) => principle.relatedClassSlugs.includes(course.slug));
            const courseAssignments = assignments.filter((assignment) => assignment.classSlug === course.slug || course.assignmentSlugs.includes(assignment.slug));
            const courseResources = resources.filter((resource) => resource.relatedClassSlugs.includes(course.slug) || course.resourceSlugs.includes(resource.slug));

            return (
              <section key={course.slug} className="border-l-4 border-gold pl-4">
                <Link href={`/classes/${course.slug}`} className="font-serif text-2xl font-semibold">
                  {course.title}
                </Link>
                <div className="mt-3 grid gap-5 md:grid-cols-2">
                  <TreeGroup title="Subjects">
                    {courseSubjects.map((subject) => (
                      <li key={subject.slug}>
                        <Link href={`/subjects/${subject.slug}`}>{subject.title}</Link>
                        <ul className="ml-5 mt-1 list-disc text-sm">
                          {principles
                            .filter((principle) => principle.relatedSubjectSlugs.includes(subject.slug))
                            .map((principle) => (
                              <li key={principle.slug}>
                                <Link href={`/principles/${principle.slug}`}>{principle.title}</Link>
                              </li>
                            ))}
                        </ul>
                      </li>
                    ))}
                  </TreeGroup>
                  <TreeGroup title="Direct principles">
                    {coursePrinciples.map((principle) => (
                      <li key={principle.slug}><Link href={`/principles/${principle.slug}`}>{principle.title}</Link></li>
                    ))}
                  </TreeGroup>
                  <TreeGroup title="Assignments">
                    {courseAssignments.map((assignment) => (
                      <li key={assignment.slug}><Link href={`/assignments/${assignment.slug}`}>{assignment.title}</Link></li>
                    ))}
                  </TreeGroup>
                  <TreeGroup title="Resources">
                    {courseResources.map((resource) => (
                      <li key={resource.slug}><Link href={`/resources/${resource.slug}`}>{resource.title}</Link></li>
                    ))}
                  </TreeGroup>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function TreeGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-l border-line pl-4">
      <h2 className="font-serif text-xl font-semibold text-[#5f0f17]">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
        {children}
      </ul>
    </div>
  );
}
