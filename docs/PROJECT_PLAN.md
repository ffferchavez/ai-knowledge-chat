# AI Knowledge Chat — Project Plan (Helion City / Helion Intelligence)

Production-lean MVP: authenticated users build a knowledge base from **files and (Phase 4b) websites**, ask questions, and receive grounded answers with citations. Next.js route handlers + server modules only; no separate API service until ingestion latency or crawl scale forces a worker split.

---

## 1. Full project plan

### Product scope (v1 core + Phase 4b)

- **In scope (core):** PDF, TXT, DOCX text extraction (no OCR), chunking, embeddings (`text-embedding-3-small`, 1536-d), pgvector retrieval, OpenAI chat with citations, chat history, org/workspace data model with RLS.
- **In scope (Phase 4b):** Canonical **`sources`** model (file / web / reserved `connector`), **URL seed → bounded crawl or fetch**, **`source_pages`** + shared chunk pipeline, **`ingestion_jobs`** for queued work, admin **Sources** UI (list, status, reindex, delete), content fingerprinting to skip redundant re-embeds when unchanged.
- **Out of scope:** Billing, OCR, multi-tenant billing, fine-tuning, full browser automation farms, write-back into ERP/CRM, production-grade distributed crawl at web-scale (stay depth- and domain-bounded for MVP).

### Architecture

| Layer | Responsibility |
| --- | --- |
| **Next.js App Router** | UI, layouts, Server Components where possible |
| **Route Handlers** (`app/api/**/route.ts`) | Upload signed URLs, ingest jobs, chat completion, dev seed/reset |
| **Server-only modules** (`lib/server/**`) | OpenAI, parsing, chunking, embedding, service-role Supabase |
| **Supabase Auth** | Session cookies via `@supabase/ssr` |
| **Supabase Postgres + pgvector** | Relational data + vector search |
| **Supabase Storage** | Private `knowledge-files` bucket; paths scoped by `organization_id` |

### SaaS extension points (no billing yet)

- `organizations` + `organization_members` + `knowledge_bases` support future multi-workspace and roles.
- **`sources.source_type = 'connector'`** plus **`ingestion_jobs.job_type = 'connector_sync'`** reserve Helion Ops / Frappe-shaped adapters without implementing them yet; same retrieval path as file/web chunks.
- `usage_events` records embedding/chat/storage events; later map to metering/billing.
- Optional columns (not required in v1): `organizations.plan`, `organizations.stripe_customer_id` — add when billing lands.

### Security model

- **Browser / Server Components:** anon key + user JWT; RLS enforced.
- **Ingestion, embeddings, admin seed:** service role **only** in server route handlers or server actions, never exposed to the client.

---

## 2. Folder structure (target)

```
app/
  (marketing)/           # optional group; v1 uses app/page.tsx as landing
  (auth)/
    login/page.tsx
    signup/page.tsx
    auth/callback/route.ts
  (app)/
    dashboard/page.tsx
    knowledge/page.tsx          # sources list + upload + URL ingest entry (Phase 4b)
    knowledge/[sourceId]/page.tsx   # source detail: metadata, pages, job history (Phase 4b)
    chat/[sessionId]/page.tsx
    settings/page.tsx
  api/
    health/route.ts
    documents/upload/route.ts   # signed URL or multipart → storage + documents row (+ source row Phase 4b)
    documents/[id]/route.ts     # delete, reprocess
    sources/route.ts            # GET list (Phase 4b)
    sources/url/route.ts        # POST seed URL → source + job (Phase 4b)
    sources/[id]/route.ts       # GET detail, DELETE (Phase 4b)
    sources/[id]/reindex/route.ts
    jobs/[id]/route.ts          # optional: job status / cancel (Phase 4b)
    ingest/route.ts             # server: parse → chunk → embed (service role)
    jobs/process/route.ts       # optional: service-role cron/poll processes next queued job (Phase 4b)
    chat/route.ts               # retrieve chunks → OpenAI → persist messages
    dev/seed/route.ts
    dev/reset/route.ts
components/
  marketing/
  chat/
  documents/
  sources/                    # Phase 4b: table, badges, URL form
  layout/
lib/
  supabase/
    client.ts
    server.ts
    middleware.ts
  server/
    openai.ts
    embeddings.ts
    chunking.ts
    parsers.ts                  # pdf / txt / docx
    crawl.ts                    # Phase 4b: fetch, extract, normalize, robots-aware later
    retrieval.ts                # org-scoped: chunks from documents OR source_pages
    citations.ts
    connectors/                 # Phase 4b: empty registry + types for future Frappe adapters
      types.ts
  config.ts
types/
  database.ts                   # generated or hand-maintained
supabase/
  migrations/
```

---

## 3. Supabase schema & migrations

**`supabase/migrations/001_initial.sql`**

