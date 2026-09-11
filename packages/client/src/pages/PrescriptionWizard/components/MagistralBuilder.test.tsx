import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MagistralBuilder } from './MagistralBuilder';

// Os serviços batem na API; aqui só interessa que o componente monte.
vi.mock('../../../services/insumo.service', () => ({
    insumoService: { buscar: vi.fn().mockResolvedValue({ data: [] }) },
    formaFarmaceuticaService: {
        listar: vi.fn().mockResolvedValue([
            { id: '1', nome: 'CÁPSULAS', ativo: true },
            { id: '2', nome: 'BISCOITOS', ativo: true },
        ]),
    },
}));

vi.mock('../../../services/precificacao.service', () => ({
    precificacaoService: { calcular: vi.fn().mockResolvedValue(null) },
}));

describe('MagistralBuilder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Regressão: quantidadeCalculada entrava na lista de dependências de um
     * useEffect declarado acima da própria constante. A lista é avaliada durante
     * o render, então todo render lançava ReferenceError (temporal dead zone) e
     * o modal abria em tela branca.
     */
    it('monta sem lançar erro', () => {
        expect(() =>
            render(<MagistralBuilder onCancel={() => {}} onConfirm={() => {}} />)
        ).not.toThrow();

        expect(screen.getByText('Formulação Magistral')).toBeInTheDocument();
    });

    it('monta em modo edição, com dados iniciais', () => {
        expect(() =>
            render(
                <MagistralBuilder
                    onCancel={() => {}}
                    onConfirm={() => {}}
                    initial={{
                        nomeFormulacao: 'Fórmula teste',
                        forma: 'CÁPSULAS',
                        dias: 30,
                        frequencia_horas: 8,
                        aroma: 'CARNE',
                        uso_continuo: true,
                        ingredientes: [
                            { codigo_interno: 665, descricao: 'Gabapentina', dosagem_mg: 25 },
                        ],
                    }}
                />
            )
        ).not.toThrow();

        expect(screen.getByDisplayValue('Fórmula teste')).toBeInTheDocument();
        // A posologia é recalculada a partir dos dados iniciais: 30 dias a cada 8h
        // = 3 doses/dia × 30 = 90. Aparece no campo de quantidade e no resumo.
        expect(screen.getAllByText('90').length).toBeGreaterThan(0);
    });
});
