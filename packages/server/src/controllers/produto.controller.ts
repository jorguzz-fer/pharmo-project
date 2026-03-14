import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProdutoController {
  /**
   * GET /api/produtos
   * Lista produtos com busca por nome ou código
   * Query params: busca, page, limit
   */
  async listar(req: Request, res: Response) {
    try {
      const { busca, page = '1', limit = '50' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
      const skip = (pageNum - 1) * limitNum;

      const where: any = { ativo: true };

      if (busca && typeof busca === 'string' && busca.trim().length >= 2) {
        where.OR = [
          { nome: { contains: busca.trim(), mode: 'insensitive' } },
          { codigo: { contains: busca.trim(), mode: 'insensitive' } },
        ];
      }

      const [produtos, total] = await Promise.all([
        prisma.produto.findMany({
          where,
          orderBy: { nome: 'asc' },
          skip,
          take: limitNum,
        }),
        prisma.produto.count({ where }),
      ]);

      res.json({
        data: produtos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      res.status(500).json({ error: 'Erro ao listar produtos' });
    }
  }

  /**
   * GET /api/produtos/:id
   * Busca produto por ID
   */
  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const produto = await prisma.produto.findUnique({
        where: { id },
      });

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      res.json({ data: produto });
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({ error: 'Erro ao buscar produto' });
    }
  }
}
