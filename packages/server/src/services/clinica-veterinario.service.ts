import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ClinicaVeterinarioService {
    async vincular(clinicaId: string, veterinarioId: string, cargo?: string) {
        // Verificar se clínica existe e está aprovada
        const clinica = await prisma.clinica.findUnique({
            where: { id: clinicaId }
        });

        if (!clinica) {
            throw new Error('Clínica não encontrada');
        }

        if (clinica.status !== 'APROVADA') {
            throw new Error('Apenas clínicas aprovadas podem ter veterinários vinculados');
        }

        // Verificar se veterinário existe
        const veterinario = await prisma.veterinario.findUnique({
            where: { id: veterinarioId }
        });

        if (!veterinario) {
            throw new Error('Veterinário não encontrado');
        }

        // Verificar se já existe vinculação ativa
        const vinculacaoExistente = await prisma.clinicaVeterinario.findUnique({
            where: {
                clinica_id_veterinario_id: {
                    clinica_id: clinicaId,
                    veterinario_id: veterinarioId
                }
            }
        });

        if (vinculacaoExistente) {
            if (vinculacaoExistente.status === 'ativo') {
                throw new Error('Veterinário já está vinculado a esta clínica');
            }

            // Reativar vinculação
            const vinculacao = await prisma.clinicaVeterinario.update({
                where: { id: vinculacaoExistente.id },
                data: {
                    status: 'ativo',
                    cargo: cargo || vinculacaoExistente.cargo
                },
                include: {
                    clinica: true,
                    veterinario: true
                }
            });

            return vinculacao;
        }

        // Criar nova vinculação
        const vinculacao = await prisma.clinicaVeterinario.create({
            data: {
                clinica_id: clinicaId,
                veterinario_id: veterinarioId,
                cargo: cargo || 'Veterinário',
                status: 'ativo'
            },
            include: {
                clinica: true,
                veterinario: true
            }
        });

        // TODO: Enviar email (Fase 7)
        // await emailService.sendVeterinarioVinculado(vinculacao);

        return vinculacao;
    }

    async desvincular(clinicaId: string, veterinarioId: string) {
        const vinculacao = await prisma.clinicaVeterinario.findUnique({
            where: {
                clinica_id_veterinario_id: {
                    clinica_id: clinicaId,
                    veterinario_id: veterinarioId
                }
            },
            include: {
                clinica: true,
                veterinario: true
            }
        });

        if (!vinculacao) {
            throw new Error('Vinculação não encontrada');
        }

        // Soft delete - marcar como inativo
        const updated = await prisma.clinicaVeterinario.update({
            where: { id: vinculacao.id },
            data: { status: 'inativo' },
            include: {
                clinica: true,
                veterinario: true
            }
        });

        // TODO: Enviar email (Fase 7)
        // await emailService.sendVeterinarioDesvinculado(updated);

        return updated;
    }

    async listarVeterinarios(clinicaId: string) {
        return prisma.clinicaVeterinario.findMany({
            where: {
                clinica_id: clinicaId,
                status: 'ativo'
            },
            include: {
                veterinario: {
                    select: {
                        id: true,
                        nome: true,
                        cpf: true,
                        crmv: true,
                        email: true,
                        telefone: true,
                        especialidades: true,
                        status: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async listarClinicas(veterinarioId: string) {
        return prisma.clinicaVeterinario.findMany({
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
    }
}
