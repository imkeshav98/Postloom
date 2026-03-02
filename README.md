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
├── nginx/              # Nginx reverse proxy config
├── docker-compose.yml  # Full stack orchestration
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

## Docker Deployment

No Node.js or pnpm needed on the host — only Docker.

### Quick Start

```bash
git clone <repo-url>
cd postloom
cp .env.example .env
# Fill in your values (see Environment Variables below)
docker compose build
docker compose up -d

# First time only: seed the database (creates admin user, schema, etc.)
docker compose exec admin npx prisma db seed
```

### Nginx & Domains

Nginx routes traffic by domain. Edit `nginx/default.conf` to set your domains:

- `admin.yourdomain.com` → admin app
- `yourblog.com` → blog app

For local testing, add to your hosts file (`C:\Windows\System32\drivers\etc\hosts` or `/etc/hosts`):

```
127.0.0.1 admin.postloom.local
127.0.0.1 blog1.postloom.local
```

### Adding More Blogs

1. Create the blog in the admin dashboard — note the Blog ID
2. Duplicate the `blog` service in `docker-compose.yml` with a new name and `BLOG_ID`
3. Add a matching `server` block in `nginx/default.conf`
4. Append the new blog host to `BLOG_HOSTS` in the admin service (e.g. `blog:3000,blog2:3000,blog-new:3000`)
5. `docker compose up -d --build`

### SSL

When you configure HTTPS (e.g. Certbot, Cloudflare), set `SECURE_COOKIES=true` in `.env` to enable secure session cookies.

## Environment Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `DATABASE_URL` | admin, worker | PostgreSQL connection (full privileges) |
| `BLOG_DATABASE_URL` | blog | PostgreSQL connection (read-only) |
| `POSTGRES_PASSWORD` | docker-compose | PostgreSQL password |
| `BLOG_READER_PASSWORD` | docker-compose | Read-only DB role password |
| `SESSION_SECRET` | admin | Session cookie signing key |
| `SECURE_COOKIES` | admin | Set to `true` when using HTTPS |
| `OPENROUTER_API_KEY` | worker | OpenRouter API key for AI models |
| `CLOUDINARY_CLOUD_NAME` | worker | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | worker | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | worker | Cloudinary API secret |
| `BLOG_ID` | blog | Which blog this deployment serves |
| `REVALIDATION_SECRET` | admin, blog, worker | Shared secret for ISR cache invalidation |
| `BLOG_HOSTS` | admin | Comma-separated blog container hosts for cache revalidation (e.g. `blog:3000,blog2:3000`) |

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
