import { SiteNav } from "@/components/SiteNav";
import { canModerate, getHelixSession } from "@/lib/auth";

export default async function AccountPage() {
  const session = await getHelixSession();

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="bg-white p-6">
          <h1 className="font-serif text-4xl font-semibold">Account</h1>
          {session ? (
            <>
              <dl className="mt-6 divide-y divide-line border border-line text-sm">
                <div className="grid grid-cols-[150px_1fr] gap-3 p-3"><dt className="text-muted">Member ID</dt><dd>{session.memberId}</dd></div>
                <div className="grid grid-cols-[150px_1fr] gap-3 p-3"><dt className="text-muted">Display name</dt><dd>{session.displayName ?? "Unknown"}</dd></div>
                <div className="grid grid-cols-[150px_1fr] gap-3 p-3"><dt className="text-muted">Roles</dt><dd>{session.roles.join(", ")}</dd></div>
                <div className="grid grid-cols-[150px_1fr] gap-3 p-3"><dt className="text-muted">Status</dt><dd>{session.status ?? "None"}</dd></div>
                <div className="grid grid-cols-[150px_1fr] gap-3 p-3"><dt className="text-muted">Permissions</dt><dd>{canModerate(session) ? "Board moderation" : "Member editing"}</dd></div>
              </dl>
              <a href="/logout" className="mt-4 inline-block border border-line px-4 py-2 text-sm hover:bg-paper">Log out</a>
            </>
          ) : (
            <p className="mt-4 text-muted">No Helix member session was detected. Use the login page to sign in.</p>
          )}
        </section>
      </main>
    </div>
  );
}
