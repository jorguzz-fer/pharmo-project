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

# Bulário base (princípios ativos CSV V2)
echo "  → Seeding bulário base (princípios ativos)..."
if npx tsx src/scripts/seed-bulario-csv.ts data/bulario_ai_ready.csv; then
    echo "  ✅ Bulário base seeded"
else
    echo "  ⚠️  Bulário seed failed ou já populado"
fi

# Seed V3: Insumos + Formas + Controlados + Exceções
echo "  → Seeding V3 (insumos, formas, controlados, exceções)..."
if npx tsx src/scripts/seed-v3.ts; then
    echo "  ✅ Seed V3 concluído"
else
    echo "  ⚠️  Seed V3 failed ou já populado"
fi

echo ""
echo "========================================="
echo "🚀 Starting PharmoPet API Server..."
echo "========================================="
exec node dist/index.js
# Trigger rebuild 1776952005
