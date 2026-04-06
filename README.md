# AI Knowledge Chat

Production-lean MVP for **Helion City** under the **Helion Intelligence** service line: a SaaS-style AI knowledge assistant where authenticated users build a knowledge base from **uploaded files and (Phase 4b) websites**, then ask questions with citations.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** (Auth, Postgres, Storage) with **Row Level Security**
- **pgvector** for embeddings retrieval
- **OpenAI** for embeddings and chat (wired in Phases 5–6)

Architecture uses **Next.js route handlers and server modules only** — no separate backend service.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key (for ingestion and chat phases)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example file and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; ingestion and privileged jobs |
| `OPENAI_API_KEY` | Server-only; embeddings + chat |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (OAuth redirects, links) |

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` to the browser.

### 3. Database and storage

Apply migrations in order using the [Supabase CLI](https://supabase.com/docs/guides/cli) or paste each file into the SQL Editor in the Supabase dashboard:

1. **`supabase/migrations/001_initial.sql`** — enables **pgvector**, core tables and **RLS**, private **`knowledge-files`** bucket, **`auth.users`** trigger (profile + default org + KB).
2. **`supabase/migrations/002_sources_ingestion_jobs.sql`** (Phase 4b) — **`sources`**, **`source_pages`**, **`ingestion_jobs`**, links **file** rows through `documents.source_id`, and allows **chunks** from either a file (`document_id`) or a web page (`source_page_id`).
3. **`supabase/migrations/003_match_document_chunks_fn.sql`** — pgvector similarity function used by chat retrieval (`match_document_chunks`), with fallback logic in app code if not present.

See [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) §7 and **§7b** for Phase 4b routes, UI, and job-runner options.

Confirm **Authentication → Providers** matches your desired login method (email, etc.).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Health check

```bash
curl -s http://localhost:3000/api/health
```

### 6. Worker and dev-admin routes

- Queue worker endpoint:
  - `POST /api/jobs/process?limit=5`
  - requires `CRON_SECRET` via `x-cron-secret` or Bearer token.
- Dev-only seed/reset endpoints:
  - `POST /api/dev/seed`
  - `POST /api/dev/reset`
  - require `DEV_ADMIN_SECRET` via `x-dev-admin-secret` or Bearer token.

Example:

```bash
curl -X POST "http://localhost:3000/api/dev/seed" \
  -H "x-dev-admin-secret: $DEV_ADMIN_SECRET"
```

```bash
curl -X POST "http://localhost:3000/api/dev/reset" \
  -H "x-dev-admin-secret: $DEV_ADMIN_SECRET"
```

### 7. Production readiness checklist (MVP)

- [ ] Migrations `001` + `002` + `003` applied to production Supabase.
- [ ] `OPENAI_API_KEY`, Supabase keys, and `CRON_SECRET` configured in hosting env.
- [ ] If multi-instance deploy: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` configured.
- [ ] Cron configured to call `/api/jobs/process` regularly.
- [ ] Upload, text source, website source, and chat tested with non-admin user account.
- [ ] Verify failed job recovery flow from `/knowledge` (Retry + Process queued jobs).

## Project documentation

- Full roadmap, routes, phases, and Phase 4b (sources / URL ingest / jobs): [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## License

Private / unlicensed unless otherwise specified.
