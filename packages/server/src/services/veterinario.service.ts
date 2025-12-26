import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VeterinarioService {
    async create(data: any) {
        // Validar CRMV
        if (!this.validarCRMV(data.crmv)) {
            throw new Error('CRMV inválido. Formato esperado: CRMV-UF 12345');
        }

        // Verificar duplicidade
        const existente = await prisma.veterinario.findFirst({
            where: {
                OR: [
                    { cpf: data.cpf },
                    { crmv: data.crmv }
                ]
            }
        });

        if (existente) {
            if (existente.cpf === data.cpf) {
                throw new Error('CPF já cadastrado');
            }
            if (existente.crmv === data.crmv) {
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
                    { crmv: { contains: query, mode: 'insensitive' } },
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

    // Validação de CRMV
    private validarCRMV(crmv: string): boolean {
        // Formato: CRMV-UF 12345 ou CRMV-UF 123456
        const regex = /^CRMV-[A-Z]{2}\s\d{4,6}$/;
        return regex.test(crmv);
    }
}
