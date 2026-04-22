-- AI Knowledge Chat — initial schema, RLS, storage (Helion City MVP)
-- Requires: PostgreSQL 15+ (Supabase), pgvector
--
-- Idempotent: safe to re-run if a previous attempt stopped partway (e.g. "profiles already exists").

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER + fixed search_path)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles (id),
  storage_path text NOT NULL,
  filename text NOT NULL,
  mime_type text,
  size_bytes bigint,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message text,
  chunk_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  token_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  citations jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON public.organization_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_org ON public.knowledge_bases (organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_kb ON public.documents (knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents (organization_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON public.document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_kb ON public.document_chunks (knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_org ON public.usage_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user ON public.usage_events (user_id);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw
  ON public.document_chunks
  USING hnsw (embedding vector_cosine_ops);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS knowledge_bases_updated_at ON public.knowledge_bases;
CREATE TRIGGER knowledge_bases_updated_at
  BEFORE UPDATE ON public.knowledge_bases
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auth bootstrap: profile + default org + membership + knowledge base
-- (Superseded by 004 for idempotent signup + backfill; kept for first-time installs.)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_slug text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1))
  );

  org_slug := 'ws-' || substr(md5(random()::text), 1, 12);

  INSERT INTO public.organizations (name, slug)
  VALUES ('My Workspace', org_slug)
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  INSERT INTO public.knowledge_bases (organization_id, name, slug)
  VALUES (new_org_id, 'Default', 'default');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- organizations
DROP POLICY IF EXISTS "organizations_select_member" ON public.organizations;
CREATE POLICY "organizations_select_member"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id));

DROP POLICY IF EXISTS "organizations_update_admin" ON public.organizations;
CREATE POLICY "organizations_update_admin"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- organization_members
DROP POLICY IF EXISTS "organization_members_select" ON public.organization_members;
CREATE POLICY "organization_members_select"
  ON public.organization_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_org_member(organization_id)
  );

-- knowledge_bases
DROP POLICY IF EXISTS "knowledge_bases_all_member" ON public.knowledge_bases;
CREATE POLICY "knowledge_bases_all_member"
  ON public.knowledge_bases FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- documents
DROP POLICY IF EXISTS "documents_all_member" ON public.documents;
CREATE POLICY "documents_all_member"
  ON public.documents FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- document_chunks
DROP POLICY IF EXISTS "document_chunks_all_member" ON public.document_chunks;
CREATE POLICY "document_chunks_all_member"
  ON public.document_chunks FOR ALL
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- chat_sessions
DROP POLICY IF EXISTS "chat_sessions_all_own_org" ON public.chat_sessions;
CREATE POLICY "chat_sessions_all_own_org"
  ON public.chat_sessions FOR ALL
  USING (
    user_id = auth.uid()
    AND public.is_org_member(organization_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_org_member(organization_id)
  );

-- chat_messages
DROP POLICY IF EXISTS "chat_messages_select_own_session" ON public.chat_messages;
CREATE POLICY "chat_messages_select_own_session"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = chat_messages.session_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "chat_messages_insert_own_session" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_own_session"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = chat_messages.session_id
        AND s.user_id = auth.uid()
    )
  );

-- usage_events
DROP POLICY IF EXISTS "usage_events_select_own" ON public.usage_events;
CREATE POLICY "usage_events_select_own"
  ON public.usage_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usage_events_insert_own" ON public.usage_events;
CREATE POLICY "usage_events_insert_own"
  ON public.usage_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_org_member(organization_id)
  );

-- -----------------------------------------------------------------------------
-- Storage: private bucket for knowledge files
-- Path convention: {organization_id}/{knowledge_base_id}/{document_id}/{filename}
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-files',
  'knowledge-files',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_knowledge_select" ON storage.objects;
CREATE POLICY "storage_knowledge_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "storage_knowledge_insert" ON storage.objects;
CREATE POLICY "storage_knowledge_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "storage_knowledge_update" ON storage.objects;
CREATE POLICY "storage_knowledge_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "storage_knowledge_delete" ON storage.objects;
CREATE POLICY "storage_knowledge_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );
