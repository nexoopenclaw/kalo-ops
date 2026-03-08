-- Bootstrap first org + owner membership
-- Run in Supabase SQL editor after user exists in auth.users

-- Required params:
--   :owner_user_id (uuid)
--   :org_name (text)
--   :org_slug (text)

do $$
declare
  v_owner uuid := :'owner_user_id';
  v_org_name text := :'org_name';
  v_org_slug text := :'org_slug';
  v_org_id uuid;
begin
  insert into public.organizations (name, slug, owner_user_id)
  values (v_org_name, v_org_slug, v_owner)
  on conflict (slug) do update set name = excluded.name
  returning id into v_org_id;

  insert into public.memberships (organization_id, user_id, role, is_active)
  values (v_org_id, v_owner, 'owner', true)
  on conflict (organization_id, user_id)
  do update set role = 'owner', is_active = true, updated_at = now();

  insert into public.profiles (id, email, full_name)
  select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
  from auth.users u
  where u.id = v_owner
  on conflict (id) do nothing;
end $$;
