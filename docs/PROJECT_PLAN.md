# AI Knowledge Chat — Project Plan (Helion City / Helion Intelligence)

Production-lean MVP: authenticated users upload business documents, ask questions, receive grounded answers with citations. Next.js route handlers + server modules only; no separate API service.

---

## 1. Full project plan

### Product scope (v1)

- **In scope:** PDF, TXT, DOCX text extraction (no OCR), chunking, embeddings (`text-embedding-3-small`, 1536-d), pgvector retrieval, OpenAI chat with citations, chat history, org/workspace data model with RLS.
- **Out of scope:** Billing, OCR, web scraping, multi-tenant billing, fine-tuning.

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
    knowledge/page.tsx          # documents list + upload entry
    chat/[sessionId]/page.tsx
    settings/page.tsx
  api/
    health/route.ts
    documents/upload/route.ts   # signed URL or multipart → storage + documents row
    documents/[id]/route.ts     # delete, reprocess
    ingest/route.ts             # server: parse → chunk → embed (service role)
    chat/route.ts               # retrieve chunks → OpenAI → persist messages
    dev/seed/route.ts
    dev/reset/route.ts
components/
  marketing/
  chat/
  documents/
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
    retrieval.ts
    citations.ts
  config.ts
types/
  database.ts                   # generated or hand-maintained
supabase/
  migrations/
```

---

## 3. Supabase schema & migrations

Implemented in `supabase/migrations/001_initial.sql`:

- Extensions: `vector`
- Tables: `profiles`, `organizations`, `organization_members`, `knowledge_bases`, `documents`, `document_chunks`, `chat_sessions`, `chat_messages`, `usage_events`
- Denormalized `organization_id` on `documents`, `document_chunks`, `chat_sessions` (and optional on messages) for simpler RLS
- Trigger: new auth user → profile + default org + membership + default knowledge base
- Indexes: FKs, `document_chunks` HNSW on `embedding` (cosine)

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
| `/knowledge` | GET | Document list, upload, delete |
| `/chat`, `/chat/[sessionId]` | GET | Chat UI + history sidebar |
| `/settings` | GET | Profile, org name (v1 minimal) |
| `/api/health` | GET | Liveness for deploys |
| `/api/documents/upload` | POST | Create `documents` row + signed upload URL or stream to storage |
| `/api/documents/[id]` | DELETE | Remove storage object + rows (or soft-delete later) |
| `/api/ingest` | POST | Load file from storage → parse → chunk → embed → `document_chunks` |
| `/api/chat` | POST | Embed query → similarity search → OpenAI → save messages |
| `/api/dev/seed` | POST | Local only: sample org/docs (guarded by env secret) |
| `/api/dev/reset` | POST | Local only: wipe user data (guarded) |

---

## 6. UI page breakdown

| Page | Sections |
| --- | --- |
| **Landing** | Hero (Helion City / Helion Intelligence), value props, feature grid, CTA to signup |
| **Login / Signup** | Email + password forms, link between them |
| **Dashboard** | Org name, KB name, counts (documents, sessions), shortcuts |
| **Knowledge** | Upload dropzone, table of documents (status, date), delete |
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
| **5** | Ingestion pipeline (parse, chunk, embed, pgvector) + status updates |
| **6** | Chat API + UI with citations + persistence |
| **7** | Chat history list + session titles |
| **8** | `usage_events` hooks (no billing UI), polish, `/api/dev/*` for local |

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
