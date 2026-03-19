# PDF Template Builder — Claude Code Build Instructions

## Overview

Build a full-stack PDF template builder POC. Staff upload a PDF, visually 
drag-and-drop fields onto it to define a reusable template, and the system 
uses that template to stamp real values onto the PDF at signing time. This 
is a standalone product — not part of any existing codebase.

---

## Repo Structure

Initialize a **Turborepo monorepo** with the following workspace layout:

```
/
├── apps/
│   ├── api/          # Fastify Node.js API
│   └── web/          # Vite + React frontend
├── packages/
│   └── shared/       # Shared TypeScript types (TemplateField, 
Document, etc.)
├── turbo.json
├── package.json      # Root workspace
└── .env.example
```

Use `pnpm` as the package manager.

---

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo |
| API | Fastify + TypeScript |
| Frontend | Vite + React + TypeScript |
| PDF Render (frontend) | PDF.js (`pdfjs-dist`) |
| PDF Stamping (API) | `pdf-lib` |
| Storage | Supabase (Postgres + Storage bucket) |
| API Deploy | Railway |
| Frontend Deploy | Vercel |

---

## Environment Variables

Create `.env.example` at root:

```
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# API
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Frontend (Vite prefix required)
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Supabase Schema

Run these migrations. Create a `supabase/migrations/` folder at repo root 
and add a single migration file.

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  original_filename text not null,
  storage_path text not null,
  total_pages integer not null default 1,
  created_at timestamptz default now()
);

create table field_definitions (
  id uuid primary key default gen_random_uuid(),
  field_id text not null unique,
  label text not null,
  type text not null check (type in ('text', 'signature', 'date', 
'metadata', 'custom')),
  category text not null check (category in ('core', 'custom')),
  default_width numeric not null default 0.25,
  default_height numeric not null default 0.03,
  created_at timestamptz default now()
);

create table document_templates (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references document_templates(id) on delete cascade,
  field_definition_id uuid references field_definitions(id),
  page integer not null default 1,
  x numeric not null,
  y numeric not null,
  width numeric not null,
  height numeric not null
);
```

Create a Supabase Storage bucket named `pdf-documents` (private, accessed 
via service role key from API only).

Seed `field_definitions` with:

```sql
insert into field_definitions (field_id, label, type, category, 
default_width, default_height) values
  ('participant_name',  'Participant Name', 'text',      'core',   0.30, 
0.025),
  ('signature',         'Signature',        'signature', 'core',   0.35, 
0.080),
  ('date_signed',       'Date Signed',      'date',      'core',   0.18, 
0.025),
  ('ip_address_footer', 'IP / Meta Footer', 'metadata',  'core',   0.75, 
0.030),
  ('favorite_car',      'Favorite Car',     'text',      'custom', 0.25, 
0.025),
  ('best_movie_2024',   'Best Movie 2024',  'text',      'custom', 0.25, 
0.025),
  ('hs_crush_name',     'HS Crush Name',    'text',      'custom', 0.25, 
0.025);
```

---

## Shared Package (`packages/shared`)

Export TypeScript types used by both `api` and `web`:

```ts
export type FieldType = 'text' | 'signature' | 'date' | 'metadata' | 
'custom';
export type FieldCategory = 'core' | 'custom';

export interface FieldDefinition {
  id: string;
  fieldId: string;
  label: string;
  type: FieldType;
  category: FieldCategory;
  defaultWidth: number;
  defaultHeight: number;
}

export interface TemplateFieldPlacement {
  id?: string;
  fieldDefinitionId: string;
  fieldId: string;
  label: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentTemplate {
  id: string;
  documentId: string;
  version: number;
  isActive: boolean;
  fields: TemplateFieldPlacement[];
}

export interface DocumentRecord {
  id: string;
  name: string;
  originalFilename: string;
  storagePath: string;
  totalPages: number;
  createdAt: string;
}

export interface SigningPayload {
  templateId: string;
  fieldValues: Record<string, string>;
}
```

---

## API (`apps/api`)

### Dependencies

```
fastify
@fastify/cors
@fastify/multipart
@supabase/supabase-js
pdf-lib
dotenv
zod
```

### Route Structure

