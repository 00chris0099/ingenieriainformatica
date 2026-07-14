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
CMD ["pnpm", "--filter", "@repo/wms", "start"]
