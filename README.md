# Postloom

AI-powered platform that manages multiple niche blog websites from a single codebase. Handles keyword research, content planning, article writing, image generation, internal linking, SEO optimization, and publishing — all automated.

## Architecture

```
                    ┌──────────────────┐
                    │   PostgreSQL 17  │
                    └──┬─────┬──────┬──┘
                       │     │      │
          ┌────────────┘     │      └────────────┐
          │                  │                   │
  ┌───────▼────────┐ ┌──────▼───────┐  ┌────────▼───────┐
  │  apps/admin    │ │ apps/worker  │  │  apps/blog     │
  │  (one)         │ │ (one)        │  │  (per domain)  │
  │                │ │              │  │                │
  │  Dashboard &   │ │  Polls DB    │  │  Public-facing │
  │  API for all   │ │  for jobs,   │  │  Next.js site, │
  │  blogs         │ │  runs AI     │  │  reads from DB │
  └────────────────┘ │  pipeline    │  └────────────────┘
                     └──────────────┘
```

- **apps/blog** — Read-only Next.js frontend. Deployed once per blog domain. Serves via `BLOG_ID` env var.
- **apps/admin** — Central dashboard with auth. Manages all blogs, posts, content plans, keywords, analytics, and pipeline runs.
- **apps/worker** — Background job processor. Polls for pipeline jobs using `SELECT FOR UPDATE SKIP LOCKED` and runs the 11-step AI content pipeline.

## Tech Stack

- **Framework:** Next.js 15, React 19
- **Language:** TypeScript 5.9
- **Database:** PostgreSQL 17, Prisma 7 (with PrismaPg adapter)
- **Styling:** Tailwind CSS 4, shadcn/ui (admin)
- **Monorepo:** pnpm workspaces, Turborepo
- **AI:** OpenRouter (Grok for research/SEO, Claude for writing, Flux for images)
- **Image Hosting:** Cloudinary
- **Containerization:** Docker Compose

## Project Structure

```
Postloom/
├── apps/
│   ├── admin/          # Admin dashboard (port 3001)
│   ├── blog/           # Public blog frontend (port 3000)
│   └── worker/         # Background job processor
├── packages/
│   ├── database/       # Prisma schema, client, seed
│   ├── ai-engine/      # OpenRouter client, pipeline steps
│   ├── shared/         # Shared types
│   └── tsconfig/       # Shared TS configs
├── docker-compose.yml  # PostgreSQL
└── .env                # Environment variables
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd Postloom
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Set up environment
cp .env.example .env
# Edit .env with your OpenRouter API key and Cloudinary credentials

# 4. Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# 5. Seed the database (creates sample blog, keywords, admin user, and pipeline jobs)
pnpm db:seed
```

### Running

```bash
# Start everything (admin + blog + worker)
pnpm dev

# Or start individually:
pnpm admin:dev      # Admin dashboard → http://localhost:3001
pnpm blog:dev       # Blog frontend  → http://localhost:3000
pnpm worker:dev     # Background worker (processes pipeline jobs)
```

### Default Admin Login

- **Email:** admin@postloom.com
- **Password:** admin123

## AI Pipeline

The worker processes two types of pipeline runs:

**SETUP** (run once per blog) — Creates categories, static pages, site images, and SEO config.

**GENERATE** (run per article) — Full content pipeline:

| Step | Name | What it does |
|------|------|-------------|
| 1 | Niche Analysis | Analyzes the blog's niche for content strategy |
| 2 | Keyword Research | Discovers high-value keywords |
| 3 | Trend Discovery | Finds trending topics in the niche |
| 4 | Content Planning | Creates article outlines with target keywords |
| 5 | Topic Clustering | Groups plans into hub/spoke clusters |
| 6 | Article Writing | Writes full markdown articles |
| 7 | Image Generation | Generates featured images via Flux |
| 8 | Internal Linking | Links related articles together |
| 9 | SEO Optimization | Optimizes meta tags, slugs, readability |
| 10 | Publishing | Publishes post and triggers blog revalidation |
| 11 | Performance Monitoring | Tracks post metrics over time |

## Environment Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `DATABASE_URL` | admin, worker | PostgreSQL connection (full privileges) |
| `BLOG_DATABASE_URL` | blog | PostgreSQL connection (read-only) |
| `SESSION_SECRET` | admin | Session cookie signing key |
| `OPENROUTER_API_KEY` | worker | OpenRouter API key for AI models |
| `CLOUDINARY_CLOUD_NAME` | worker | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | worker | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | worker | Cloudinary API secret |
| `BLOG_ID` | blog | Which blog this deployment serves |
| `REVALIDATION_SECRET` | blog | Webhook secret for ISR cache invalidation |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm admin:dev` | Start admin on port 3001 |
| `pnpm blog:dev` | Start blog on port 3000 |
| `pnpm worker:dev` | Start background worker |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Prisma Studio |

## License

Private — not open source.
