FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY packages/prisma-wms/package.json ./packages/prisma-wms/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/prisma-wms/node_modules ./packages/prisma-wms/node_modules
COPY --from=deps /app/packages/prisma/node_modules ./packages/prisma/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules
COPY . .
RUN corepack enable pnpm && pnpm --filter @repo/prisma-wms db:generate
RUN corepack enable pnpm && pnpm --filter @repo/wms build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/wms/public ./wms/public
COPY --from=builder --chown=nextjs:nodejs /app/wms/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/wms/.next/static ./wms/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "wms/server.js"]
