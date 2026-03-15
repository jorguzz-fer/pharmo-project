#!/bin/sh
set -e

echo "========================================="
echo "🚀 PharmoPet Backend Startup"
echo "========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set!"
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

# Run Prisma migrations (safe - only applies pending migrations)
echo "🔄 Running Prisma migrations..."
if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully"
else
    echo "⚠️  Migrations failed, trying db push as fallback..."
    npx prisma db push --skip-generate
    echo "✅ Database schema synced via db push"
fi
echo ""

# Run seeds (all use upsert, safe to re-run)
echo "🌱 Running database seeds..."

# Main seed (users + clinic)
echo "  → Seeding users & clinic..."
if npx tsx prisma/seed.ts; then
    echo "  ✅ Users & clinic seeded"
else
    echo "  ⚠️  User seed failed or already populated"
fi

# Principios ativos seed
echo "  → Seeding medications..."
if npx tsx prisma/seeds/principios-ativos.seed.ts; then
    echo "  ✅ Medications seeded"
else
    echo "  ⚠️  Medication seed failed or already populated"
fi

# Produtos (catálogo PharmoPet) seed
echo "  → Seeding produtos (catálogo PharmoPet)..."
if node prisma/seed-produtos.js; then
    echo "  ✅ Produtos seeded"
else
    echo "  ⚠️  Produtos seed failed or already populated"
fi

echo ""
echo "========================================="
echo "🚀 Starting PharmoPet API Server..."
echo "========================================="
exec node dist/index.js
