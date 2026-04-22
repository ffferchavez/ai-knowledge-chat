-- Align production / staging with the app (public schema, workspace snapshot, chat).
-- Safe to re-run: idempotent inserts and replaced functions.
--
-- PREREQUISITE (required): run in the SQL editor FIRST, in this exact order:
--   1) 001_initial.sql
--   2) 002_sources_ingestion_jobs.sql
--   3) 003_match_document_chunks_fn.sql
-- Those files create public.profiles, public.chat_messages, etc. If you run only
-- this file on an empty project, you will get "relation public.chat_messages does not exist".

DO $migration_004_prereq$
BEGIN
  IF to_regclass('public.profiles') IS NULL
     OR to_regclass('public.organization_members') IS NULL
     OR to_regclass('public.organizations') IS NULL
     OR to_regclass('public.knowledge_bases') IS NULL
     OR to_regclass('public.chat_sessions') IS NULL
     OR to_regclass('public.chat_messages') IS NULL
  THEN
    RAISE EXCEPTION
      'Migration 004 requires the base schema. In the Supabase SQL editor, run these files from the repo IN ORDER, then run 004 again: (1) supabase/migrations/001_initial.sql (2) 002_sources_ingestion_jobs.sql (3) 003_match_document_chunks_fn.sql (4) 004_workspace_bootstrap_alignment.sql';
  END IF;
END
$migration_004_prereq$;

-- -----------------------------------------------------------------------------
-- Legacy public.profiles (e.g. other templates): add columns this app expects
-- (workspace snapshot selects id, email, full_name — same as 001_initial.sql)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.profiles p
SET
  email = COALESCE(NULLIF(trim(p.email), ''), NULLIF(trim(u.email), ''), ''),
  full_name = COALESCE(
    p.full_name,
    NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(COALESCE(NULLIF(trim(u.email), ''), 'user'), '@', 1)
  )
FROM auth.users u
WHERE u.id = p.id;

UPDATE public.profiles SET email = '' WHERE email IS NULL;
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;

-- -----------------------------------------------------------------------------
-- Chat: optional image attachments (app writes this column)
-- -----------------------------------------------------------------------------
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS attachments jsonb;

-- -----------------------------------------------------------------------------
-- Auth bootstrap: tolerate partial state (re-deploys, manual auth.users inserts)
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
  )
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

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
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------------------
-- One-time repair: users in auth without profile / org / KB (fixes "Workspace unavailable")
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.backfill_user_workspaces()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  u record;
  new_org_id uuid;
  org_slug text;
  repaired integer := 0;
BEGIN
  FOR u IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
  LOOP
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      u.id,
      COALESCE(u.email, ''),
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'user'), '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;

    IF NOT EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.user_id = u.id
    ) THEN
      org_slug := 'ws-' || substr(md5(random()::text || u.id::text), 1, 12);

      INSERT INTO public.organizations (name, slug)
      VALUES ('My Workspace', org_slug)
      RETURNING id INTO new_org_id;

      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES (new_org_id, u.id, 'owner');

      INSERT INTO public.knowledge_bases (organization_id, name, slug)
      VALUES (new_org_id, 'Default', 'default');

      repaired := repaired + 1;
    END IF;
  END LOOP;

  INSERT INTO public.knowledge_bases (organization_id, name, slug)
  SELECT DISTINCT om.organization_id, 'Default', 'default'
  FROM public.organization_members om
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.knowledge_bases k
    WHERE k.organization_id = om.organization_id
  )
  ON CONFLICT (organization_id, slug) DO NOTHING;

  RETURN repaired;
END;
$$;

-- Run once when this migration applies (returns count of users who received a new org stack)
SELECT public.backfill_user_workspaces();

COMMENT ON FUNCTION public.backfill_user_workspaces() IS
  'Repairs missing profile/org/membership/knowledge_base for auth.users. Re-run in SQL editor if needed: SELECT public.backfill_user_workspaces();';
