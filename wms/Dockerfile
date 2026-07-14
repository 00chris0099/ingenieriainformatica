FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/prisma-wms db:generate
RUN pnpm --filter @repo/wms build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@repo/wms", "start"]
