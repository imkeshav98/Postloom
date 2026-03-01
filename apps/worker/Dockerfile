FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────────────
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/ai-engine/package.json ./packages/ai-engine/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN pnpm install --frozen-lockfile

# ─── Builder ──────────────────────────────────────────────────────────────
FROM base AS builder

# Copy source + workspace config first
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker ./apps/worker
COPY packages ./packages
COPY turbo.json ./

# Then overlay node_modules from deps (so they don't get overwritten)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/ai-engine/node_modules ./packages/ai-engine/node_modules

# Generate Prisma client (dummy URL — only needed for codegen, not a real connection)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm --filter @postloom/database db:generate

# Build packages and worker
RUN pnpm --filter @postloom/ai-engine build
RUN pnpm --filter @postloom/worker build

# ─── Runner ───────────────────────────────────────────────────────────────
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

# Install tsx globally to handle TypeScript workspace packages at runtime
RUN npm install -g tsx

# Copy workspace config for pnpm install
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./

# Copy compiled worker output
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/

# Copy workspace packages (source — their main points to .ts files)
COPY --from=builder /app/packages/ai-engine/src ./packages/ai-engine/src
COPY --from=builder /app/packages/ai-engine/package.json ./packages/ai-engine/
COPY --from=builder /app/packages/database/src ./packages/database/src
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/shared/src ./packages/shared/src
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/tsconfig/package.json ./packages/tsconfig/

# Install production dependencies with proper workspace symlinks
RUN pnpm install --frozen-lockfile --prod

USER worker

CMD ["tsx", "apps/worker/dist/index.js"]
