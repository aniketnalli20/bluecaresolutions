# S.V. Kini Ayurvedic clinic Frontend

This frontend is the Vite + React client for the S.V. Kini Ayurvedic clinic workspace.

## Production URL

- Primary URL: [https://bluecaresolutions.vercel.app/](https://bluecaresolutions.vercel.app/)

## Frontend Scope

- Single-clinic Ayurvedic dashboard and operations workspace
- OPD and IPD management
- Disease templates and prescription support
- Medicine catalog, inventory alerts, suppliers, and purchases
- Packages, invoices, reports, notifications, and clinic admin tools
- Dark and light mode with clinic UI styling
- Supabase-backed storage when `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are configured

## Deployment Notes

- The root Vercel configuration builds this frontend from the nested `frontend` directory.
- Production output is generated into `frontend/dist`.
- For any future changes, redeploy the project in Vercel so the production URL reflects the latest build.
- Supabase setup and schema details are documented in [../SUPABASE_SETUP.md](file:///c:/xampp/htdocs/bluecaresolutions/SUPABASE_SETUP.md).
