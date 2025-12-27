import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ClinicaDashboardController {
    async getDashboard(req: Request, res: Response) {
        try {
            // O usuário vem do middleware de autenticação
            const clinicaId = (req as any).user?.id;

            if (!clinicaId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }

            // Buscar prescrições de todos veterinários da clínica
            const prescricoes = await prisma.prescricao.findMany({
                where: {
                    veterinario: {
                        clinicas: {
                            some: { clinica_id: clinicaId }
                        }
                    }
                },
                include: {
                    veterinario: {
                        select: { nome: true, crv: true }
                    },
                    animal: {
                        select: { nome: true, especie: true }
                    },
                    orcamento: true
                },
                orderBy: { created_at: 'desc' },
                take: 20
            });

            // Calcular métricas
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const prescricoesHoje = prescricoes.filter(p => {
                const pData = new Date(p.created_at);
                pData.setHours(0, 0, 0, 0);
                return pData.getTime() === hoje.getTime();
            }).length;

            const veterinariosAtivos = await prisma.clinicaVeterinario.count({
                where: { clinica_id: clinicaId }
            });

            const trintaDiasAtras = new Date();
            trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

            const receitaEstimada30d = prescricoes
                .filter(p =>
                    p.orcamento?.status_pagamento === 'PAID' &&
                    new Date(p.created_at) >= trintaDiasAtras
                )
                .reduce((sum, p) => sum + Number(p.orcamento?.valor_total || 0), 0);

            const aguardandoPagamento = prescricoes.filter(p =>
                p.orcamento?.status_pagamento === 'PENDING'
            ).length;

            const metrics = {
                prescricoesHoje,
                veterinariosAtivos,
                receitaEstimada30d,
                aguardandoPagamento
            };

            res.json({ metrics, prescricoes });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({ error: 'Erro ao carregar dashboard' });
        }
    }
}

export const clinicaDashboardController = new ClinicaDashboardController();
