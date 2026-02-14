import { prisma } from '../../shared/utils/prisma';
import { AppError } from '../../shared/errors/app-error';
import {
  CreatePrincipioAtivoInput,
  UpdatePrincipioAtivoInput,
  CreateConcentracaoInput,
  CreateFaixaInput,
} from './principio-ativo.schema';

export class PrincipioAtivoService {
  async create(data: CreatePrincipioAtivoInput) {
    const existing = await prisma.principioAtivo.findUnique({
      where: { nome_padronizado: data.nome_padronizado },
    });
    if (existing) {
      throw AppError.conflict('Principio ativo ja cadastrado com esse nome');
    }

    return prisma.principioAtivo.create({
      data: {
        nome_padronizado: data.nome_padronizado,
        classe_terapeutica: data.classe_terapeutica,
        controlado: data.controlado,
        descricao_palatavel: data.descricao_palatavel,
        observacoes: data.observacoes,
        concentracoes: data.concentracoes
          ? { create: data.concentracoes }
          : undefined,
        faixas_terapeuticas: data.faixas
          ? { create: data.faixas }
          : undefined,
      },
      include: {
        concentracoes: true,
        faixas_terapeuticas: true,
      },
    });
  }

  async findAll(search?: string) {
    return prisma.principioAtivo.findMany({
      where: search
        ? {
            OR: [
              { nome_padronizado: { contains: search, mode: 'insensitive' } },
              { classe_terapeutica: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        concentracoes: { where: { ativo: true } },
        _count: { select: { faixas_terapeuticas: true } },
      },
      orderBy: { nome_padronizado: 'asc' },
    });
  }

  async findById(id: string) {
    const ativo = await prisma.principioAtivo.findUnique({
      where: { id },
      include: {
        concentracoes: true,
        faixas_terapeuticas: {
          orderBy: [{ especie: 'asc' }, { peso_min_kg: 'asc' }],
        },
      },
    });

    if (!ativo) {
      throw AppError.notFound('Principio ativo nao encontrado');
    }

    return ativo;
  }

  async update(id: string, data: UpdatePrincipioAtivoInput) {
    const ativo = await prisma.principioAtivo.findUnique({ where: { id } });
    if (!ativo) {
      throw AppError.notFound('Principio ativo nao encontrado');
    }

    if (data.nome_padronizado && data.nome_padronizado !== ativo.nome_padronizado) {
      const existing = await prisma.principioAtivo.findUnique({
        where: { nome_padronizado: data.nome_padronizado },
      });
      if (existing) {
        throw AppError.conflict('Ja existe um principio ativo com esse nome');
      }
    }

    return prisma.principioAtivo.update({
      where: { id },
      data,
      include: { concentracoes: true, faixas_terapeuticas: true },
    });
  }

  async delete(id: string) {
    const ativo = await prisma.principioAtivo.findUnique({ where: { id } });
    if (!ativo) {
      throw AppError.notFound('Principio ativo nao encontrado');
    }

    await prisma.principioAtivo.delete({ where: { id } });
  }

  // --- Concentracoes ---

  async addConcentracao(principioAtivoId: string, data: CreateConcentracaoInput) {
    const ativo = await prisma.principioAtivo.findUnique({ where: { id: principioAtivoId } });
    if (!ativo) {
      throw AppError.notFound('Principio ativo nao encontrado');
    }

    return prisma.principioAtivoConcentracao.create({
      data: { principio_ativo_id: principioAtivoId, ...data },
    });
  }

  async updateConcentracao(principioAtivoId: string, concentracaoId: string, data: Partial<CreateConcentracaoInput>) {
    const conc = await prisma.principioAtivoConcentracao.findFirst({
      where: { id: concentracaoId, principio_ativo_id: principioAtivoId },
    });
    if (!conc) {
      throw AppError.notFound('Concentracao nao encontrada');
    }

    return prisma.principioAtivoConcentracao.update({
      where: { id: concentracaoId },
      data,
    });
  }

  async deleteConcentracao(principioAtivoId: string, concentracaoId: string) {
    const conc = await prisma.principioAtivoConcentracao.findFirst({
      where: { id: concentracaoId, principio_ativo_id: principioAtivoId },
    });
    if (!conc) {
      throw AppError.notFound('Concentracao nao encontrada');
    }

    await prisma.principioAtivoConcentracao.delete({ where: { id: concentracaoId } });
  }

  // --- Faixas Terapeuticas ---

  async addFaixa(principioAtivoId: string, data: CreateFaixaInput) {
    const ativo = await prisma.principioAtivo.findUnique({ where: { id: principioAtivoId } });
    if (!ativo) {
      throw AppError.notFound('Principio ativo nao encontrado');
    }

    return prisma.faixaTerapeutica.create({
      data: { principio_ativo_id: principioAtivoId, ...data },
    });
  }

  async updateFaixa(principioAtivoId: string, faixaId: string, data: Partial<CreateFaixaInput>) {
    const faixa = await prisma.faixaTerapeutica.findFirst({
      where: { id: faixaId, principio_ativo_id: principioAtivoId },
    });
    if (!faixa) {
      throw AppError.notFound('Faixa terapeutica nao encontrada');
    }

    return prisma.faixaTerapeutica.update({
      where: { id: faixaId },
      data,
    });
  }

  async deleteFaixa(principioAtivoId: string, faixaId: string) {
    const faixa = await prisma.faixaTerapeutica.findFirst({
      where: { id: faixaId, principio_ativo_id: principioAtivoId },
    });
    if (!faixa) {
      throw AppError.notFound('Faixa terapeutica nao encontrada');
    }

    await prisma.faixaTerapeutica.delete({ where: { id: faixaId } });
  }
}
