alter table public.revisions
add column if not exists edited_by_role text,
add column if not exists edited_by_status text;
