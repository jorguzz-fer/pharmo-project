import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://app.pharmopet.com.br';

export class ClinicaAuthController {
    // Login de clínica
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            console.log('🔍 Clinic Login Attempt:', { email, passwordLength: password?.length });

            if (!email || !password) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios' });
            }

            // Buscar clínica por email
            const clinica = await prisma.clinica.findFirst({
                where: { email: email.toLowerCase() }
            });

            console.log('🔍 Clinic Found:', {
                found: !!clinica,
                id: clinica?.id,
                email: clinica?.email,
                hasSenhaHash: !!clinica?.senha_hash,
                status: clinica?.status
            });

            if (!clinica) {
                console.log('❌ Clinic not found for email:', email);
                return res.status(401).json({ error: 'Email ou senha inválidos' });
            }

            // Verificar se a clínica tem senha cadastrada
            if (!clinica.senha_hash) {
                console.log('❌ Clinic has no password hash');
                return res.status(401).json({
                    error: 'Senha não cadastrada. Entre em contato com o administrador.'
                });
            }

            // Verificar senha
            const isPasswordValid = await bcrypt.compare(password, clinica.senha_hash);
            console.log('🔍 Password validation:', { isPasswordValid });

            if (!isPasswordValid) {
                console.log('❌ Invalid password for clinic:', clinica.email);
                return res.status(401).json({ error: 'Email ou senha inválidos' });
            }

            // Verificar se a clínica está aprovada
            if (clinica.status !== 'APROVADA') {
                console.log('❌ Clinic not approved:', clinica.status);
                return res.status(403).json({
                    error: 'Clínica ainda não aprovada. Aguarde a aprovação do administrador.'
                });
            }

            console.log('✅ Login successful for clinic:', clinica.email);

            // Gerar token JWT
            const token = jwt.sign(
                {
                    id: clinica.id,
                    email: clinica.email,
                    role: 'CLINIC'
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Retornar dados da clínica e token
            res.json({
                token,
                user: {
                    id: clinica.id,
                    name: clinica.nome_fantasia,
                    email: clinica.email,
                    role: 'CLINIC'
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Erro ao fazer login' });
        }
    }

    // Solicitar recuperação de senha
    async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email é obrigatório' });
            }

            const clinica = await prisma.clinica.findFirst({
                where: { email: email.toLowerCase() }
            });

            // Por segurança, sempre retornar sucesso mesmo se o email não existir
            if (!clinica) {
                return res.json({
                    message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
                });
            }

            // Gerar token de recuperação
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

            // Salvar token no banco
            await prisma.clinica.update({
                where: { id: clinica.id },
                data: {
                    reset_token: resetToken,
                    reset_token_expires: resetTokenExpires
                }
            });

            // Enviar email
            const resetLink = `${FRONTEND_URL}/clinica/reset-password?token=${resetToken}`;

            try {
                await sendEmail({
                    to: clinica.email,
                    subject: 'Recuperação de Senha - PharmoPet',
                    html: `
                        <h2>Recuperação de Senha</h2>
                        <p>Olá, ${clinica.nome_fantasia}!</p>
                        <p>Você solicitou a recuperação de senha da sua conta.</p>
                        <p>Clique no link abaixo para redefinir sua senha:</p>
                        <p><a href="${resetLink}">${resetLink}</a></p>
                        <p>Este link expira em 1 hora.</p>
                        <p>Se você não solicitou esta recuperação, ignore este email.</p>
                        <br>
                        <p>Atenciosamente,<br>Equipe PharmoPet</p>
                    `
                });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                // Não falhar a requisição se o email não for enviado
            }

            res.json({
                message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: 'Erro ao processar solicitação' });
        }
    }

    // Redefinir senha
    async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;

            console.log('🔍 Reset Password Attempt:', {
                hasToken: !!token,
                tokenLength: token?.length,
                passwordLength: newPassword?.length
            });

            if (!token || !newPassword) {
                return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
            }

            // Buscar clínica pelo token
            const clinica = await prisma.clinica.findFirst({
                where: {
                    reset_token: token,
                    reset_token_expires: {
                        gte: new Date() // Token ainda válido
                    }
                }
            });

            console.log('🔍 Clinic found by token:', {
                found: !!clinica,
                id: clinica?.id,
                email: clinica?.email,
                tokenExpires: clinica?.reset_token_expires
            });

            if (!clinica) {
                console.log('❌ Token invalid or expired');
                return res.status(400).json({ error: 'Token inválido ou expirado' });
            }

            // Hash da nova senha
            const senha_hash = await bcrypt.hash(newPassword, 10);
            console.log('🔐 Password hashed, updating database...');

            // Atualizar senha e limpar token
            await prisma.clinica.update({
                where: { id: clinica.id },
                data: {
                    senha_hash,
                    reset_token: null,
                    reset_token_expires: null
                }
            });

            console.log('✅ Password reset successful for clinic:', clinica.email);
            console.log('📝 Hash saved (first 20 chars):', senha_hash.substring(0, 20) + '...');

            res.json({ message: 'Senha redefinida com sucesso!' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Erro ao redefinir senha' });
        }
    }

    // Definir senha inicial (para clínicas recém-aprovadas)
    async setInitialPassword(req: Request, res: Response) {
        try {
            const { clinicaId, password } = req.body;

            if (!clinicaId || !password) {
                return res.status(400).json({ error: 'ID da clínica e senha são obrigatórios' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
            }

            const clinica = await prisma.clinica.findUnique({
                where: { id: clinicaId }
            });

            if (!clinica) {
                return res.status(404).json({ error: 'Clínica não encontrada' });
            }

            // Hash da senha
            const senha_hash = await bcrypt.hash(password, 10);

            // Atualizar senha
            await prisma.clinica.update({
                where: { id: clinicaId },
                data: { senha_hash }
            });

            res.json({ message: 'Senha definida com sucesso!' });
        } catch (error) {
            console.error('Set initial password error:', error);
            res.status(500).json({ error: 'Erro ao definir senha' });
        }
    }
}

export const clinicaAuthController = new ClinicaAuthController();
