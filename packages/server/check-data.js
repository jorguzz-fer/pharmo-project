const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    console.log('=== Verificando dados no banco ===\n');

    const prescricoes = await prisma.prescricao.count();
    console.log(`📋 Prescrições: ${prescricoes}`);

    const orcamentos = await prisma.orcamento.count();
    console.log(`💰 Orçamentos: ${orcamentos}`);

    const orcamentosPagos = await prisma.orcamento.count({
        where: { status_pagamento: 'PAID' }
    });
    console.log(`✅ Orçamentos PAGOS: ${orcamentosPagos}`);

    const pedidos = await prisma.pedido.count();
    console.log(`📦 Pedidos: ${pedidos}`);

    const veterinarios = await prisma.veterinario.count();
    console.log(`👨‍⚕️ Veterinários: ${veterinarios}`);

    console.log('\n=== Top 5 Veterinários ===\n');
    const topVets = await prisma.prescricao.groupBy({
        by: ['veterinario_id'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
    });

    for (const v of topVets) {
        const vet = await prisma.veterinario.findUnique({
            where: { id: v.veterinario_id },
            select: { nome: true, crv: true }
        });
        console.log(`${vet?.nome} (CRV: ${vet?.crv}) - ${v._count.id} prescrições`);
    }

    await prisma.$disconnect();
}

checkData().catch(console.error);
