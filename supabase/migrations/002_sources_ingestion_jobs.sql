-- Phase 4b: canonical sources, web pages, ingestion jobs, chunk parent for file OR page
-- Apply after 001_initial.sql. Existing rows keep document_id set; source_id / source_page_id optional until backfilled.

-- -----------------------------------------------------------------------------
-- sources: umbrella for files, websites, future connectors (Helion Ops / Frappe)
-- -----------------------------------------------------------------------------
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  source_type text NOT NULL CHECK (source_type IN ('file', 'web', 'connector')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message text,
  content_fingerprint text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  indexed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sources_kb ON public.sources (knowledge_base_id);
CREATE INDEX idx_sources_org ON public.sources (organization_id);
CREATE INDEX idx_sources_type_status ON public.sources (source_type, status);

CREATE TRIGGER sources_updated_at
  BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- documents: optional 1:1 link to sources (file-backed knowledge)
-- -----------------------------------------------------------------------------
ALTER TABLE public.documents
  ADD COLUMN source_id uuid UNIQUE REFERENCES public.sources (id) ON DELETE CASCADE;

CREATE INDEX idx_documents_source ON public.documents (source_id);

-- -----------------------------------------------------------------------------
-- source_pages: crawled / fetched HTML pages for web sources
-- -----------------------------------------------------------------------------
CREATE TABLE public.source_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources (id) ON DELETE CASCADE,
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  url text NOT NULL,
  canonical_url text,
  title text,
  extracted_text text,
  content_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed', 'skipped')),
  fetch_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, url)
);

CREATE INDEX idx_source_pages_source ON public.source_pages (source_id);
CREATE INDEX idx_source_pages_org ON public.source_pages (organization_id);

CREATE TRIGGER source_pages_updated_at
  BEFORE UPDATE ON public.source_pages
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- document_chunks: allow chunks from a file (document) OR a web page
-- -----------------------------------------------------------------------------
ALTER TABLE public.document_chunks
  DROP CONSTRAINT IF EXISTS document_chunks_document_id_chunk_index_key;

ALTER TABLE public.document_chunks
  ADD COLUMN source_page_id uuid REFERENCES public.source_pages (id) ON DELETE CASCADE;

ALTER TABLE public.document_chunks
  ALTER COLUMN document_id DROP NOT NULL;

ALTER TABLE public.document_chunks
  ADD CONSTRAINT document_chunks_one_parent CHECK (
    (document_id IS NOT NULL AND source_page_id IS NULL)
    OR (document_id IS NULL AND source_page_id IS NOT NULL)
  );

CREATE UNIQUE INDEX document_chunks_document_chunk_idx
  ON public.document_chunks (document_id, chunk_index)
  WHERE document_id IS NOT NULL;

CREATE UNIQUE INDEX document_chunks_page_chunk_idx
  ON public.document_chunks (source_page_id, chunk_index)
  WHERE source_page_id IS NOT NULL;

CREATE INDEX idx_document_chunks_source_page ON public.document_chunks (source_page_id);

-- -----------------------------------------------------------------------------
-- ingestion_jobs: queue for crawl, file pipeline, reindex (MVP: poll or inline)
-- -----------------------------------------------------------------------------
CREATE TABLE public.ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases (id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.sources (id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  job_type text NOT NULL CHECK (job_type IN ('file_ingest', 'web_crawl', 'reindex', 'connector_sync')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX idx_ingestion_jobs_status_created ON public.ingestion_jobs (status, created_at);
CREATE INDEX idx_ingestion_jobs_org ON public.ingestion_jobs (organization_id);
CREATE INDEX idx_ingestion_jobs_source ON public.ingestion_jobs (source_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sources_all_member"
  ON public.sources FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "source_pages_all_member"
  ON public.source_pages FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "ingestion_jobs_select_member"
  ON public.ingestion_jobs FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "ingestion_jobs_insert_member"
  ON public.ingestion_jobs FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND auth.uid() = created_by
  );

CREATE POLICY "ingestion_jobs_update_member"
  ON public.ingestion_jobs FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "ingestion_jobs_delete_member"
  ON public.ingestion_jobs FOR DELETE
  USING (public.is_org_member(organization_id));
