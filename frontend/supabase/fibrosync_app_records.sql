create extension if not exists pgcrypto;

create table if not exists public.fibrosync_app_records (
  sync_key text primary key,
  entity_type text not null,
  entity_id text not null,
  user_id text,
  user_email text,
  payload jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  source text not null default 'fibrosync-web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fibrosync_app_records_entity_type_idx
  on public.fibrosync_app_records (entity_type);

create index if not exists fibrosync_app_records_user_id_idx
  on public.fibrosync_app_records (user_id);

create or replace function public.touch_fibrosync_app_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fibrosync_app_records_set_updated_at
on public.fibrosync_app_records;

create trigger fibrosync_app_records_set_updated_at
before update on public.fibrosync_app_records
for each row
execute function public.touch_fibrosync_app_records_updated_at();

alter table public.fibrosync_app_records enable row level security;

-- Desenvolvimento inicial:
-- estas policies permitem que o frontend escreva no Supabase com a publishable key.
-- Nao crie policy de SELECT se nao quiser expor leitura publica.
create policy "fibrosync_app_records_anon_insert"
on public.fibrosync_app_records
for insert
to anon
with check (true);

create policy "fibrosync_app_records_anon_update"
on public.fibrosync_app_records
for update
to anon
using (true)
with check (true);
