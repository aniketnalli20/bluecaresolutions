# S.V. Kini Clinic Backend

Node + Express + MySQL backend for the S.V. Kini Ayurvedic clinic project.

## What This Backend Does

- Connects the project to a MySQL database
- Exposes a health endpoint at `GET /api/health`
- Exposes a workspace API at:
  - `GET /api/workspace`
  - `PUT /api/workspace`
- Stores clinic modules in MySQL tables that mirror the current frontend workspace model

## Why This Structure

The current frontend still reads and writes a single workspace-shaped object. This backend keeps that same contract so you can move to MySQL without rewriting every screen first.

## Setup

1. Copy `.env.example` to `.env`
2. Update MySQL credentials
3. Create the database in MySQL
4. Run the schema file:

```sql
SOURCE database/schema.sql;
```

5. Install dependencies:

```bash
npm install
```

6. Check database connectivity:

```bash
npm run check:db
```

7. Start the backend:

```bash
npm run dev
```

## Default Local MySQL Values

These defaults work for many XAMPP setups:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sv_kini_clinic
```

## Next Integration Step

The backend is ready to connect to the React app next by replacing the current direct data-store calls with HTTP calls to:

- `GET /api/workspace`
- `PUT /api/workspace`

## Important

- The current `vercel.json` still builds only the frontend.
- This backend runs separately unless you deploy it to a backend host or convert it to serverless API routes later.
