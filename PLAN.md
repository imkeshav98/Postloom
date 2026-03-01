# AutoBlog — Implementation Plan

## What This Is

AutoBlog is an AI-powered platform that manages multiple niche blog websites from a single codebase. It handles keyword research, content writing, image generation, internal linking, SEO optimization, and publishing — all automated. The goal is to generate passive income through Google AdSense and affiliate links by ranking blog posts on Google.

---

## Architecture

Three apps share one PostgreSQL database, deployed together on a single VPS using Docker Compose:

```
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    │   (one DB)       │
                    └──┬─────┬──────┬─┘
                       │     │      │
          ┌────────────┘     │      └────────────┐
          │                  │                   │
  ┌───────▼────────┐ ┌──────▼───────┐  ┌────────▼───────┐
  │   apps/admin   │ │  apps/worker │  │  apps/blog     │
  │   (one)        │ │  (one)       │  │  (per domain)  │
  │                │ │              │  │                │
  │ - Dashboard    │ │ - Polls DB   │  │ - Public pages │
  │ - API routes   │ │   for jobs   │  │ - SSG / ISR    │
  │ - Manages ALL  │ │ - Runs AI    │  │ - Reads from   │
  │   blogs        │ │   pipeline   │  │   DB directly  │
  │ - Auth         │ │   for ALL    │  │ - BLOG_ID from │
  │                │ │   blogs      │  │   env var      │
  └────────────────┘ └──────────────┘  └────────────────┘
```

- **apps/blog** — Lightweight, read-only Next.js frontend. Deployed once per blog domain. Each deployment knows which blog it serves via a `BLOG_ID` environment variable. No auth, no write endpoints — reads from DB using a restricted PostgreSQL role that can only access public content tables. Exposes a single signed webhook endpoint (`POST /api/revalidate`) for cache invalidation.
- **apps/admin** — Central Next.js dashboard with API routes. Single deployment that manages all blogs. Protected by admin login.
- **apps/worker** — Background process that polls for pipeline jobs using `SELECT ... FOR UPDATE SKIP LOCKED` and executes the 11-step AI content pipeline. Single deployment that processes work for all blogs.

---

## Monorepo Structure

```
AutoBlog/
├── apps/
│   ├── blog/                         # Public blog (deployed per domain)
│   │   ├── app/
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx          # Post page
│   │   │   ├── category/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── tag/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── api/
│   │   │   │   └── revalidate/
│   │   │   │       └── route.ts  # Signed webhook for ISR invalidation
│   │   │   ├── sitemap.ts
│   │   │   └── robots.ts
│   │   ├── Dockerfile
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── admin/                        # Central admin dashboard + API
│   │   ├── app/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Dashboard overview
│   │   │   │   ├── blogs/
│   │   │   │   ├── posts/
│   │   │   │   ├── keywords/
│   │   │   │   ├── pipeline/
│   │   │   │   └── analytics/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   ├── blogs/
│   │   │   │   ├── posts/
│   │   │   │   ├── pipeline/
│   │   │   │   ├── keywords/
│   │   │   │   ├── content-plans/
│   │   │   │   └── analytics/
│   │   │   └── layout.tsx
│   │   ├── Dockerfile
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── worker/                       # Background AI pipeline worker
│       ├── src/
│       │   ├── index.ts              # Entry point, polling loop
│       │   ├── executor.ts           # Job executor, step sequencing
│       │   └── retry.ts             # Backoff and retry logic
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── database/                     # Prisma schema + client
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── prisma.config.ts
│   │   ├── src/
│   │   │   ├── index.ts              # PrismaClient singleton export
│   │   │   └── seed.ts              # Seed script
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ai-engine/                    # AI pipeline steps + orchestration
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client/
│   │   │   │   └── openrouter.ts     # OpenRouter client (OpenAI SDK wrapper)
│   │   │   ├── config/
│   │   │   │   ├── models.ts         # Model configuration (swappable per task)
│   │   │   │   └── prompts/
│   │   │   │       ├── niche-analysis.ts
│   │   │   │       ├── keyword-research.ts
│   │   │   │       ├── trend-discovery.ts
│   │   │   │       ├── content-planning.ts
│   │   │   │       ├── article-writing.ts
│   │   │   │       ├── seo-optimization.ts
│   │   │   │       └── internal-linking.ts
│   │   │   ├── pipeline/
│   │   │   │   ├── orchestrator.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── steps/
│   │   │   │       ├── 01-niche-analysis.ts
│   │   │   │       ├── 02-keyword-research.ts
│   │   │   │       ├── 03-trend-discovery.ts
│   │   │   │       ├── 04-content-planning.ts
│   │   │   │       ├── 05-topic-clustering.ts
│   │   │   │       ├── 06-article-writing.ts
│   │   │   │       ├── 07-image-generation.ts
│   │   │   │       ├── 08-internal-linking.ts
│   │   │   │       ├── 09-seo-optimization.ts
│   │   │   │       ├── 10-publishing.ts
│   │   │   │       └── 11-performance-monitoring.ts
│   │   │   └── services/
│   │   │       ├── keyword-service.ts
│   │   │       ├── trend-service.ts
│   │   │       └── performance-service.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── seo/                          # SEO utilities
│   │   ├── src/
│   │   │   ├── schema-markup.ts      # JSON-LD generators
│   │   │   ├── meta-tags.ts
│   │   │   ├── sitemap.ts
│   │   │   └── structured-data.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared/                       # Types, validation, constants
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── schemas/              # Zod validation schemas
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── tsconfig/                     # Shared TypeScript configs
│       ├── base.json
│       ├── nextjs.json
│       └── library.json
│
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
└── .gitignore
```

