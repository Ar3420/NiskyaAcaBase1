create extension if not exists "pgcrypto";

create table public.classes (
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

create table public.subjects (
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

create table public.assignments (
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

create table public.resources (
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

create table public.entity_links (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('class', 'subject', 'assignment', 'resource')),
  source_id uuid not null,
  target_type text not null check (target_type in ('class', 'subject', 'assignment', 'resource')),
  target_id uuid not null,
  relationship_type text not null,
  created_by_member_id text,
  created_at timestamptz not null default now()
);

create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('class', 'subject', 'assignment', 'resource')),
  entity_id uuid not null,
  edited_by_member_id text,
  edited_by_display_name text,
  change_summary text,
  previous_snapshot_json jsonb,
  new_snapshot_json jsonb,
  created_at timestamptz not null default now()
);

create table public.saved_class_filters (
  id uuid primary key default gen_random_uuid(),
  member_id text not null,
  class_ids uuid[] not null default '{}',
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index classes_published_slug_idx on public.classes(published, slug);
create index subjects_published_slug_idx on public.subjects(published, slug);
create index assignments_due_date_idx on public.assignments(due_date);
create index resources_published_slug_idx on public.resources(published, slug);
create index entity_links_source_idx on public.entity_links(source_type, source_id);
create index entity_links_target_idx on public.entity_links(target_type, target_id);
create index revisions_entity_idx on public.revisions(entity_type, entity_id, created_at desc);

insert into public.classes (slug, title, department, grade_levels, overview, metadata_json, published)
values
  ('honors-chemistry', 'Honors Chemistry', 'Science', array['10','11'], 'An accelerated chemistry course covering atomic structure, bonding, reactions, stoichiometry, thermochemistry, and laboratory practice.', '{"units":["Atomic structure","Chemical bonding","Stoichiometry","Solutions","Thermochemistry"]}', true),
  ('ap-biology', 'AP Biology', 'Science', array['11','12'], 'A college-level biology course organized around evolution, cellular processes, genetics, information transfer, ecology, and scientific practices.', '{"units":["Chemistry of life","Cell structure","Cellular energetics","Gene expression","Ecology"]}', true),
  ('ap-calculus-bc', 'AP Calculus BC', 'Mathematics', array['11','12'], 'A rigorous calculus course covering limits, derivatives, integrals, differential equations, sequences, and series.', '{"units":["Limits","Derivatives","Integrals","Parametric equations","Sequences and series"]}', true);

insert into public.subjects (slug, title, overview, metadata_json, published)
values
  ('trigonometry', 'Trigonometry', 'The study of angle relationships, right triangles, circular functions, identities, and periodic models used across mathematics and science.', '{"subtopics":["Unit circle","Graphing sine and cosine","Trigonometric identities","Inverse functions"]}', true),
  ('stoichiometry', 'Stoichiometry', 'A chemistry topic focused on quantitative relationships in balanced chemical reactions, including mole ratios and limiting reactants.', '{"subtopics":["Mole conversions","Balanced equations","Limiting reactants","Percent yield"]}', true);

insert into public.assignments (slug, title, assignment_type, class_id, due_date, description, metadata_json, published)
select 'unit-3-chemistry-test', 'Unit 3 Chemistry Test', 'test', c.id, '2026-09-25', 'Assessment covering chemical quantities, balanced equations, mole-to-mole calculations, and limiting reactants.', '{"related_subjects":["stoichiometry"]}', true
from public.classes c where c.slug = 'honors-chemistry';

insert into public.assignments (slug, title, assignment_type, class_id, due_date, description, metadata_json, published)
select 'textbook-problems-45-50', 'Textbook Problems 45-50', 'homework', c.id, '2026-09-18', 'Practice set on mole ratios and reaction quantities. Show work and include units for each answer.', '{"related_subjects":["stoichiometry"]}', true
from public.classes c where c.slug = 'honors-chemistry';

insert into public.resources (slug, title, resource_type, description, content_body, metadata_json, published)
values ('stoichiometry-review-guide', 'Stoichiometry Review Guide', 'Study guide', 'A reusable study guide for reviewing mole conversions, reaction ratios, limiting reactants, and percent yield.', 'Review balanced equations first, then identify the given quantity, convert to moles, use the reaction ratio, and convert to the requested unit.', '{"related_subjects":["stoichiometry"],"related_classes":["honors-chemistry"]}', true);
