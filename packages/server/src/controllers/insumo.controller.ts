import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Limites alinhados à precisão das colunas do schema, para o banco não estourar
// com um valor digitado errado no painel.
const listaControleSchema = z
  .string()
  .trim()
  .min(1, 'Informe a lista de controle')
  .max(30, 'Lista de controle muito longa')
  .transform((s) => s.toUpperCase());

const insumoBaseSchema = z.object({
  descricao: z.string().trim().min(2, 'Descrição é obrigatória').max(200),
  valor_custo: z.number().min(0, 'Custo não pode ser negativo').max(99999, 'Custo fora da faixa'),
  custo_referencia: z.number().min(0, 'Custo de referência não pode ser negativo').max(99999, 'Custo de referência fora da faixa'),
  markup: z.number().min(0, 'Markup não pode ser negativo').max(999999, 'Markup fora da faixa'),
  un_manipulacao: z.string().trim().min(1, 'Unidade de manipulação é obrigatória').max(10),
  estoque: z.number().min(0, 'Estoque não pode ser negativo').max(999999, 'Estoque fora da faixa'),
  calculo_tipo: z.string().trim().min(1, 'Tipo de cálculo é obrigatório').max(50),
  controlado: z.boolean().optional(),
  lista_controle: listaControleSchema.nullable().optional(),
});

const criarInsumoSchema = insumoBaseSchema.extend({
  codigo_interno: z.number().int('Código interno deve ser inteiro').positive('Código interno deve ser positivo'),
});

const atualizarInsumoSchema = insumoBaseSchema.extend({
  codigo_interno: z.number().int('Código interno deve ser inteiro').positive('Código interno deve ser positivo').optional(),
});

const toggleControladoSchema = z.object({
  controlado: z.boolean(),
  lista_controle: listaControleSchema.nullable().optional(),
});

/** Só grava a lista quando o insumo é controlado — evita lista órfã no cadastro. */
function normalizarControle(controlado: boolean | undefined, lista: string | null | undefined) {
  const marcado = !!controlado;
  return {
    controlado: marcado,
    lista_controle: marcado ? (lista || null) : null,
  };
}

function detalhesZod(error: z.ZodError) {
  return error.issues.map((i) => i.message);
}

