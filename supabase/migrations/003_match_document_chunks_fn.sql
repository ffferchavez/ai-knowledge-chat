-- Retrieval helper for pgvector similarity search.
-- Apply after 001/002 migrations.

create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  org_id uuid,
  kb_id uuid,
  match_count integer default 6,
  min_similarity double precision default 0.04
)
returns table (
  chunk_id uuid,
  document_id uuid,
  filename text,
  content text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id as chunk_id,
    c.document_id,
    d.filename,
    c.content,
    (1 - (c.embedding <=> query_embedding)) as similarity
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where
    c.organization_id = org_id
    and c.knowledge_base_id = kb_id
    and c.embedding is not null
    and c.document_id is not null
    and (1 - (c.embedding <=> query_embedding)) >= min_similarity
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;
