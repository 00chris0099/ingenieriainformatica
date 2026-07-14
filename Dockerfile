ARG SERVICE=wms

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable pnpm
COPY . .

# WMS
FROM base AS wms
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/prisma-wms db:generate
RUN pnpm --filter @repo/wms build
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "--filter", "@repo/wms", "start"]

# TIENDA
FROM base AS tienda
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/prisma db:generate
RUN pnpm --filter @repo/tienda build
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["pnpm", "--filter", "@repo/tienda", "start"]

FROM ${SERVICE} AS final