---

## Data Model (PostgreSQL + Prisma 7)

### Entities

**Blog**
`id`, `name`, `slug @unique`, `domain @unique`, `niche`, `description`, `logoUrl`, `adsenseId`, `defaultAuthor`, `language`, `aiConfig Json?`, `createdAt`, `updatedAt`

**Category** (hub-and-spoke)
`id`, `name`, `slug`, `description`, `isPillar`, `parentId?` → self-relation, `blogId` → Blog
`@@unique([blogId, slug])`
Service layer enforces: parent category must belong to the same `blogId`.

**Post**
`id`, `title`, `slug`, `contentMarkdown` (required), `contentHtml` (cached render), `excerpt`, `metaTitle`, `metaDescription`, `canonicalUrl`, `focusKeyword`, `secondaryKeywords String[]`, `readingTime`, `wordCount`, `faqData Json?`, `status` (DRAFT|REVIEWING|SCHEDULED|PUBLISHED|ARCHIVED), `publishedAt?`, `scheduledAt?`, `aiGenerated`, `aiModel`, `aiPromptVersion`, `humanEdited`, `blogId` → Blog, `categoryId?` → Category
`@@unique([blogId, slug])`, `@@index([blogId, status])`, `@@index([blogId, publishedAt])`

**Tag**
`id`, `name`, `slug`, `blogId` → Blog
`@@unique([blogId, slug])`

**Keyword**
`id`, `keyword`, `searchVolume`, `difficulty`, `cpc`, `intent` (INFORMATIONAL|NAVIGATIONAL|TRANSACTIONAL|COMMERCIAL), `trendScore`, `trendData Json?`, `blogId` → Blog, `lastResearched`, `createdAt`
`@@unique([blogId, keyword])`, `@@index([blogId, searchVolume])`

**ContentPlan**
`id`, `title`, `outline Json?`, `targetKeywordId?` → Keyword, `priority`, `status` (PLANNED|IN_PROGRESS|COMPLETED|SKIPPED), `clusterGroup`, `isHub`, `blogId` → Blog, `createdAt`, `updatedAt`

