FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable pnpm

# === WMS ===
FROM base AS wms-deps
COPY . .
RUN pnpm install --frozen-lockfile

FROM wms-deps AS wms-builder
RUN pnpm --filter @repo/prisma-wms db:generate
RUN pnpm --filter @repo/wms build

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

# === TIENDA ===
FROM base AS tienda-deps
COPY . .
RUN pnpm install --frozen-lockfile

FROM tienda-deps AS tienda-builder
RUN pnpm --filter @repo/prisma db:generate
RUN pnpm --filter @repo/tienda build

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

ARG SERVICE=wms
FROM ${SERVICE}-runner AS final
