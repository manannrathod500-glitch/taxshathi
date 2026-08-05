-- Task B: manual "Add Client" flow
-- Manually-added clients live in `clients` (ca_user_id), share-link clients
-- stay in the existing `ca_clients` (ca_id) table. The dashboard merges both.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  ca_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  gstin text,
  phone text,
  email text,
  source text not null default 'manual' check (source in ('manual', 'share_link')),
  created_at timestamptz not null default now()
);

create index if not exists clients_ca_user_id_idx on public.clients (ca_user_id);

alter table public.clients enable row level security;

create policy "CAs can view their own clients"
  on public.clients for select
  using (auth.uid() = ca_user_id);

create policy "CAs can add their own clients"
  on public.clients for insert
  with check (auth.uid() = ca_user_id);

create policy "CAs can delete their own clients"
  on public.clients for delete
  using (auth.uid() = ca_user_id);
