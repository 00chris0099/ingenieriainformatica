FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/utils/package.json ./packages/utils/
COPY packages/blocks/package.json ./packages/blocks/
COPY packages/ai/package.json ./packages/ai/
COPY packages/config/package.json ./packages/config/
COPY packages/templates/package.json ./packages/templates/
COPY tienda/package.json ./tienda/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/tienda/node_modules ./tienda/node_modules
COPY . .
RUN cd packages/prisma && npx prisma generate
RUN cd tienda && npx next build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/tienda/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/tienda/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/tienda/.next/static ./tienda/.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "tienda/server.js"]
