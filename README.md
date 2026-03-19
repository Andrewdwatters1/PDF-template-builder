# PDF Template Builder

A full-stack POC for visually building PDF templates. Staff upload a PDF, drag-and-drop fields onto it to define a reusable template, then stamp real values onto the PDF at signing time.

## Tech Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm |
| API | Fastify + TypeScript |
| Frontend | Vite + React + TypeScript |
| PDF Render (frontend) | PDF.js (`pdfjs-dist`) |
| PDF Stamping (API) | `pdf-lib` |
| Storage | Supabase (Postgres + Storage bucket) |

## Local Dev Setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A Supabase project (free tier works)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (Settings → API → service_role)

The frontend reads `VITE_API_URL` from its own `.env`. Copy `.env.example` to `apps/web/.env` as well if you need to override defaults.

### 3. Apply Supabase migrations

In the Supabase dashboard SQL editor, run the migration files in order:

```
supabase/migrations/20240101000000_init.sql
supabase/migrations/20240101000001_seed.sql
```

Then create the storage bucket:
- Go to Storage → New Bucket
- Name: `pdf-documents`
- Public: **off** (private)

### 4. Start dev servers

```bash
pnpm dev
```

This starts both the API (port 3001) and frontend (port 5173) concurrently via Turborepo.

Open [http://localhost:5173](http://localhost:5173)

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/documents/upload` | Upload PDF (multipart: `file`, `name`) |
| `GET` | `/documents` | List all documents |
| `GET` | `/documents/:id/file` | Stream PDF bytes (used by PDF.js) |
| `DELETE` | `/documents/:id` | Delete document, template, and storage object |
| `GET` | `/field-definitions` | List all field definitions |
| `POST` | `/field-definitions` | Create a custom field definition |
| `DELETE` | `/field-definitions/:id` | Delete a custom field definition |
| `POST` | `/templates` | Create or replace active template for a document |
| `GET` | `/templates/:documentId` | Get active template with field placements |
| `POST` | `/sign` | Stamp field values onto PDF, returns signed PDF bytes |

## Deployment

**API → Railway**
- Build command: `pnpm --filter api build`
- Start command: `node dist/server.js`
- Set all env vars in Railway dashboard

**Frontend → Vercel**
- Build command: `pnpm --filter web build`
- Output directory: `apps/web/dist`
- Set `VITE_API_URL` to your Railway API URL

## Custom Field IDs

When you add new custom fields via the `/fields` UI, they appear in the template builder palette immediately. However, **consuming signing applications** that process the `POST /sign` payload must be updated to handle new `fieldId` values — they are not automatically handled.

Core field IDs: `participant_name`, `signature`, `date_signed`, `ip_address_footer`

Custom examples: `favorite_car`, `best_movie_2024`, `hs_crush_name`
