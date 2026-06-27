import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { getHelixSession, loginWithHelixMember } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string; next?: string }> }) {
  const session = await getHelixSession();
  const resolvedSearchParams = await searchParams;
  const next = resolvedSearchParams?.next || "/account";

  async function loginAction(formData: FormData) {
    "use server";

    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextPath = String(formData.get("next") ?? "/account");
    const result = await loginWithHelixMember(identifier, password);

    if (!result.ok) {
      redirect(`/login?error=${encodeURIComponent(result.error ?? "Login failed")}&next=${encodeURIComponent(nextPath)}`);
    }

    redirect(nextPath.startsWith("/") ? nextPath : "/account");
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="border border-line bg-white p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Helix member access</p>
          <h1 className="font-serif text-4xl font-semibold">Login</h1>

          <p className="mt-4 text-muted">
            This page signs Helix members into the Academic Database. Public visitors can read published pages without
            logging in; member login enables editing and revision attribution.
          </p>

          {session ? (
            <div className="mt-6 border border-line bg-paper p-4">
              <p className="font-medium">You are already signed in as {session.displayName ?? session.memberId}.</p>
              <a href="/account" className="mt-3 inline-block border border-nisky px-4 py-2 text-sm font-medium text-nisky">
                Go to account
              </a>
            </div>
          ) : (
            <form action={loginAction} className="mt-6 grid gap-4">
              <input type="hidden" name="next" value={next} />
              {resolvedSearchParams?.error ? (
                <p className="border border-nisky bg-nisky/5 p-3 text-sm text-nisky">{resolvedSearchParams.error}</p>
              ) : null}
              <label className="grid gap-2 text-sm font-medium">
                Email, username, or member ID
                <input
                  name="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  className="border border-line bg-paper px-3 py-2"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{8}"
                  minLength={8}
                  maxLength={8}
                  title="Password must be exactly 8 numeric digits."
                  autoComplete="current-password"
                  className="border border-line bg-paper px-3 py-2"
                />
              </label>
              <button className="w-fit border border-nisky bg-nisky px-4 py-2 text-sm font-medium text-white">
                Sign in
              </button>
            </form>
          )}

          <div className="mt-6 border border-line bg-paper p-4 text-sm text-muted">
            This form checks the configured Helix member table in Supabase, verifies the password hash, then creates a
            signed HTTP-only session cookie for this app.
          </div>
        </section>
      </main>
    </div>
  );
}
