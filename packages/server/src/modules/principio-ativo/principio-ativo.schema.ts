import { z } from 'zod';

export const createPrincipioAtivoSchema = z.object({
  nome_padronizado: z.string().min(2, 'Nome obrigatorio'),
  classe_terapeutica: z.string().optional(),
  controlado: z.boolean().default(false),
  descricao_palatavel: z.string().optional(),
  observacoes: z.string().optional(),
  // Concentracoes iniciais (opcional)
  concentracoes: z.array(z.object({
    valor: z.number().positive('Valor deve ser positivo'),
    unidade: z.enum(['MG', 'G', 'ML', 'MCG', 'UI']).default('MG'),
    forma_farmaceutica: z.enum([
      'CAPSULA', 'COMPRIMIDO', 'LIQUIDO', 'BISCOITO',
      'PASTA', 'POMADA', 'OLEO', 'INJETAVEL', 'OUTRO',
    ]).default('CAPSULA'),
  })).optional(),
  // Faixas terapeuticas iniciais (opcional)
  faixas: z.array(z.object({
    especie: z.enum(['CANINO', 'FELINO', 'EQUINO', 'BOVINO', 'AVIAR', 'SILVESTRE', 'OUTRO']),
    peso_min_kg: z.number().positive().optional(),
    peso_max_kg: z.number().positive().optional(),
    dose_min_mg_kg: z.number().positive('Dose minima obrigatoria'),
    dose_max_mg_kg: z.number().positive('Dose maxima obrigatoria'),
    frequencia_horas: z.number().int().positive().optional(),
    observacoes: z.string().optional(),
    fonte_referencia: z.string().optional(),
  })).optional(),
});

export const updatePrincipioAtivoSchema = z.object({
  nome_padronizado: z.string().min(2).optional(),
  classe_terapeutica: z.string().optional(),
  controlado: z.boolean().optional(),
  descricao_palatavel: z.string().optional(),
  observacoes: z.string().optional(),
});

export const createConcentracaoSchema = z.object({
  valor: z.number().positive('Valor deve ser positivo'),
  unidade: z.enum(['MG', 'G', 'ML', 'MCG', 'UI']).default('MG'),
  forma_farmaceutica: z.enum([
    'CAPSULA', 'COMPRIMIDO', 'LIQUIDO', 'BISCOITO',
    'PASTA', 'POMADA', 'OLEO', 'INJETAVEL', 'OUTRO',
  ]).default('CAPSULA'),
});

export const createFaixaSchema = z.object({
  especie: z.enum(['CANINO', 'FELINO', 'EQUINO', 'BOVINO', 'AVIAR', 'SILVESTRE', 'OUTRO']),
  peso_min_kg: z.number().positive().optional(),
  peso_max_kg: z.number().positive().optional(),
  dose_min_mg_kg: z.number().positive('Dose minima obrigatoria'),
  dose_max_mg_kg: z.number().positive('Dose maxima obrigatoria'),
  frequencia_horas: z.number().int().positive().optional(),
  observacoes: z.string().optional(),
  fonte_referencia: z.string().optional(),
});

export type CreatePrincipioAtivoInput = z.infer<typeof createPrincipioAtivoSchema>;
export type UpdatePrincipioAtivoInput = z.infer<typeof updatePrincipioAtivoSchema>;
export type CreateConcentracaoInput = z.infer<typeof createConcentracaoSchema>;
export type CreateFaixaInput = z.infer<typeof createFaixaSchema>;
