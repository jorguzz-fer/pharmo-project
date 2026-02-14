import { prisma } from '../../shared/utils/prisma';
import { hashPassword } from '../../shared/utils/password';
import { AppError } from '../../shared/errors/app-error';
import { CreateTenantInput, UpdateTenantInput, UpdateBrandingInput } from './tenant.schema';

export class TenantService {
  async create(data: CreateTenantInput) {
    const existing = await prisma.clinica.findUnique({ where: { cnpj: data.cnpj } });
    if (existing) {
      throw AppError.conflict('CNPJ ja cadastrado');
    }

    const existingEmail = await prisma.clinicaUsuario.findUnique({ where: { email: data.admin_email } });
    if (existingEmail) {
      throw AppError.conflict('Email do admin ja cadastrado');
    }

    const senhaHash = await hashPassword(data.admin_senha);

    const clinica = await prisma.clinica.create({
      data: {
        nome_fantasia: data.nome_fantasia,
        razao_social: data.razao_social,
        cnpj: data.cnpj,
        inscricao_estadual: data.inscricao_estadual,
        email: data.email,
        telefone: data.telefone,
        whatsapp: data.whatsapp,
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        usuarios: {
          create: {
            nome: data.admin_nome,
            email: data.admin_email,
            senha_hash: senhaHash,
            role: 'ADMIN_CLINICA',
          },
        },
      },
      include: {
        usuarios: { select: { id: true, nome: true, email: true, role: true } },
      },
    });

    return clinica;
  }

  async findById(id: string) {
    const clinica = await prisma.clinica.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usuarios: true,
            tutores: true,
            prescricoes: true,
          },
        },
      },
    });

    if (!clinica) {
      throw AppError.notFound('Clinica nao encontrada');
    }

    return clinica;
  }

  async update(id: string, data: UpdateTenantInput) {
    const clinica = await prisma.clinica.findUnique({ where: { id } });
    if (!clinica) {
      throw AppError.notFound('Clinica nao encontrada');
    }

    return prisma.clinica.update({
      where: { id },
      data,
    });
  }

  async updateBranding(id: string, data: UpdateBrandingInput) {
    const clinica = await prisma.clinica.findUnique({ where: { id } });
    if (!clinica) {
      throw AppError.notFound('Clinica nao encontrada');
    }

    return prisma.clinica.update({
      where: { id },
      data,
    });
  }

  async getConfig(id: string) {
    const clinica = await prisma.clinica.findUnique({
      where: { id },
      select: { id: true, configuracoes: true, nome_fantasia: true },
    });

    if (!clinica) {
      throw AppError.notFound('Clinica nao encontrada');
    }

    return clinica;
  }
}
