-- Optional folder organization for sources (UI + APIs under /api/knowledge/folders).
-- Idempotent. Apply after 002 (documents + sources exist).

-- -----------------------------------------------------------------------------
-- source_folders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.source_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  parent_folder_id uuid REFERENCES public.source_folders (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_folders_kb ON public.source_folders (knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_source_folders_org ON public.source_folders (organization_id);
CREATE INDEX IF NOT EXISTS idx_source_folders_parent ON public.source_folders (parent_folder_id);

-- One name per parent under a knowledge base (root vs nested)
CREATE UNIQUE INDEX IF NOT EXISTS source_folders_root_name_unique
  ON public.source_folders (knowledge_base_id, name)
  WHERE parent_folder_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS source_folders_nested_name_unique
  ON public.source_folders (knowledge_base_id, parent_folder_id, name)
  WHERE parent_folder_id IS NOT NULL;

DROP TRIGGER IF EXISTS source_folders_updated_at ON public.source_folders;
CREATE TRIGGER source_folders_updated_at
  BEFORE UPDATE ON public.source_folders
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.source_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "source_folders_all_member" ON public.source_folders;
CREATE POLICY "source_folders_all_member"
  ON public.source_folders FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- -----------------------------------------------------------------------------
-- documents / sources: optional folder assignment
-- -----------------------------------------------------------------------------
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.source_folders (id) ON DELETE SET NULL;

ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.source_folders (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_folder ON public.documents (folder_id);
CREATE INDEX IF NOT EXISTS idx_sources_folder ON public.sources (folder_id);
