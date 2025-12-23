import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export class TutorController {
    async create(req: Request, res: Response) {
        const schema = z.object({
            nome: z.string().min(3),
            cpf: z.string().min(11).max(14), // Accept unformatted (11) or formatted (14)
            email: z.string().email().optional().or(z.literal('')),
            telefone: z.string().optional(),
            endereco: z.string().optional(),
        });

        try {
            const data = schema.parse(req.body);

            // Clean CPF (remove non-digits)
            const cleanCpf = data.cpf.replace(/\D/g, '');

            const existingTutor = await prisma.tutor.findUnique({
                where: { cpf: cleanCpf }, // Check against clean CPF
            });

            if (existingTutor) {
                return res.status(400).json({ error: 'Tutor já cadastrado com este CPF' });
            }

            // Save with cleaned CPF
            const tutor = await prisma.tutor.create({
                data: {
                    ...data,
                    cpf: cleanCpf
                }
            });
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
