import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export class PrescricaoController {
    async create(req: Request, res: Response) {
        const schema = z.object({
            veterinario_id: z.string().uuid(),
            tutor_id: z.string().uuid(),
            animal_id: z.string().uuid(),
            doenca: z.string().optional(),
            medicamento: z.string(),
            dosagem: z.string(),
            forma_farmaceutica: z.string(),
            quantidade: z.string(),
            observacoes: z.string().optional(),
        });

        // MOCK: Lista de Medicamentos Controlados
        const CONTROLLED_SUBSTANCES = ['Morfina', 'Tramadol', 'Diazepam', 'Ketamina'];

        try {
            const data = schema.parse(req.body);

            // Validate that veterinario exists
            const vet = await prisma.veterinario.findUnique({
                where: { id: data.veterinario_id },
            });
            if (!vet) {
                return res.status(401).json({
                    error: 'Veterinário não encontrado. Faça logout e login novamente.',
                    code: 'VET_NOT_FOUND',
                });
            }

            // Validate that tutor exists
            const tutorExists = await prisma.tutor.findUnique({
                where: { id: data.tutor_id },
            });
            if (!tutorExists) {
                return res.status(400).json({
                    error: 'Tutor não encontrado. Cadastre o tutor novamente.',
                    code: 'TUTOR_NOT_FOUND',
                });
            }

            // Validate that animal exists
            const animalExists = await prisma.animal.findUnique({
                where: { id: data.animal_id },
            });
            if (!animalExists) {
                return res.status(400).json({
                    error: 'Animal não encontrado. Cadastre o animal novamente.',
                    code: 'ANIMAL_NOT_FOUND',
                });
            }

            // Validação de Receita Controlada
            const isControlled = CONTROLLED_SUBSTANCES.some(sub =>
                data.medicamento.toLowerCase().includes(sub.toLowerCase())
            );

            if (isControlled) {
                // Exige número de notificação nas observações
                if (!data.observacoes || !data.observacoes.toLowerCase().includes('notificação')) {
                    return res.status(400).json({
                        error: 'Para medicamentos controlados, é obrigatório informar o número da Notificação de Receita nas observações.'
                    });
                }
            }

            // Auto-link to vet's active clinic
            const clinicaVet = await prisma.clinicaVeterinario.findFirst({
                where: { veterinario_id: data.veterinario_id, status: 'ativo' },
            });

            // Create Prescricao + Orcamento (Mock Logic for price)
            const mockPrice = 150.00 + (Math.random() * 100); // 150 - 250

            const result = await prisma.$transaction(async (tx) => {
                const prescricao = await tx.prescricao.create({
                    data: {
                        ...data,
                        clinica_id: clinicaVet?.clinica_id || null,
                        status: 'DRAFT', // Starts as draft
                    },
                });

                const orcamento = await tx.orcamento.create({
                    data: {
                        prescricao_id: prescricao.id,
                        valor_total: mockPrice,
                        status_pagamento: 'PENDING',
                    },
                });

                return { prescricao, orcamento };
            });

            return res.status(201).json(result);
        } catch (error: any) {
            console.error('❌ Prescription create error:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: (error as any).errors });
            }
            // Handle Prisma FK constraint errors with clear messages
            if (error.code === 'P2003') {
                const field = error.meta?.field_name || '';
                if (field.includes('veterinario')) {
                    return res.status(401).json({
                        error: 'Sessão expirada ou veterinário não encontrado. Faça logout e login novamente.',
                        code: 'VET_NOT_FOUND',
                    });
                }
                if (field.includes('tutor')) {
                    return res.status(400).json({
                        error: 'Tutor não encontrado. Cadastre o tutor novamente.',
                        code: 'TUTOR_NOT_FOUND',
                    });
                }
                if (field.includes('animal')) {
                    return res.status(400).json({
                        error: 'Animal não encontrado. Cadastre o animal novamente.',
                        code: 'ANIMAL_NOT_FOUND',
                    });
                }
                return res.status(400).json({
                    error: 'Dados de referência inválidos. Tente novamente.',
                });
            }
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }

    async listByVet(req: Request, res: Response) {
        const vetId = req.userId; // From authMiddleware

        try {
            const prescricoes = await prisma.prescricao.findMany({
                where: { veterinario_id: vetId },
                include: {
                    tutor: true,
                    animal: true,
                    orcamento: true,
                },
                orderBy: { created_at: 'desc' },
                take: 20
            });

            return res.json(prescricoes);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async sendToClient(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const prescricao = await prisma.prescricao.update({
                where: { id },
                data: { status: 'SENT' }
            });

            // Mock sending Logic (WhatsApp integration comes later)
            console.log(`[WHATSAPP MOCK] Sending prescription ${id} to client...`);

            return res.json({ success: true, message: 'Prescrição enviada com sucesso', prescricao });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getOrderStatus(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const orcamento = await prisma.orcamento.findFirst({
                where: { prescricao_id: id },
                include: {
                    prescricao: {
                        include: {
                            tutor: true,
                            animal: true
                        }
                    },
                    pedido: true
                }
            });

            if (!orcamento) {
                return res.status(404).json({ error: 'Pedido não encontrado' });
            }

            return res.json({
                orcamento: {
                    id: orcamento.id,
                    valor_total: orcamento.valor_total,
                    status_pagamento: orcamento.status_pagamento,
                    link_pagamento: orcamento.link_pagamento,
                    data_pagamento: orcamento.data_pagamento,
                    prescricao: orcamento.prescricao
                },
                pedido: orcamento.pedido
            });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
