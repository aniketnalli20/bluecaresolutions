# BlueCare EMR

BlueCare EMR is a modular clinic management starter built with:

- React + Vite frontend
- PHP 8 REST API
- MySQL database schema
- Plain HTML/CSS/JavaScript compatible frontend assets

## Included Modules

- Dashboard with overview statistics, upcoming appointments, and recent activity
- Patient management with add/edit flow, profile details, allergies, conditions, and visit timeline
- Appointment management with doctor-wise scheduling and status tracking
- Doctor management with specialization and availability details
- Consultation and EMR records with notes, diagnosis, treatment plans, and supporting documents
- Prescription creation with downloadable text exports
- Billing and invoice generation with payment tracking and receipts
- Reports with CSV export
- Basic notifications for appointments, follow-ups, and billing reminders

## Project Structure

```text
bluecaresolutions/
|-- api/
|   |-- .env.example
|   |-- .htaccess
|   |-- bootstrap.php
|   `-- index.php
|-- database/
|   `-- schema.sql
|-- frontend/
|   |-- .env.example
|   |-- package.json
|   `-- src/
`-- README.md
```

## Backend Setup

1. Copy `api/.env.example` to `api/.env`.
2. Update the database credentials for your MySQL server.
3. Import `database/schema.sql` into MySQL.
4. Place the project under Apache/XAMPP so `http://localhost/bluecaresolutions/api` is reachable.

## Frontend Setup

1. Copy `frontend/.env.example` to `frontend/.env` if you need a custom API URL.
2. Install dependencies:

```bash
cd frontend
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Notes

- The React app automatically falls back to demo data if the PHP API or database is unavailable.
- API responses are JSON-based and designed for REST-style integration.
- Database writes use prepared statements through PDO.
- Uploaded clinical files are currently modeled as filenames and should be extended with a secure storage flow for production use.
