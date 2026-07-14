#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -U adris -d adriskids -q; do
  sleep 2
done
echo "PostgreSQL is ready!"

echo "Running Prisma migrations..."
cd /app/packages/prisma-wms
npx prisma db push --skip-generate
cd /app/packages/prisma
npx prisma db push --skip-generate

echo "Seeding database..."
cd /app/packages/prisma-wms
npx tsx src/seed.ts
cd /app/packages/prisma
npx tsx src/seed.ts

echo "Database initialized!"
