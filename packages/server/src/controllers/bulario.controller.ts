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
}
