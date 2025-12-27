import { PrismaClient, ClinicaStatus } from '@prisma/client';

const prisma = new PrismaClient();

type ClinicaFilters = {
    status?: ClinicaStatus;
    cidade?: string;
    search?: string;
};

export class ClinicaService {
    async create(data: any) {
        // Validar e limpar CNPJ
        const cnpjLimpo = data.cnpj.replace(/\D/g, '');

        return prisma.clinica.create({
            data: {
                nome_fantasia: data.nome_fantasia,
                razao_social: data.razao_social,
                cnpj: cnpjLimpo,
                inscricao_estadual: data.inscricao_estadual || null,
                email: data.email,
                telefone: data.telefone || null,
                whatsapp: data.whatsapp || null,
                cep: data.cep || null,
                logradouro: data.logradouro || null,
                numero: data.numero || null,
                complemento: data.complemento || null,
                bairro: data.bairro || null,
                cidade: data.cidade || null,
                estado: data.estado || null,
                responsavel_legal: data.responsavel_legal,
                cpf_responsavel: data.cpf_responsavel,
                observacoes_internas: data.observacoes_internas || null,
                status: data.status || 'PENDENTE'
            }
        });
    }

    async list(filters: ClinicaFilters = {}) {
        const where: any = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.cidade) {
            where.cidade = filters.cidade;
        }

        if (filters.search) {
            where.OR = [
                { nome_fantasia: { contains: filters.search, mode: 'insensitive' } },
                { razao_social: { contains: filters.search, mode: 'insensitive' } },
                { cnpj: { contains: filters.search } }
            ];
        }

        return prisma.clinica.findMany({
            where,
            include: {
                _count: {
                    select: {
                        veterinarios: true,
                        prescricoes: true,
                        documentos: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getById(id: string) {
        return prisma.clinica.findUnique({
            where: { id },
            include: {
                documentos: {
                    orderBy: { created_at: 'desc' }
                },
                veterinarios: {
                    where: { status: 'ativo' },
                    include: {
                        veterinario: {
                            select: {
                                id: true,
                                nome: true,
                                crv: true,
                                email: true,
                                telefone: true,
                                especialidades: true
                            }
                        }
                    }
                },
                prescricoes: {
                    take: 20,
                    orderBy: { created_at: 'desc' },
                    include: {
                        tutor: { select: { nome: true } },
                        animal: { select: { nome: true, especie: true } },
                        veterinario: { select: { nome: true } }
                    }
                },
                _count: {
                    select: {
                        veterinarios: true,
                        prescricoes: true,
                        documentos: true
                    }
                }
            }
        });
    }

    async update(id: string, data: any) {
        return prisma.clinica.update({
            where: { id },
            data: {
                ...data,
                updated_at: new Date()
            }
        });
    }

    async updateStatus(id: string, status: ClinicaStatus, userId: string) {
        const updateData: any = {
            status,
            updated_at: new Date()
        };

        if (status === ClinicaStatus.APROVADA) {
            updateData.approved_at = new Date();
            updateData.approved_by = userId;

            // Gerar senha aleatória segura
            const senhaTemporaria = this.generateRandomPassword();
            const bcrypt = await import('bcryptjs');
            updateData.senha_hash = await bcrypt.hash(senhaTemporaria, 10);

            console.log(`🔐 Gerando senha para clínica ${id}: ${senhaTemporaria}`);
        }

        const clinica = await prisma.clinica.update({
            where: { id },
            data: updateData
        });

        // Enviar emails
        const { EmailService } = await import('./email.service');
        const emailService = new EmailService();

        if (status === ClinicaStatus.APROVADA) {
            // Enviar email de aprovação
            await emailService.sendClinicaAprovada(clinica);

            // Enviar credenciais de acesso
            const senhaTemporaria = this.generateRandomPassword();
            await emailService.sendClinicaCredenciais(clinica, senhaTemporaria);

            console.log(`✅ Clínica aprovada e credenciais enviadas para ${clinica.email}`);
        } else if (status === ClinicaStatus.SUSPENSA) {
            await emailService.sendClinicaSuspensa(clinica);
        }

        return clinica;
    }

    // Gerar senha aleatória segura
    private generateRandomPassword(): string {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%&*';

        const all = uppercase + lowercase + numbers + symbols;

        let password = '';
        // Garantir pelo menos um de cada tipo
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];

        // Completar com caracteres aleatórios até 12 caracteres
        for (let i = password.length; i < 12; i++) {
            password += all[Math.floor(Math.random() * all.length)];
        }

        // Embaralhar a senha
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    async softDelete(id: string) {
        return prisma.clinica.update({
            where: { id },
            data: {
                status: ClinicaStatus.INATIVA,
                updated_at: new Date()
            }
        });
    }

    async getMetrics(id: string) {
        const [totalPrescricoes, totalFaturamento] = await Promise.all([
            prisma.prescricao.count({
                where: { clinica_id: id }
            }),
            prisma.orcamento.aggregate({
                where: {
                    prescricao: { clinica_id: id }
                },
                _sum: { valor_total: true }
            })
        ]);

        return {
            total_prescricoes: totalPrescricoes,
            total_faturamento: Number(totalFaturamento._sum.valor_total || 0)
        };
    }
}
