import { Especie, ValidacaoTipo } from '@prisma/client';
import { prisma } from '../../shared/utils/prisma';
import { verificarFaixaTerapeutica } from '../../shared/utils/dosagem';

export interface ValidacaoResultItem {
  principio_ativo_id: string;
  principio_ativo_nome: string;
  dose_mg_kg: number;
  especie: Especie;
  peso_kg: number;
  dentroFaixa: boolean;
  percentualDesvio?: number;
  faixa_min?: number;
  faixa_max?: number;
  faixas_encontradas: number;
  alertas: string[];
}

export interface ValidacaoResult {
  valida: boolean;
  itens: ValidacaoResultItem[];
  itens_fora_faixa: number;
}

export class ValidacaoService {
  /**
   * Valida todos os itens de uma prescricao contra as faixas terapeuticas
   */
  async validarItens(
    itens: Array<{
      principio_ativo_id: string;
      dose_mg_kg: number;
    }>,
    especie: Especie,
    peso_kg: number,
  ): Promise<ValidacaoResult> {
    const resultados: ValidacaoResultItem[] = [];

    for (const item of itens) {
      const ativo = await prisma.principioAtivo.findUnique({
        where: { id: item.principio_ativo_id },
        include: {
          faixas_terapeuticas: {
            where: {
              especie,
              OR: [
                { peso_min_kg: null, peso_max_kg: null },
                {
                  peso_min_kg: { lte: peso_kg },
                  peso_max_kg: { gte: peso_kg },
                },
                { peso_min_kg: { lte: peso_kg }, peso_max_kg: null },
                { peso_min_kg: null, peso_max_kg: { gte: peso_kg } },
              ],
            },
          },
        },
      });

      if (!ativo) {
        resultados.push({
          principio_ativo_id: item.principio_ativo_id,
          principio_ativo_nome: 'Desconhecido',
          dose_mg_kg: item.dose_mg_kg,
          especie,
          peso_kg,
          dentroFaixa: false,
          faixas_encontradas: 0,
          alertas: ['Principio ativo nao encontrado'],
        });
        continue;
      }

      const alertas: string[] = [];
      let dentroFaixa = true;
      let percentualDesvio: number | undefined;
      let faixaMin: number | undefined;
      let faixaMax: number | undefined;

      if (ativo.faixas_terapeuticas.length === 0) {
        alertas.push(`Nenhuma faixa terapeutica cadastrada para ${ativo.nome_padronizado} em ${especie}`);
        // Sem faixa = considerar valido mas com alerta
      } else {
        // Usar a faixa mais especifica (com peso definido tem prioridade)
        const faixa = ativo.faixas_terapeuticas.sort((a, b) => {
          const aSpecific = a.peso_min_kg !== null ? 1 : 0;
          const bSpecific = b.peso_min_kg !== null ? 1 : 0;
          return bSpecific - aSpecific;
        })[0];

        faixaMin = Number(faixa.dose_min_mg_kg);
        faixaMax = Number(faixa.dose_max_mg_kg);

        const resultado = verificarFaixaTerapeutica(item.dose_mg_kg, faixaMin, faixaMax);
        dentroFaixa = resultado.dentroFaixa;
        percentualDesvio = resultado.percentualDesvio;

        if (!dentroFaixa) {
          alertas.push(
            `Dose ${item.dose_mg_kg}mg/kg esta fora da faixa terapeutica (${faixaMin}-${faixaMax}mg/kg) para ${ativo.nome_padronizado}. Desvio: ${percentualDesvio}%`,
          );
        }
      }

      if (ativo.controlado) {
        alertas.push(`${ativo.nome_padronizado} e um medicamento CONTROLADO - requer assinatura digital`);
      }

      resultados.push({
        principio_ativo_id: item.principio_ativo_id,
        principio_ativo_nome: ativo.nome_padronizado,
        dose_mg_kg: item.dose_mg_kg,
        especie,
        peso_kg,
        dentroFaixa,
        percentualDesvio,
        faixa_min: faixaMin,
        faixa_max: faixaMax,
        faixas_encontradas: ativo.faixas_terapeuticas.length,
        alertas,
      });
    }

    return {
      valida: resultados.every((r) => r.dentroFaixa),
      itens: resultados,
      itens_fora_faixa: resultados.filter((r) => !r.dentroFaixa).length,
    };
  }

  /**
   * Registra log juridico de validacao
   */
  async registrarLog(params: {
    prescricao_id: string;
    prescricao_item_id?: string;
    clinica_id: string;
    veterinario_id: string;
    tipo: ValidacaoTipo;
    dose_prescrita_mg_kg: number;
    dose_min_mg_kg?: number;
    dose_max_mg_kg?: number;
    especie: Especie;
    peso_animal_kg: number;
    principio_ativo_nome: string;
    motivo_aceite?: string;
    ip_address?: string;
    user_agent?: string;
  }) {
    return prisma.validacaoLog.create({ data: params });
  }

  /**
   * Busca logs de validacao por prescricao
   */
  async getLogsPorPrescricao(prescricaoId: string) {
    return prisma.validacaoLog.findMany({
      where: { prescricao_id: prescricaoId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Busca logs de validacao com filtros
   */
  async getLogs(clinicaId: string, filtros: {
    tipo?: ValidacaoTipo;
    veterinario_id?: string;
    data_inicio?: Date;
    data_fim?: Date;
    limit?: number;
  }) {
    return prisma.validacaoLog.findMany({
      where: {
        clinica_id: clinicaId,
        ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros.veterinario_id ? { veterinario_id: filtros.veterinario_id } : {}),
        ...(filtros.data_inicio || filtros.data_fim
          ? {
              created_at: {
                ...(filtros.data_inicio ? { gte: filtros.data_inicio } : {}),
                ...(filtros.data_fim ? { lte: filtros.data_fim } : {}),
              },
            }
          : {}),
      },
      include: {
        veterinario: { select: { nome: true, crmv: true, uf_crmv: true } },
      },
      orderBy: { created_at: 'desc' },
      take: filtros.limit || 100,
    });
  }
}
