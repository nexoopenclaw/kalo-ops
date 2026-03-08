# Supabase Bootstrap (Kalo Ops)

## 1) Run migrations
1. Open Supabase SQL Editor.
2. Run in order:
   - `db/migrations/202603080155_init_org_profiles_memberships_leads.sql` (legacy baseline if not applied)
   - `db/migrations/202603082200_sprint17_supabase_multitenant_core.sql`

## 2) Create first organization + owner
1. Get your auth user UUID from `auth.users`.
2. Run `db/migrations/202603082210_bootstrap_first_org.sql` with params:
   - `owner_user_id`
   - `org_name`
   - `org_slug`

## 3) Attach existing user as owner
The bootstrap script inserts/upserts:
- `public.organizations`
- `public.memberships` (`role='owner'`)
- `public.profiles`

## 4) Verify RLS
Using an authenticated user token:
- `GET /api/leads/list` (with `Authorization: Bearer <token>`)
- `POST /api/leads/create`
- `POST /api/deals/update-stage`

Expected:
- Owner/Admin can read/write all org rows.
- Setter/Closer constrained by assigned ownership policies.
- Non-members receive forbidden auth-context errors.

## 5) Env setup
Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

Do **not** expose service role key in browser/client bundles.
