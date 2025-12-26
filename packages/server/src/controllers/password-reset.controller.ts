import { Request, Response } from 'express';
import { PasswordResetService } from '../services/password-reset.service';
import { z } from 'zod';

const passwordResetService = new PasswordResetService();

export class PasswordResetController {
    // Solicitar recuperação de senha
    async requestReset(req: Request, res: Response) {
        const schema = z.object({
            email: z.string().email(),
            userType: z.enum(['veterinario', 'admin'])
        });

        try {
            const { email, userType } = schema.parse(req.body);
            const result = await passwordResetService.requestPasswordReset(email, userType);
            return res.json(result);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
            }
            console.error('Error requesting password reset:', error);
            return res.status(500).json({ error: 'Erro ao solicitar recuperação de senha' });
        }
    }

    // Validar token
    async validateToken(req: Request, res: Response) {
        try {
            const { token } = req.params;
            const result = await passwordResetService.validateToken(token);

            if (!result.valid) {
                return res.status(400).json({ valid: false, error: result.error });
            }

            return res.json({ valid: true });
        } catch (error) {
            console.error('Error validating token:', error);
            return res.status(500).json({ error: 'Erro ao validar token' });
        }
    }

    // Redefinir senha
    async resetPassword(req: Request, res: Response) {
        const schema = z.object({
            token: z.string(),
            newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
        });

        try {
            const { token, newPassword } = schema.parse(req.body);
            const result = await passwordResetService.resetPassword(token, newPassword);
            return res.json(result);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
            }
            console.error('Error resetting password:', error);
            return res.status(400).json({ error: error.message || 'Erro ao redefinir senha' });
        }
    }
}
