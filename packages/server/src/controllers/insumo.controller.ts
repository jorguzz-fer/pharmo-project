import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InsumoController {
  // Buscar insumos (com filtro de texto e disponibilidade)
  async buscar(req: Request, res: Response) {
    try {
      const { busca, page = '1', limit = '20', somente_disponivel } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = { ativo: true };

      if (busca && (busca as string).trim().length >= 2) {
        const term = (busca as string).trim();
        // Tenta buscar por código numérico
        const codigoNum = parseInt(term);
        if (!isNaN(codigoNum)) {
          where.codigo_interno = codigoNum;
        } else {
          where.descricao = { contains: term, mode: 'insensitive' };
        }
      }

      if (somente_disponivel === 'true') {
        where.estoque = { gt: 0 };
      }

      const [data, total] = await Promise.all([
        prisma.insumoFarmaceutico.findMany({
          where,
          orderBy: { descricao: 'asc' },
          skip,
          take: limitNum,
          include: {
            regras_excecao: {
              include: { forma: { select: { id: true, nome: true } } },
            },
          },
        }),
        prisma.insumoFarmaceutico.count({ where }),
      ]);

      return res.json({
        data: data.map((i) => ({
          ...i,
          valor_custo: Number(i.valor_custo),
          custo_referencia: Number(i.custo_referencia),
          markup: Number(i.markup),
          estoque: Number(i.estoque),
          custo_efetivo: Math.max(Number(i.valor_custo), Number(i.custo_referencia)),
          disponivel: Number(i.estoque) > 0,
          formas_proibidas: i.regras_excecao.map((r) => r.forma.nome),
        })),
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error: any) {
      console.error('Erro ao buscar insumos:', error);
      return res.status(500).json({ error: 'Erro ao buscar insumos' });
    }
  }

  // Buscar por ID
  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const insumo = await prisma.insumoFarmaceutico.findUnique({
        where: { id },
        include: {
          regras_excecao: {
            include: { forma: { select: { id: true, nome: true } } },
          },
        },
      });
      if (!insumo) return res.status(404).json({ error: 'Insumo não encontrado' });

      return res.json({
        ...insumo,
        valor_custo: Number(insumo.valor_custo),
        custo_referencia: Number(insumo.custo_referencia),
        markup: Number(insumo.markup),
        estoque: Number(insumo.estoque),
        custo_efetivo: Math.max(Number(insumo.valor_custo), Number(insumo.custo_referencia)),
        disponivel: Number(insumo.estoque) > 0,
        formas_proibidas: insumo.regras_excecao.map((r) => r.forma.nome),
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao buscar insumo' });
    }
  }
}

export class FormaFarmaceuticaController {
  // Listar todas as formas ativas
  async listar(_req: Request, res: Response) {
    try {
      const formas = await prisma.formaFarmaceutica.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' },
      });
      return res.json({ data: formas });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao listar formas farmacêuticas' });
    }
  }
}
