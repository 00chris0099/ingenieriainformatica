ARG SERVICE=wms

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# === WMS BUILD ===
FROM base AS wms-deps
COPY package.json pnpm-lock.yaml ./
COPY packages/prisma-wms/package.json ./packages/prisma-wms/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS wms-builder
COPY --from=wms-deps /app/node_modules ./node_modules
COPY --from=wms-deps /app/packages/prisma-wms/node_modules ./packages/prisma-wms/node_modules
COPY --from=wms-deps /app/packages/prisma/node_modules ./packages/prisma/node_modules
COPY --from=wms-deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=wms-deps /app/packages/utils/node_modules ./packages/utils/node_modules
COPY . .
RUN corepack enable pnpm && pnpm --filter @repo/prisma-wms db:generate
RUN corepack enable pnpm && pnpm --filter @repo/wms build

FROM base AS wms-runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=wms-builder /app/wms/public ./wms/public
COPY --from=wms-builder --chown=nextjs:nodejs /app/wms/.next/standalone ./
COPY --from=wms-builder --chown=nextjs:nodejs /app/wms/.next/static ./wms/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "wms/server.js"]

# === TIENDA BUILD ===
FROM base AS tienda-deps
COPY package.json pnpm-lock.yaml ./
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS tienda-builder
COPY --from=tienda-deps /app/node_modules ./node_modules
COPY --from=tienda-deps /app/packages/prisma/node_modules ./packages/prisma/node_modules
COPY --from=tienda-deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=tienda-deps /app/packages/utils/node_modules ./packages/utils/node_modules
COPY . .
RUN corepack enable pnpm && pnpm --filter @repo/prisma db:generate
RUN corepack enable pnpm && pnpm --filter @repo/tienda build

FROM base AS tienda-runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=tienda-builder /app/tienda/public ./tienda/public
COPY --from=tienda-builder --chown=nextjs:nodejs /app/tienda/.next/standalone ./
COPY --from=tienda-builder --chown=nextjs:nodejs /app/tienda/.next/static ./tienda/.next/static
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "tienda/server.js"]

# === FINAL STAGE ===
FROM ${SERVICE}-runner AS final
