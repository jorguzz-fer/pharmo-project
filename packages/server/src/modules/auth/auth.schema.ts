import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token obrigatorio'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatorio'),
  nova_senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
