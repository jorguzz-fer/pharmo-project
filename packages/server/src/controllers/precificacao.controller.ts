import { Request, Response } from 'express';
import { z } from 'zod';
import { PrecificacaoService } from '../services/precificacao.service';

const precificacaoService = new PrecificacaoService();

// Condições informadas manualmente no simulador do admin. Cada campo é opcional:
// o que não vier continua saindo do cadastro da clínica.
const condicoesSchema = z.object({
  taxa_manipulacao: z.number().min(0, 'Taxa de manipulação não pode ser negativa').optional(),
  custo_embalagens: z.number().min(0, 'Taxa de embalagem não pode ser negativa').optional(),
  desconto_parceiro: z.number().min(0).max(1, 'Desconto deve estar entre 0 e 1 (0,4 = 40%)').optional(),
  adicional_entrega: z.number().min(0, 'Frete não pode ser negativo').optional(),
  adicional_biscoito: z.number().min(0, 'Adicional de biscoito não pode ser negativo').optional(),
});

const calcularSchema = z.object({
  ingredientes: z.array(z.object({
    codigo_interno: z.number().optional(),
    insumo_id: z.string().optional(),
    dosagem_mg: z.number().positive('Dosagem deve ser positiva'),
    quantidade: z.number().int().positive('Quantidade deve ser positiva'),
  })).min(1, 'Pelo menos 1 ingrediente é obrigatório'),
  forma_farmaceutica: z.string().min(1, 'Forma farmacêutica é obrigatória'),
  clinica_id: z.string().optional(),
  condicoes: condicoesSchema.optional(),
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

      // Sobrepor as condições comerciais é ferramenta de conferência do admin.
      // Para o veterinário o preço continua saindo do cadastro da clínica.
      if (parsed.data.condicoes && req.userRole !== 'ADMIN') {
        return res.status(403).json({
          error: 'Somente administradores podem informar condições comerciais manualmente',
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
