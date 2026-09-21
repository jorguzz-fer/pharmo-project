/**
 * Parâmetros do simulador de preço (Admin > Insumos).
 *
 * Fora do componente porque são usados tanto para calcular quanto para gravar
 * as condições comerciais da clínica — e porque exportar função de um arquivo
 * de componente quebra o Fast Refresh.
 */
import type { CondicoesComerciaisInput } from '../../services/precificacao.service';

export const CONDICOES_VAZIAS = {
    taxa_manipulacao: '',
    custo_embalagens: '',
    desconto_parceiro: '',
    adicional_entrega: '',
    adicional_biscoito: '',
};

export type CondicoesForm = typeof CONDICOES_VAZIAS;

/** Campos editáveis do cálculo, na mesma ordem em que entram na fórmula. */
export const CAMPOS_SIMULADOR: {
    name: keyof CondicoesForm;
    label: string;
    hint: string;
    step: string;
    max?: string;
}[] = [
    {
        name: 'taxa_manipulacao',
        label: 'Taxa de Manipulação (R$)',
        hint: 'Valor fixo cobrado por manipulação',
        step: '0.01',
    },
    {
        name: 'custo_embalagens',
        label: 'Taxa de Embalagem (R$)',
        hint: 'Custo fixo de embalagem por pedido',
        step: '0.01',
    },
    {
        name: 'desconto_parceiro',
        label: 'Desconto (%)',
        hint: 'Aplicado sobre o subtotal (ex: 40 = 40%)',
        step: '0.1',
        max: '100',
    },
    {
        name: 'adicional_entrega',
        label: 'Frete / Entrega (R$)',
        hint: 'Somado depois do desconto',
        step: '0.01',
    },
    {
        name: 'adicional_biscoito',
        label: 'Adicional Biscoito (R$)',
        hint: 'Só entra quando a forma é biscoito/petisco',
        step: '0.01',
    },
];

/** Converte o texto do input em número, aceitando vírgula como separador decimal. */
export function paraNumero(valor: string): number | undefined {
    if (!valor.trim()) return undefined;
    const n = parseFloat(valor.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
}

export function moeda(valor: number): string {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

export type CondicoesLidas = Record<keyof CondicoesComerciaisInput, number | null>;

/**
 * Lê os cinco parâmetros do formulário do simulador, já no formato do banco
 * (desconto digitado em % vira 0-1). Campo em branco vira null: no cálculo ele
 * é omitido, e vale o da clínica; ao atualizar a clínica ele limpa a condição.
 */
export function lerCondicoes(form: CondicoesForm): { valores: CondicoesLidas } | { erro: string } {
    const desconto = paraNumero(form.desconto_parceiro);
    if (desconto !== undefined && (desconto < 0 || desconto > 100)) {
        return { erro: 'O desconto deve estar entre 0 e 100%' };
    }

    const emReais: (keyof CondicoesComerciaisInput)[] = [
        'taxa_manipulacao',
        'custo_embalagens',
        'adicional_entrega',
        'adicional_biscoito',
    ];
    for (const campo of emReais) {
        const valor = paraNumero(form[campo]);
        if (valor !== undefined && valor < 0) {
            const rotulo = CAMPOS_SIMULADOR.find((c) => c.name === campo)?.label ?? campo;
            return { erro: `${rotulo} não pode ser negativo` };
        }
    }

    return {
        valores: {
            taxa_manipulacao: paraNumero(form.taxa_manipulacao) ?? null,
            custo_embalagens: paraNumero(form.custo_embalagens) ?? null,
            desconto_parceiro: desconto !== undefined ? desconto / 100 : null,
            adicional_entrega: paraNumero(form.adicional_entrega) ?? null,
            adicional_biscoito: paraNumero(form.adicional_biscoito) ?? null,
        },
    };
}
