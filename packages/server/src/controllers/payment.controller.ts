import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { notificationService } from '../services/notification.service';

const prisma = new PrismaClient();

export class PaymentController {

    // 1. Gera Link de Pagamento (Simulação Mercado Pago)
    async generateLink(req: Request, res: Response) {
        const schema = z.object({
            orcamentoId: z.string().uuid(),
        });

        try {
            const { orcamentoId } = schema.parse(req.body);

            const orcamento = await prisma.orcamento.findUnique({
                where: { id: orcamentoId },
                include: { prescricao: { include: { tutor: true } } }
            });

            if (!orcamento) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            if (orcamento.status_pagamento === 'PAID') {
                return res.status(400).json({ error: 'Orçamento já pago' });
            }

            // MOCK Gateway Integration
            const transactionId = `txn_${Date.now()}`;
            const fakePaymentLink = `https://pay.pharmo.com.br/${transactionId}`;
            const fakePixCode = `00020126580014BR.GOV.BCB.PIX0136valid-pix-key-1235204000053039865802BR5913Pharmo Pet6008Sao Paulo62070503***6304`;

            // Update Orcamento with Link
            await prisma.orcamento.update({
                where: { id: orcamentoId },
                data: {
                    link_pagamento: fakePaymentLink,
                    status_pagamento: 'PENDING'
                }
            });

            return res.json({
                success: true,
                link: fakePaymentLink,
                pix_code: fakePixCode,
                transaction_id: transactionId,
                expires_in: '30 minutes'
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: (error as any).errors });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // 2. Webhook de Confirmação
    async webhook(req: Request, res: Response) {
        // In real scenario, validate Gateway Signature here
        const { transaction_id, status, orcamento_id } = req.body;

        console.log(`[WEBHOOK] Received update for ${orcamento_id} (Tx: ${transaction_id}): ${status}`);

        if (status === 'approved') {
            // Confirm Payment Logic
            const updatedOrcamento = await prisma.$transaction(async (tx) => {
                // 1. Update Payment Status
                const orc = await tx.orcamento.update({
                    where: { id: orcamento_id },
                    data: {
                        status_pagamento: 'PAID',
                        data_pagamento: new Date(),
                        metodo_pagamento: 'PIX'
                    },
                    include: {
                        prescricao: {
                            include: {
                                tutor: true,
                                animal: true
                            }
                        }
                    }
                });

                // 2. Create or Update Order for Production
                const existingPedido = await tx.pedido.findUnique({
                    where: { orcamento_id: orcamento_id }
                });

                let pedido;
                if (existingPedido) {
                    pedido = await tx.pedido.update({
                        where: { id: existingPedido.id },
                        data: { status_producao: 'PAGAMENTO_CONFIRMADO' }
                    });
                } else {
                    pedido = await tx.pedido.create({
                        data: {
                            orcamento_id: orcamento_id,
                            status_producao: 'PAGAMENTO_CONFIRMADO'
                        }
                    });
                }

                // 3. Send to Production (PrismaFive Integration)
                const { PrismaFiveService } = await import('../services/prismaFive.service');
                const prismaFiveService = new PrismaFiveService();

                const osId = await prismaFiveService.sendOrderToProduction(
                    pedido.id,
                    {
                        medicamento: orc.prescricao.medicamento,
                        dosagem: orc.prescricao.dosagem,
                        quantidade: orc.prescricao.quantidade,
                        tutor: orc.prescricao.tutor.nome,
                        animal: orc.prescricao.animal.nome
                    }
                );

                // 4. Update Order Status to EM_PRODUCAO
                await tx.pedido.update({
                    where: { id: pedido.id },
                    data: {
                        status_producao: 'EM_PRODUCAO',
                        data_producao: new Date(),
                        observacoes: `OS PrismaFive: ${osId}`
                    }
                });

                // 5. Create Follow-up for 3 days from now
                const followUpDate = new Date();
                followUpDate.setDate(followUpDate.getDate() + 3);

                await tx.followUp.create({
                    data: {
                        pedido_id: pedido.id,
                        mensagem: `Verificar status de produção - ${orc.prescricao.medicamento}`,
                        data_contato: followUpDate,
                        realizado: false
                    }
                });

                return orc;
            });

            // Mock sending WhatsApp Notification
            if (updatedOrcamento?.prescricao?.tutor?.telefone) {
                await notificationService.notifyPaymentConfirmed(
                    updatedOrcamento.prescricao.tutor.telefone,
                    updatedOrcamento.prescricao.tutor.nome,
                    updatedOrcamento.prescricao_id.slice(0, 8) // Short ID for display
                );
            }

            console.log(`[WEBHOOK] ✅ Payment confirmed and order sent to production for ${orcamento_id}`);
        }

        return res.status(200).send('OK');
    }

    // 3. Status Check
    async checkStatus(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const orcamento = await prisma.orcamento.findUnique({
                where: { id }
            });

            if (!orcamento) return res.status(404).json({ error: 'Not found' });

            return res.json({
                status: orcamento.status_pagamento,
                paid_at: orcamento.data_pagamento
            });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
