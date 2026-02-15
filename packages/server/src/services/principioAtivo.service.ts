import { PrismaClient, Prisma } from '@prisma/client';

export interface PrincipioAtivoCreateInput {
    nome: string;
    nome_cientifico?: string;
    classe_terapeutica?: string;
    controlado?: boolean;
    texto_palatavel?: string;
    observacoes?: string;
    concentracoes?: Array<{
        valor: number;
        unidade: string;
        forma_farmaceutica?: string;
    }>;
    ranges?: Array<{
        especie: string;
        peso_min_kg?: number;
        peso_max_kg?: number;
        dose_min_mg_kg: number;
        dose_max_mg_kg: number;
        frequencia_horas?: number;
        duracao_max_dias?: number;
        observacoes?: string;
    }>;
}

export interface PrincipioAtivoFilters {
    ativo?: boolean;
    controlado?: boolean;
    classe_terapeutica?: string;
    busca?: string; // Busca por nome
}

export class PrincipioAtivoService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Listar todos os princípios ativos com filtros opcionais
     */
    async listarTodos(filtros?: PrincipioAtivoFilters) {
        const where: Prisma.PrincipioAtivoWhereInput = {};

        if (filtros?.ativo !== undefined) {
            where.ativo = filtros.ativo;
        }

        if (filtros?.controlado !== undefined) {
            where.controlado = filtros.controlado;
        }

        if (filtros?.classe_terapeutica) {
            where.classe_terapeutica = filtros.classe_terapeutica;
        }

        if (filtros?.busca) {
            where.OR = [
                { nome: { contains: filtros.busca, mode: 'insensitive' } },
                { nome_cientifico: { contains: filtros.busca, mode: 'insensitive' } }
            ];
        }

        return this.prisma.principioAtivo.findMany({
            where,
            include: {
                concentracoes: true,
                ranges: true
            },
            orderBy: { nome: 'asc' }
        });
    }

    /**
     * Buscar princípio ativo por ID com todas as relações
     */
    async buscarPorId(id: string) {
        return this.prisma.principioAtivo.findUnique({
            where: { id },
            include: {
                concentracoes: {
                    orderBy: [
                        { forma_farmaceutica: 'asc' },
                        { valor: 'asc' }
                    ]
                },
                ranges: {
                    orderBy: [
                        { especie: 'asc' },
                        { peso_min_kg: 'asc' }
                    ]
                }
            }
        });
    }

    /**
     * Buscar princípio ativo por nome
     */
    async buscarPorNome(nome: string) {
        return this.prisma.principioAtivo.findUnique({
            where: { nome },
            include: {
                concentracoes: true,
                ranges: true
            }
        });
    }

    /**
     * Criar novo princípio ativo com concentrações e ranges
     */
    async criar(data: PrincipioAtivoCreateInput) {
        return this.prisma.principioAtivo.create({
            data: {
                nome: data.nome,
                nome_cientifico: data.nome_cientifico,
                classe_terapeutica: data.classe_terapeutica,
                controlado: data.controlado || false,
                texto_palatavel: data.texto_palatavel,
                observacoes: data.observacoes,
                concentracoes: data.concentracoes ? {
                    create: data.concentracoes
                } : undefined,
                ranges: data.ranges ? {
                    create: data.ranges
                } : undefined
            },
            include: {
                concentracoes: true,
                ranges: true
            }
        });
    }

    /**
     * Atualizar princípio ativo
     */
    async atualizar(id: string, data: Partial<PrincipioAtivoCreateInput>) {
        return this.prisma.principioAtivo.update({
            where: { id },
            data: {
                nome: data.nome,
                nome_cientifico: data.nome_cientifico,
                classe_terapeutica: data.classe_terapeutica,
                controlado: data.controlado,
                texto_palatavel: data.texto_palatavel,
                observacoes: data.observacoes
            },
            include: {
                concentracoes: true,
                ranges: true
            }
        });
    }

    /**
     * Desativar princípio ativo (soft delete)
     */
    async desativar(id: string) {
        return this.prisma.principioAtivo.update({
            where: { id },
            data: { ativo: false }
        });
    }

    /**
     * Buscar concentrações válidas para um princípio ativo
     */
    async buscarConcentracoes(principioAtivoId: string, formaFarmaceutica?: string) {
        const where: Prisma.ConcentracaoWhereInput = {
            principio_ativo_id: principioAtivoId
        };

        if (formaFarmaceutica) {
            where.forma_farmaceutica = formaFarmaceutica;
        }

        return this.prisma.concentracao.findMany({
            where,
            orderBy: { valor: 'asc' }
        });
    }

    /**
     * Adicionar concentração a um princípio ativo
     */
    async adicionarConcentracao(
        principioAtivoId: string,
        concentracao: {
            valor: number;
            unidade: string;
            forma_farmaceutica?: string;
        }
    ) {
        return this.prisma.concentracao.create({
            data: {
                principio_ativo_id: principioAtivoId,
                ...concentracao
            }
        });
    }

    /**
     * Remover concentração
     */
    async removerConcentracao(concentracaoId: string) {
        return this.prisma.concentracao.delete({
            where: { id: concentracaoId }
        });
    }

    /**
     * Buscar range terapêutico para espécie e peso específicos
     */
    async buscarRange(principioAtivoId: string, especie: string, pesoKg: number) {
        // Buscar range mais específico primeiro (com limites de peso)
        // Se não encontrar, buscar range geral (sem limites de peso)
        return this.prisma.rangeTerapeutico.findFirst({
            where: {
                principio_ativo_id: principioAtivoId,
                especie: especie.toLowerCase(),
                OR: [
                    // Range geral (sem limites de peso)
                    { peso_min_kg: null, peso_max_kg: null },
                    // Range específico que inclui o peso
                    {
                        AND: [
                            { peso_min_kg: { lte: pesoKg } },
                            { peso_max_kg: { gte: pesoKg } }
                        ]
                    }
                ]
            },
            orderBy: [
                // Priorizar range mais específico (com limites de peso)
                { peso_min_kg: 'desc' }
            ]
        });
    }

    /**
     * Adicionar range terapêutico
     */
    async adicionarRange(
        principioAtivoId: string,
        range: {
            especie: string;
            peso_min_kg?: number;
            peso_max_kg?: number;
            dose_min_mg_kg: number;
            dose_max_mg_kg: number;
            frequencia_horas?: number;
            duracao_max_dias?: number;
            observacoes?: string;
        }
    ) {
        return this.prisma.rangeTerapeutico.create({
            data: {
                principio_ativo_id: principioAtivoId,
                ...range,
                especie: range.especie.toLowerCase()
            }
        });
    }

    /**
     * Atualizar range terapêutico
     */
    async atualizarRange(rangeId: string, data: Partial<{
        peso_min_kg: number;
        peso_max_kg: number;
        dose_min_mg_kg: number;
        dose_max_mg_kg: number;
        frequencia_horas: number;
        duracao_max_dias: number;
        observacoes: string;
    }>) {
        return this.prisma.rangeTerapeutico.update({
            where: { id: rangeId },
            data
        });
    }

    /**
     * Remover range terapêutico
     */
    async removerRange(rangeId: string) {
        return this.prisma.rangeTerapeutico.delete({
            where: { id: rangeId }
        });
    }

    /**
     * Listar classes terapêuticas únicas
     */
    async listarClassesTerapeuticas() {
        const result = await this.prisma.principioAtivo.findMany({
            where: {
                classe_terapeutica: { not: null },
                ativo: true
            },
            select: {
                classe_terapeutica: true
            },
            distinct: ['classe_terapeutica']
        });

        return result
            .map(r => r.classe_terapeutica)
            .filter((c): c is string => c !== null)
            .sort();
    }
}