**InternalLink**
`id`, `sourcePostId` → Post, `targetPostId` → Post, `anchorText`, `context`
`@@unique([sourcePostId, targetPostId])`
Service layer enforces: both posts must belong to the same `blogId`. DB trigger as defense-in-depth.

**PostPerformance**
`id`, `postId` → Post, `date`, `pageViews`, `uniqueVisitors`, `avgTimeOnPage`, `bounceRate`, `googlePosition`, `impressions`, `clicks`, `ctr`
`@@index([postId, date])`

**Image**
`id`, `url`, `altText`, `prompt`, `width`, `height`, `format`, `postId?` → Post, `createdAt`

**AffiliateLink**
`id`, `url`, `anchorText`, `platform`, `postId` → Post

**SiteConfig**
`id`, `blogId @unique` → Blog, `primaryColor`, `accentColor`, `googleAnalyticsId`, `googleSearchConsoleKey`, `twitterHandle`, `facebookUrl`, `postsPerPage`, `enableComments`, `adsenseSlots Json?`, `affiliateConfig Json?`

**AdminUser**
`id`, `email @unique`, `passwordHash`, `isActive`, `createdAt`, `updatedAt`

**AdminSession**
`id`, `userId` → AdminUser, `tokenHash @unique`, `expiresAt`, `createdAt`

**PipelineRun**
`id`, `blogId` → Blog, `type` (RESEARCH|GENERATE|BATCH|OPTIMIZE), `status` (QUEUED|RUNNING|SUCCEEDED|FAILED|CANCELLED), `priority`, `idempotencyKey @unique`, `requestedById?` → AdminUser (nullable for system/cron jobs), `input Json`, `result Json?`, `error Json?`, `attempts`, `maxAttempts`, `lockedAt?` (lease timestamp for worker), `scheduledAt?`, `startedAt?`, `finishedAt?`, `createdAt`, `updatedAt`

**PipelineStepRun**
`id`, `pipelineRunId` → PipelineRun, `stepName`, `status`, `input Json?`, `output Json?`, `error Json?`, `durationMs?`, `createdAt`, `updatedAt`

### Cascade rules
- Blog → cascades to all child entities (categories, posts, tags, keywords, content plans, site config, pipeline runs)
- Post → cascades to images, affiliate links, performance rows, internal links
- Category → restrict delete if child categories exist

---

## API (lives in `apps/admin`)

### Auth
```
POST   /api/auth/login              → httpOnly session cookie
POST   /api/auth/logout
GET    /api/auth/me
```

### Blogs
```
POST   /api/blogs
GET    /api/blogs
GET    /api/blogs/:id
PUT    /api/blogs/:id
DELETE /api/blogs/:id
```

### Posts
```
POST   /api/posts
GET    /api/posts                   ?blogId&status&categoryId&page&limit
GET    /api/posts/:id
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/publish
POST   /api/posts/:id/schedule
```

### Pipeline
```
POST   /api/pipeline/research       → enqueue, returns { runId, status, idempotencyKey }
POST   /api/pipeline/generate       → enqueue
POST   /api/pipeline/batch          → enqueue multiple
POST   /api/pipeline/optimize/:postId → enqueue
GET    /api/pipeline/runs/:id
GET    /api/pipeline/runs           ?blogId&status&type
```

### Keywords, Content Plans, Analytics
```
GET    /api/keywords                ?blogId
POST   /api/keywords/research
GET    /api/content-plans           ?blogId
POST   /api/content-plans
PUT    /api/content-plans/:id
GET    /api/analytics/:blogId
GET    /api/analytics/post/:id
```

### Error responses
Runtime validation with Zod. Standard codes: 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (not found), 409 (idempotency conflict), 422 (domain rule violation), 500 (internal).

---

## AI Pipeline (11 Steps)

### Step contract
Every step implements:
- `stepName` — deterministic identifier
- `inputSchema` — Zod validation
- `outputSchema` — Zod validation
- `execute(input, context)` — the work

