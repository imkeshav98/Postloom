FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────────────
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/blog/package.json ./apps/blog/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN pnpm install --frozen-lockfile

# ─── Builder ──────────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/blog/node_modules ./apps/blog/node_modules
COPY --from=deps /app/packages ./packages

# Copy source + workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/blog ./apps/blog
COPY packages ./packages
COPY turbo.json ./

# Generate Prisma client
RUN pnpm --filter @postloom/database db:generate

# Build the blog app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @postloom/blog build

# ─── Runner ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/blog/.next/standalone ./
COPY --from=builder /app/apps/blog/.next/static ./apps/blog/.next/static
COPY --from=builder /app/apps/blog/public ./apps/blog/public/

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/blog/server.js"]
