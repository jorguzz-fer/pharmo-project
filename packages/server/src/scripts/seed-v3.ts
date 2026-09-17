/**
 * Seed V3: Insumos Farmacêuticos + Formas Farmacêuticas + Controlados + Regras de Exceção
 *
 * Uso: npx tsx src/scripts/seed-v3.ts
 *
 * Insumo já cadastrado tem custo, custo de referência e markup preservados: esses
 * campos são mantidos pelo admin em Admin > Insumos, e recarregar a base não pode
 * desfazer uma correção de preço. Os demais campos continuam sendo atualizados.
 * Para forçar os valores do arquivo:
 *   SEED_SOBRESCREVER_CUSTOS=true npx tsx src/scripts/seed-v3.ts
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Escape para recarregar a base inteira a partir do arquivo, preços inclusive. */
const sobrescreverCustos = process.env.SEED_SOBRESCREVER_CUSTOS === 'true';

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

export async function seedInsumos() {
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
  if (sobrescreverCustos) {
    console.log('   ⚠️  SEED_SOBRESCREVER_CUSTOS=true — custo, custo de referência e markup do arquivo vão sobrepor o que foi editado no painel');
  }

  let ins = 0, upd = 0, err = 0, preservados = 0;
  for (const item of insumos) {
    try {
      const existing = await prisma.insumoFarmaceutico.findUnique({
        where: { codigo_interno: item.codigo_interno },
      });
      const precos = {
        valor_custo: item.valor_custo,
        custo_referencia: item.custo_referencia,
        markup: item.markup,
      };
      const data = {
        descricao: item.descricao,
        un_manipulacao: item.un_manipulacao,
        estoque: item.estoque,
        calculo_tipo: item.calculo_tipo,
      };
      if (existing) {
        // O painel é a fonte de verdade dos preços depois da carga inicial:
        // o admin corrige o custo quando compra por outro valor, e uma
        // recarga da base não pode desfazer isso.
        const mudouPreco =
          Number(existing.valor_custo) !== item.valor_custo ||
          Number(existing.custo_referencia) !== item.custo_referencia ||
          Number(existing.markup) !== item.markup;

        if (mudouPreco && !sobrescreverCustos) preservados++;

        await prisma.insumoFarmaceutico.update({
          where: { id: existing.id },
          data: sobrescreverCustos ? { ...data, ...precos } : data,
        });
        upd++;
      } else {
        await prisma.insumoFarmaceutico.create({
          data: { codigo_interno: item.codigo_interno, ...data, ...precos },
        });
        ins++;
      }
    } catch (e: any) {
      err++;
      if (err <= 5) console.error(`   ❌ ${item.descricao}: ${e.message}`);
    }
  }
  console.log(`   ✅ Inseridos: ${ins} | Atualizados: ${upd} | Erros: ${err}`);
  if (preservados > 0) {
    console.log(`   🔒 Preços mantidos como estão no painel em ${preservados} insumo(s) — o arquivo trazia valor diferente`);
    console.log('      Para forçar os valores do arquivo: SEED_SOBRESCREVER_CUSTOS=true npx tsx src/scripts/seed-v3.ts');
  }
}

async function seedControlados() {
  const controlados: Array<{ codigo?: number; nome: string; lista: string }> = loadJson('controlados.json');
  if (!controlados.length) return;
  console.log(`\n💊 Controlados: ${controlados.length}`);
  let matched = 0, notFound = 0;

  // Primeiro, reseta todos para não-controlado (permite re-runs limpas)
  await prisma.insumoFarmaceutico.updateMany({
    where: { controlado: true },
    data: { controlado: false, lista_controle: null },
  });

  for (const ctrl of controlados) {
    let insumo = null;

    // Match por código exato (preferencial)
    if (ctrl.codigo) {
      insumo = await prisma.insumoFarmaceutico.findUnique({
        where: { codigo_interno: ctrl.codigo },
      });
    }

    // Fallback: match por nome exato (case insensitive)
    if (!insumo) {
      insumo = await prisma.insumoFarmaceutico.findFirst({
        where: { descricao: { equals: ctrl.nome, mode: 'insensitive' } },
      });
    }

    if (insumo) {
      await prisma.insumoFarmaceutico.update({
        where: { id: insumo.id },
        data: {
          controlado: true,
          lista_controle: ctrl.lista || null,
        },
      });
      matched++;
    } else {
      notFound++;
      console.log(`   ⚠️  Não encontrado: ${ctrl.nome} (código: ${ctrl.codigo || 'N/A'})`);
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

// Só executa quando chamado direto pela linha de comando; ao ser importado
// (pelos testes) o módulo apenas expõe as funções.
if (require.main === module) {
  main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
}
