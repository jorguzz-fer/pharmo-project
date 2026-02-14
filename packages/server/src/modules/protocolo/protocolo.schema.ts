import { z } from 'zod';

export const createProtocoloSchema = z.object({
  codigo: z.string().min(1, 'Codigo obrigatorio'),
  nome: z.string().min(2, 'Nome obrigatorio'),
  descricao: z.string().optional(),
  especie_alvo: z.enum(['CANINO', 'FELINO', 'EQUINO', 'BOVINO', 'AVIAR', 'SILVESTRE', 'OUTRO']).optional(),
  indicacao: z.string().optional(),
  itens: z.array(z.object({
    principio_ativo_id: z.string().uuid(),
    concentracao_id: z.string().uuid().optional(),
    dose_mg_kg: z.number().positive(),
    frequencia_horas: z.number().int().positive(),
    duracao_dias: z.number().int().positive(),
    observacoes: z.string().optional(),
    ordem: z.number().int().default(0),
  })).min(1, 'Protocolo precisa de pelo menos 1 item'),
});

export const updateProtocoloSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  especie_alvo: z.enum(['CANINO', 'FELINO', 'EQUINO', 'BOVINO', 'AVIAR', 'SILVESTRE', 'OUTRO']).optional(),
  indicacao: z.string().optional(),
  ativo: z.boolean().optional(),
});

export type CreateProtocoloInput = z.infer<typeof createProtocoloSchema>;
export type UpdateProtocoloInput = z.infer<typeof updateProtocoloSchema>;