```
POST   /documents/upload          # Upload PDF to Supabase Storage, insert 
documents row
GET    /documents                  # List all documents
GET    /documents/:id/file         # Proxy-stream PDF bytes from Supabase 
Storage to client
DELETE /documents/:id              # Delete document + template + storage 
object

GET    /field-definitions          # Return all field_definitions rows
POST   /field-definitions          # Create a new field definition
DELETE /field-definitions/:id      # Delete a custom field definition

POST   /templates                  # Create or replace active template for a 
document
GET    /templates/:documentId      # Get active template for a document 
(with fields)

POST   /sign                       # Stamp PDF with field values, return 
signed PDF bytes
```

### Key Implementation Notes

**`POST /documents/upload`**
- Accept `multipart/form-data` with fields: `file` (PDF binary), `name` 
(string)
- Upload raw PDF bytes to Supabase Storage at path `documents/{uuid}.pdf`
- Parse total page count using `pdf-lib` (`PDFDocument.load` then 
`.getPageCount()`)
- Insert row into `documents` table, return the created record

**`GET /documents/:id/file`**
- Download PDF bytes from Supabase Storage using service role key
- Stream bytes back with `Content-Type: application/pdf`
- This is the URL PDF.js on the frontend will load

**`POST /templates`**
- Accept body: `{ documentId, fields: TemplateFieldPlacement[] }`
- Set any existing active template for the document to `is_active = false`
- Insert new `document_templates` row, then bulk insert `template_fields` 
rows
- Return full template with fields

**`POST /sign`**
- Accept body: `SigningPayload` — `{ templateId, fieldValues: { [fieldId]: 
string } }`
- Load template + fields from DB
- Load original PDF bytes from Supabase Storage
- Use `pdf-lib` to stamp each field:
  - `text`, `date`, `custom`: `page.drawText(value, { x, y, size, font })`
  - `metadata`: draw small text line at bottom of page (footer style)
  - `signature`: if value is a base64 data URL, embed as image via 
`page.drawImage`; otherwise draw as text
- Convert x/y/width/height from normalized (0–1) to absolute using actual 
page dimensions:
  ```ts
  const { width: pageW, height: pageH } = page.getSize();
  const absX = field.x * pageW;
  const absY = pageH - (field.y * pageH) - (field.height * pageH); // 
pdf-lib origin is bottom-left
  ```
- Return signed PDF as `application/pdf` binary response

### Error Handling

Use Zod for request validation on all routes. Return consistent error shape:
```json
{ "error": "string describing what went wrong" }
```

---

## Frontend (`apps/web`)

### Dependencies

```
react
react-dom
pdfjs-dist
axios (or native fetch)
```

No CSS framework. Use plain CSS with CSS custom properties matching the 
design system below.

### Design System (CSS Variables)

Define these in a global `styles/variables.css`:

```css
:root {
  --color-background-primary: #ffffff;
  --color-background-secondary: #f5f5f4;
  --color-background-tertiary: #e8e8e6;
  --color-text-primary: #1c1c1a;
  --color-text-secondary: #5f5e5a;
  --color-text-tertiary: #888780;
  --color-border-tertiary: rgba(0,0,0,0.12);
  --color-border-secondary: rgba(0,0,0,0.22);
  --color-accent: #BA7517;
  --color-accent-hover: #854F0B;
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: 'Menlo', 'Consolas', monospace;
  --radius-md: 8px;
  --radius-lg: 12px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background-primary: #1c1c1a;
    --color-background-secondary: #262624;
    --color-background-tertiary: #2c2c2a;
    --color-text-primary: #f0ede8;
    --color-text-secondary: #b4b2a9;
    --color-text-tertiary: #888780;
    --color-border-tertiary: rgba(255,255,255,0.10);
    --color-border-secondary: rgba(255,255,255,0.18);
  }
}
```

### Field Type Color Map

```ts
export const FIELD_TYPE_COLORS = {
  text:      { bg: 'rgba(59,130,246,0.12)',  border: '#3b82f6', text: 
'#1d4ed8', dot: '#3b82f6' },
  signature: { bg: 'rgba(139,92,246,0.12)',  border: '#8b5cf6', text: 
'#6d28d9', dot: '#8b5cf6' },
  date:      { bg: 'rgba(16,185,129,0.12)',  border: '#10b981', text: 
'#065f46', dot: '#10b981' },
  metadata:  { bg: 'rgba(245,158,11,0.12)',  border: '#f59e0b', text: 
'#92400e', dot: '#f59e0b' },
  custom:    { bg: 'rgba(236,72,153,0.12)',  border: '#ec4899', text: 
'#9d174d', dot: '#ec4899' },
};
```

