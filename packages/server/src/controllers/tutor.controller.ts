import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export class TutorController {
    async create(req: Request, res: Response) {
        const schema = z.object({
            nome: z.string().min(3),
            cpf: z.string().length(14), // XXX.XXX.XXX-XX
            email: z.string().email().optional(),
            telefone: z.string().optional(),
            endereco: z.string().optional(),
        });

        try {
            const data = schema.parse(req.body);

            const existingTutor = await prisma.tutor.findUnique({
                where: { cpf: data.cpf },
            });

            if (existingTutor) {
                return res.status(400).json({ error: 'Tutor já cadastrado com este CPF' });
            }

            const tutor = await prisma.tutor.create({ data });
            return res.status(201).json(tutor);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: (error as any).errors });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async search(req: Request, res: Response) {
        const { cpf, telefone } = req.query;

        if (!cpf && !telefone) {
            return res.status(400).json({ error: 'CPF ou Telefone necessários para busca' });
        }

        try {
            const tutor = await prisma.tutor.findFirst({
                where: {
                    OR: [
                        { cpf: cpf ? String(cpf) : undefined },
                        { telefone: telefone ? String(telefone) : undefined },
                    ],
                },
                include: {
                    animais: true,
                },
            });

            if (!tutor) {
                return res.status(404).json({ error: 'Tutor não encontrado' });
            }

            return res.json(tutor);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
