# LockdownCL Stats

Production-ready foundation for the LockdownCL esports stats site. Built with Next.js (App Router), TypeScript, Tailwind CSS, and a Supabase-compatible Postgres schema.

## Quick Start

```bash
npm install
npm run dev
```

Ensure `DATABASE_URL` is set before running the app locally.

Visit `http://localhost:3000` and explore:
- `/players`
- `/player/[discord_id]`
- `/series/[match_id]`

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repo and select **Next.js**.
3. Add the environment variables listed below.
4. Deploy.

## Environment Variables

Create a `.env` file locally or set these in Vercel:

```bash
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgres://username:password@host:5432/database
SHEETS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SHEET_ID=your-google-sheet-id
```

## Data Ingestion (Google Sheets)

The `/app/api/ingest-sheets` route is a stub to demonstrate how ingestion will work. It is ready to be replaced with real Google Sheets API logic:

- Use `SHEETS_CLIENT_EMAIL` and `SHEETS_PRIVATE_KEY` for service account auth.
- Fetch data from `SHEET_ID` and translate rows into Postgres inserts.
- The Postgres schema lives in `db/schema.sql`.

## Database Schema

See `db/schema.sql` for the full schema. It mirrors the league data model:

- `players`
- `series`
- `maps`
- `player_map_stats`

## API Endpoints (database-backed)

- `GET /api/players`
- `GET /api/player/[discord_id]`
- `GET /api/series/[match_id]`

These are powered by Postgres via `lib/queries.ts` and require `DATABASE_URL`.
