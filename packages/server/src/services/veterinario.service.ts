import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VeterinarioService {
    async create(data: any) {
        // Validar CRMV (apenas verificar se não está vazio)
        if (!data.crv || data.crv.trim().length < 5) {
            throw new Error('CRMV inválido. Mínimo 5 caracteres.');
        }

        // Verificar duplicidade
        const existente = await prisma.veterinario.findFirst({
            where: {
                OR: [
                    { cpf: data.cpf },
                    { crv: data.crv }
                ]
            }
        });

        if (existente) {
            if (existente.cpf === data.cpf) {
                throw new Error('CPF já cadastrado');
            }
            if (existente.crv === data.crv) {
                throw new Error('CRMV já cadastrado');
            }
        }

        return prisma.veterinario.create({
            data: {
                ...data,
                cpf: data.cpf?.replace(/\D/g, ''),
                status: 'ACTIVE'
            }
        });
    }

    async list() {
        return prisma.veterinario.findMany({
            include: {
                _count: {
                    select: {
                        prescricoes: true,
                        clinicas: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getById(id: string) {
        return prisma.veterinario.findUnique({
            where: { id },
            include: {
                clinicas: {
                    where: { status: 'ativo' },
                    include: {
                        clinica: {
                            select: {
                                id: true,
                                nome_fantasia: true,
                                cidade: true,
                                estado: true,
                                status: true
                            }
                        }
                    }
                },
                prescricoes: {
                    take: 20,
                    orderBy: { created_at: 'desc' },
                    include: {
                        tutor: { select: { nome: true } },
                        animal: { select: { nome: true } },
                        clinica: { select: { nome_fantasia: true } }
                    }
                },
                _count: {
                    select: {
                        prescricoes: true,
                        clinicas: true
                    }
                }
            }
        });
    }

    async buscar(query: string) {
        // Busca por CRMV ou CPF
        const cpfLimpo = query.replace(/\D/g, '');

        return prisma.veterinario.findFirst({
            where: {
                OR: [
                    { crv: { contains: query, mode: 'insensitive' } },
                    { cpf: cpfLimpo }
                ]
            },
            include: {
                clinicas: {
                    where: { status: 'ativo' },
                    include: {
                        clinica: {
                            select: {
                                id: true,
                                nome_fantasia: true,
                                cidade: true,
                                estado: true
                            }
                        }
                    }
                }
            }
        });
    }

    async update(id: string, data: any) {
        return prisma.veterinario.update({
            where: { id },
            data: {
                ...data,
                updated_at: new Date()
            }
        });
    }

    async getClinicas(veterinarioId: string) {
        const vinculacoes = await prisma.clinicaVeterinario.findMany({
            where: {
                veterinario_id: veterinarioId,
                status: 'ativo'
            },
            include: {
                clinica: {
                    select: {
                        id: true,
                        nome_fantasia: true,
                        razao_social: true,
                        cnpj: true,
                        cidade: true,
                        estado: true,
                        status: true,
                        telefone: true,
                        email: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return vinculacoes.map(v => ({
            ...v.clinica,
            cargo: v.cargo,
            data_vinculacao: v.created_at
        }));
    }
}
