import { z } from 'zod';

export const createPrescricaoSchema = z.object({
  tutor_id: z.string().uuid(),
  animal_id: z.string().uuid(),
  protocolo_id: z.string().uuid().optional(), // Modo A
  diagnostico: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    principio_ativo_id: z.string().uuid(),
    concentracao_id: z.string().uuid().optional(),
    dose_mg_kg: z.number().positive('Dose deve ser positiva'),
    frequencia_horas: z.number().int().positive('Frequencia deve ser positiva'),
    duracao_dias: z.number().int().positive('Duracao deve ser positiva'),
    forma_farmaceutica: z.enum([
      'CAPSULA', 'COMPRIMIDO', 'LIQUIDO', 'BISCOITO',
      'PASTA', 'POMADA', 'OLEO', 'INJETAVEL', 'OUTRO',
    ]).default('CAPSULA'),
    observacoes: z.string().optional(),
    ordem: z.number().int().default(0),
  })).min(1, 'Prescricao precisa de pelo menos 1 item'),
});

export const updatePrescricaoSchema = z.object({
  diagnostico: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    principio_ativo_id: z.string().uuid(),
    concentracao_id: z.string().uuid().optional(),
    dose_mg_kg: z.number().positive(),
    frequencia_horas: z.number().int().positive(),
    duracao_dias: z.number().int().positive(),
    forma_farmaceutica: z.enum([
      'CAPSULA', 'COMPRIMIDO', 'LIQUIDO', 'BISCOITO',
      'PASTA', 'POMADA', 'OLEO', 'INJETAVEL', 'OUTRO',
    ]).default('CAPSULA'),
    observacoes: z.string().optional(),
    ordem: z.number().int().default(0),
  })).optional(),
});

export const aceiteForaFaixaSchema = z.object({
  itens_aceite: z.array(z.object({
    prescricao_item_id: z.string().uuid(),
    motivo_aceite: z.string().min(10, 'Motivo deve ter no minimo 10 caracteres'),
  })).min(1, 'Pelo menos 1 item de aceite obrigatorio'),
});

export const calcularPreviewSchema = z.object({
  animal_id: z.string().uuid(),
  itens: z.array(z.object({
    principio_ativo_id: z.string().uuid(),
    dose_mg_kg: z.number().positive(),
    frequencia_horas: z.number().int().positive(),
    duracao_dias: z.number().int().positive(),
  })).min(1),
});

export type CreatePrescricaoInput = z.infer<typeof createPrescricaoSchema>;
export type UpdatePrescricaoInput = z.infer<typeof updatePrescricaoSchema>;
export type AceiteForaFaixaInput = z.infer<typeof aceiteForaFaixaSchema>;
export type CalcularPreviewInput = z.infer<typeof calcularPreviewSchema>;
