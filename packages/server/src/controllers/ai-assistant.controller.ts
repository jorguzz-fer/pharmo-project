import { Request, Response } from 'express';
import { z } from 'zod';
import { searchMedications, generateRecommendation } from '../services/ai-assistant.service';

export class AiAssistantController {
    async consultar(req: Request, res: Response) {
        const schema = z.object({
            pergunta: z.string().min(5, 'A pergunta deve ter pelo menos 5 caracteres'),
        });

        try {
            const { pergunta } = schema.parse(req.body);

            // Step 1: Search for relevant medications in DB
            const medicamentos = await searchMedications(pergunta);

            // Step 2: Generate AI recommendation with context
            const resposta = await generateRecommendation(pergunta, medicamentos);

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
