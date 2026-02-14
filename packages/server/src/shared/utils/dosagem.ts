import { Decimal } from '@prisma/client/runtime/library';

/**
 * Calcula a dose total em mg para um animal
 * dose_mg_kg * peso_kg = dose_total_mg
 */
export function calcularDoseTotal(dose_mg_kg: number, peso_kg: number): number {
  return Math.round(dose_mg_kg * peso_kg * 100) / 100;
}

/**
 * Calcula quantidade total de unidades (capsulas, comprimidos, etc)
 * baseado na frequencia e duracao
 *
 * Ex: 1 capsula a cada 8h por 10 dias
 * = (24/8) * 10 = 30 capsulas
 */
export function calcularQuantidadeTotal(
  frequencia_horas: number,
  duracao_dias: number,
): number {
  if (frequencia_horas <= 0 || duracao_dias <= 0) return 0;
  const doses_por_dia = 24 / frequencia_horas;
  return Math.ceil(doses_por_dia * duracao_dias);
}

/**
 * Gera texto de posologia automatico
 *
 * Ex: "Administrar 1 capsula de 10mg a cada 8 horas, durante 10 dias (total: 30 capsulas)"
 */
export function gerarPosologiaTexto(params: {
  principio_ativo: string;
  forma_farmaceutica: string;
  concentracao_valor?: number;
  concentracao_unidade?: string;
  dose_mg_kg: number;
  frequencia_horas: number;
  duracao_dias: number;
  quantidade_total: number;
}): string {
  const {
    principio_ativo,
    forma_farmaceutica,
    concentracao_valor,
    concentracao_unidade,
    dose_mg_kg,
    frequencia_horas,
    duracao_dias,
    quantidade_total,
  } = params;

  const forma = forma_farmaceutica.toLowerCase();
  const concentracao = concentracao_valor
    ? ` de ${concentracao_valor}${concentracao_unidade || 'mg'}`
    : '';

  const frequenciaTexto = frequencia_horas === 24
    ? 'uma vez ao dia'
    : frequencia_horas === 12
      ? 'a cada 12 horas'
      : `a cada ${frequencia_horas} horas`;

  return `${principio_ativo}${concentracao} - Administrar 1 ${forma} ${frequenciaTexto}, durante ${duracao_dias} dias. Dose: ${dose_mg_kg}mg/kg. Total: ${quantidade_total} ${forma}(s).`;
}

/**
 * Converte entre unidades de dose
 */
export function converterUnidade(
  valor: number,
  de: 'MG' | 'G' | 'ML' | 'MCG' | 'UI',
  para: 'MG' | 'G' | 'ML' | 'MCG' | 'UI',
): number {
  if (de === para) return valor;

  // Conversoes comuns
  const conversoes: Record<string, Record<string, number>> = {
    MG: { G: 0.001, MCG: 1000 },
    G: { MG: 1000, MCG: 1000000 },
    MCG: { MG: 0.001, G: 0.000001 },
  };

  const fator = conversoes[de]?.[para];
  if (!fator) {
    throw new Error(`Conversao de ${de} para ${para} nao suportada`);
  }

  return Math.round(valor * fator * 10000) / 10000;
}

/**
 * Verifica se dose esta dentro da faixa terapeutica
 */
export function verificarFaixaTerapeutica(
  dose_mg_kg: number,
  faixa_min: number,
  faixa_max: number,
): { dentroFaixa: boolean; percentualDesvio?: number } {
  if (dose_mg_kg >= faixa_min && dose_mg_kg <= faixa_max) {
    return { dentroFaixa: true };
  }

  const percentualDesvio = dose_mg_kg < faixa_min
    ? ((faixa_min - dose_mg_kg) / faixa_min) * -100
    : ((dose_mg_kg - faixa_max) / faixa_max) * 100;

  return {
    dentroFaixa: false,
    percentualDesvio: Math.round(percentualDesvio * 100) / 100,
  };
}
