import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import {
    searchMedications,
    searchPrincipiosAtivos,
    generateRecommendation,
    SEM_BASE_TOKEN,
    MENSAGEM_ENCAMINHAMENTO,
} from '../services/ai-assistant.service';
import { whatsappService } from '../services/whatsapp.service';

const prisma = new PrismaClient();

/**
 * Avisa o farmacêutico responsável por WhatsApp sobre uma dúvida sem base.
 * Nunca derruba a requisição: a falha no aviso é registrada, e o veterinário
 * continua recebendo a mensagem de encaminhamento.
 */
async function avisarFarmaceutico(pergunta: string, veterinarioId?: string) {
    const destino = process.env.PHARMACIST_WHATSAPP;
    if (!destino) {
        console.warn('[ASSISTENTE] PHARMACIST_WHATSAPP não configurado — dúvida não encaminhada:', pergunta);
        return;
    }

    let nomeVet: string | undefined;
    if (veterinarioId) {
        const vet = await prisma.veterinario
            .findUnique({ where: { id: veterinarioId }, select: { nome: true, crv: true } })
            .catch(() => null);
        if (vet) nomeVet = `${vet.nome} (CRMV ${vet.crv})`;
    }

    const resultado = await whatsappService.sendPharmacistAlert(destino, pergunta, nomeVet);
    if (!resultado.enviado) {
        console.error('[ASSISTENTE] Falha ao avisar farmacêutico:', resultado.motivo);
    }
}

export class AiAssistantController {
    async consultar(req: Request, res: Response) {
        const schema = z.object({
            pergunta: z.string().min(5, 'A pergunta deve ter pelo menos 5 caracteres'),
            species: z.enum(['cão', 'gato']).optional(),
        });

        try {
            const { pergunta, species } = schema.parse(req.body);

            // Step 1: Busca em paralelo: fórmulas magistrais + princípios ativos
            const [medicamentos, principiosAtivos] = await Promise.all([
                searchMedications(pergunta),
                searchPrincipiosAtivos(pergunta, species ?? null),
            ]);

            // Step 2: Filtra medicamentos que existem no catálogo de produtos
            const codigos = medicamentos.map(m => m.codigo);
            const produtosExistentes = await prisma.produto.findMany({
                where: { codigo: { in: codigos } },
                select: { codigo: true },
            });
            const codigosNoCatalogo = new Set(produtosExistentes.map(p => p.codigo));
            const medicamentosFiltrados = medicamentos.filter(m => codigosNoCatalogo.has(m.codigo));

            // Step 3: Generate AI recommendation with combined context
            const resposta = await generateRecommendation(pergunta, medicamentosFiltrados, principiosAtivos);

            // Step 4: Sem base suficiente, a IA não arrisca uma posologia — a dúvida
            // vai para o farmacêutico e o veterinário recebe o aviso de encaminhamento.
            const semMaterial = medicamentosFiltrados.length === 0 && principiosAtivos.length === 0;
            if (resposta.includes(SEM_BASE_TOKEN) || semMaterial) {
                await avisarFarmaceutico(pergunta, req.userId);
                return res.json({
                    resposta: MENSAGEM_ENCAMINHAMENTO,
                    encaminhado_farmaceutico: true,
                    medicamentos: [],
                    principios_ativos: [],
                });
            }

            return res.json({
                resposta,
                encaminhado_farmaceutico: false,
                medicamentos: medicamentosFiltrados.map(m => ({
                    id: m.id,
                    codigo: m.codigo,
                    nome: m.nome,
                    linha_terapeutica: m.linha_terapeutica,
                    forma_farmaceutica: m.forma_farmaceutica,
                    indicacao: m.indicacao,
                    modo_uso: m.modo_uso,
                    especie: m.especie,
                })),
                principios_ativos: principiosAtivos.map(p => ({
                    id: p.id,
                    principio_ativo: p.principio_ativo,
                    doenca: p.doenca,
                    posologia: p.posologia,
                    species: p.species,
                    route_hint: p.route_hint,
                    contraindicacoes: p.contraindicacoes,
                })),
            });
        } catch (error: any) {
            console.error('❌ AI Assistant error:', error);

            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: error.issues });
            }

            if (error.message?.includes('OPENAI_API_KEY')) {
                return res.status(503).json({
                    error: 'Assistente IA não configurado. Contate o administrador.',
                });
            }

            return res.status(500).json({
                error: 'Erro ao consultar o assistente. Tente novamente.',
            });
        }
    }
}
