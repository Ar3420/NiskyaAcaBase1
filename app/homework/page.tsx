import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { canModerate, getHelixSession } from "@/lib/auth";
import { getAssignments, getClasses, getPrinciples, getSubjects } from "@/lib/database";
import { createEntityFromSnapshot, deleteEntityPage } from "@/lib/mutations";
import type { AssignmentEntry, ClassEntry } from "@/lib/types";

const assignmentTypes = ["homework", "quiz", "test", "project", "lab", "reading", "other"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type HomeworkSearchParams = {
  class?: string;
  subject?: string;
  type?: string;
  start?: string;
  end?: string;
  view?: string;
  month?: string;
};

export default async function HomeworkPage({ searchParams }: { searchParams?: Promise<HomeworkSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const selectedClass = resolvedSearchParams?.class ?? "";
  const selectedSubject = resolvedSearchParams?.subject ?? "";
  const selectedType = resolvedSearchParams?.type ?? "";
  const start = resolvedSearchParams?.start ?? "";
  const end = resolvedSearchParams?.end ?? "";
  const view = resolvedSearchParams?.view === "list" ? "list" : "calendar";
  const monthValue = resolvedSearchParams?.month ?? inferDefaultMonth(start);
  const calendarMonth = parseMonth(monthValue);
  const [assignments, classes, subjects, principles, session] = await Promise.all([
    getAssignments(),
    getClasses(),
    getSubjects(),
    getPrinciples(),
    getHelixSession(),
  ]);
  const canDelete = canModerate(session);

  const filtered = assignments
    .filter((entry) => !selectedClass || entry.classSlug === selectedClass)
    .filter((entry) => !selectedSubject || entry.relatedSubjectSlugs.includes(selectedSubject))
    .filter((entry) => !selectedType || entry.assignmentType === selectedType)
    .filter((entry) => !start || entry.dueDate >= start)
    .filter((entry) => !end || entry.dueDate <= end)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const calendarDays = buildCalendarDays(calendarMonth);
  const monthAssignments = filtered.filter((entry) => entry.dueDate.startsWith(formatMonth(calendarMonth)));
  const previousMonth = addMonths(calendarMonth, -1);
  const nextMonth = addMonths(calendarMonth, 1);

  async function createHomeworkAction(formData: FormData) {
    "use server";

    const activeSession = await getHelixSession();
    if (!activeSession) redirect("/login?next=/homework");

    const title = textField(formData, "title");
    const dueDate = textField(formData, "dueDate");
    const slug = textField(formData, "slug") || slugify([title, dueDate].filter(Boolean).join(" "));
    const snapshot = {
      title,
      slug,
      assignmentType: textField(formData, "assignmentType") || "homework",
      classSlug: textField(formData, "classSlug"),
      dueDate,
      description: textField(formData, "description"),
      relatedSubjectSlugs: listField(formData, "relatedSubjectSlugs"),
      relatedPrincipleSlugs: listField(formData, "relatedPrincipleSlugs"),
      resourceSlugs: [],
      published: true,
    };
    const result = await createEntityFromSnapshot({
      entityType: "assignment",
      snapshot,
      changeSummary: "Created homework entry.",
      session: activeSession,
    });
    if (!result.ok || !result.slug) redirect(`/homework?error=${encodeURIComponent(result.error ?? "Create failed")}`);
    redirect(`/assignments/${result.slug}?edit=1`);
  }

  async function deleteHomeworkAction(formData: FormData) {
    "use server";

    const activeSession = await getHelixSession();
    if (!canModerate(activeSession)) redirect("/login?next=/homework");

    await deleteEntityPage({ entityType: "assignment", entityId: textField(formData, "entityId") });
    redirect("/homework");
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Filtered assignment view</p>
            <h1 className="font-serif text-4xl font-semibold">Homework Calendar</h1>
            <p className="mt-2 max-w-3xl text-muted">
              This calendar is generated from assignment and test database entries. It is not a separate content type.
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <Link className={`border px-3 py-2 ${view === "list" ? "border-nisky bg-white text-nisky" : "border-line bg-white"}`} href={buildHomeworkHref(resolvedSearchParams, { view: "list" })}>
              <ListFilter className="mr-1 inline h-4 w-4" /> List
            </Link>
            <Link className={`border px-3 py-2 ${view === "calendar" ? "border-nisky bg-white text-nisky" : "border-line bg-white"}`} href={buildHomeworkHref(resolvedSearchParams, { view: "calendar" })}>
              <CalendarDays className="mr-1 inline h-4 w-4" /> Calendar
            </Link>
          </div>
        </div>

        <form className="mt-6 grid gap-3 bg-white p-4 md:grid-cols-7">
          <input type="hidden" name="view" value={view} />
          <select name="class" defaultValue={selectedClass} className="border border-line bg-paper px-3 py-2 text-sm">
            <option value="">All classes</option>
            {classes.map((course) => <option key={course.slug} value={course.slug}>{course.title}</option>)}
          </select>
          <select name="subject" defaultValue={selectedSubject} className="border border-line bg-paper px-3 py-2 text-sm">
            <option value="">All subjects</option>
            {subjects.map((subject) => <option key={subject.slug} value={subject.slug}>{subject.title}</option>)}
          </select>
          <select name="type" defaultValue={selectedType} className="border border-line bg-paper px-3 py-2 text-sm">
            <option value="">All types</option>
            {assignmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input name="month" type="month" defaultValue={formatMonth(calendarMonth)} className="border border-line bg-paper px-3 py-2 text-sm" />
          <input name="start" type="date" defaultValue={start} className="border border-line bg-paper px-3 py-2 text-sm" />
          <input name="end" type="date" defaultValue={end} className="border border-line bg-paper px-3 py-2 text-sm" />
          <button className="border border-nisky bg-nisky px-3 py-2 text-sm font-medium text-white">Apply filters</button>
        </form>

        <p className="mt-3 text-sm text-muted">
          For combined workload planning, leave class as all classes or filter to a selected course set once saved class filters are connected to member accounts.
        </p>

        <details className="mt-4 border border-gold bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-nisky">Add homework</summary>
          {session ? (
            <form action={createHomeworkAction} className="grid gap-3 border-t border-line bg-paper p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <input name="title" required placeholder="Homework title" className="border border-line bg-white px-3 py-2 text-sm" />
                <input name="slug" placeholder="Slug, optional" className="border border-line bg-white px-3 py-2 text-sm" />
                <select name="assignmentType" defaultValue="homework" className="border border-line bg-white px-3 py-2 text-sm">
                  {assignmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select name="classSlug" required defaultValue={selectedClass} className="border border-line bg-white px-3 py-2 text-sm">
                  <option value="">Select class</option>
                  {classes.map((course) => <option key={course.slug} value={course.slug}>{course.title}</option>)}
                </select>
                <input name="dueDate" required type="date" defaultValue={start || formatDate(new Date())} className="border border-line bg-white px-3 py-2 text-sm" />
                <input
                  name="relatedSubjectSlugs"
                  defaultValue={selectedSubject}
                  placeholder="Related subject slugs"
                  list="homework-subject-slugs"
                  className="border border-line bg-white px-3 py-2 text-sm"
                />
                <input
                  name="relatedPrincipleSlugs"
                  placeholder="Related principle slugs"
                  list="homework-principle-slugs"
                  className="border border-line bg-white px-3 py-2 text-sm"
                />
              </div>
              <textarea name="description" rows={3} placeholder="Homework directions or description" className="border border-line bg-white px-3 py-2 text-sm" />
              <datalist id="homework-subject-slugs">
                {subjects.map((subject) => <option key={subject.slug} value={subject.slug}>{subject.title}</option>)}
              </datalist>
              <datalist id="homework-principle-slugs">
                {principles.map((principle) => <option key={principle.slug} value={principle.slug}>{principle.title}</option>)}
              </datalist>
              <button className="w-fit border border-nisky bg-nisky px-4 py-2 text-sm font-medium text-white">Create homework</button>
            </form>
          ) : (
            <p className="border-t border-line p-4 text-sm text-muted">
              <Link href="/login?next=/homework">Log in</Link> as a Helix member to add homework.
            </p>
          )}
        </details>

        {view === "calendar" ? (
          <section className="mt-6 bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <Link href={buildHomeworkHref(resolvedSearchParams, { view: "calendar", month: formatMonth(previousMonth) })} className="inline-flex items-center gap-1 text-sm text-muted hover:text-nisky">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
              <h2 className="font-serif text-2xl font-semibold">
                {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <Link href={buildHomeworkHref(resolvedSearchParams, { view: "calendar", month: formatMonth(nextMonth) })} className="inline-flex items-center gap-1 text-sm text-muted hover:text-nisky">
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {dayNames.map((day) => <div key={day} className="px-2 py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayAssignments = monthAssignments.filter((entry) => entry.dueDate === day.isoDate);
                return (
                  <div key={day.isoDate} className={`min-h-32 border-b border-r border-line p-2 ${day.inCurrentMonth ? "bg-white" : "bg-paper/70 text-muted"}`}>
                    <div className="text-sm font-medium">{day.date.getDate()}</div>
                    <div className="mt-2 space-y-1">
                      {dayAssignments.map((entry) => <CalendarAssignment key={entry.id} entry={entry} classes={classes} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="mt-6 divide-y divide-line bg-white">
            {filtered.map((entry) => <AssignmentRow key={entry.id} entry={entry} classes={classes} canDelete={canDelete} deleteAction={deleteHomeworkAction} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function CalendarAssignment({ entry, classes }: { entry: AssignmentEntry; classes: ClassEntry[] }) {
  const course = classes.find((item) => item.slug === entry.classSlug);
  return (
    <Link href={`/assignments/${entry.slug}`} className="block rounded border border-line bg-paper px-2 py-1 text-xs hover:border-nisky hover:bg-white">
      <span className="block font-medium text-nisky">{entry.title}</span>
      <span className="block text-muted">{course?.title} - {entry.assignmentType}</span>
    </Link>
  );
}

function AssignmentRow({
  entry,
  classes,
  canDelete,
  deleteAction,
}: {
  entry: AssignmentEntry;
  classes: ClassEntry[];
  canDelete: boolean;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const course = classes.find((item) => item.slug === entry.classSlug);
  return (
    <div className="grid gap-2 p-4 hover:bg-paper md:grid-cols-[160px_1fr_170px_auto]">
      <Link href={`/assignments/${entry.slug}`} className="contents">
        <span className="text-sm font-medium">{new Date(`${entry.dueDate}T12:00:00`).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
        <span>
          <strong className="font-serif text-xl">{entry.title}</strong>
        </span>
        <span className="text-sm text-muted">{course?.title} - {entry.assignmentType}</span>
      </Link>
      {canDelete ? (
        <form action={deleteAction}>
          <input type="hidden" name="entityId" value={entry.id} />
          <button className="border border-nisky px-3 py-1 text-sm font-medium text-nisky hover:bg-nisky hover:text-white">
            Delete
          </button>
        </form>
      ) : null}
    </div>
  );
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      isoDate: date.toISOString().slice(0, 10),
      inCurrentMonth: date.getMonth() === month.getMonth(),
    };
  });
}

function parseMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return new Date(2026, 8, 1);
  return new Date(year, month - 1, 1);
}

function inferDefaultMonth(start?: string) {
  return start?.slice(0, 7) || "2026-09";
}

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildHomeworkHref(current: HomeworkSearchParams | undefined, updates: HomeworkSearchParams) {
  const params = new URLSearchParams();
  const merged = { ...current, ...updates };

  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }

  return `/homework?${params.toString()}`;
}

function textField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function listField(formData: FormData, key: string) {
  return textField(formData, key).split(",").map((item) => item.trim()).filter(Boolean);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
