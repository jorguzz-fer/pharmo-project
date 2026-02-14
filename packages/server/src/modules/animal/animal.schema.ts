import { z } from 'zod';

export const createAnimalSchema = z.object({
  tutor_id: z.string().uuid('ID do tutor invalido'),
  nome: z.string().min(1, 'Nome obrigatorio'),
  especie: z.enum(['CANINO', 'FELINO', 'EQUINO', 'BOVINO', 'AVIAR', 'SILVESTRE', 'OUTRO']),
  raca: z.string().optional(),
  sexo: z.enum(['MACHO', 'FEMEA']).optional(),
  peso_kg: z.number().positive('Peso deve ser positivo').optional(),
  data_nascimento: z.string().datetime().optional(),
  observacoes: z.string().optional(),
});

export const updateAnimalSchema = z.object({
  nome: z.string().min(1).optional(),
  raca: z.string().optional(),
  sexo: z.enum(['MACHO', 'FEMEA']).optional(),
  peso_kg: z.number().positive().optional(),
  data_nascimento: z.string().datetime().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().optional(),
});

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>;
export type UpdateAnimalInput = z.infer<typeof updateAnimalSchema>;
