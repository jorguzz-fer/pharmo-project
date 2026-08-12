import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { mercadoPagoService } from '../services/mercadopago.service';
import { confirmarPagamento } from '../services/pagamento.service';
import { gerarCobranca } from '../services/cobranca.service';

const prisma = new PrismaClient();

export class PaymentController {

    /** POST /api/pagamentos/gerar — cria a cobrança no gateway e devolve o link */
    async generateLink(req: Request, res: Response) {
        const schema = z.object({
            orcamentoId: z.string().uuid(),
        });

        try {
            const { orcamentoId } = schema.parse(req.body);
            const resultado = await gerarCobranca(orcamentoId);

            if (!resultado.ok) {
                return res.status(resultado.status).json({
                    success: false,
                    error: resultado.motivo,
                });
            }

            return res.json({
                success: true,
                link: resultado.link,
                gateway: 'mercadopago',
                referencia: resultado.referencia,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: (error as any).errors });
            }
            console.error('❌ Erro ao gerar cobrança:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /api/pagamentos/webhook/mercadopago
     * O Mercado Pago avisa que algo mudou; a confirmação vem da consulta ao
     * gateway, nunca do corpo da notificação.
     */
    async webhookMercadoPago(req: Request, res: Response) {
        const dataId = String(req.body?.data?.id ?? req.query['data.id'] ?? '');
        const tipo = String(req.body?.type ?? req.query.type ?? '');

        const assinaturaValida = mercadoPagoService.verificarAssinatura({
            assinatura: req.headers['x-signature'] as string | undefined,
            requestId: req.headers['x-request-id'] as string | undefined,
            dataId,
        });

        if (!assinaturaValida) {
            console.warn('[WEBHOOK MP] Assinatura inválida — notificação descartada');
            return res.status(401).send('assinatura inválida');
        }

        // Só pagamento interessa; os demais eventos são reconhecidos e ignorados
        if (tipo && tipo !== 'payment') {
            return res.status(200).send('OK');
        }

        if (!dataId) {
            return res.status(400).send('sem id de pagamento');
        }

        const pagamento = await mercadoPagoService.consultarPagamento(dataId);

        if (!pagamento.encontrado) {
            console.warn(`[WEBHOOK MP] Pagamento ${dataId} não pôde ser consultado: ${pagamento.motivo}`);
            // 500 faz o Mercado Pago tentar de novo, que é o comportamento desejado
            return res.status(500).send('falha ao consultar pagamento');
        }

        if (!pagamento.aprovado || !pagamento.orcamento_id) {
            return res.status(200).send('OK');
        }

        const metodo = pagamento.metodo === 'credit_card' ? 'CREDIT_CARD'
            : pagamento.metodo === 'debit_card' ? 'DEBIT_CARD'
                : 'PIX';

        await prisma.orcamento.updateMany({
            where: { id: pagamento.orcamento_id },
            data: { gateway: 'mercadopago', gateway_ref: dataId },
        });

        await confirmarPagamento(pagamento.orcamento_id, metodo);
        return res.status(200).send('OK');
    }

    /**
     * POST /api/pagamentos/webhook
     * Endpoint genérico legado. Fora de produção serve para simular a
     * confirmação; com o gateway configurado, só o webhook assinado do
     * Mercado Pago confirma pagamento.
     */
    async webhook(req: Request, res: Response) {
        const { status, orcamento_id } = req.body;

        if (mercadoPagoService.configurado) {
            console.warn('[WEBHOOK] Chamada ao endpoint genérico recusada: gateway configurado');
            return res.status(409).json({
                error: 'Gateway configurado — use /api/pagamentos/webhook/mercadopago',
            });
        }

        if (status === 'approved' && orcamento_id) {
            await confirmarPagamento(orcamento_id, 'PIX');
        }

        return res.status(200).send('OK');
    }

    /** GET /api/pagamentos/:id/status */
    async checkStatus(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const orcamento = await prisma.orcamento.findUnique({ where: { id } });
            if (!orcamento) return res.status(404).json({ error: 'Not found' });

            return res.json({
                status: orcamento.status_pagamento,
                paid_at: orcamento.data_pagamento,
                link: orcamento.link_pagamento,
            });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