### Page Structure

```
/                    → redirect to /documents
/documents           → DocumentListPage
/documents/new       → UploadPage
/documents/:id/build → TemplateBuilderPage  ← core UI
/sign/:templateId    → SigningTestPage       ← fill field values, download 
signed PDF
/fields              → FieldDefinitionsPage ← manage field palette 
(add/delete custom fields)
```

Use React Router v6.

### TemplateBuilderPage — UI Reference

This is the core screen. It is a three-panel layout:

```
┌─────────────────────────────────────────────────────────────┐
│ Header: doc name, page nav, zoom, Save Template button      │
├──────────────┬──────────────────────────────┬───────────────┤
│ Left Panel   │ Canvas                       │ Right Panel   │
│ Field Palette│ PDF.js renders the document  │ Placed Fields │
│              │ Drag fields from left onto   │ list + live   │
│ Chips:       │ the PDF. Each placed field   │ template JSON │
│ [field name] │ is a colored overlay div.    │ preview       │
│ [field type] │ Move by drag. Resize from    │               │
│              │ bottom-right handle.         │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

**Behavior:**
- Left panel fetches `GET /field-definitions` on mount
- PDF canvas fetches `GET /documents/:id/file` and renders via PDF.js
- Fields dragged onto overlay are stored in local React state as 
`PlacedField[]`
- Coordinates stored as normalized 0–1 fractions of page width/height 
(resolution-independent)
- Page navigation rerenders canvas and filters overlay to current page only
- "Save Template" calls `POST /templates` with all placed fields across all 
pages
- If a template already exists for the document, load it on mount via `GET 
/templates/:documentId` and pre-populate placed fields

**Placed field element:** absolutely positioned div over the PDF canvas 
overlay. Shows label text, delete button on hover, resize handle 
bottom-right. Colored by field type using `FIELD_TYPE_COLORS`.

### FieldDefinitionsPage

Simple CRUD table. Columns: field ID, label, type, category. Actions: delete 
(custom fields only — core fields cannot be deleted). Add form at top: 
inputs for `fieldId` (slug, no spaces), `label`, `type` (select), `category` 
defaults to `custom`. Submits to `POST /field-definitions`. Warn inline that 
adding new fields may require developer action in consuming applications.

### SigningTestPage

Form that loads the template's field list and renders one input per field 
(or a file input for `signature` type). On submit, calls `POST /sign` and 
triggers a browser download of the returned PDF blob. This is a 
validation/testing screen.

---

## Turborepo Config (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {}
  }
}
```

---

## Deployment Config

**API (Railway)**
- Set all env vars in Railway dashboard
- Start command: `node dist/server.js`
- Build command: `pnpm --filter api build`

**Frontend (Vercel)**
- Set `VITE_API_URL` to the Railway API URL
- Build command: `pnpm --filter web build`
- Output dir: `apps/web/dist`

---

## Git Branching

- Default branch: `main`
- Create `develop` branched from `main` immediately
- All feature work branches from `develop` using pattern `feature/<name>`
- Never commit directly to `main` or `develop`
- Suggested first feature branch: `feature/initial-scaffold`

---

## Build Order for Claude Code

Execute in this order:

1. Initialize Turborepo monorepo with pnpm, create workspace structure
2. Create `packages/shared` with all TypeScript types
3. Scaffold `apps/api` — Fastify server, Supabase client, all routes (stub 
handlers first, then implement)
4. Create `supabase/migrations/` with schema SQL and seed SQL
5. Scaffold `apps/web` — Vite + React, router, CSS variables, API client 
module
6. Implement `TemplateBuilderPage` (highest complexity — do this before 
other pages)
7. Implement remaining pages: DocumentList, Upload, FieldDefinitions, 
SigningTest
8. Wire end-to-end: upload a PDF → build template → sign → download
9. Add `.env.example`, `README.md` with local dev setup instructions
10. Commit everything to `feature/initial-scaffold`, push

---

## README Content (generate this file too)

The README should include: project overview, local dev setup (pnpm install, 
env vars, supabase migration steps, `pnpm dev`), API route reference table, 
and a note that new `fieldId` values added via the UI require corresponding 
handling in any consuming signing application.
