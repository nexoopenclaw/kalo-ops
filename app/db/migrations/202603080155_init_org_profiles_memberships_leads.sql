-- Kalo Ops initial backend schema for Supabase
-- Tables: organizations, profiles, memberships, leads

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id text primary key,
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  source text not null default 'manual',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_memberships_user_id on public.memberships(user_id);
create index if not exists idx_memberships_org_user on public.memberships(organization_id, user_id);
create index if not exists idx_leads_org_created_at on public.leads(organization_id, created_at desc);
create index if not exists idx_leads_org_email on public.leads(organization_id, email);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.leads enable row level security;

-- organizations policies
create policy "org_select_member"
on public.organizations
for select
using (
  owner_user_id = auth.uid()
  or exists (
    select 1 from public.memberships m
    where m.organization_id = organizations.id
      and m.user_id = auth.uid()
  )
);

create policy "org_insert_owner"
on public.organizations
for insert
with check (owner_user_id = auth.uid());

create policy "org_update_owner"
on public.organizations
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- profiles policies
create policy "profile_select_self"
on public.profiles
for select
using (id = auth.uid());

create policy "profile_insert_self"
on public.profiles
for insert
with check (id = auth.uid());

create policy "profile_update_self"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- memberships policies
create policy "membership_select_member"
on public.memberships
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.memberships m2
    where m2.organization_id = memberships.organization_id
      and m2.user_id = auth.uid()
  )
);

create policy "membership_insert_owner"
on public.memberships
for insert
with check (
  exists (
    select 1 from public.organizations o
    where o.id = memberships.organization_id
      and o.owner_user_id = auth.uid()
  )
);

create policy "membership_update_owner"
on public.memberships
for update
using (
  exists (
    select 1 from public.organizations o
    where o.id = memberships.organization_id
      and o.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.organizations o
    where o.id = memberships.organization_id
      and o.owner_user_id = auth.uid()
  )
);

-- leads policies
create policy "lead_select_member"
on public.leads
for select
using (
  exists (
    select 1 from public.memberships m
    where m.organization_id = leads.organization_id
      and m.user_id = auth.uid()
  )
  or exists (
    select 1 from public.organizations o
    where o.id = leads.organization_id
      and o.owner_user_id = auth.uid()
  )
);

create policy "lead_insert_member"
on public.leads
for insert
with check (
  exists (
    select 1 from public.memberships m
    where m.organization_id = leads.organization_id
      and m.user_id = auth.uid()
  )
  or exists (
    select 1 from public.organizations o
    where o.id = leads.organization_id
      and o.owner_user_id = auth.uid()
  )
);

create policy "lead_update_member"
on public.leads
for update
using (
  exists (
    select 1 from public.memberships m
    where m.organization_id = leads.organization_id
      and m.user_id = auth.uid()
  )
  or exists (
    select 1 from public.organizations o
    where o.id = leads.organization_id
      and o.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.memberships m
    where m.organization_id = leads.organization_id
      and m.user_id = auth.uid()
  )
  or exists (
    select 1 from public.organizations o
    where o.id = leads.organization_id
      and o.owner_user_id = auth.uid()
  )
);

create policy "lead_delete_owner"
on public.leads
for delete
using (
  exists (
    select 1 from public.organizations o
    where o.id = leads.organization_id
      and o.owner_user_id = auth.uid()
  )
);
