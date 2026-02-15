import { PrismaClient } from '@prisma/client';
import { PrincipioAtivoService } from './principioAtivo.service';

export interface ValidacaoResultado {
    valido: boolean;
    alertas: string[];
    avisos: string[];
    dose_total_mg: number;
    dose_mg_kg: number;
    doses_por_dia: number;
    dose_diaria_total_mg: number;
    range_encontrado?: {
        dose_min_mg_kg: number;
        dose_max_mg_kg: number;
        especie: string;
        peso_min_kg?: number;
        peso_max_kg?: number;
    };
    requer_ciencia: boolean;
}

export interface ValidacaoDosagemParams {
    principio_ativo_id: string;
    animal_id: string;
    dosagem_mg_kg: number;
    frequencia_horas: number;
    duracao_dias: number;
}

export interface RegistroCienciaParams {
    prescricao_id: string;
    veterinario_id: string;
    principio_ativo_id: string;
    animal_id: string;
    dosagem_prescrita_mg_kg: number;
    peso_animal_kg: number;
    dose_min_esperada_mg_kg: number;
    dose_max_esperada_mg_kg: number;
    motivo: string;
    ip_address?: string;
    user_agent?: string;
}

export class ValidacaoClinicaService {
    private principioAtivoService: PrincipioAtivoService;

    constructor(private prisma: PrismaClient) {
        this.principioAtivoService = new PrincipioAtivoService(prisma);
    }

    /**
     * Validar dosagem de um medicamento para um animal
     */
    async validarDosagem(params: ValidacaoDosagemParams): Promise<ValidacaoResultado> {
        const resultado: ValidacaoResultado = {
            valido: true,
            alertas: [],
            avisos: [],
            dose_total_mg: 0,
            dose_mg_kg: params.dosagem_mg_kg,
            doses_por_dia: 0,
            dose_diaria_total_mg: 0,
            requer_ciencia: false
        };

        // 1. Buscar dados do animal
        const animal = await this.prisma.animal.findUnique({
            where: { id: params.animal_id }
        });

        if (!animal) {
            resultado.valido = false;
            resultado.alertas.push('Animal não encontrado');
            return resultado;
        }

        if (!animal.peso) {
            resultado.valido = false;
            resultado.alertas.push('Peso do animal não informado. Por favor, cadastre o peso do paciente.');
            return resultado;
        }

        // 2. Buscar princípio ativo
        const principioAtivo = await this.principioAtivoService.buscarPorId(params.principio_ativo_id);

        if (!principioAtivo) {
            resultado.valido = false;
            resultado.alertas.push('Princípio ativo não encontrado');
            return resultado;
        }

        // 3. Buscar range terapêutico
        const range = await this.principioAtivoService.buscarRange(
            params.principio_ativo_id,
            animal.especie,
            animal.peso
        );

        if (!range) {
            resultado.avisos.push(
                `⚠️ Não há range terapêutico cadastrado para ${principioAtivo.nome} em ${animal.especie} com ${animal.peso}kg`
            );
            resultado.avisos.push(
                'Verifique a literatura veterinária antes de prosseguir.'
            );
            resultado.requer_ciencia = true;
        } else {
            resultado.range_encontrado = {
                dose_min_mg_kg: Number(range.dose_min_mg_kg),
                dose_max_mg_kg: Number(range.dose_max_mg_kg),
                especie: range.especie,
                peso_min_kg: range.peso_min_kg ? Number(range.peso_min_kg) : undefined,
                peso_max_kg: range.peso_max_kg ? Number(range.peso_max_kg) : undefined
            };

            // 4. Validar dosagem contra o range
            if (params.dosagem_mg_kg < Number(range.dose_min_mg_kg)) {
                resultado.valido = false;
                resultado.alertas.push(
                    `🔴 Dosagem ABAIXO do mínimo terapêutico (${range.dose_min_mg_kg} mg/kg)`
                );
                resultado.alertas.push(
                    'Dosagem subterapêutica pode não ter efeito clínico esperado.'
                );
                resultado.requer_ciencia = true;
            }

            if (params.dosagem_mg_kg > Number(range.dose_max_mg_kg)) {
                resultado.valido = false;
                resultado.alertas.push(
                    `🔴 Dosagem ACIMA do máximo terapêutico (${range.dose_max_mg_kg} mg/kg)`
                );
                resultado.alertas.push(
                    'Risco de toxicidade e efeitos adversos.'
                );
                resultado.requer_ciencia = true;
            }

            // 5. Validar duração
            if (range.duracao_max_dias && params.duracao_dias > range.duracao_max_dias) {
                resultado.avisos.push(
                    `⚠️ Duração acima do recomendado (máximo: ${range.duracao_max_dias} dias)`
                );
                resultado.avisos.push(
                    'Considere monitoramento adicional para uso prolongado.'
                );
            }

            // 6. Validar frequência
            if (range.frequencia_horas && params.frequencia_horas !== range.frequencia_horas) {
                resultado.avisos.push(
                    `ℹ️ Frequência recomendada: a cada ${range.frequencia_horas} horas`
                );
            }
        }

        // 7. Calcular dose total
        resultado.doses_por_dia = 24 / params.frequencia_horas;
        const dosePorAplicacao = params.dosagem_mg_kg * animal.peso;
        resultado.dose_diaria_total_mg = dosePorAplicacao * resultado.doses_por_dia;
        resultado.dose_total_mg = resultado.dose_diaria_total_mg * params.duracao_dias;

        // 8. Avisos adicionais para medicamentos controlados
        if (principioAtivo.controlado) {
            resultado.avisos.push(
                '⚠️ Medicamento CONTROLADO - Requer assinatura digital e receituário especial'
            );
        }

        return resultado;
    }

