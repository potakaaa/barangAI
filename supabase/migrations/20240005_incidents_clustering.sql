-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: incidents_clustering
-- Introduces incidents table and pgvector for semantic clustering of reports.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Enable the vector extension for embeddings
create extension if not exists vector;

-- 2. Create the incidents table
create table if not exists incidents (
  id              uuid         primary key default gen_random_uuid(),
  title           text         not null,
  concern_type    text         not null,
  location_zone   text,
  status          text         not null default 'open'
                    check (status in ('open', 'resolved', 'monitoring', 'dismissed')),
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

-- 3. Auto-update updated_at for incidents
create trigger incidents_updated_at
  before update on incidents
  for each row execute function update_updated_at();

-- 4. Add incident linking and vector column to reports
alter table reports
  add column incident_id uuid references incidents(id) on delete set null,
  add column summary_embedding vector(768);

-- 5. Indexes for performance
create index idx_reports_incident on reports(incident_id);
create index idx_incidents_status on incidents(status);
create index idx_incidents_concern on incidents(concern_type);

-- 6. RPC Function for Vector Similarity Search
-- We create an RPC function so our Edge Function can call it to find similar reports.
create or replace function match_similar_reports(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_concern_type text,
  filter_location_zone text
)
returns table (
  id uuid,
  incident_id uuid,
  summary text,
  similarity float
)
language sql stable
as $$
  select
    reports.id,
    reports.incident_id,
    reports.summary,
    1 - (reports.summary_embedding <=> query_embedding) as similarity
  from reports
  where 1 - (reports.summary_embedding <=> query_embedding) > match_threshold
    and reports.concern_type = filter_concern_type
    and (filter_location_zone is null or reports.location_zone = filter_location_zone)
  order by reports.summary_embedding <=> query_embedding
  limit match_count;
$$;

