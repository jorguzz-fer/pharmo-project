import crypto from 'crypto';

/**
 * Integração com o Mercado Pago (Checkout Pro).
 *
 * O tutor recebe um link, escolhe como pagar (PIX, cartão, boleto) e o Mercado
 * Pago avisa a PharmoPet por webhook. Sem MERCADOPAGO_ACCESS_TOKEN configurado o
 * serviço não gera link falso: informa que não está configurado e quem chamou
 * decide o que dizer ao usuário.
 */

// Sobrescrevível para testes; em produção fica o endereço oficial
const API_URL = process.env.MERCADOPAGO_API_URL || 'https://api.mercadopago.com';

export interface CobrancaItem {
    titulo: string;
    quantidade: number;
    valor_unitario: number;
}

export interface CobrancaResultado {
    criada: boolean;
    /** URL de checkout para o tutor pagar */
    link?: string;
    /** ID da preferência no gateway */
    referencia?: string;
    motivo?: string;
}

export interface PagamentoConsulta {
    encontrado: boolean;
    aprovado: boolean;
    /** ID do orçamento (external_reference enviado na criação) */
    orcamento_id?: string;
    metodo?: string;
    motivo?: string;
}

export class MercadoPagoService {
    private accessToken: string;
    private webhookSecret: string;

    constructor() {
        this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
        this.webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';
    }

    get configurado(): boolean {
        return Boolean(this.accessToken);
    }

    /**
     * Cria a preferência de pagamento e devolve o link do checkout.
     * `orcamentoId` volta no webhook como external_reference.
     */
    async criarCobranca(params: {
        orcamentoId: string;
        itens: CobrancaItem[];
        pagador?: { nome?: string; email?: string | null };
        urlRetorno?: string;
    }): Promise<CobrancaResultado> {
        if (!this.configurado) {
            console.warn('[MERCADOPAGO] Cobrança ignorada: MERCADOPAGO_ACCESS_TOKEN não configurado');
            return { criada: false, motivo: 'Gateway de pagamento não configurado' };
        }

        const itensValidos = params.itens.filter(i => i.valor_unitario > 0);
        if (itensValidos.length === 0) {
            return { criada: false, motivo: 'Orçamento sem valor a cobrar' };
        }

        const body: Record<string, unknown> = {
            items: itensValidos.map(i => ({
                title: i.titulo.slice(0, 250),
                quantity: i.quantidade,
                unit_price: Number(i.valor_unitario.toFixed(2)),
                currency_id: 'BRL',
            })),
            external_reference: params.orcamentoId,
            notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || undefined,
            statement_descriptor: 'PHARMOPET',
        };

        if (params.pagador?.email) {
            body.payer = { name: params.pagador.nome, email: params.pagador.email };
        }

        if (params.urlRetorno) {
            body.back_urls = {
                success: params.urlRetorno,
                pending: params.urlRetorno,
                failure: params.urlRetorno,
            };
            body.auto_return = 'approved';
        }

        try {
            const response = await fetch(`${API_URL}/checkout/preferences`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    // Evita cobrança duplicada se a requisição for repetida
                    'X-Idempotency-Key': params.orcamentoId,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const detalhe = await response.text().catch(() => '');
                console.error(`[MERCADOPAGO] Falha ${response.status}: ${detalhe}`);
                return { criada: false, motivo: `Gateway recusou a cobrança (HTTP ${response.status})` };
            }

            const data = await response.json() as { id?: string; init_point?: string; sandbox_init_point?: string };
            const link = data.init_point || data.sandbox_init_point;

            if (!link) {
                return { criada: false, motivo: 'Gateway não devolveu link de pagamento' };
            }

            return { criada: true, link, referencia: data.id };
        } catch (error: any) {
            console.error('[MERCADOPAGO] Erro de rede:', error?.message);
            return { criada: false, motivo: 'Falha de comunicação com o gateway' };
        }
    }

    /** Consulta um pagamento para saber se foi mesmo aprovado. */
    async consultarPagamento(paymentId: string): Promise<PagamentoConsulta> {
        if (!this.configurado) {
            return { encontrado: false, aprovado: false, motivo: 'Gateway não configurado' };
        }

        try {
            const response = await fetch(`${API_URL}/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
            });

            if (!response.ok) {
                console.error(`[MERCADOPAGO] Consulta ${paymentId} falhou: HTTP ${response.status}`);
                return { encontrado: false, aprovado: false, motivo: `HTTP ${response.status}` };
            }

            const data = await response.json() as {
                status?: string;
                external_reference?: string;
                payment_type_id?: string;
            };

            return {
                encontrado: true,
                aprovado: data.status === 'approved',
                orcamento_id: data.external_reference,
                metodo: data.payment_type_id,
            };
        } catch (error: any) {
            console.error('[MERCADOPAGO] Erro ao consultar pagamento:', error?.message);
            return { encontrado: false, aprovado: false, motivo: 'Falha de comunicação com o gateway' };
        }
    }

    /**
     * Confere a assinatura do webhook (header x-signature).
     * Sem segredo configurado não há o que validar — nesse caso a confirmação
     * depende da consulta ao gateway, que é a garantia real.
     */
    verificarAssinatura(params: {
        assinatura?: string;
        requestId?: string;
        dataId?: string;
    }): boolean {
        if (!this.webhookSecret) return true;
        if (!params.assinatura || !params.dataId) return false;

        const partes = Object.fromEntries(
            params.assinatura.split(',').map(p => p.split('=').map(s => s.trim()) as [string, string])
        );
        const ts = partes.ts;
        const hash = partes.v1;
        if (!ts || !hash) return false;

        const manifest = `id:${params.dataId};request-id:${params.requestId || ''};ts:${ts};`;
        const esperado = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(manifest)
            .digest('hex');

        const a = Buffer.from(esperado);
        const b = Buffer.from(hash);
        return a.length === b.length && crypto.timingSafeEqual(a, b);
    }
}

export const mercadoPagoService = new MercadoPagoService();
