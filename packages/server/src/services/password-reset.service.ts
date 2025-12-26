import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { EmailService } from './email.service';

const prisma = new PrismaClient();
const emailService = new EmailService();

export class PasswordResetService {
    // Gerar token único
    private generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    // Solicitar recuperação de senha
    async requestPasswordReset(email: string, userType: 'veterinario' | 'admin') {
        // Verificar se usuário existe
        let userExists = false;

        if (userType === 'veterinario') {
            const vet = await prisma.veterinario.findUnique({ where: { email } });
            userExists = !!vet;
        } else {
            const admin = await prisma.usuarioAdmin.findUnique({ where: { email } });
            userExists = !!admin;
        }

        if (!userExists) {
            // Por segurança, não revelar se o email existe ou não
            return { success: true, message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
        }

        // Invalidar tokens anteriores
        await prisma.passwordResetToken.updateMany({
            where: {
                email,
                user_type: userType,
                used: false
            },
            data: { used: true }
        });

        // Criar novo token (válido por 1 hora)
        const token = this.generateToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                user_type: userType,
                expires_at: expiresAt
            }
        });

        // Enviar email
        await emailService.sendPasswordResetEmail(email, token, userType);

        return { success: true, message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
    }

    // Validar token
    async validateToken(token: string) {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken) {
            return { valid: false, error: 'Token inválido' };
        }

        if (resetToken.used) {
            return { valid: false, error: 'Token já foi utilizado' };
        }

        if (new Date() > resetToken.expires_at) {
            return { valid: false, error: 'Token expirado' };
        }

        return { valid: true, email: resetToken.email, userType: resetToken.user_type };
    }

    // Redefinir senha
    async resetPassword(token: string, newPassword: string) {
        // Validar token
        const validation = await this.validateToken(token);

        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar senha
        if (validation.userType === 'veterinario') {
            await prisma.veterinario.update({
                where: { email: validation.email },
                data: { senha_hash: hashedPassword }
            });
        } else {
            await prisma.usuarioAdmin.update({
                where: { email: validation.email },
                data: { senha_hash: hashedPassword }
            });
        }

        // Marcar token como usado
        await prisma.passwordResetToken.update({
            where: { token },
            data: {
                used: true,
                used_at: new Date()
            }
        });

        return { success: true, message: 'Senha redefinida com sucesso' };
    }

    // Limpar tokens expirados (executar periodicamente)
    async cleanupExpiredTokens() {
        const result = await prisma.passwordResetToken.deleteMany({
            where: {
                OR: [
                    { expires_at: { lt: new Date() } },
                    { used: true, used_at: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7 dias
                ]
            }
        });

        return { deleted: result.count };
    }
}
