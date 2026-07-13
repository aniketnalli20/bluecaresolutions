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

- the app seeds the Ayurvedic clinic demo workspace into Supabase only for prepared clinic emails
- subsequent saves write to Supabase first and keep a local cache for resilience

Prepared first-run emails:

- `admin@svkini.clinic`
- `kavya.iyer@svkini.clinic`
- `rohan.sharma@svkini.clinic`
- `anjali.das@svkini.clinic`

## 5. Configure Supabase Auth

Open Supabase Dashboard -> `Authentication` and confirm:

- Email provider is enabled
- `Site URL` matches your frontend URL
- `Redirect URLs` include your local and production app URLs

Recommended redirect URLs:

- `http://localhost:5173`
- your deployed Vercel URL

Password reset and email confirmation links return to the React app, which now shows:

- sign in
- sign up
- forgot password
- update password after recovery link

Recommended first admin setup:

- use `admin@svkini.clinic`
- create the Supabase account from the auth screen using the seeded access card
- sign in again after confirmation if your project requires email confirmation

## 6. Auth and Clinic User Mapping

The workspace is now protected when Supabase credentials are configured.

How access works:

- the user must authenticate with Supabase first
- the authenticated email must match a record in `clinic_users.email`, or that row must already contain the same `auth_user_id`
- if an email match exists, the app automatically stores the Supabase user id in `clinic_users.auth_user_id`
- module access is still controlled by `clinic_users.allowed_views`

Important admin rule:

- every clinic user who should be able to sign in must have a valid email in Clinic Admin -> User Management
- the sign-in email must match that clinic user email exactly
- users without a linked clinic profile can authenticate but cannot enter the workspace

## 7. Current Security Posture

The schema now enforces authenticated clinic access only.

Current policy model:

- `anon` no longer has CRUD access to clinic tables
- authenticated users must match an active clinic user by `auth_user_id` or clinic email
- `Clinic Administrator` and `Chief Ayurvedic Physician` can manage admin-owned tables
- operational tables remain available to authenticated clinic members inside the same clinic
- first-run bootstrap is allowed only for the prepared clinic emails listed above when the clinic has no users yet

Production note:

- this is significantly safer than the earlier demo-wide CRUD setup
- if you later add multiple clinics or server-side admin actions, extend the policies again instead of widening them

## 8. Files Added for the Migration

- [supabaseClient.js](file:///c:/xampp/htdocs/bluecaresolutions/frontend/src/services/supabaseClient.js)
- [supabaseStore.js](file:///c:/xampp/htdocs/bluecaresolutions/frontend/src/services/supabaseStore.js)
- [workspaceTransforms.js](file:///c:/xampp/htdocs/bluecaresolutions/frontend/src/services/workspaceTransforms.js)
- [emrStore.js](file:///c:/xampp/htdocs/bluecaresolutions/frontend/src/services/emrStore.js)
- [requestContext.example.js](file:///c:/xampp/htdocs/bluecaresolutions/server/requestContext.example.js)

## 9. If Supabase Is Not Configured

The app falls back to the existing local cache, so the UI still works during setup.
