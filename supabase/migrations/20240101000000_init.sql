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
  type text not null check (type in ('text', 'signature', 'date', 'metadata', 'custom')),
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

-- Storage bucket: pdf-documents (private)
-- Create via Supabase dashboard or CLI: supabase storage create pdf-documents
-- Bucket settings: public = false, file size limit = 50MB