### Steps
```
 1. Niche Analysis      Grok: analyze niche, competitors, content gaps
 2. Keyword Research     Grok: AI-based keyword discovery (API-ready for later)
 3. Trend Discovery      Grok: trending topics in the niche
 4. Content Planning     Prioritize articles by volume + difficulty + trend score
 5. Topic Clustering     Organize into hub-and-spoke clusters
 6. Article Writing      Claude (swappable): 1200–2500 word SEO-optimized post
 7. Image Generation     Nano Banana 2: featured image + in-post images
 8. Internal Linking     Analyze existing posts, insert contextual links
 9. SEO Optimization     Meta tags, keyword density, readability check
10. Publishing           Save to DB, trigger blog revalidation
11. Performance Monitor  Track rankings over time, flag underperformers
```

### Orchestration
- State machine: `QUEUED → RUNNING → SUCCEEDED | FAILED | CANCELLED`
- Each step persisted in `PipelineStepRun` with input, output, errors, duration
- Transient errors (network, rate limit) retried with exponential backoff
- Validation and content policy errors are non-retriable
- Resumable from first failed or pending step
- Idempotent writes guarded by slug uniqueness and run scope

### Queue and locking
- Worker polls with `SELECT ... FOR UPDATE SKIP LOCKED` to claim jobs atomically
- `lockedAt` timestamp on `PipelineRun` serves as a lease; stale locks (> 5 min without heartbeat) are reclaimed
- Worker heartbeats update `lockedAt` during long-running steps to prevent lease expiry
- Single worker is sufficient for v1; locking strategy supports scaling to multiple workers later

### Model configuration
All AI calls go through OpenRouter (OpenAI SDK with `baseURL: "https://openrouter.ai/api/v1"`). Swap any model by changing a string:

```typescript
export const defaultModelConfig = {
  research:        { model: "x-ai/grok-4.1-fast",                    temperature: 0.3 },
  writing:         { model: "anthropic/claude-sonnet-4.6",            temperature: 0.7 },
  imageGeneration: { model: "google/gemini-3.1-flash-image-preview"                   },
  seoOptimization: { model: "x-ai/grok-4.1-fast",                    temperature: 0.2 },
  internalLinking: { model: "x-ai/grok-4.1-fast",                    temperature: 0.1 },
};
```

Per-blog overrides stored in `Blog.aiConfig`. Prompt versions tracked in `Post.aiPromptVersion`.

---

## Blog App — SEO Delivery

### Routes
`/` homepage, `/:slug` post, `/category/:slug`, `/tag/:slug`, `/sitemap.xml`, `/robots.txt`

### Rendering
- Server Components by default — minimal client JavaScript
- Markdown → HTML rendered server-side with sanitization
- `generateStaticParams` for recent and high-traffic posts; others served via ISR on-demand

### Revalidation
- Each blog deployment exposes `POST /api/revalidate?secret=<REVALIDATION_SECRET>&tag=<cache-tag>`
- Worker calls this endpoint after publishing or updating a post (Step 10)
- Blog domain URLs are stored in `Blog.domain`; worker resolves the correct blog container via internal Docker network hostname
- `REVALIDATION_SECRET` is a shared secret per blog deployment, verified before invalidating cache
- Uses Next.js `revalidateTag()` for granular invalidation (post slug, category slug, sitemap)

### SEO
- `generateMetadata()` on every indexable page (title, description, OG, canonical)
- JSON-LD structured data: `BlogPosting`, `BreadcrumbList`, `FAQPage`, `Organization`
- Dynamic sitemap queries all published posts for this blog's `BLOG_ID`
- Core Web Vitals optimized: Server Components, Turbopack, `next/image`

### Config
Each deployment reads `BLOG_ID` from environment. Blog name, theme colors, AdSense ID, and other settings come from `Blog` + `SiteConfig` tables. Every DB query scopes to `process.env.BLOG_ID`.

---

## Admin App — Central Management

