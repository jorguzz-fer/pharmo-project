import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminService {
    async getDashboardMetrics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [revenueData, pipelineData, topVets] = await Promise.all([
            // 1. Revenue
            prisma.orcamento.aggregate({
                where: {
                    status_pagamento: 'PAID',
                },
                _sum: { valor_total: true },
                _count: { id: true }
            }),

            // 2. Production Pipeline
            prisma.pedido.groupBy({
                by: ['status_producao'],
                _count: { id: true }
            }),

            // 3. Top Performers (Vets)
            prisma.prescricao.groupBy({
                by: ['veterinario_id'],
                _count: { id: true },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                },
                take: 5
            })
        ]);

        // Transform pipeline data to map
        const pipelineMap: Record<string, number> = {};
        pipelineData.forEach(item => {
            pipelineMap[item.status_producao] = item._count.id;
        });

        return {
            revenue: {
                total: Number(revenueData._sum.valor_total || 0),
                count: revenueData._count.id
            },
            production_pipeline: pipelineMap,
            top_performers: topVets
        };
    }

    async getFollowUps() {
        return prisma.followUp.findMany({
            where: { realizado: false },
            include: {
                pedido: {
                    include: {
                        orcamento: {
                            include: {
                                prescricao: {
                                    include: { tutor: true, animal: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { data_contato: 'asc' }
        });
    }

    async markFollowUp(id: string) {
        return prisma.followUp.update({
            where: { id },
            data: { realizado: true }
        });
    }

    async getSalesReports(period: 'day' | 'month' = 'day') {
        const now = new Date();
        const startDate = new Date();
        if (period === 'month') {
            startDate.setMonth(now.getMonth() - 1);
        } else {
            startDate.setDate(now.getDate() - 1);
        }

        const sales = await prisma.orcamento.findMany({
            where: {
                status_pagamento: 'PAID',
                data_pagamento: { gte: startDate }
            },
            include: {
                prescricao: {
                    include: { veterinario: true }
                }
            }
        });

        // Aggregate by Veterinarian
        const byVet: Record<string, number> = {};
        sales.forEach(sale => {
            const vetName = sale.prescricao.veterinario.nome;
            const value = Number(sale.valor_total);
            byVet[vetName] = (byVet[vetName] || 0) + value;
        });

        return { period, totalSales: sales.length, byVet };
    }
}
