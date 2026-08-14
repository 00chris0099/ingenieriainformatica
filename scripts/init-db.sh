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

# Seed: crea el Super Admin (anchillo00@gmail.com) desde SUPER_ADMIN_EMAIL /
# SUPER_ADMIN_PASSWORD (igual que el endpoint seed-admin y el seed local).
# Sin esto, la BD de producci\u00f3n queda sin el usuario y el login falla.
echo "Running seed (Super Admin bootstrap)..."
DATABASE_URL="$DATABASE_URL" \
  SUPER_ADMIN_EMAIL="${SUPER_ADMIN_EMAIL:-anchillo00@gmail.com}" \
  SUPER_ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-Mineria99*}" \
  npx tsx src/seed.ts

echo "Database initialized!"
