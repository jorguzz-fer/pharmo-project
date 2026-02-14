import { prisma } from '../../shared/utils/prisma';
import { AppError } from '../../shared/errors/app-error';
import { CreateTutorInput, UpdateTutorInput } from './tutor.schema';

export class TutorService {
  async create(clinicaId: string, data: CreateTutorInput) {
    return prisma.tutor.create({
      data: { ...data, clinica_id: clinicaId },
      include: { animais: true },
    });
  }

  async findAll(clinicaId: string, search?: string) {
    return prisma.tutor.findMany({
      where: {
        clinica_id: clinicaId,
        ...(search
          ? {
              OR: [
                { nome: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        animais: { where: { ativo: true }, select: { id: true, nome: true, especie: true } },
        _count: { select: { prescricoes: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(clinicaId: string, id: string) {
    const tutor = await prisma.tutor.findFirst({
      where: { id, clinica_id: clinicaId },
      include: {
        animais: { where: { ativo: true } },
        prescricoes: {
          take: 10,
          orderBy: { created_at: 'desc' },
          select: { id: true, status: true, diagnostico: true, created_at: true },
        },
      },
    });

    if (!tutor) {
      throw AppError.notFound('Tutor nao encontrado');
    }

    return tutor;
  }

  async update(clinicaId: string, id: string, data: UpdateTutorInput) {
    const tutor = await prisma.tutor.findFirst({ where: { id, clinica_id: clinicaId } });
    if (!tutor) {
      throw AppError.notFound('Tutor nao encontrado');
    }

    return prisma.tutor.update({ where: { id }, data });
  }
}