    /**
     * Registrar log de ciência quando veterinário aceita dosagem fora do range
     */
    async registrarCiencia(params: RegistroCienciaParams) {
        // Validar que o motivo foi fornecido
        if (!params.motivo || params.motivo.trim().length < 10) {
            throw new Error('Justificativa deve ter no mínimo 10 caracteres');
        }

        const doseTotalMg = params.dosagem_prescrita_mg_kg * params.peso_animal_kg;

        return this.prisma.logCiencia.create({
            data: {
                prescricao_id: params.prescricao_id,
                veterinario_id: params.veterinario_id,
                principio_ativo_id: params.principio_ativo_id,
                animal_id: params.animal_id,
                dosagem_prescrita_mg_kg: params.dosagem_prescrita_mg_kg,
                peso_animal_kg: params.peso_animal_kg,
                dose_total_mg: doseTotalMg,
                dose_min_esperada_mg_kg: params.dose_min_esperada_mg_kg,
                dose_max_esperada_mg_kg: params.dose_max_esperada_mg_kg,
                motivo: params.motivo.trim(),
                aceite_veterinario: true,
                ip_address: params.ip_address,
                user_agent: params.user_agent
            },
            include: {
                veterinario: {
                    select: {
                        nome: true,
                        crv: true
                    }
                },
                principioAtivo: {
                    select: {
                        nome: true
                    }
                },
                animal: {
                    select: {
                        nome: true,
                        especie: true
                    }
                }
            }
        });
    }

    /**
     * Buscar logs de ciência por prescrição
     */
    async buscarLogsPorPrescricao(prescricaoId: string) {
        return this.prisma.logCiencia.findMany({
            where: { prescricao_id: prescricaoId },
            include: {
                veterinario: {
                    select: {
                        nome: true,
                        crv: true
                    }
                },
                principioAtivo: {
                    select: {
                        nome: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    /**
     * Buscar logs de ciência por veterinário
     */
    async buscarLogsPorVeterinario(veterinarioId: string, limite = 50) {
        return this.prisma.logCiencia.findMany({
            where: { veterinario_id: veterinarioId },
            include: {
                prescricao: {
                    select: {
                        id: true,
                        created_at: true
                    }
                },
                principioAtivo: {
                    select: {
                        nome: true
                    }
                },
                animal: {
                    select: {
                        nome: true,
                        especie: true
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: limite
        });
    }

    /**
     * Relatório de logs de ciência (para admin)
     */
    async relatorioLogsCiencia(filtros?: {
        data_inicio?: Date;
        data_fim?: Date;
        veterinario_id?: string;
        principio_ativo_id?: string;
    }) {
        const where: any = {};

        if (filtros?.data_inicio || filtros?.data_fim) {
            where.created_at = {};
            if (filtros.data_inicio) {
                where.created_at.gte = filtros.data_inicio;
            }
            if (filtros.data_fim) {
                where.created_at.lte = filtros.data_fim;
            }
        }

        if (filtros?.veterinario_id) {
            where.veterinario_id = filtros.veterinario_id;
        }

        if (filtros?.principio_ativo_id) {
            where.principio_ativo_id = filtros.principio_ativo_id;
        }

        return this.prisma.logCiencia.findMany({
            where,
            include: {
                veterinario: {
                    select: {
                        nome: true,
                        crv: true,
                        email: true
                    }
                },
                principioAtivo: {
                    select: {
                        nome: true,
                        classe_terapeutica: true
                    }
                },
                animal: {
                    select: {
                        nome: true,
                        especie: true,
                        tutor: {
                            select: {
                                nome: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    /**
     * Calcular quantidade total de medicamento necessária
     */
    calcularQuantidadeTotal(params: {
        dosagem_mg_kg: number;
        peso_kg: number;
        frequencia_horas: number;
        duracao_dias: number;
        concentracao_mg?: number; // Concentração do comprimido/cápsula
    }): {
        dose_por_aplicacao_mg: number;
        doses_por_dia: number;
        dose_diaria_total_mg: number;
        dose_total_mg: number;
        unidades_necessarias?: number; // Se concentração fornecida
    } {
        const dosePorAplicacao = params.dosagem_mg_kg * params.peso_kg;
        const dosesPorDia = 24 / params.frequencia_horas;
        const doseDiariaTotal = dosePorAplicacao * dosesPorDia;
        const doseTotal = doseDiariaTotal * params.duracao_dias;

        const resultado = {
            dose_por_aplicacao_mg: Math.round(dosePorAplicacao * 100) / 100,
            doses_por_dia: dosesPorDia,
            dose_diaria_total_mg: Math.round(doseDiariaTotal * 100) / 100,
            dose_total_mg: Math.round(doseTotal * 100) / 100,
            unidades_necessarias: undefined as number | undefined
        };

        if (params.concentracao_mg) {
            resultado.unidades_necessarias = Math.ceil(doseTotal / params.concentracao_mg);
        }

        return resultado;
    }
}
