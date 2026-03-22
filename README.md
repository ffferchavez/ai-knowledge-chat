# AI Knowledge Chat

Production-lean MVP for **Helion City** under the **Helion Intelligence** service line: a SaaS-style AI knowledge assistant where authenticated users upload business documents and ask questions with citations.

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

Apply migrations using the [Supabase CLI](https://supabase.com/docs/guides/cli) or paste `supabase/migrations/001_initial.sql` into the SQL Editor in the Supabase dashboard.

This migration:

- Enables **pgvector**
- Creates application tables and **RLS policies**
- Registers the private **`knowledge-files`** storage bucket and object policies
- Adds an **`auth.users`** trigger to create a profile, default organization, membership, and knowledge base for each new user

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

## Project documentation

- Full roadmap, routes, and phases: [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## License

Private / unlicensed unless otherwise specified.
