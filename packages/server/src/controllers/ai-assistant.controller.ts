import { Request, Response } from 'express';
import { z } from 'zod';
import {
    searchMedications,
    searchPrincipiosAtivos,
    generateRecommendation,
} from '../services/ai-assistant.service';

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

            // Step 2: Generate AI recommendation with combined context
            const resposta = await generateRecommendation(pergunta, medicamentos, principiosAtivos);

            return res.json({
                resposta,
                medicamentos: medicamentos.map(m => ({
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
