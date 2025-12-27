import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

export class AuthController {
    async loginVet(req: Request, res: Response) {
        console.log('🔵 Login attempt received:', { body: req.body });

        const schema = z.object({
            crv: z.string(),
            password: z.string(),
        });

        try {
            const { crv, password } = schema.parse(req.body);
            console.log('✅ Validation passed:', { crv });

            // Find vet
            const vet = await prisma.veterinario.findUnique({
                where: { crv },
            });
            console.log('🔍 Vet found:', vet ? 'YES' : 'NO');

            if (!vet) {
                console.log('❌ Vet not found');
                return res.status(401).json({ error: 'Veterinário não encontrado' });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, vet.senha_hash);
            console.log('🔑 Password valid:', isValidPassword);

            if (!isValidPassword) {
                console.log('❌ Invalid password');
                return res.status(401).json({ error: 'Senha incorreta' });
            }

            // Generate token
            const token = jwt.sign(
                { id: vet.id, role: 'VET' },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1d' }
            );
            console.log('✅ Login successful');

            return res.json({
                user: {
                    id: vet.id,
                    name: vet.nome,
                    crv: vet.crv,
                    email: vet.email,
                    role: 'VET'
                },
                token,
            });

        } catch (error) {
            console.error('❌ Login error:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: error.issues });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async loginAdmin(req: Request, res: Response) {
        const schema = z.object({
            email: z.string().email(),
            password: z.string(),
        });

        try {
            const { email, password } = schema.parse(req.body);

            const admin = await prisma.usuarioAdmin.findUnique({
                where: { email },
            });

            if (!admin) {
                return res.status(401).json({ error: 'Administrador não encontrado' });
            }

            const isValidPassword = await bcrypt.compare(password, admin.senha_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Senha incorreta' });
            }

            const token = jwt.sign(
                { id: admin.id, role: admin.role },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1d' }
            );

            return res.json({
                user: {
                    id: admin.id,
                    name: admin.nome,
                    email: admin.email,
                    role: admin.role
                },
                token,
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: (error as any).errors });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
