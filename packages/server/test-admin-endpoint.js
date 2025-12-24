const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAdminEndpoint() {
    console.log('=== Testando lógica do Admin Dashboard ===\n');
    
    // Simular o que o endpoint faz
    const [revenueData, pipelineData, topPrescriptions] = await Promise.all([
        prisma.orcamento.aggregate({
            where: { status_pagamento: 'PAID' },
            _sum: { valor_total: true },
            _count: { id: true }
        }),
        prisma.pedido.groupBy({
            by: ['status_producao'],
            _count: { id: true }
        }),
        prisma.prescricao.groupBy({
            by: ['veterinario_id'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        })
    ]);
    
    console.log('Revenue Data:', revenueData);
    console.log('Pipeline Data:', pipelineData);
    console.log('Top Prescriptions:', topPrescriptions);
    
    // Buscar detalhes dos vets
    const vetIds = topPrescriptions.map(p => p.veterinario_id);
    const vets = await prisma.veterinario.findMany({
        where: { id: { in: vetIds } },
        select: { id: true, nome: true, crv: true }
    });
    
    console.log('\nVeterinários:', vets);
    
    await prisma.$disconnect();
}

testAdminEndpoint().catch(console.error);
