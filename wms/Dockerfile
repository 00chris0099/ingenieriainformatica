FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
COPY . .
RUN pnpm install
RUN pnpm --filter @repo/prisma-wms db:generate
RUN pnpm --filter @repo/wms build

ENV NODE_ENV=production
EXPOSE 3000

# Copy standalone output
RUN cp -r .next/standalone . .next/static .next/standalone/.next/static 2>/dev/null || true
RUN cp -r public .next/standalone/public 2>/dev/null || true

CMD ["node", ".next/standalone/server.js"]
