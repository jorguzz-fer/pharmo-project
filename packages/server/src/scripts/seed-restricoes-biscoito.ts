/**
 * Restrições de forma farmacêutica pedidas na reunião de 11/09 (13:05).
 *
 * Pancreatina, ciclosporina e SAM não podem ser manipulados em biscoito —
 * somente em cápsula. Cadastra a regra de exceção correspondente, que o motor
 * de precificação já usa para bloquear a combinação e avisar o veterinário.
 *
 * Idempotente: rodar de novo não duplica nada.
 *
 * Uso: npx tsx src/scripts/seed-restricoes-biscoito.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Trechos que identificam os princípios ativos restritos, por busca parcial. */
const ATIVOS_RESTRITOS = ['pancreatina', 'ciclosporina', 'sam'];

const FORMA_RESTRITA = 'BISCOITOS';
const DESCRICAO = 'NÃO FAZ EM BISCOITO — somente cápsula';

async function main() {
    const forma = await prisma.formaFarmaceutica.findUnique({
        where: { nome: FORMA_RESTRITA },
    });

    if (!forma) {
        console.error(`❌ Forma farmacêutica "${FORMA_RESTRITA}" não encontrada. Rode o seed-v3 antes.`);
        await prisma.$disconnect();
        process.exit(1);
    }

    let criadas = 0;
    let jaExistiam = 0;
    const naoEncontrados: string[] = [];

    for (const termo of ATIVOS_RESTRITOS) {
        const insumos = await prisma.insumoFarmaceutico.findMany({
            where: { descricao: { contains: termo, mode: 'insensitive' } },
        });

        if (insumos.length === 0) {
            naoEncontrados.push(termo);
            continue;
        }

        for (const insumo of insumos) {
            const existente = await prisma.regraExcecao.findUnique({
                where: {
                    insumo_farmaceutico_id_forma_farmaceutica_id: {
                        insumo_farmaceutico_id: insumo.id,
                        forma_farmaceutica_id: forma.id,
                    },
                },
            });

            if (existente) {
                jaExistiam++;
                continue;
            }

            await prisma.regraExcecao.create({
                data: {
                    insumo_farmaceutico_id: insumo.id,
                    forma_farmaceutica_id: forma.id,
                    descricao: DESCRICAO,
                },
            });
            console.log(`  ✓ ${insumo.descricao} (${insumo.codigo_interno}) × ${FORMA_RESTRITA}`);
            criadas++;
        }
    }

    console.log(`\n✅ Restrições: ${criadas} criada(s), ${jaExistiam} já existia(m).`);
    if (naoEncontrados.length > 0) {
        console.warn(`⚠️  Sem insumo cadastrado para: ${naoEncontrados.join(', ')}`);
    }

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
