# BlueCare EMR

BlueCare EMR is now a React-only clinic workspace focused on a cleaner visual style and a smoother day-to-day workflow.

## What Is Included

- Dashboard with overview cards, upcoming visits, recent activity, and quick actions
- Patient management with search, filters, full profiles, allergies, conditions, and visit timeline
- Appointment planning with status updates for scheduled, checked in, completed, and cancelled visits
- Doctor management with specialization, availability, and assigned visit totals
- Consultation notes with diagnosis, treatment plans, and supporting document names
- Prescription creation with medicine details and downloadable summaries
- Billing with invoice creation, payment tracking, and downloadable receipts
- Reports with CSV export
- Notifications for upcoming visits, follow-ups, and payment reminders

## Project Structure

```text
bluecaresolutions/
|-- frontend/
|   |-- package.json
|   `-- src/
|       |-- data/
|       |-- services/
|       |-- App.css
|       |-- App.jsx
|       `-- index.css
`-- README.md
```

## Run The App

1. Open a terminal in `frontend`
2. Install dependencies

```bash
npm install
```

3. Start the app

```bash
npm run dev
```

4. Build for production

```bash
npm run build
```

## How Saving Works

- Starter records load automatically the first time the app opens
- Changes are saved on the current device through the browser
- Use the refresh button in the sidebar if you want to restore the starter records

## Design Direction

- Uses the palette `#03045e`, `#0077b6`, `#00b4d8`, `#90e0ef`, and `#caf0f8`
- Keeps the layout bright, readable, and calm for long sessions
- Uses simple built-in icons instead of emoji
