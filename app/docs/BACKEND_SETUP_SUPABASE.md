# Backend Setup (Supabase) - Kalo Ops

## 1) Environment variables
Create `.env.local` in `app/` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill these values:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://raammojtwnoyrhihqjwm.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key shared in chat

> Important: `SUPABASE_SERVICE_ROLE_KEY` is still pending for the next backend phase (privileged server operations).

## 2) Install dependencies

```bash
npm install
```

## 3) Run SQL migration
In Supabase SQL Editor, run file:

- `db/migrations/202603080155_init_org_profiles_memberships_leads.sql`

This creates:
- `organizations`
- `profiles`
- `memberships`
- `leads`

With indexes + RLS policies scoped by organization owner/member.

## 4) Run app

```bash
npm run dev
```

## 5) Test backend endpoints quickly

- `GET /api/health`
- `GET /api/supabase/ping`
- `GET /api/leads/list?organizationId=org_demo_1`
- `POST /api/leads/create`

Example body:

```json
{
  "organizationId": "org_demo_1",
  "fullName": "Test Lead",
  "email": "lead@example.com",
  "phone": "+34 600 000 000",
  "source": "manual"
}
```

## 6) Vercel env vars
In Vercel Project → **Settings → Environment Variables** add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (next phase) `SUPABASE_SERVICE_ROLE_KEY`

Apply for Preview + Production, then redeploy.
