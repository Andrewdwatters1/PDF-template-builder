# Handoff: Field Definitions Endpoint — PDF Template Builder

## Context

The PDF template builder (React/Fastify) needs a lightweight cross-app API 
endpoint that accepts field definitions from external apps and makes them 
available to the template builder UI. This allows any app (e.g. a client 
portal) to register its fieldIDs so template authors can map them to PDF 
fields by name.

## Stack

- **Backend:** Fastify — server at `/apps/api/src/server.ts`, routes at 
`/apps/api/src/routes/*`
- **Database:** Supabase (client already configured)
- **Auth:** API key via `x-api-key` request header

---

## Supabase Table

Create a table called `field_definitions` with the following columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `field_id` | `text` | Unique, not null — the app's fieldID string |
| `label` | `text` | Human-readable display name |
| `type` | `text` | e.g. `text`, `date`, `signature` |
| `created_at` | `timestamptz` | Default `now()` |

---

## Endpoints

Add a new route file at `/apps/api/src/routes/fieldDefinitions.ts`.

Register it in `server.ts` the same way existing routes are registered.

### Auth

All routes require an `x-api-key` header. The valid key should be read from 
an environment variable (e.g. `FIELD_DEFINITIONS_API_KEY`). Return `401` if 
missing or invalid.

---

### `POST /api/field-definitions`

Accepts an array of field definitions from an external app and upserts them 
into Supabase.

**Request body:**
```json
[
  { "field_id": "participant_name", "label": "Participant Name", "type": 
"text" },
  { "field_id": "signature", "label": "Signature", "type": "signature" }
]
```

**Behavior:**
- Validate that each item has `field_id`, `label`, and `type`
- Upsert on `field_id` (update `label` and `type` if already exists)
- Return `200` with count of upserted records on success

---

### `GET /api/field-definitions`

Returns all stored field definitions for use by the template builder UI.

**Response:**
```json
[
  { "id": "...", "field_id": "participant_name", "label": "Participant 
Name", "type": "text" },
  { "field_id": "signature", "label": "Signature", "type": "signature" }
]
```

---

## Intent

- The template builder UI will call `GET /api/field-definitions` to populate 
a field picker when authoring templates, so template authors can select 
portal fieldIDs by label rather than typing them manually
- External apps (e.g. the client portal) call `POST /api/field-definitions` 
to register their available fieldIDs — this can be triggered on deploy, 
config change, or manually
- No ownership/app-scoping is needed at this stage — a single shared flat 
list is sufficient
- Keep the implementation minimal; no pagination, filtering, or soft deletes 
required now