- Extensions: `vector`
- Tables: `profiles`, `organizations`, `organization_members`, `knowledge_bases`, `documents`, `document_chunks`, `chat_sessions`, `chat_messages`, `usage_events`
- Denormalized `organization_id` on `documents`, `document_chunks`, `chat_sessions` (and optional on messages) for simpler RLS
- Trigger: new auth user → profile + default org + membership + default knowledge base
- Indexes: FKs, `document_chunks` HNSW on `embedding` (cosine)

**`supabase/migrations/002_sources_ingestion_jobs.sql` (Phase 4b)**

- **`sources`:** `source_type` ∈ `file` | `web` | `connector` (connector stub for Helion Ops); `status`, `metadata` jsonb (seed URL, crawl limits, MIME, tags), `content_fingerprint` for skip-reindex when unchanged.
- **`documents.source_id`:** optional 1:1 link to `sources` for file-backed knowledge (new uploads should create `sources` then `documents`; legacy rows may have `NULL` until backfill).
- **`source_pages`:** one row per fetched URL for web sources; `extracted_text`, `content_hash`, `status`.
- **`document_chunks`:** exactly one parent — **`document_id`** XOR **`source_page_id`** — partial unique indexes per parent type; retrieval stays one table filtered by `organization_id` / `knowledge_base_id`.
- **`ingestion_jobs`:** `job_type` ∈ `file_ingest` | `web_crawl` | `reindex` | `connector_sync` (sync not implemented in MVP); `payload` jsonb for URLs, depth, document id, etc.

Apply **002** after **001** via Supabase CLI or SQL Editor. No automatic backfill of `sources` for existing `documents` in this migration (optional script later).

---

## 4. RLS policies (summary)

| Table | Policy idea |
| --- | --- |
| `profiles` | Users `SELECT`/`UPDATE` own row |
| `organizations` | `SELECT` if member; `UPDATE` if owner/admin (v1 can tighten) |
| `organization_members` | `SELECT` if self or same org |
| `knowledge_bases` | `SELECT`/`INSERT`/`UPDATE`/`DELETE` if org member (refine delete to admin later) |
| `documents` | All if `is_org_member(organization_id)` |
| `document_chunks` | Same |
| `sources` | All if `is_org_member(organization_id)` |
| `source_pages` | Same |
| `ingestion_jobs` | `SELECT` if member; `INSERT` if member and `created_by = auth.uid()`; `UPDATE`/`DELETE` if member (tighten to admin later if needed) |
| `chat_sessions` | `SELECT`/`INSERT`/`UPDATE`/`DELETE` own rows where `is_org_member(organization_id)` |
| `chat_messages` | Via `EXISTS` join to `chat_sessions` where `user_id = auth.uid()` |
| `usage_events` | `INSERT` with `user_id = auth.uid()`; `SELECT` own rows |

Storage bucket `knowledge-files`: path prefix `{organization_id}/...`; policies mirror org membership.

Service role bypasses RLS for ingestion pipelines invoked only on the server.

---

## 5. Route-by-route implementation plan

| Route | Method | Purpose |
| --- | --- | --- |
| `/` | GET | Marketing landing |
| `/login`, `/signup` | GET | Auth UI (Supabase email/password or OAuth later) |
| `/auth/callback` | GET | Exchange code for session |
| `/dashboard` | GET | Overview, quick links |
| `/knowledge` | GET | Sources list, upload, URL ingest, delete/reindex entry points |
| `/knowledge/[sourceId]` | GET | Source detail: metadata, web pages, errors (Phase 4b) |
| `/chat`, `/chat/[sessionId]` | GET | Chat UI + history sidebar |
| `/settings` | GET | Profile, org name (v1 minimal) |
| `/api/health` | GET | Liveness for deploys |
| `/api/documents/upload` | POST | Create `sources` (file) + `documents` + storage path (Phase 4b); until then documents-only |
| `/api/documents/[id]` | DELETE | Remove storage object + source/chunks cascade as implemented |
| `/api/sources` | GET | List sources for current KB/org (Phase 4b) |
| `/api/sources/url` | POST | Create `sources` (web) + queue `ingestion_jobs` `web_crawl` (Phase 4b) |
| `/api/sources/[id]` | GET, DELETE | Detail; delete cascades pages, chunks, document row if any (Phase 4b) |
| `/api/sources/[id]/reindex` | POST | Enqueue `reindex` job or inline reset fingerprint + pipeline (Phase 4b) |
| `/api/jobs/process` | POST | Service role / secret: claim next `queued` job (optional MVP worker) (Phase 4b) |
| `/api/ingest` | POST | Load file from storage → parse → chunk → embed → chunks; web: page rows → same chunker (Phase 4b) |
| `/api/chat` | POST | Embed query → similarity search over **all** org chunks → OpenAI → save messages |
| `/api/dev/seed` | POST | Local only: sample org/docs (guarded by env secret) |
| `/api/dev/reset` | POST | Local only: wipe user data (guarded) |

