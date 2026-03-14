/**
 * Seed script para popular a tabela de produtos PharmoPet
 * Roda com: node prisma/seed-produtos.js
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedProdutos() {
  console.log('🌱 Seeding produtos do catálogo PharmoPet...');

  const filePath = path.join(__dirname, 'seeds', 'produtos.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const produtos = JSON.parse(raw);

  let count = 0;

  for (const produto of produtos) {
    await prisma.produto.upsert({
      where: { codigo: produto.codigo },
      update: {
        nome: produto.nome,
        preco_sugestao: produto.preco_sugestao,
        preco_tabela: produto.preco_tabela,
      },
      create: {
        codigo: produto.codigo,
        nome: produto.nome,
        preco_sugestao: produto.preco_sugestao,
        preco_tabela: produto.preco_tabela,
      },
    });
    count++;
  }

  console.log(`✅ ${count} produtos processados (upsert)`);
}

seedProdutos()
  .catch((e) => {
    console.error('❌ Erro ao popular produtos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
