/**
 * Seed V3: Insumos Farmacêuticos + Formas Farmacêuticas + Controlados + Regras de Exceção
 *
 * Uso: npx tsx src/scripts/seed-v3.ts
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function loadJson(filename: string) {
  const filePath = path.resolve(__dirname, '../../data', filename);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function seedFormas() {
  const formas: string[] = loadJson('formas.json');
  if (!formas.length) return;
  console.log(`\n🏷️  Formas Farmacêuticas: ${formas.length}`);
  let ins = 0, skip = 0;
  for (const nome of formas) {
    const existing = await prisma.formaFarmaceutica.findUnique({ where: { nome } });
    if (existing) { skip++; continue; }
    await prisma.formaFarmaceutica.create({ data: { nome } });
    ins++;
  }
  console.log(`   ✅ Inseridas: ${ins} | Já existiam: ${skip}`);
}

async function seedInsumos() {
  const insumos: Array<{
    codigo_interno: number;
    descricao: string;
    valor_custo: number;
    custo_referencia: number;
    markup: number;
    un_manipulacao: string;
    estoque: number;
    calculo_tipo: string;
  }> = loadJson('insumos.json');
  if (!insumos.length) return;
  console.log(`\n🧪 Insumos Farmacêuticos: ${insumos.length}`);
  let ins = 0, upd = 0, err = 0;
  for (const item of insumos) {
    try {
      const existing = await prisma.insumoFarmaceutico.findUnique({
        where: { codigo_interno: item.codigo_interno },
      });
      const data = {
        descricao: item.descricao,
        valor_custo: item.valor_custo,
        custo_referencia: item.custo_referencia,
        markup: item.markup,
        un_manipulacao: item.un_manipulacao,
        estoque: item.estoque,
        calculo_tipo: item.calculo_tipo,
      };
      if (existing) {
        await prisma.insumoFarmaceutico.update({ where: { id: existing.id }, data });
        upd++;
      } else {
        await prisma.insumoFarmaceutico.create({
          data: { codigo_interno: item.codigo_interno, ...data },
        });
        ins++;
      }
    } catch (e: any) {
      err++;
      if (err <= 5) console.error(`   ❌ ${item.descricao}: ${e.message}`);
    }
  }
  console.log(`   ✅ Inseridos: ${ins} | Atualizados: ${upd} | Erros: ${err}`);
}

async function seedControlados() {
  const controlados: Array<{ nome: string; lista: string }> = loadJson('controlados.json');
  if (!controlados.length) return;
  console.log(`\n💊 Controlados: ${controlados.length}`);
  let matched = 0, notFound = 0;
  for (const ctrl of controlados) {
    // Busca o insumo pelo nome (match parcial insensível)
    const insumos = await prisma.insumoFarmaceutico.findMany({
      where: { descricao: { contains: ctrl.nome.split(' ')[0], mode: 'insensitive' } },
    });
    if (insumos.length > 0) {
      for (const insumo of insumos) {
        await prisma.insumoFarmaceutico.update({
          where: { id: insumo.id },
          data: {
            controlado: true,
            lista_controle: ctrl.lista || null,
          },
        });
      }
      matched++;
    } else {
      notFound++;
      console.log(`   ⚠️  Não encontrado: ${ctrl.nome}`);
    }
  }
  console.log(`   ✅ Marcados: ${matched} | Não encontrados: ${notFound}`);
}

async function seedExcecoes() {
  const excecoes: Array<{ codigo: number; produto: string; regra: string }> = loadJson('excecoes.json');
  if (!excecoes.length) return;
  console.log(`\n⛔ Regras de Exceção: ${excecoes.length}`);
  let ins = 0, err = 0;

  // Mapeia "NÃO FAZ EM PASTA" → busca a forma "PASTA ORAL"
  const formaMap: Record<string, string> = {
    'NÃO FAZ EM PASTA': 'PASTA ORAL',
  };

  for (const exc of excecoes) {
    try {
      const insumo = await prisma.insumoFarmaceutico.findUnique({
        where: { codigo_interno: exc.codigo },
      });
      if (!insumo) {
        console.log(`   ⚠️  Insumo ${exc.codigo} (${exc.produto}) não encontrado`);
        err++;
        continue;
      }

      const formaNome = formaMap[exc.regra] || exc.regra;
      const forma = await prisma.formaFarmaceutica.findUnique({ where: { nome: formaNome } });
      if (!forma) {
        console.log(`   ⚠️  Forma "${formaNome}" não encontrada`);
        err++;
        continue;
      }

      const existing = await prisma.regraExcecao.findUnique({
        where: {
          insumo_farmaceutico_id_forma_farmaceutica_id: {
            insumo_farmaceutico_id: insumo.id,
            forma_farmaceutica_id: forma.id,
          },
        },
      });
      if (!existing) {
        await prisma.regraExcecao.create({
          data: {
            insumo_farmaceutico_id: insumo.id,
            forma_farmaceutica_id: forma.id,
            descricao: exc.regra,
          },
        });
        ins++;
      }
    } catch (e: any) {
      err++;
      console.error(`   ❌ ${exc.produto}: ${e.message}`);
    }
  }
  console.log(`   ✅ Inseridas: ${ins} | Erros: ${err}`);
}

async function main() {
  console.log('========================================');
  console.log('🚀 Seed V3 - PharmoPet');
  console.log('========================================');

  await seedFormas();
  await seedInsumos();
  await seedControlados();
  await seedExcecoes();

  console.log('\n========================================');
  console.log('✅ Seed V3 concluído!');
  console.log('========================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
