create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  department text,
  grade_levels text[] not null default '{}',
  overview text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by_member_id text,
  updated_by_member_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published boolean not null default false
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  overview text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by_member_id text,
  updated_by_member_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published boolean not null default false
);

create table if not exists public.principles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  overview text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by_member_id text,
  updated_by_member_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published boolean not null default false
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  assignment_type text not null check (assignment_type in ('homework', 'quiz', 'test', 'project', 'lab', 'reading', 'other')),
  class_id uuid references public.classes(id) on delete set null,
  due_date date,
  description text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by_member_id text,
  updated_by_member_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published boolean not null default false
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  resource_type text,
  description text,
  content_body text,
  external_url text,
  file_url text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by_member_id text,
  updated_by_member_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published boolean not null default false
);

create table if not exists public.entity_links (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('class', 'subject', 'principle', 'assignment', 'resource')),
  source_id uuid not null,
  target_type text not null check (target_type in ('class', 'subject', 'principle', 'assignment', 'resource')),
  target_id uuid not null,
  relationship_type text not null,
  created_by_member_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('class', 'subject', 'principle', 'assignment', 'resource')),
  entity_id uuid not null,
  edited_by_member_id text,
  edited_by_display_name text,
  edited_by_role text,
  edited_by_status text,
  change_summary text,
  previous_snapshot_json jsonb,
  new_snapshot_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_class_filters (
  id uuid primary key default gen_random_uuid(),
  member_id text not null,
  class_ids uuid[] not null default '{}',
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classes_published_slug_idx on public.classes(published, slug);
create index if not exists classes_search_idx on public.classes using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(department, '') || ' ' || coalesce(overview, '')));
create index if not exists subjects_published_slug_idx on public.subjects(published, slug);
create index if not exists subjects_search_idx on public.subjects using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(overview, '')));
create index if not exists principles_published_slug_idx on public.principles(published, slug);
create index if not exists principles_search_idx on public.principles using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(overview, '')));
create index if not exists assignments_due_date_idx on public.assignments(due_date);
create index if not exists assignments_search_idx on public.assignments using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
create index if not exists resources_published_slug_idx on public.resources(published, slug);
create index if not exists resources_search_idx on public.resources using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content_body, '')));
create index if not exists entity_links_source_idx on public.entity_links(source_type, source_id);
create index if not exists entity_links_target_idx on public.entity_links(target_type, target_id);
create index if not exists revisions_entity_idx on public.revisions(entity_type, entity_id, created_at desc);

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();

drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at before update on public.subjects for each row execute function public.set_updated_at();

drop trigger if exists principles_set_updated_at on public.principles;
create trigger principles_set_updated_at before update on public.principles for each row execute function public.set_updated_at();

drop trigger if exists assignments_set_updated_at on public.assignments;
create trigger assignments_set_updated_at before update on public.assignments for each row execute function public.set_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at before update on public.resources for each row execute function public.set_updated_at();

drop trigger if exists saved_class_filters_set_updated_at on public.saved_class_filters;
create trigger saved_class_filters_set_updated_at before update on public.saved_class_filters for each row execute function public.set_updated_at();

alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.principles enable row level security;
alter table public.assignments enable row level security;
alter table public.resources enable row level security;
alter table public.entity_links enable row level security;
alter table public.revisions enable row level security;
alter table public.saved_class_filters enable row level security;

drop policy if exists "Public can read published classes" on public.classes;
create policy "Public can read published classes" on public.classes for select using (published = true);

drop policy if exists "Public can read published subjects" on public.subjects;
create policy "Public can read published subjects" on public.subjects for select using (published = true);

drop policy if exists "Public can read published principles" on public.principles;
create policy "Public can read published principles" on public.principles for select using (published = true);

drop policy if exists "Public can read published assignments" on public.assignments;
create policy "Public can read published assignments" on public.assignments for select using (published = true);

drop policy if exists "Public can read published resources" on public.resources;
create policy "Public can read published resources" on public.resources for select using (published = true);

