#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -U adris -d adriskids -q 2>/dev/null; do
  sleep 2
done
echo "PostgreSQL is ready!"

echo "Running Prisma migrations..."
cd /app/packages/prisma
npm install --prefer-offline 2>/dev/null || npm install
DATABASE_URL="$DATABASE_URL" npx prisma db push --skip-generate

echo "Database initialized!"
