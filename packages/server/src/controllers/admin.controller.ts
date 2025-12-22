import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminController {
    // 1. Dashboard Principal (Metricas Gerais)
    async getDashboardMetrics(_req: Request, res: Response) {
        try {
            // Total de Vendas (Status PAID)
            const totalSales = await prisma.orcamento.aggregate({
                where: { status_pagamento: 'PAID' },
                _sum: { valor_total: true },
                _count: { id: true }
            });

            // Pedidos por Status (Pipeline de Produção)
            const ordersByStatus = await prisma.pedido.groupBy({
                by: ['status_producao'],
                _count: { id: true }
            });

            // Top Veterinários (Por volume de prescrições)
            const topVets = await prisma.prescricao.groupBy({
                by: ['veterinario_id'],
                _count: { id: true },
                orderBy: {
                    _count: { id: 'desc' }
                },
                take: 5
            });

            // Enrich Top Vets with Names (This would be better with a raw query or include, but groupBy has limitations in Prisma for relations)
            // For now returning IDs and counts. 

            return res.json({
                revenue: {
                    total: totalSales._sum.valor_total || 0,
                    count: totalSales._count.id
                },
                production_pipeline: ordersByStatus.reduce((acc, curr) => {
                    acc[curr.status_producao] = curr._count.id;
                    return acc;
                }, {} as Record<string, number>),
                top_performers: topVets
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // 2. Relatório de Vendas (Listagem detalhada de Pedidos Pagos)
    async getSalesReport(_req: Request, res: Response) {
        try {
            const sales = await prisma.orcamento.findMany({
                where: { status_pagamento: 'PAID' },
                include: {
                    prescricao: {
                        include: {
                            veterinario: { select: { nome: true, crv: true } },
                            tutor: { select: { nome: true } }
                        }
                    },
                    pedido: true
                },
                orderBy: { updated_at: 'desc' },
                take: 50
            });

            return res.json(sales.map(s => ({
                date: s.data_pagamento,
                amount: s.valor_total,
                method: s.metodo_pagamento,
                vet: s.prescricao.veterinario.nome,
                client: s.prescricao.tutor.nome,
                status: s.pedido?.status_producao || 'PENDING_PRODUCTION'
            })));

        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
