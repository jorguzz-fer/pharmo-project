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

    async getPrescricoes(req: Request, res: Response) {
        try {
            const clinicaId = (req as any).user?.id;

            if (!clinicaId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }

            // Buscar todas as prescrições dos veterinários da clínica
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
                        select: { nome: true, crv: true, email: true }
                    },
                    animal: {
                        select: { nome: true, especie: true },
                        include: {
                            tutor: {
                                select: { nome: true, telefone: true }
                            }
                        }
                    },
                    orcamento: true
                },
                orderBy: { created_at: 'desc' }
            });

            res.json({ prescricoes });
        } catch (error) {
            console.error('Get prescricoes error:', error);
            res.status(500).json({ error: 'Erro ao carregar prescrições' });
        }
    }

    async getVeterinarios(req: Request, res: Response) {
        try {
            const clinicaId = (req as any).user?.id;

            if (!clinicaId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }

            // Buscar veterinários vinculados à clínica
            const vinculos = await prisma.clinicaVeterinario.findMany({
                where: { clinica_id: clinicaId },
                include: {
                    veterinario: {
                        select: {
                            id: true,
                            nome: true,
                            crv: true,
                            email: true,
                            telefone: true,
                            _count: {
                                select: {
                                    prescricoes: true
                                }
                            }
                        }
                    }
                }
            });

            // Mapear para formato mais limpo
            const veterinarios = vinculos.map(v => ({
                ...v.veterinario,
                totalPrescricoes: v.veterinario._count.prescricoes,
                vinculadoEm: v.created_at
            }));

            res.json({ veterinarios });
        } catch (error) {
            console.error('Get veterinarios error:', error);
            res.status(500).json({ error: 'Erro ao carregar veterinários' });
        }
    }
}

export const clinicaDashboardController = new ClinicaDashboardController();
