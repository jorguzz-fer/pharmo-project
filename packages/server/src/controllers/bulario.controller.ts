import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BularioController {
    async search(req: Request, res: Response) {
        const { term } = req.query;

        if (!term || typeof term !== 'string') {
            return res.status(400).json({ error: 'Termo de busca obrigatório' });
        }

        try {
            const results = await prisma.bulario.findMany({
                where: {
                    OR: [
                        { doenca: { contains: term, mode: 'insensitive' } },
                        { principio_ativo: { contains: term, mode: 'insensitive' } },
                    ],
                },
                take: 10,
            });

            return res.json(results);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async seedBularioMagistral(req: Request, res: Response) {
        const { medications, adminKey } = req.body;

        // Simple admin key protection
        if (adminKey !== process.env.JWT_SECRET) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        if (!Array.isArray(medications) || medications.length === 0) {
            return res.status(400).json({ error: 'Array de medicamentos obrigatório' });
        }

        try {
            let inserted = 0;
            let errors = 0;
            const errorDetails: string[] = [];

            for (const med of medications) {
                try {
                    await prisma.bularioMagistral.upsert({
                        where: { codigo: med.codigo },
                        update: {
                            nome: med.nome,
                            linha_terapeutica: med.linha_terapeutica,
                            forma_farmaceutica: med.forma_farmaceutica,
                            indicacao: med.indicacao,
                            diferencial: med.diferencial || null,
                            formula: med.formula,
                            modo_uso: med.modo_uso,
                            especie: med.especie,
                            observacoes: med.observacoes || null,
                            controlado: med.controlado || false,
                        },
                        create: {
                            codigo: med.codigo,
                            nome: med.nome,
                            linha_terapeutica: med.linha_terapeutica,
                            forma_farmaceutica: med.forma_farmaceutica,
                            indicacao: med.indicacao,
                            diferencial: med.diferencial || null,
                            formula: med.formula,
                            modo_uso: med.modo_uso,
                            especie: med.especie,
                            observacoes: med.observacoes || null,
                            controlado: med.controlado || false,
                        },
                    });
                    inserted++;
                } catch (err: any) {
                    errors++;
                    errorDetails.push(`${med.codigo}: ${err.message}`);
                }
            }

            return res.json({
                success: true,
                inserted,
                errors,
                errorDetails: errorDetails.slice(0, 10),
            });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
