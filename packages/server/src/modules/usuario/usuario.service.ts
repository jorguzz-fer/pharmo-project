import { prisma } from '../../shared/utils/prisma';
import { hashPassword } from '../../shared/utils/password';
import { AppError } from '../../shared/errors/app-error';
import { CreateUsuarioInput, UpdateUsuarioInput } from './usuario.schema';

export class UsuarioService {
  async create(clinicaId: string, data: CreateUsuarioInput) {
    const existing = await prisma.clinicaUsuario.findUnique({ where: { email: data.email } });
    if (existing) {
      throw AppError.conflict('Email ja cadastrado');
    }

    const senhaHash = await hashPassword(data.senha);
    let veterinarioId: string | undefined;

    // Se for veterinario, criar ou vincular perfil profissional
    if (data.role === 'VETERINARIO' && data.veterinario) {
      const { crmv, uf_crmv } = data.veterinario;

      let vet = await prisma.veterinario.findUnique({
        where: { crmv_uf_crmv: { crmv, uf_crmv } },
      });

      if (!vet) {
        vet = await prisma.veterinario.create({
          data: {
            nome: data.nome,
            crmv,
            uf_crmv,
            cpf: data.veterinario.cpf,
            email: data.email,
            telefone: data.veterinario.telefone,
            especialidades: data.veterinario.especialidades || [],
          },
        });
      }

      veterinarioId = vet.id;
    }

    return prisma.clinicaUsuario.create({
      data: {
        clinica_id: clinicaId,
        nome: data.nome,
        email: data.email,
        senha_hash: senhaHash,
        role: data.role,
        veterinario_id: veterinarioId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        veterinario: {
          select: { id: true, crmv: true, uf_crmv: true },
        },
        created_at: true,
      },
    });
  }

  async findAll(clinicaId: string) {
    return prisma.clinicaUsuario.findMany({
      where: { clinica_id: clinicaId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        veterinario: {
          select: { id: true, crmv: true, uf_crmv: true, especialidades: true },
        },
        created_at: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(clinicaId: string, id: string) {
    const usuario = await prisma.clinicaUsuario.findFirst({
      where: { id, clinica_id: clinicaId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        veterinario: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!usuario) {
      throw AppError.notFound('Usuario nao encontrado');
    }

    return usuario;
  }

  async update(clinicaId: string, id: string, data: UpdateUsuarioInput) {
    const usuario = await prisma.clinicaUsuario.findFirst({
      where: { id, clinica_id: clinicaId },
    });

    if (!usuario) {
      throw AppError.notFound('Usuario nao encontrado');
    }

    return prisma.clinicaUsuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
      },
    });
  }

  async deactivate(clinicaId: string, id: string) {
    const usuario = await prisma.clinicaUsuario.findFirst({
      where: { id, clinica_id: clinicaId },
    });

    if (!usuario) {
      throw AppError.notFound('Usuario nao encontrado');
    }

    return prisma.clinicaUsuario.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