### Features
- Single admin login (email + password, httpOnly session cookie)
- Dashboard: all blogs overview, post counts, pipeline run activity
- Blog CRUD: create, configure, and delete blogs
- Post management: list, search, edit, publish, schedule across all blogs
- Pipeline controls: trigger research, generation, batch runs, optimization; view run status and per-step logs
- Keyword browser: view researched keywords per blog, trigger new research
- Content plan manager: view, reprioritize, update status
- Analytics: per-blog and per-post performance metrics

### Deferred
Multi-user auth, RBAC, team management, invite flows.

---

## Deployment

All services run on a single VPS via Docker Compose. Nginx routes domains to containers.

```yaml
services:
  db:
    image: postgres:18

  admin:
    build: { context: ., dockerfile: apps/admin/Dockerfile }
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SESSION_SECRET: ${SESSION_SECRET}

  worker:
    build: { context: ., dockerfile: apps/worker/Dockerfile }
    environment:
      DATABASE_URL: ${DATABASE_URL}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}

  blog-fitness:
    build: { context: ., dockerfile: apps/blog/Dockerfile }
    environment:
      DATABASE_URL: ${BLOG_DATABASE_URL}
      BLOG_ID: "fitness_blog_id"
      REVALIDATION_SECRET: ${REVALIDATION_SECRET}

  blog-cooking:
    build: { context: ., dockerfile: apps/blog/Dockerfile }
    environment:
      DATABASE_URL: ${BLOG_DATABASE_URL}
      BLOG_ID: "cooking_blog_id"
      REVALIDATION_SECRET: ${REVALIDATION_SECRET}

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    # fitnessblog.com  → blog-fitness:3000
    # cookingblog.com  → blog-cooking:3000
    # admin.domain.com → admin:3000
```

### Adding a new blog
1. Create the blog in admin dashboard → get the blog ID
2. Add a service block to `docker-compose.yml` (5 lines, same Dockerfile, new `BLOG_ID`)
3. Add an Nginx server block for the domain
4. Point DNS A record to server IP
5. `docker compose up -d` and reload Nginx

---

## Environment Variables

**apps/admin:** `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`

**apps/worker:** `DATABASE_URL`, `OPENROUTER_API_KEY`

**apps/blog (per deploy):** `DATABASE_URL` (restricted read-only role), `BLOG_ID`, `REVALIDATION_SECRET`

**Optional (stored in DB per blog):** Google Analytics ID, Search Console key, AdSense ID

---

## Security

### Auth and CSRF
- Admin sessions: httpOnly, Secure, SameSite=Lax cookies
- CSRF protection on all state-changing admin API routes: validate `Origin` header against allowed origins; reject requests from unknown origins
- Passwords hashed with bcrypt
- Rate limiting on auth and pipeline enqueue endpoints

### Content safety
- Markdown sanitized before HTML render (XSS prevention)

### Database access control
- **apps/admin and apps/worker** connect with full-privilege PostgreSQL role
- **apps/blog** connects with a restricted read-only role (`blog_reader`) that can only `SELECT` on: `Blog`, `Post`, `Category`, `Tag`, `Image`, `SiteConfig`, `AffiliateLink`, `InternalLink`, `PostPerformance`
- Blog role has no access to: `AdminUser`, `AdminSession`, `PipelineRun`, `PipelineStepRun`, `Keyword`, `ContentPlan`
- Roles created during DB setup (Phase 1 migration script)

### Blog app surface
- Fully read-only — no mutations, no write endpoints
- Single exception: `POST /api/revalidate` (signed webhook, verifies shared secret, only invalidates cache)

---

## Observability

- Structured logs tagged with `runId`, `blogId`, `stepName`
- Error taxonomy: transient vs permanent, provider vs internal
- Metrics: queue depth, run success rate, per-step latency

---

## Implementation Phases

