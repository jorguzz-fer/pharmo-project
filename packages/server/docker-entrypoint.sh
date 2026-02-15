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

# Run Prisma migrations with force reset
echo "🔄 Running Prisma migrations (with force reset)..."
if npx prisma db push --force-reset --accept-data-loss --skip-generate; then
    echo "✅ Database schema synced successfully"
else
    echo "❌ Failed to sync database schema"
    exit 1
fi
echo ""

# Run seeds
echo "🌱 Running database seeds..."

# Main seed (users)
echo "  → Seeding users..."
if npx tsx prisma/seed.ts 2>/dev/null; then
    echo "  ✅ Users seeded"
else
    echo "  ⚠️  User seed failed or already populated"
fi

# Principios ativos seed
echo "  → Seeding medications..."
if npx tsx prisma/seeds/principios-ativos.seed.ts 2>/dev/null; then
    echo "  ✅ Medications seeded"
else
    echo "  ⚠️  Medication seed failed or already populated"
fi

echo ""
echo "========================================="
echo "🚀 Starting PharmoPet API Server..."
echo "========================================="
exec node dist/index.js
