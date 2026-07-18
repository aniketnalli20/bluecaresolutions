# S.V. Kini Ayurvedic clinic

S.V. Kini Ayurvedic clinic is a clinic workspace with a Vite + React frontend and a separate Node + Express + MySQL backend for database connectivity.

## Production URL

- Use [https://bluecaresolutions.vercel.app/](https://bluecaresolutions.vercel.app/) as the primary application URL.

## What Is Included

- Clinic dashboard with today's appointments, OPD count, IPD count, revenue, stock alerts, follow-ups, quick actions, and recent consultations
- Patient management with Ayurvedic history, family history, allergy history, occupation, contact details, reminders, and visit timeline
- Visit planner for appointments, walk-ins, follow-ups, therapy planning, doctor calendar, and daily queue visibility
- OPD management with symptoms, Nadi examination, diagnosis, Ayurvedic assessment, prescriptions, diet and lifestyle advice, Panchakarma recommendation, and billing
- IPD management with admission records, bed allocation, treatment chart, Panchakarma schedule, medicine administration, diet plan, discharge summary, and final invoice
- Disease master with illness-specific medicine templates for direct prescription loading
- Unit-based medicine catalog, inventory monitoring, stock warnings, suppliers, purchase records, packages, billing, reports, notifications, and clinic admin tools

## Project Structure

```text
bluecaresolutions/
|-- backend/
|   |-- database/
|   |-- src/
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- package.json
|   `-- src/
|       |-- data/
|       |-- services/
|       |-- App.css
|       |-- App.jsx
|       `-- index.css
|-- vercel.json
`-- README.md
```

## Repeat Vercel Redeploys

- Root deployment config is defined in [vercel.json](file:///c:/xampp/htdocs/bluecaresolutions/vercel.json).
- Vercel installs from `frontend`, builds with `npm run build`, and serves `frontend/dist`.
- Any future UI or data changes must be redeployed to appear on [https://bluecaresolutions.vercel.app/](https://bluecaresolutions.vercel.app/).
- If Vercel does not pick up a new deployment automatically, trigger a manual redeploy from the Vercel project dashboard.
- SPA rewrites are already configured, so direct paths still resolve to the app entry correctly.

## Data Layer

- The app supports clinic data persistence with seeded demo records on first load.
- The clinic admin panel still includes backup, restore, and reset support.
- The `backend/` folder now contains a Node + Express + MySQL API for a real database-backed workflow.
