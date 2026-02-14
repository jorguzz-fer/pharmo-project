import { z } from 'zod';

export const createTenantSchema = z.object({
  nome_fantasia: z.string().min(2, 'Nome fantasia obrigatorio'),
  razao_social: z.string().min(2, 'Razao social obrigatoria'),
  cnpj: z.string().min(14, 'CNPJ invalido').max(18),
  inscricao_estadual: z.string().optional(),
  email: z.string().email('Email invalido'),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  // Admin inicial da clinica
  admin_nome: z.string().min(2, 'Nome do admin obrigatorio'),
  admin_email: z.string().email('Email do admin invalido'),
  admin_senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

export const updateTenantSchema = z.object({
  nome_fantasia: z.string().min(2).optional(),
  razao_social: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

export const updateBrandingSchema = z.object({
  logo_url: z.string().url().optional(),
  cor_primaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor invalida').optional(),
  cor_secundaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor invalida').optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