### Phase 1 — Monorepo + Database
- pnpm workspace, Turborepo, shared TypeScript configs
- Prisma 7 schema with all entities
- Docker Compose for PostgreSQL
- Migration script that creates restricted `blog_reader` DB role (read-only, scoped tables)
- DB trigger on `InternalLink` to enforce same-blog constraint on insert/update
- Seed script with sample blog, categories, posts
- `.env.example`
- **Done when:** `pnpm install` + `pnpm db:push` succeeds; seed populates sample data; `blog_reader` role verified

### Phase 2 — Worker + Job Queue
- `apps/worker` with DB polling loop using `SELECT ... FOR UPDATE SKIP LOCKED`
- Lease-based locking with `lockedAt` timestamp and heartbeat during long steps
- PipelineRun / PipelineStepRun lifecycle
- Retry with exponential backoff, idempotency dedupe, resume from failure
- **Done when:** enqueue a test job → worker picks up → executes → marks complete; stale lock reclaimed on restart

### Phase 3 — AI Steps 1–3 (Research)
- OpenRouter client wrapper
- Model config system with per-blog overrides
- Steps: Niche Analysis, Keyword Research, Trend Discovery
- Prompt templates
- **Done when:** research run persists keywords and trend data in DB

### Phase 4 — AI Steps 4–9 (Content Generation)
- Steps: Content Planning, Topic Clustering, Article Writing, Image Generation, Internal Linking, SEO Optimization
- Full orchestrator with step sequencing, error handling, resume
- **Done when:** generate run produces a complete draft post with content, images, links, SEO metadata

### Phase 5 — Steps 10–11 (Publishing + Monitoring)
- Publish and schedule flows, DB persistence
- Signed webhook call to blog container's `/api/revalidate` for ISR cache invalidation
- Performance tracking scaffold (Search Console integration point)
- **Done when:** publishing changes post visibility; blog cache invalidated via webhook; performance rows appear

### Phase 6 — Blog App + SEO
- Next.js 16.1 with Tailwind CSS 4.2
- All public routes, metadata, JSON-LD, sitemap, robots
- `POST /api/revalidate` signed webhook endpoint
- Scoped to `BLOG_ID` from env, using `blog_reader` DB role
- Dockerfile
- **Done when:** blog renders posts; revalidation webhook works; Lighthouse SEO >= 90

### Phase 7 — Admin App + Monetization
- Next.js admin with auth (session cookies + CSRF origin validation)
- All management screens: blogs, posts, pipeline, keywords, plans, analytics
- AdSense slot configuration, affiliate link management
- Nginx config template, complete Docker Compose
- **Done when:** admin can create blog → generate content → publish → post visible on blog domain with ads

---

## Testing

**Unit:** prompt builder, model override resolution, slug generation, retry classification

**Integration:** API validation, queue lifecycle (lock/lease/heartbeat), publish → revalidation webhook, blog-scoped isolation, CSRF rejection on cross-origin requests

**E2E:** admin login → create blog → generate → publish → revalidation webhook fires → verify public page with metadata

**Failure:** provider timeouts, idempotency conflicts, partial pipeline resume, cross-blog isolation, stale lock reclaim, blog_reader role cannot access admin tables, InternalLink cross-blog trigger rejection

**Performance:** Lighthouse SEO >= 90, pipeline throughput baseline

---

## Tech Stack

| Technology | Version | Where |
|---|---|---|
| Next.js | 16.1 | apps/blog, apps/admin |
| Prisma | 7.2 | packages/database |
| PostgreSQL | 18 | Docker Compose |
| TypeScript | 5.9 | Everything |
| Tailwind CSS | 4.2 | apps/blog, apps/admin |
| Turborepo + pnpm | - | Monorepo |
| OpenRouter API | - | packages/ai-engine |
| Docker + Nginx | - | Deployment |
| Zod | - | packages/shared |

---

## Defaults and Constraints
- Single VPS, single region deployment
- One admin user
- Markdown as canonical content format, HTML cached on render
- DB-backed job queue (sufficient for v1 scale)
- External keyword and trend APIs are optional — AI-first approach is the default
- Blog app is read-only with zero write surface
- Exact dependency versions locked at implementation time