---

## 6. UI page breakdown

| Page | Sections |
| --- | --- |
| **Landing** | Hero (Helion City / Helion Intelligence), value props, feature grid, CTA to signup |
| **Login / Signup** | Email + password forms, link between them |
| **Dashboard** | Org name, KB name, counts (sources, sessions), shortcuts |
| **Knowledge** | Sources table (type badges: file / web / connector reserved), upload, URL form, status, reindex, delete |
| **Source detail** | Metadata, page list for web sources, last job error, fingerprint / indexed time (Phase 4b) |
| **Chat** | Session list, message thread, citations panel or inline footnotes |
| **Settings** | Display name, sign out |

---

## 7. Step-by-step development phases

| Phase | Deliverables |
| --- | --- |
| **1** | Next.js + Tailwind, landing page, folder skeleton, `docs/PROJECT_PLAN.md`, migration + README + `.env.example`, Supabase client stubs |
| **2** | Supabase Auth wired (middleware, login/signup, session), `profiles` sync verified |
| **3** | Dashboard shell, settings, org/KB display from DB |
| **4** | Storage bucket + upload API + document list/delete |
| **4b** | Apply `002_sources_ingestion_jobs.sql`; **`sources` / `source_pages` / `ingestion_jobs`** RLS verified; create `sources`+`documents` on file upload; **Sources** admin UI; **POST `/api/sources/url`** + bounded fetch/crawl → `source_pages` + shared chunk+embed path; **job runner**: simplest path = **inline completion in route handler** for small sites, optional **`/api/jobs/process`** + cron for longer crawls; **retrieval** unchanged except queries include page-backed chunks; **`connector` type** UI hidden or read-only “coming soon” |
| **5** | Ingestion pipeline hardened: fingerprints, idempotent reindex, status propagation `sources`/`documents`/`source_pages`, errors surfaced in UI |
| **6** | Chat API + UI with citations + persistence |
| **7** | Chat history list + session titles |
| **8** | `usage_events` hooks (no billing UI), polish, `/api/dev/*` for local |

---

## 7b. Phase 4b — design notes (jobs, crawl, connectors)

### Job execution (MVP, solo-founder realistic)

1. **Inline:** For small PDFs and single-page or shallow URL lists, run ingest in the same route handler after enqueueing a row (fastest to ship).
2. **Poll worker:** `ingestion_jobs.status = 'queued'` → a server route guarded by `CRON_SECRET` or Supabase **pg_cron** calling your deploy URL runs `POST /api/jobs/process`, which claims one job with `FOR UPDATE SKIP LOCKED` (or single-tenant `UPDATE ... WHERE status = 'queued' RETURNING`) and executes crawl/chunk/embed.
3. **Later:** Move worker to a dedicated process (still TypeScript) or Python only if crawl/parsing complexity warrants it — not required for Phase 4b schema.

### Crawl / scrape boundaries

- **MVP:** Same-origin or allowlisted host, max depth, max pages, polite delay; `fetch` + HTML text extraction (no Playwright unless you hit JS-rendered walls).
- **Store:** `source_pages` holds URL metadata + extracted text; vectors live in `document_chunks` linked to `source_page_id`.
- **Skip re-index:** Compare `content_hash` (and optional `content_fingerprint` on `sources`) before re-embedding.

### Future Helion Ops (Frappe) alignment

- Implement **connector adapters** as server modules under `lib/server/connectors/` that produce normalized **text segments** + metadata and enqueue `ingestion_jobs` `connector_sync` with `payload.connector_key` and credentials scoped by org (never in client).
- Reuse **`sources.source_type = 'connector'`** and the same chunk + citation pipeline as file/web.

---

## 8. Suggested environment variables

See `.env.example` in the repo root.

---

## 9. README setup instructions

See `README.md` in the repo root.

---

## 10. Phase 1 status

- [x] Next.js (App Router, TypeScript, Tailwind v4)
- [x] Marketing landing (Helion City / Helion Intelligence)
- [x] Route placeholders: `/login`, `/signup`, `/dashboard`
- [x] `docs/PROJECT_PLAN.md`, `supabase/migrations/001_initial.sql`, `.env.example`, `README.md`
- [x] `lib/supabase/client.ts` + `server.ts` stubs
- [x] `lib/config.ts` site metadata

Next: Phase 2 — auth middleware, real login/signup, and RLS-tested queries.

After Phase 4 completes file upload UX, apply **`002_sources_ingestion_jobs.sql`** and implement **Phase 4b** before or in parallel with hardening **Phase 5** (same chunk/embed pipeline for both parents).
