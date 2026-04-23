import { Request, Response } from 'express';
import { z } from 'zod';
import { PrecificacaoService } from '../services/precificacao.service';

const precificacaoService = new PrecificacaoService();

const calcularSchema = z.object({
  ingredientes: z.array(z.object({
    codigo_interno: z.number().optional(),
    insumo_id: z.string().optional(),
    dosagem_mg: z.number().positive('Dosagem deve ser positiva'),
    quantidade: z.number().int().positive('Quantidade deve ser positiva'),
  })).min(1, 'Pelo menos 1 ingrediente é obrigatório'),
  forma_farmaceutica: z.string().min(1, 'Forma farmacêutica é obrigatória'),
  clinica_id: z.string().optional(),
});

export class PrecificacaoController {
  async calcular(req: Request, res: Response) {
    try {
      const parsed = calcularSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          detalhes: parsed.error.issues.map((i) => i.message),
        });
      }

      const resultado = await precificacaoService.calcular(parsed.data);

      // Se houve erros críticos (insumo não encontrado, forma proibida), retornar 422
      if (resultado.erros.length > 0) {
        return res.status(422).json(resultado);
      }

      return res.json(resultado);
    } catch (error: any) {
      console.error('Erro no cálculo de precificação:', error);
      return res.status(500).json({ error: 'Erro interno no cálculo de precificação' });
    }
  }
}
