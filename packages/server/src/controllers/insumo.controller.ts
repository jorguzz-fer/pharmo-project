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

  // Listar controlados
  async listarControlados(req: Request, res: Response) {
    try {
      const data = await prisma.insumoFarmaceutico.findMany({
        where: { controlado: true, ativo: true },
        orderBy: { descricao: 'asc' },
        include: {
          regras_excecao: {
            include: { forma: { select: { id: true, nome: true } } },
          },
        },
      });

      return res.json({
        data: data.map((i) => ({
          id: i.id,
          codigo_interno: i.codigo_interno,
          descricao: i.descricao,
          lista_controle: i.lista_controle,
          valor_custo: Number(i.valor_custo),
          custo_referencia: Number(i.custo_referencia),
          markup: Number(i.markup),
          un_manipulacao: i.un_manipulacao,
          estoque: Number(i.estoque),
          disponivel: Number(i.estoque) > 0,
          formas_proibidas: i.regras_excecao.map((r) => r.forma.nome),
        })),
        total: data.length,
      });
    } catch (error: any) {
      console.error('Erro ao listar controlados:', error);
      return res.status(500).json({ error: 'Erro ao listar controlados' });
    }
  }

  // Listar regras de exceção
  async listarExcecoes(req: Request, res: Response) {
    try {
      const data = await prisma.regraExcecao.findMany({
        include: {
          insumo: {
            select: { id: true, codigo_interno: true, descricao: true },
          },
          forma: {
            select: { id: true, nome: true },
          },
        },
        orderBy: { insumo: { descricao: 'asc' } },
      });

      return res.json({
        data: data.map((r) => ({
          id: r.id,
          insumo_codigo: r.insumo.codigo_interno,
          insumo_descricao: r.insumo.descricao,
          forma_nome: r.forma.nome,
          descricao: r.descricao,
        })),
        total: data.length,
      });
    } catch (error: any) {
      console.error('Erro ao listar exceções:', error);
      return res.status(500).json({ error: 'Erro ao listar exceções' });
    }
  }

  // Marcar/desmarcar controlado
  async toggleControlado(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { controlado, lista_controle } = req.body;

      const insumo = await prisma.insumoFarmaceutico.update({
        where: { id },
        data: {
          controlado: !!controlado,
          lista_controle: controlado ? (lista_controle || null) : null,
        },
      });

      return res.json({
        id: insumo.id,
        codigo_interno: insumo.codigo_interno,
        descricao: insumo.descricao,
        controlado: insumo.controlado,
        lista_controle: insumo.lista_controle,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar controlado:', error);
      return res.status(500).json({ error: 'Erro ao atualizar controlado' });
    }
  }

  // Adicionar regra de exceção
  async adicionarExcecao(req: Request, res: Response) {
    try {
      const { insumo_id, forma_id, descricao } = req.body;

      const existing = await prisma.regraExcecao.findUnique({
        where: {
          insumo_farmaceutico_id_forma_farmaceutica_id: {
            insumo_farmaceutico_id: insumo_id,
            forma_farmaceutica_id: forma_id,
          },
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Regra já existe para este insumo e forma' });
      }

      const regra = await prisma.regraExcecao.create({
        data: {
          insumo_farmaceutico_id: insumo_id,
          forma_farmaceutica_id: forma_id,
          descricao: descricao || null,
        },
        include: {
          insumo: { select: { codigo_interno: true, descricao: true } },
          forma: { select: { nome: true } },
        },
      });

      return res.status(201).json(regra);
    } catch (error: any) {
      console.error('Erro ao adicionar exceção:', error);
      return res.status(500).json({ error: 'Erro ao adicionar exceção' });
    }
  }

  // Remover regra de exceção
  async removerExcecao(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.regraExcecao.delete({ where: { id } });
      return res.json({ message: 'Regra removida' });
    } catch (error: any) {
      console.error('Erro ao remover exceção:', error);
      return res.status(500).json({ error: 'Erro ao remover exceção' });
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
