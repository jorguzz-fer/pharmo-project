import { PrismaClient } from '@prisma/client';
import { mercadoPagoService } from './mercadopago.service';

const prisma = new PrismaClient();

export interface GerarCobrancaResultado {
    ok: boolean;
    status: number;
    link?: string;
    referencia?: string;
    motivo?: string;
}

/**
 * Garante um link de pagamento para o orçamento.
 * Reaproveita o link já criado — cada chamada nova geraria outra cobrança no
 * gateway para a mesma dívida.
 */
export async function gerarCobranca(orcamentoId: string): Promise<GerarCobrancaResultado> {
    const orcamento = await prisma.orcamento.findUnique({
        where: { id: orcamentoId },
        include: {
            prescricao: {
                include: { tutor: true, animal: true, medicamentos: true },
            },
        },
    });

    if (!orcamento) {
        return { ok: false, status: 404, motivo: 'Orçamento não encontrado' };
    }

    if (orcamento.status_pagamento === 'PAID') {
        return { ok: false, status: 409, motivo: 'Este orçamento já foi pago' };
    }

    if (orcamento.link_pagamento) {
        return {
            ok: true,
            status: 200,
            link: orcamento.link_pagamento,
            referencia: orcamento.gateway_ref ?? undefined,
        };
    }

    const nomeAnimal = orcamento.prescricao.animal.nome;
    const itens = orcamento.prescricao.medicamentos.length > 0
        ? orcamento.prescricao.medicamentos.map(m => ({
            titulo: `${m.medicamento} — ${nomeAnimal}`,
            quantidade: 1,
            valor_unitario: Number(m.preco_sugestao ?? 0),
        }))
        : [{
            titulo: `${orcamento.prescricao.medicamento} — ${nomeAnimal}`,
            quantidade: 1,
            valor_unitario: Number(orcamento.valor_total),
        }];

    // Se os itens não somam o total do orçamento, cobra o total (fonte da verdade)
    const somaItens = itens.reduce((s, i) => s + i.valor_unitario * i.quantidade, 0);
    const itensCobranca = Math.abs(somaItens - Number(orcamento.valor_total)) < 0.01
        ? itens
        : [{
            titulo: `Manipulação PharmoPet — ${nomeAnimal}`,
            quantidade: 1,
            valor_unitario: Number(orcamento.valor_total),
        }];

    const urlRetorno = orcamento.token_publico && process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/receita/${orcamento.token_publico}`
        : undefined;

    const cobranca = await mercadoPagoService.criarCobranca({
        orcamentoId: orcamento.id,
        itens: itensCobranca,
        pagador: {
            nome: orcamento.prescricao.tutor.nome,
            email: orcamento.prescricao.tutor.email,
        },
        urlRetorno,
    });

    if (!cobranca.criada || !cobranca.link) {
        return { ok: false, status: 503, motivo: cobranca.motivo || 'Não foi possível gerar a cobrança' };
    }

    await prisma.orcamento.update({
        where: { id: orcamento.id },
        data: {
            link_pagamento: cobranca.link,
            gateway: 'mercadopago',
            gateway_ref: cobranca.referencia,
        },
    });

    return { ok: true, status: 200, link: cobranca.link, referencia: cobranca.referencia };
}
