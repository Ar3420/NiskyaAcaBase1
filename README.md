# Niskayuna Academic Database

A Next.js App Router project for a Wikipedia-inspired academic knowledge base created by Helix Research and Development.

## Features

- Public database pages for classes, subjects, assignments/tests, and resources.
- Homework calendar and list views generated from assignment/test entries.
- Basic search across all seeded entity types.
- Wikipedia-style database page layout with read, edit, and history actions.
- Placeholder Helix member-session integration in `lib/auth.ts`.
- Supabase/Postgres migration with revision logging and future saved class filters.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill in values when Supabase and Helix auth are ready.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
HELIX_AUTH_COOKIE_NAME=helix_member_session
HELIX_AUTH_JWT_SECRET=
HELIX_MEMBER_LOGIN_URL=
```

The current app uses local seed data from `lib/data.ts` so the first version can run before Supabase is connected.

## Supabase Schema

The initial migration is in `supabase/migrations/202606260001_initial_academic_database.sql`.
For a copy-paste SQL setup with RLS policies and triggers, use `supabase/schema.sql`.

It creates:

- `classes`
- `subjects`
- `assignments`
- `resources`
- `entity_links`
- `revisions`
- `saved_class_filters`

Member IDs are stored as text fields to map later to the existing Helix custom member model.

## Auth Integration Notes

The Helix website is assumed to use custom member authentication with a JWT session cookie, not Supabase Auth. Update `getHelixSession()` in `lib/auth.ts` to verify the existing Helix cookie and return:

- `memberId`
- `displayName`
- `roles`

Editing is intentionally blocked unless a session is detected. Admin/board moderation hooks are represented by `canModerate()`.

## Logo

The homepage uses `public/na-database-logo.png`.

## Supabase Setup Guide

See `docs/supabase-setup.md` for backend creation, SQL, environment variables, and the recommended read/write integration flow.
