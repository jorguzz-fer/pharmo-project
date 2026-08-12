import { PrismaClient, MetodoPagamento } from '@prisma/client';
import { notificationService } from './notification.service';
import { PrismaFiveService } from './prismaFive.service';

const prisma = new PrismaClient();

export interface ConfirmacaoResultado {
    confirmado: boolean;
    /** true quando o orçamento já estava pago (webhook repetido) */
    jaEstavaPago?: boolean;
    pedido_id?: string;
    motivo?: string;
}

/**
 * Efetiva um pagamento aprovado: marca o orçamento, abre o pedido, manda para a
 * produção, agenda o retorno e avisa o tutor.
 *
 * É idempotente: gateways reenviam a mesma notificação várias vezes, e um
 * orçamento já pago não pode virar dois pedidos.
 */
export async function confirmarPagamento(
    orcamentoId: string,
    metodo: MetodoPagamento = 'PIX'
): Promise<ConfirmacaoResultado> {
    const existente = await prisma.orcamento.findUnique({
        where: { id: orcamentoId },
        select: { id: true, status_pagamento: true },
    });

    if (!existente) {
        return { confirmado: false, motivo: 'Orçamento não encontrado' };
    }

    if (existente.status_pagamento === 'PAID') {
        const pedido = await prisma.pedido.findUnique({ where: { orcamento_id: orcamentoId } });
        return { confirmado: true, jaEstavaPago: true, pedido_id: pedido?.id };
    }

    const { orcamento, pedidoId } = await prisma.$transaction(async (tx) => {
        const orc = await tx.orcamento.update({
            where: { id: orcamentoId },
            data: {
                status_pagamento: 'PAID',
                data_pagamento: new Date(),
                metodo_pagamento: metodo,
            },
            include: {
                prescricao: {
                    include: { tutor: true, animal: true, medicamentos: true },
                },
            },
        });

        const existentePedido = await tx.pedido.findUnique({ where: { orcamento_id: orcamentoId } });
        const pedido = existentePedido
            ? await tx.pedido.update({
                where: { id: existentePedido.id },
                data: { status_producao: 'PAGAMENTO_CONFIRMADO' },
            })
            : await tx.pedido.create({
                data: { orcamento_id: orcamentoId, status_producao: 'PAGAMENTO_CONFIRMADO' },
            });

        return { orcamento: orc, pedidoId: pedido.id };
    });

    // Envio à produção fora da transação: falha aqui não pode desfazer o pagamento
    try {
        const prismaFive = new PrismaFiveService();
        const itens = orcamento.prescricao.medicamentos.length > 0
            ? orcamento.prescricao.medicamentos
            : [{
                medicamento: orcamento.prescricao.medicamento,
                dosagem: orcamento.prescricao.dosagem,
                quantidade: orcamento.prescricao.quantidade,
            }];

        const osId = await prismaFive.sendOrderToProduction(pedidoId, {
            itens,
            tutor: orcamento.prescricao.tutor.nome,
            animal: orcamento.prescricao.animal.nome,
        });

        await prisma.pedido.update({
            where: { id: pedidoId },
            data: {
                status_producao: 'EM_PRODUCAO',
                data_producao: new Date(),
                observacoes: `OS PrismaFive: ${osId}`,
            },
        });
    } catch (error: any) {
        console.error('[PAGAMENTO] Falha ao enviar para produção:', error?.message);
        // O pedido fica em PAGAMENTO_CONFIRMADO para a operação tratar manualmente
    }

    const dataRetorno = new Date();
    dataRetorno.setDate(dataRetorno.getDate() + 3);
    await prisma.followUp.create({
        data: {
            pedido_id: pedidoId,
            mensagem: `Verificar status de produção - ${orcamento.prescricao.medicamento}`,
            data_contato: dataRetorno,
            realizado: false,
        },
    });

    await notificationService.notifyPaymentConfirmed(
        orcamento.prescricao.tutor.telefone,
        orcamento.prescricao.tutor.nome,
        orcamento.prescricao_id.slice(0, 8)
    );

    console.log(`[PAGAMENTO] ✅ Orçamento ${orcamentoId} confirmado, pedido ${pedidoId}`);
    return { confirmado: true, pedido_id: pedidoId };
}
