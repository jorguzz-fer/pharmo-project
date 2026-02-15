#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
npx prisma db push --accept-data-loss

echo "🌱 Running database seeds..."
npx tsx prisma/seed.ts || echo "⚠️  Seed failed or already populated"
npx tsx prisma/seeds/principios-ativos.seed.ts || echo "⚠️  Principios ativos seed failed or already populated"

echo "🚀 Starting server..."
exec node dist/index.js
