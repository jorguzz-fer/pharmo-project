const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function markAsPaid() {
    console.log('🔄 Marcando orçamentos como PAGOS...\n');

    // Buscar todos os orçamentos PENDING
    const orcamentos = await prisma.orcamento.findMany({
        where: { status_pagamento: 'PENDING' },
        include: { prescricao: { include: { tutor: true, animal: true } } }
    });

    console.log(`📋 Encontrados ${orcamentos.length} orçamentos pendentes\n`);

    for (const orc of orcamentos) {
        // Marcar como PAID
        await prisma.orcamento.update({
            where: { id: orc.id },
            data: {
                status_pagamento: 'PAID',
                data_pagamento: new Date(),
                metodo_pagamento: 'PIX'
            }
        });

        // Criar pedido
        await prisma.pedido.create({
            data: {
                orcamento_id: orc.id,
                status_producao: 'PAGAMENTO_CONFIRMADO'
            }
        });

        console.log(`✅ Orçamento ${orc.id.substring(0, 8)}... - R$ ${orc.valor_total} - ${orc.prescricao.tutor.nome}`);
    }

    console.log(`\n✅ ${orcamentos.length} orçamentos marcados como PAGOS e pedidos criados!`);

    await prisma.$disconnect();
}

markAsPaid().catch(console.error);
