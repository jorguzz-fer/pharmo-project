#!/bin/sh
set -e

echo "Running Prisma db push (sync schema to database)..."
npx prisma db push --skip-generate

echo "Running seed (if needed)..."
node prisma/seed.js || echo "Seed skipped or already applied"

echo "Starting server..."
exec node dist/index.js
