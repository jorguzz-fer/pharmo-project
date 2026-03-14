import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ProdutoData {
  codigo: string;
  nome: string;
  preco_sugestao: number;
  preco_tabela: number;
}

async function seedProdutos() {
  console.log('🌱 Seeding produtos do catálogo PharmoPet...');

  const filePath = path.join(__dirname, 'seeds', 'produtos.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const produtos: ProdutoData[] = JSON.parse(raw);

  let created = 0;
  let updated = 0;

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

    // Check if it was created or updated (we'll just count total)
    created++;
  }

  console.log(`✅ ${created} produtos processados (upsert)`);
}

seedProdutos()
  .catch((e) => {
    console.error('❌ Erro ao popular produtos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
