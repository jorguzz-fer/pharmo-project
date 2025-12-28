import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminService {
    async getDashboardMetrics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get current month start/end
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

        const [revenueData, pipelineData, topPrescriptions] = await Promise.all([
            // 1. Revenue - ALL budgets from current month (not just PAID)
            prisma.orcamento.aggregate({
                where: {
                    created_at: { gte: monthStart, lte: monthEnd }
                },
                _sum: { valor_total: true },
                _count: { id: true }
            }),

            // 2. Production Pipeline - group by prescription status instead
            prisma.prescricao.groupBy({
                by: ['status'],
                _count: { id: true }
            }),

            // 3. Top Performers (Vets) - Get prescription counts
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

        // Fetch veterinarian details for top performers
        const vetIds = topPrescriptions.map(p => p.veterinario_id);
        const vets = await prisma.veterinario.findMany({
            where: { id: { in: vetIds } },
            select: { id: true, nome: true, crv: true }
        });

        // Combine prescription counts with vet details
        const topPerformers = topPrescriptions.map(p => {
            const vet = vets.find(v => v.id === p.veterinario_id);
            return {
                veterinario_id: p.veterinario_id,
                nome: vet?.nome || 'Desconhecido',
                crv: vet?.crv || '-',
                prescricoes_count: p._count.id
            };
        });

        // Transform pipeline data to map (by prescription status)
        const pipelineMap: Record<string, number> = {};
        pipelineData.forEach(item => {
            pipelineMap[item.status] = item._count.id;
        });

        return {
            revenue: {
                total: Number(revenueData._sum.valor_total || 0),
                count: revenueData._count.id
            },
            production_pipeline: pipelineMap,
            top_performers: topPerformers
        };
    }

    async getFinancialReport(mes?: string) {
        // mes formato: "2025-12" ou usa mês atual
        const now = new Date();
        const [year, month] = mes ? mes.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const prescricoes = await prisma.prescricao.findMany({
            where: {
                created_at: { gte: startDate, lte: endDate }
            },
            include: {
                veterinario: true,
                tutor: true,
                animal: true,
                orcamento: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Agrupar por veterinário
        const porVetMap: Record<string, any> = {};

        prescricoes.forEach(p => {
            if (!porVetMap[p.veterinario_id]) {
                porVetMap[p.veterinario_id] = {
                    veterinario_id: p.veterinario_id,
                    nome: p.veterinario.nome,
                    crv: p.veterinario.crv,
                    email: p.veterinario.email,
                    prescricoes_count: 0,
                    valor_total: 0,
                    prescricoes: []
                };
            }

            porVetMap[p.veterinario_id].prescricoes_count++;
            porVetMap[p.veterinario_id].valor_total += Number(p.orcamento?.valor_total || 0);
            porVetMap[p.veterinario_id].prescricoes.push({
                id: p.id,
                data: p.created_at,
                tutor: p.tutor.nome,
                animal: p.animal.nome,
                medicamento: p.medicamento,
                valor: Number(p.orcamento?.valor_total || 0),
                status: p.status
            });
        });

        const porVeterinario = Object.values(porVetMap);
        const totalFaturamento = porVeterinario.reduce((sum, v) => sum + v.valor_total, 0);

        return {
            periodo: `${year}-${String(month).padStart(2, '0')}`,
            total_prescricoes: prescricoes.length,
            total_faturamento: totalFaturamento,
            por_veterinario: porVeterinario
        };
    }

    async getFollowUps() {
        // 1. Follow-ups de pagamentos pendentes (existentes)
        const paymentFollowUps = await prisma.followUp.findMany({
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

        // 2. Clínicas com aprovação pendente
        const pendingClinics = await prisma.clinica.findMany({
            where: { status: 'PENDENTE' },
            select: {
                id: true,
                nome_fantasia: true,
                razao_social: true,
                email: true,
                telefone: true,
                created_at: true,
                cnpj: true,
                responsavel_legal: true
            },
            orderBy: { created_at: 'asc' }
        });

        // 3. Retornar dados combinados
        return {
            paymentFollowUps,
            pendingApprovals: pendingClinics.map(clinic => ({
                id: clinic.id,
                type: 'PENDING_APPROVAL',
                clinic_name: clinic.nome_fantasia,
                razao_social: clinic.razao_social,
                email: clinic.email,
                telefone: clinic.telefone,
                cnpj: clinic.cnpj,
                responsavel_legal: clinic.responsavel_legal,
                created_at: clinic.created_at,
                priority: 'high'
            })),
            summary: {
                totalPaymentFollowUps: paymentFollowUps.length,
                totalPendingApprovals: pendingClinics.length,
                totalTasks: paymentFollowUps.length + pendingClinics.length
            }
        };
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
