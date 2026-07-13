# Supabase Setup

This project now supports a Supabase-backed clinic data layer while preserving the current React UI.

## 1. Create the Database Schema

Open the Supabase SQL Editor for project `rmuvcqxegjkibzdkwxdu` and run:

- [clinic_schema.sql](file:///c:/xampp/htdocs/bluecaresolutions/supabase/clinic_schema.sql)

What this creates:

- `clinic_profile`
- `system_settings`
- `clinic_users`
- `patients`
- `visit_planner`
- `opd_consultations`
- `ipd_admissions`
- `disease_master`
- `suppliers`
- `medicine_catalog`
- `treatment_packages`
- `purchases`
- `invoices`

## 2. Configure Frontend Environment Variables

Copy [frontend/.env.example](file:///c:/xampp/htdocs/bluecaresolutions/frontend/.env.example) to `frontend/.env.local` and fill in:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Important:

- Use the publishable browser key
- Do not use the `service_role` key in the frontend

## 3. Configure Backend Environment Variables

The repository root now acts as the Node backend workspace for `@supabase/server`.

Copy [/.env.example](file:///c:/xampp/htdocs/bluecaresolutions/.env.example) to `.env` and set the real secret key locally:

```bash
SUPABASE_URL=https://rmuvcqxegjkibzdkwxdu.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_4qs-o94pw7U0Cweqb3mO7A_t2Kklcab
SUPABASE_SECRET_KEY=replace-with-your-full-supabase-secret-key
SUPABASE_JWKS_URL=https://rmuvcqxegjkibzdkwxdu.supabase.co/auth/v1/.well-known/jwks.json
```

Installed backend packages:

- `@supabase/server@1.3.0`
- `@supabase/supabase-js@2.110.3`

Optional helper files:

- [requestContext.example.js](file:///c:/xampp/htdocs/bluecaresolutions/server/requestContext.example.js)
- [verifyEnv.js](file:///c:/xampp/htdocs/bluecaresolutions/server/verifyEnv.js)

Backend env verification:

```bash
npm run check:backend-env
```

## 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

On first load with valid Supabase credentials and empty tables:

- the app seeds the Ayurvedic clinic demo workspace into Supabase
- subsequent saves write to Supabase first and keep a local cache for resilience

## 5. Auth and Session Mapping

The current app still works without changing the login flow.

Optional session mapping is ready for future use:

- `clinic_users.auth_user_id` can store a Supabase Auth user id
- when a session exists, the app can map that auth user to the matching clinic user

## 6. Current Security Posture

The schema enables RLS on all new tables and grants Data API access explicitly, but the current policies allow broad `anon` and `authenticated` CRUD so the existing frontend can work without redesigning auth.

That is acceptable only for demo and development migration.

Before production:

- restrict write access to authenticated users only
- add ownership or role-based policies
- stop allowing public anonymous write access
- connect clinic user roles to `auth_user_id`

## 7. Files Added for the Migration

- [supabaseClient.js](file:///c:/xampp/htdocs/bluecaresolutions/frontend/src/services/supabaseClient.js)
- [supabaseStore.js](file:///c:/xampp/htdocs/bluecaresolutions/frontend/src/services/supabaseStore.js)
- [workspaceTransforms.js](file:///c:/xampp/htdocs/bluecaresolutions/frontend/src/services/workspaceTransforms.js)
- [emrStore.js](file:///c:/xampp/htdocs/bluecaresolutions/frontend/src/services/emrStore.js)
- [requestContext.example.js](file:///c:/xampp/htdocs/bluecaresolutions/server/requestContext.example.js)

## 8. If Supabase Is Not Configured

The app falls back to the existing local cache, so the UI still works during setup.
