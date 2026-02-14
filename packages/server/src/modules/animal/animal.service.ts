import { prisma } from '../../shared/utils/prisma';
import { AppError } from '../../shared/errors/app-error';
import { CreateAnimalInput, UpdateAnimalInput } from './animal.schema';

export class AnimalService {
  async create(clinicaId: string, data: CreateAnimalInput) {
    // Verificar se tutor pertence a clinica
    const tutor = await prisma.tutor.findFirst({
      where: { id: data.tutor_id, clinica_id: clinicaId },
    });
    if (!tutor) {
      throw AppError.notFound('Tutor nao encontrado nesta clinica');
    }

    return prisma.animal.create({
      data: {
        clinica_id: clinicaId,
        tutor_id: data.tutor_id,
        nome: data.nome,
        especie: data.especie,
        raca: data.raca,
        sexo: data.sexo,
        peso_kg: data.peso_kg,
        data_nascimento: data.data_nascimento ? new Date(data.data_nascimento) : undefined,
        observacoes: data.observacoes,
      },
      include: { tutor: { select: { id: true, nome: true } } },
    });
  }

  async findAll(clinicaId: string, tutorId?: string) {
    return prisma.animal.findMany({
      where: {
        clinica_id: clinicaId,
        ativo: true,
        ...(tutorId ? { tutor_id: tutorId } : {}),
      },
      include: { tutor: { select: { id: true, nome: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(clinicaId: string, id: string) {
    const animal = await prisma.animal.findFirst({
      where: { id, clinica_id: clinicaId },
      include: {
        tutor: true,
        prescricoes: {
          take: 10,
          orderBy: { created_at: 'desc' },
          select: { id: true, status: true, diagnostico: true, created_at: true },
        },
      },
    });

    if (!animal) {
      throw AppError.notFound('Animal nao encontrado');
    }

    return animal;
  }

  async update(clinicaId: string, id: string, data: UpdateAnimalInput) {
    const animal = await prisma.animal.findFirst({ where: { id, clinica_id: clinicaId } });
    if (!animal) {
      throw AppError.notFound('Animal nao encontrado');
    }

    return prisma.animal.update({
      where: { id },
      data: {
        ...data,
        data_nascimento: data.data_nascimento ? new Date(data.data_nascimento) : undefined,
      },
    });
  }
}
