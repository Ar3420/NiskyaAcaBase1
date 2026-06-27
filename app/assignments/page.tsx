import { IndexPage } from "@/components/IndexPage";
import { SiteNav } from "@/components/SiteNav";
import { getAssignments, getClasses } from "@/lib/database";

export default async function AssignmentsPage() {
  const [assignments, classes] = await Promise.all([getAssignments(), getClasses()]);
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <IndexPage
        eyebrow="Database index"
        title="Assignments and Tests"
        description="Homework, quizzes, tests, projects, labs, readings, and other dated academic entries."
        items={assignments.map((entry) => ({
          title: entry.title,
          href: `/assignments/${entry.slug}`,
          description: entry.description,
          meta: `${entry.assignmentType} · ${classes.find((course) => course.slug === entry.classSlug)?.title ?? "Class TBD"}`,
        }))}
      />
    </div>
  );
}