drop policy if exists "Public can read links" on public.entity_links;
create policy "Public can read links" on public.entity_links for select using (true);

drop policy if exists "Public can read revisions" on public.revisions;
create policy "Public can read revisions" on public.revisions for select using (true);

-- Do not add public insert/update/delete policies while using Helix custom auth.
-- Create server-side Next.js route handlers that verify the Helix JWT cookie,
-- then write with SUPABASE_SERVICE_ROLE_KEY and insert a matching revisions row.

insert into public.classes (slug, title, department, grade_levels, overview, metadata_json, published)
values
  ('honors-chemistry', 'Honors Chemistry', 'Science', array['10','11'], 'An accelerated chemistry course covering atomic structure, bonding, reactions, stoichiometry, thermochemistry, and laboratory practice.', '{"units":["Atomic structure","Chemical bonding","Stoichiometry","Solutions","Thermochemistry"]}', true),
  ('ap-biology', 'AP Biology', 'Science', array['11','12'], 'A college-level biology course organized around evolution, cellular processes, genetics, information transfer, ecology, and scientific practices.', '{"units":["Chemistry of life","Cell structure","Cellular energetics","Gene expression","Ecology"]}', true),
  ('ap-calculus-bc', 'AP Calculus BC', 'Mathematics', array['11','12'], 'A rigorous calculus course covering limits, derivatives, integrals, differential equations, sequences, and series.', '{"units":["Limits","Derivatives","Integrals","Parametric equations","Sequences and series"]}', true)
on conflict (slug) do nothing;

insert into public.subjects (slug, title, overview, metadata_json, published)
values
  ('trigonometry', 'Trigonometry', 'The study of angle relationships, right triangles, circular functions, identities, and periodic models used across mathematics and science.', '{"subtopics":["Unit circle","Graphing sine and cosine","Trigonometric identities","Inverse functions"]}', true),
  ('stoichiometry', 'Stoichiometry', 'A chemistry topic focused on quantitative relationships in balanced chemical reactions, including mole ratios and limiting reactants.', '{"subtopics":["Mole conversions","Balanced equations","Limiting reactants","Percent yield"]}', true)
on conflict (slug) do nothing;

insert into public.assignments (slug, title, assignment_type, class_id, due_date, description, metadata_json, published)
select 'unit-3-chemistry-test', 'Unit 3 Chemistry Test', 'test', c.id, '2026-09-25', 'Assessment covering chemical quantities, balanced equations, mole-to-mole calculations, and limiting reactants.', '{"related_subjects":["stoichiometry"]}', true
from public.classes c where c.slug = 'honors-chemistry'
on conflict (slug) do nothing;

insert into public.assignments (slug, title, assignment_type, class_id, due_date, description, metadata_json, published)
select 'textbook-problems-45-50', 'Textbook Problems 45-50', 'homework', c.id, '2026-09-18', 'Practice set on mole ratios and reaction quantities. Show work and include units for each answer.', '{"related_subjects":["stoichiometry"]}', true
from public.classes c where c.slug = 'honors-chemistry'
on conflict (slug) do nothing;

insert into public.resources (slug, title, resource_type, description, content_body, metadata_json, published)
values ('stoichiometry-review-guide', 'Stoichiometry Review Guide', 'Study guide', 'A reusable study guide for reviewing mole conversions, reaction ratios, limiting reactants, and percent yield.', 'Review balanced equations first, then identify the given quantity, convert to moles, use the reaction ratio, and convert to the requested unit.', '{"related_subjects":["stoichiometry"],"related_classes":["honors-chemistry"]}', true)
on conflict (slug) do nothing;

-- The initial placeholder content is immediately removed so new deployments start empty.
delete from public.resources where slug in ('stoichiometry-review-guide');
delete from public.assignments where slug in ('unit-3-chemistry-test', 'textbook-problems-45-50');
delete from public.subjects where slug in ('trigonometry', 'stoichiometry');
delete from public.classes where slug in ('honors-chemistry', 'ap-biology', 'ap-calculus-bc');
