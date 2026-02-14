import { z } from 'zod';

export const createUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatorio'),
  email: z.string().email('Email invalido'),
  senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  role: z.enum(['ADMIN_CLINICA', 'VETERINARIO', 'RECEPCIONISTA', 'FARMACEUTICO']),
  // Se role = VETERINARIO, dados profissionais
  veterinario: z.object({
    crmv: z.string().min(1, 'CRMV obrigatorio'),
    uf_crmv: z.string().length(2, 'UF deve ter 2 caracteres'),
    cpf: z.string().optional(),
    telefone: z.string().optional(),
    especialidades: z.array(z.string()).optional(),
  }).optional(),
});

export const updateUsuarioSchema = z.object({
  nome: z.string().min(2).optional(),
  role: z.enum(['ADMIN_CLINICA', 'VETERINARIO', 'RECEPCIONISTA', 'FARMACEUTICO']).optional(),
  ativo: z.boolean().optional(),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
