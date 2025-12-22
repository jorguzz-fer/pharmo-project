import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export class AnimalController {
    async create(req: Request, res: Response) {
        const schema = z.object({
            tutor_id: z.string().uuid(),
            nome: z.string(),
            especie: z.string(),
            raca: z.string().optional(),
            peso: z.number().positive(),
            data_nascimento: z.string().optional(), // ISO String
        });

        try {
            const data = schema.parse(req.body);

            const animal = await prisma.animal.create({
                data: {
                    ...data,
                    data_nascimento: data.data_nascimento ? new Date(data.data_nascimento) : undefined,
                },
            });

            return res.status(201).json(animal);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: (error as any).errors });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async listByTutor(req: Request, res: Response) {
        const { tutorId } = req.params;

        try {
            const animals = await prisma.animal.findMany({
                where: { tutor_id: tutorId },
            });
            return res.json(animals);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
