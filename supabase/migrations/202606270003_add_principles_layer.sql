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

create index if not exists principles_published_slug_idx on public.principles(published, slug);
create index if not exists principles_search_idx on public.principles using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(overview, '')));

drop trigger if exists principles_set_updated_at on public.principles;
create trigger principles_set_updated_at before update on public.principles for each row execute function public.set_updated_at();

alter table public.principles enable row level security;

drop policy if exists "Public can read published principles" on public.principles;
create policy "Public can read published principles" on public.principles for select using (published = true);

alter table public.entity_links drop constraint if exists entity_links_source_type_check;
alter table public.entity_links add constraint entity_links_source_type_check check (source_type in ('class', 'subject', 'principle', 'assignment', 'resource'));

alter table public.entity_links drop constraint if exists entity_links_target_type_check;
alter table public.entity_links add constraint entity_links_target_type_check check (target_type in ('class', 'subject', 'principle', 'assignment', 'resource'));

alter table public.revisions drop constraint if exists revisions_entity_type_check;
alter table public.revisions add constraint revisions_entity_type_check check (entity_type in ('class', 'subject', 'principle', 'assignment', 'resource'));
