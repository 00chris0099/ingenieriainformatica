FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/prisma-wms db:generate
RUN pnpm --filter @repo/wms build

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copiar standalone (genera server.js en .next/standalone/)
RUN cp -r /app/wms/.next/standalone/* /app/ 2>/dev/null || true
RUN cp -r /app/wms/.next/static /app/wms/.next/static 2>/dev/null || true
RUN cp -r /app/wms/public /app/wms/public 2>/dev/null || true
RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
