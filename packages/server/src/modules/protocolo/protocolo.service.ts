import { prisma } from '../../shared/utils/prisma';
import { AppError } from '../../shared/errors/app-error';
import { CreateProtocoloInput, UpdateProtocoloInput } from './protocolo.schema';

export class ProtocoloService {
  async create(clinicaId: string, data: CreateProtocoloInput) {
    const existing = await prisma.protocolo.findUnique({
      where: { clinica_id_codigo: { clinica_id: clinicaId, codigo: data.codigo } },
    });
    if (existing) {
      throw AppError.conflict('Codigo de protocolo ja existe nesta clinica');
    }

    return prisma.protocolo.create({
      data: {
        clinica_id: clinicaId,
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao,
        especie_alvo: data.especie_alvo,
        indicacao: data.indicacao,
        itens: {
          create: data.itens.map((item, index) => ({
            principio_ativo_id: item.principio_ativo_id,
            concentracao_id: item.concentracao_id,
            dose_mg_kg: item.dose_mg_kg,
            frequencia_horas: item.frequencia_horas,
            duracao_dias: item.duracao_dias,
            observacoes: item.observacoes,
            ordem: item.ordem ?? index,
          })),
        },
      },
      include: {
        itens: {
          include: {
            principio_ativo: { select: { id: true, nome_padronizado: true } },
            concentracao: true,
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });
  }

  async findAll(clinicaId: string, especie?: string) {
    return prisma.protocolo.findMany({
      where: {
        OR: [
          { clinica_id: clinicaId },
          { clinica_id: null }, // Protocolos globais
        ],
        ativo: true,
        ...(especie ? { especie_alvo: especie as any } : {}),
      },
      include: {
        itens: {
          include: {
            principio_ativo: { select: { id: true, nome_padronizado: true } },
          },
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(clinicaId: string, id: string) {
    const protocolo = await prisma.protocolo.findFirst({
      where: {
        id,
        OR: [{ clinica_id: clinicaId }, { clinica_id: null }],
      },
      include: {
        itens: {
          include: {
            principio_ativo: true,
            concentracao: true,
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!protocolo) {
      throw AppError.notFound('Protocolo nao encontrado');
    }

    return protocolo;
  }

  async update(clinicaId: string, id: string, data: UpdateProtocoloInput) {
    const protocolo = await prisma.protocolo.findFirst({
      where: { id, clinica_id: clinicaId },
    });
    if (!protocolo) {
      throw AppError.notFound('Protocolo nao encontrado ou nao pertence a esta clinica');
    }

    return prisma.protocolo.update({
      where: { id },
      data,
      include: { itens: { include: { principio_ativo: true } } },
    });
  }

  async delete(clinicaId: string, id: string) {
    const protocolo = await prisma.protocolo.findFirst({
      where: { id, clinica_id: clinicaId },
    });
    if (!protocolo) {
      throw AppError.notFound('Protocolo nao encontrado');
    }

    await prisma.protocolo.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
