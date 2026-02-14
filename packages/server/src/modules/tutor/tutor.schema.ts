import { z } from 'zod';

export const createTutorSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatorio'),
  cpf: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
});

export const updateTutorSchema = createTutorSchema.partial();

export type CreateTutorInput = z.infer<typeof createTutorSchema>;
export type UpdateTutorInput = z.infer<typeof updateTutorSchema>;