/** Converte os Decimal do Prisma em número e agrega os campos derivados usados pelo painel. */
function serializarInsumo(insumo: any) {
  return {
    ...insumo,
    valor_custo: Number(insumo.valor_custo),
    custo_referencia: Number(insumo.custo_referencia),
    markup: Number(insumo.markup),
    estoque: Number(insumo.estoque),
    custo_efetivo: Math.max(Number(insumo.valor_custo), Number(insumo.custo_referencia)),
    disponivel: Number(insumo.estoque) > 0,
    formas_proibidas: (insumo.regras_excecao || []).map((r: any) => r.forma.nome),
  };
}

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

  // Criar insumo
  async criar(req: Request, res: Response) {
    try {
      const parsed = criarInsumoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: detalhesZod(parsed.error) });
      }

      const { codigo_interno, controlado, lista_controle, ...campos } = parsed.data;
      const controle = normalizarControle(controlado, lista_controle);

      // O código interno é único, então um insumo inativo com o mesmo código
      // bloquearia o cadastro. Nesse caso reativamos o registro existente.
      const existente = await prisma.insumoFarmaceutico.findUnique({ where: { codigo_interno } });
      if (existente && existente.ativo) {
        return res.status(409).json({ error: `Já existe um insumo ativo com o código ${codigo_interno}` });
      }

      const insumo = existente
        ? await prisma.insumoFarmaceutico.update({
            where: { id: existente.id },
            data: { ...campos, ...controle, ativo: true },
            include: { regras_excecao: { include: { forma: { select: { id: true, nome: true } } } } },
          })
        : await prisma.insumoFarmaceutico.create({
            data: { codigo_interno, ...campos, ...controle },
            include: { regras_excecao: { include: { forma: { select: { id: true, nome: true } } } } },
          });

      return res.status(201).json(serializarInsumo(insumo));
    } catch (error: any) {
      console.error('Erro ao criar insumo:', error);
      return res.status(500).json({ error: 'Erro ao criar insumo' });
    }
  }

  // Atualizar insumo (custo, markup, estoque, controle…)
  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = atualizarInsumoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: detalhesZod(parsed.error) });
      }

      const atual = await prisma.insumoFarmaceutico.findUnique({ where: { id } });
      if (!atual) return res.status(404).json({ error: 'Insumo não encontrado' });

      const { codigo_interno, controlado, lista_controle, ...campos } = parsed.data;
      const controle = normalizarControle(controlado, lista_controle);

      if (codigo_interno != null && codigo_interno !== atual.codigo_interno) {
        const conflito = await prisma.insumoFarmaceutico.findUnique({ where: { codigo_interno } });
        if (conflito) {
          return res.status(409).json({ error: `O código ${codigo_interno} já pertence a outro insumo` });
        }
      }

      const insumo = await prisma.insumoFarmaceutico.update({
        where: { id },
        data: {
          ...campos,
          ...controle,
          ...(codigo_interno != null ? { codigo_interno } : {}),
        },
        include: { regras_excecao: { include: { forma: { select: { id: true, nome: true } } } } },
      });

      return res.json(serializarInsumo(insumo));
    } catch (error: any) {
      console.error('Erro ao atualizar insumo:', error);
      return res.status(500).json({ error: 'Erro ao atualizar insumo' });
    }
  }

  // Inativar insumo. Não apagamos o registro: prescrições antigas e regras de
  // exceção continuam referenciando o insumo, e o código interno é único.
  async inativar(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const atual = await prisma.insumoFarmaceutico.findUnique({ where: { id } });
      if (!atual) return res.status(404).json({ error: 'Insumo não encontrado' });

      await prisma.insumoFarmaceutico.update({ where: { id }, data: { ativo: false } });
      return res.json({ message: 'Insumo removido da base ativa' });
    } catch (error: any) {
      console.error('Erro ao inativar insumo:', error);
      return res.status(500).json({ error: 'Erro ao remover insumo' });
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

      // Mesma forma da listagem geral: o painel edita o insumo direto desta tela,
      // então ele precisa de todos os campos, não só os do controle.
      return res.json({
        data: data.map(serializarInsumo),
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
      const parsed = toggleControladoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: detalhesZod(parsed.error) });
      }

      const { controlado, lista_controle } = parsed.data;
      if (controlado && !lista_controle) {
        return res.status(400).json({ error: 'Informe a lista de controle' });
      }

      const atual = await prisma.insumoFarmaceutico.findUnique({ where: { id } });
      if (!atual) return res.status(404).json({ error: 'Insumo não encontrado' });

      const insumo = await prisma.insumoFarmaceutico.update({
        where: { id },
        data: normalizarControle(controlado, lista_controle),
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

  // Verificar se um texto contém substância controlada
  async verificarControlado(req: Request, res: Response) {
    try {
      const { texto } = req.query;
      if (!texto || (texto as string).trim().length < 3) {
        return res.json({ controlado: false, substancias: [] });
      }

      // Buscar todos os insumos controlados
      const controlados = await prisma.insumoFarmaceutico.findMany({
        where: { controlado: true, ativo: true },
        select: { descricao: true, lista_controle: true },
      });

      // Verificar se algum nome aparece no texto do produto
      const textoLower = (texto as string).toLowerCase();
      const encontrados = controlados.filter((c) => {
        const nome = c.descricao.toLowerCase().split(' ')[0]; // primeira palavra
        return nome.length >= 4 && textoLower.includes(nome);
      });

      return res.json({
        controlado: encontrados.length > 0,
        substancias: encontrados.map((c) => ({
          nome: c.descricao,
          lista: c.lista_controle,
        })),
      });
    } catch (error: any) {
      console.error('Erro ao verificar controlado:', error);
      return res.json({ controlado: false, substancias: [] });
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
