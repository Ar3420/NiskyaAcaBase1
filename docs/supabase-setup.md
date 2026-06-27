# Supabase Backend Setup

## 1. Create the Supabase Project

1. Go to the Supabase dashboard.
2. Create a new project.
3. Save the project URL, anon public key, and service role key from Project Settings > API.

## 2. Run the SQL

Open SQL Editor in Supabase and run:

```sql
-- Paste the contents of supabase/schema.sql here.
```

The same SQL is available at `supabase/schema.sql`. It creates the database tables, indexes, updated-at triggers, RLS policies for public reads, and initial seed rows.

## 3. Configure Environment Variables

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HELIX_AUTH_COOKIE_NAME=helix_member_session
HELIX_AUTH_JWT_SECRET=your-helix-jwt-secret
HELIX_MEMBER_LOGIN_URL=https://your-helix-site.example/login
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components. Use it only in server route handlers or server actions after verifying the Helix member cookie.

## 4. Link Reads

Public pages can use the anon key to read published rows because RLS policies allow `published = true` for classes, subjects, assignments, and resources.

Recommended next implementation step:

```ts
const supabase = createSupabaseBrowserClient();
const { data } = await supabase
  .from("classes")
  .select("*")
  .eq("published", true)
  .order("title");
```

For server components, add a server Supabase helper that uses the anon key for public reads.

## 5. Link Writes

Because Helix uses custom auth instead of Supabase Auth, do not rely on Supabase client-side insert/update policies for editing.

Recommended write flow:

1. User submits an edit form to a Next.js route handler.
2. Route handler verifies the Helix JWT session cookie in `lib/auth.ts`.
3. Route handler loads the previous row from Supabase.
4. Route handler writes the updated row using `SUPABASE_SERVICE_ROLE_KEY`.
5. Route handler inserts a `revisions` row with member ID, display name, change summary, previous JSON, and new JSON.

## 6. Homework Calendar Query

The homework page should query `assignments`, join the class name, and filter by date range:

```sql
select
  assignments.*,
  classes.title as class_title,
  classes.slug as class_slug
from public.assignments
left join public.classes on classes.id = assignments.class_id
where assignments.published = true
  and assignments.due_date between date '2026-09-01' and date '2026-09-30'
order by assignments.due_date asc;
```

## 7. Search Query

A simple Supabase text search can use the GIN indexes from `schema.sql`:

```sql
select 'class' as entity_type, slug, title, overview as description
from public.classes
where published = true
  and to_tsvector('english', coalesce(title, '') || ' ' || coalesce(department, '') || ' ' || coalesce(overview, ''))
      @@ plainto_tsquery('english', 'stoichiometry');
```
