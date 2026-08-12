import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { gerarCobranca } from '../services/cobranca.service';
import { generatePrescriptionPdf } from '../services/pdf.service';

const prisma = new PrismaClient();

/** Esconde o meio do documento: "123.***.**9-00" */
function mascararCpf(cpf: string): string {
    const d = cpf.replace(/\D/g, '');
    if (d.length !== 11) return '***';
    return `${d.slice(0, 3)}.***.**${d.slice(8, 9)}-${d.slice(9)}`;
}

async function buscarPorToken(token: string) {
    return prisma.orcamento.findUnique({
        where: { token_publico: token },
        include: {
            prescricao: {
                include: {
                    tutor: true,
                    animal: true,
                    veterinario: true,
                    clinica: true,
                    medicamentos: true,
                },
            },
            pedido: true,
        },
    });
}

export class PublicoController {
    /**
     * GET /api/publico/orcamentos/:token
     * Página do tutor. Só devolve o necessário para ele reconhecer o pedido e
     * pagar — nada de CPF completo, endereço ou dados de outros pacientes.
     */
    async consultar(req: Request, res: Response) {
        const { token } = req.params;

        try {
            const orcamento = await buscarPorToken(token);

            if (!orcamento) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            const { prescricao } = orcamento;
            const medicamentos = prescricao.medicamentos.length > 0
                ? prescricao.medicamentos.map(m => ({
                    medicamento: m.medicamento,
                    forma_farmaceutica: m.forma_farmaceutica,
                    quantidade: m.quantidade,
                    observacoes: m.observacoes,
                    preco: Number(m.preco_sugestao ?? 0),
                }))
                : [{
                    medicamento: prescricao.medicamento,
                    forma_farmaceutica: prescricao.forma_farmaceutica,
                    quantidade: prescricao.quantidade,
                    observacoes: prescricao.observacoes,
                    preco: Number(orcamento.valor_total),
                }];

            return res.json({
                token,
                valor_total: Number(orcamento.valor_total),
                status_pagamento: orcamento.status_pagamento,
                data_pagamento: orcamento.data_pagamento,
                link_pagamento: orcamento.link_pagamento,
                status_pedido: orcamento.pedido?.status_producao ?? null,
                tutor: {
                    nome: prescricao.tutor.nome,
                    cpf: mascararCpf(prescricao.tutor.cpf),
                },
                animal: {
                    nome: prescricao.animal.nome,
                    especie: prescricao.animal.especie,
                    peso: prescricao.animal.peso,
                },
                veterinario: {
                    nome: prescricao.veterinario.nome,
                    crv: prescricao.veterinario.crv,
                },
                clinica: prescricao.clinica
                    ? { nome: prescricao.clinica.nome_fantasia, telefone: prescricao.clinica.telefone }
                    : null,
                doenca: prescricao.doenca,
                medicamentos,
                emitida_em: prescricao.created_at,
            });
        } catch (error) {
            console.error('❌ Erro na consulta pública:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /api/publico/orcamentos/:token/pagar
     * Devolve o link de checkout, criando a cobrança na primeira vez.
     */
    async pagar(req: Request, res: Response) {
        const { token } = req.params;

        try {
            const orcamento = await prisma.orcamento.findUnique({
                where: { token_publico: token },
                select: { id: true },
            });

            if (!orcamento) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            const resultado = await gerarCobranca(orcamento.id);

            if (!resultado.ok) {
                return res.status(resultado.status).json({ error: resultado.motivo });
            }

            return res.json({ link: resultado.link });
        } catch (error) {
            console.error('❌ Erro ao gerar cobrança pública:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /** GET /api/publico/orcamentos/:token/pdf — a receita para o tutor baixar */
    async pdf(req: Request, res: Response) {
        const { token } = req.params;

        try {
            const orcamento = await buscarPorToken(token);

            if (!orcamento) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            const { prescricao } = orcamento;

            let logoBuffer: Buffer | null = null;
            if (prescricao.clinica?.logo_url) {
                try {
                    const resp = await fetch(prescricao.clinica.logo_url);
                    if (resp.ok) logoBuffer = Buffer.from(await resp.arrayBuffer());
                } catch {
                    // segue sem logo
                }
            }

            const medicamentos = prescricao.medicamentos.length > 0
                ? prescricao.medicamentos
                : [{
                    medicamento: prescricao.medicamento,
                    codigo_medicamento: null,
                    dosagem: prescricao.dosagem,
                    forma_farmaceutica: prescricao.forma_farmaceutica,
                    quantidade: prescricao.quantidade,
                    observacoes: prescricao.observacoes,
                }];

            const pdf = await generatePrescriptionPdf(
                {
                    id: prescricao.id,
                    created_at: prescricao.created_at,
                    observacoes: prescricao.observacoes,
                    veterinario: {
                        nome: prescricao.veterinario.nome,
                        crv: prescricao.veterinario.crv,
                        email: prescricao.veterinario.email,
                        telefone: prescricao.veterinario.telefone,
                    },
                    tutor: {
                        nome: prescricao.tutor.nome,
                        cpf: prescricao.tutor.cpf,
                        telefone: prescricao.tutor.telefone,
                        endereco: prescricao.tutor.endereco,
                    },
                    animal: {
                        nome: prescricao.animal.nome,
                        especie: prescricao.animal.especie,
                        raca: prescricao.animal.raca,
                        peso: prescricao.animal.peso,
                    },
                    clinica: prescricao.clinica,
                    medicamentos,
                } as any,
                logoBuffer
            );

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="receita-${prescricao.animal.nome}.pdf"`);
            return res.send(pdf);
        } catch (error) {
            console.error('❌ Erro ao gerar PDF público:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
