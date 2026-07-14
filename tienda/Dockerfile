FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/prisma db:generate
RUN pnpm --filter @repo/tienda build

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copiar standalone
RUN cp -r /app/tienda/.next/standalone/* /app/ 2>/dev/null || true
RUN cp -r /app/tienda/.next/static /app/tienda/.next/static 2>/dev/null || true
RUN cp -r /app/tienda/public /app/tienda/public 2>/dev/null || true
RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
