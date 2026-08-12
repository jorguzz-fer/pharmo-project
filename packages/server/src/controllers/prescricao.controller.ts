import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { notificationService } from '../services/notification.service';
import { gerarCobranca } from '../services/cobranca.service';

const prisma = new PrismaClient();

const medicamentoSchema = z.object({
    codigo_medicamento: z.string().nullish(),
    medicamento: z.string().min(1),
    dosagem: z.string(),
    forma_farmaceutica: z.string().min(1),
    quantidade: z.string(),
    observacoes: z.string().nullish(),
    preco_sugestao: z.number().nonnegative().nullish(),
    preco_tabela: z.number().nonnegative().nullish(),
    is_magistral: z.boolean().optional(),
});

type MedicamentoInput = z.infer<typeof medicamentoSchema>;

export class PrescricaoController {
    async create(req: Request, res: Response) {
        const schema = z.object({
            veterinario_id: z.string().uuid(),
            tutor_id: z.string().uuid(),
            animal_id: z.string().uuid(),
            doenca: z.string().optional(),
            observacoes: z.string().optional(),
            // Lista completa de medicamentos da prescrição
            medicamentos: z.array(medicamentoSchema).min(1).optional(),
            // Campos legados (prescrição de medicamento único)
            medicamento: z.string().optional(),
            dosagem: z.string().optional(),
            forma_farmaceutica: z.string().optional(),
            quantidade: z.string().optional(),
        });

        // MOCK: Lista de Medicamentos Controlados
        const CONTROLLED_SUBSTANCES = ['Morfina', 'Tramadol', 'Diazepam', 'Ketamina'];

        try {
            const data = schema.parse(req.body);

            // Normaliza: aceita a lista nova ou o formato legado de medicamento único
            let medicamentos: MedicamentoInput[];
            if (data.medicamentos?.length) {
                medicamentos = data.medicamentos;
            } else if (data.medicamento && data.forma_farmaceutica) {
                medicamentos = [{
                    medicamento: data.medicamento,
                    dosagem: data.dosagem ?? '',
                    forma_farmaceutica: data.forma_farmaceutica,
                    quantidade: data.quantidade ?? '',
                    observacoes: data.observacoes,
                }];
            } else {
                return res.status(400).json({
                    error: 'Informe ao menos um medicamento (campo "medicamentos").',
                });
            }

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

            // Validação de Receita Controlada (verifica todos os medicamentos)
            const isControlled = medicamentos.some(med =>
                CONTROLLED_SUBSTANCES.some(sub =>
                    med.medicamento.toLowerCase().includes(sub.toLowerCase())
                )
            );

            if (isControlled) {
                // Exige número de notificação nas observações (da prescrição ou de algum item)
                const textoObservacoes = [
                    data.observacoes,
                    ...medicamentos.map(m => m.observacoes),
                ].filter(Boolean).join(' ').toLowerCase();

                if (!textoObservacoes.includes('notificação')) {
                    return res.status(400).json({
                        error: 'Para medicamentos controlados, é obrigatório informar o número da Notificação de Receita nas observações.'
                    });
                }
            }

            // Auto-link to vet's active clinic
            const clinicaVet = await prisma.clinicaVeterinario.findFirst({
                where: { veterinario_id: data.veterinario_id, status: 'ativo' },
            });

            // Valor do orçamento = soma dos preços praticados nos itens.
            // Um item sem preço torna o total incompleto — melhor recusar do que
            // gravar um orçamento que não corresponde ao que foi prescrito.
            const semPreco = medicamentos.filter(
                m => m.preco_sugestao === undefined || m.preco_sugestao === null
            );
            if (semPreco.length > 0) {
                return res.status(400).json({
                    error: `Sem preço para: ${semPreco.map(m => m.medicamento).join(', ')}. Refaça o orçamento antes de salvar.`,
                    code: 'PRECO_AUSENTE',
                });
            }
            const valorTotal = medicamentos.reduce(
                (soma, m) => soma + Number(m.preco_sugestao ?? 0), 0
            );

            const primeiro = medicamentos[0];

            const result = await prisma.$transaction(async (tx) => {
                const prescricao = await tx.prescricao.create({
                    data: {
                        veterinario_id: data.veterinario_id,
                        tutor_id: data.tutor_id,
                        animal_id: data.animal_id,
                        doenca: data.doenca || null,
                        observacoes: data.observacoes,
                        // Campos legados: espelham o primeiro item, para compatibilidade
                        medicamento: primeiro.medicamento,
                        dosagem: primeiro.dosagem,
                        forma_farmaceutica: primeiro.forma_farmaceutica,
                        quantidade: primeiro.quantidade,
                        clinica_id: clinicaVet?.clinica_id || null,
                        status: 'DRAFT', // Starts as draft
                        medicamentos: {
                            create: medicamentos.map(m => ({
                                codigo_medicamento: m.codigo_medicamento ?? null,
                                medicamento: m.medicamento,
                                dosagem: m.dosagem,
                                forma_farmaceutica: m.forma_farmaceutica,
                                quantidade: m.quantidade,
                                observacoes: m.observacoes ?? null,
                                preco_sugestao: m.preco_sugestao ?? null,
                                preco_tabela: m.preco_tabela ?? null,
                                is_magistral: m.is_magistral ?? false,
                            })),
                        },
                    },
                    include: { medicamentos: true },
                });

                const orcamento = await tx.orcamento.create({
                    data: {
                        prescricao_id: prescricao.id,
                        valor_total: valorTotal,
                        status_pagamento: 'PENDING',
                        // Token da página pública que o tutor abre sem login
                        token_publico: randomBytes(16).toString('hex'),
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
            const prescricao = await prisma.prescricao.findUnique({
                where: { id },
                include: { tutor: true, orcamento: true },
            });

            if (!prescricao) {
                return res.status(404).json({ error: 'Prescrição não encontrada' });
            }

            // Prepara a cobrança antes de enviar: o tutor abre o link já podendo pagar
            let avisoCobranca: string | null = null;
            if (prescricao.orcamento && prescricao.orcamento.status_pagamento !== 'PAID') {
                const cobranca = await gerarCobranca(prescricao.orcamento.id);
                if (!cobranca.ok) avisoCobranca = cobranca.motivo ?? null;
            }

            // O link é sempre o da página do tutor, não o do checkout: ali ele vê a
            // receita, o valor e o botão de pagar, e pode voltar depois.
            const token = prescricao.orcamento?.token_publico;
            const link = token
                ? `${process.env.FRONTEND_URL || ''}/receita/${token}`
                : `${process.env.FRONTEND_URL || ''}/pedidos/${prescricao.id}`;

            const envio = await notificationService.notifyPrescriptionCreated(
                prescricao.tutor.telefone,
                prescricao.tutor.nome,
                link
            );

            // Só marca como enviada se de fato saiu
            if (envio.enviado) {
                await prisma.prescricao.update({
                    where: { id },
                    data: { status: 'SENT' },
                });
            }

            return res.json({
                success: true,
                enviado: envio.enviado,
                canal: envio.enviado ? 'whatsapp' : null,
                motivo: envio.motivo ?? null,
                aviso_cobranca: avisoCobranca,
                link,
                message: envio.enviado
                    ? 'Prescrição enviada por WhatsApp ao tutor'
                    : `Prescrição registrada, mas não enviada: ${envio.motivo}`,
            });
        } catch (error) {
            console.error('❌ Erro ao enviar prescrição:', error);
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
