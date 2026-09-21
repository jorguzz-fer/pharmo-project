import { describe, it, expect } from 'vitest';
import { lerCondicoes } from './simuladorPrecificacao';

/**
 * `lerCondicoes` decide o que o simulador manda para o cálculo e, em
 * "Atualizar Clínica", o que é gravado no cadastro do parceiro. Um erro de
 * conversão aqui grava condição comercial errada sem ninguém perceber.
 */

const VAZIO = {
    taxa_manipulacao: '',
    custo_embalagens: '',
    desconto_parceiro: '',
    adicional_entrega: '',
    adicional_biscoito: '',
};

function valores(form: typeof VAZIO) {
    const lido = lerCondicoes(form);
    if ('erro' in lido) throw new Error(`esperava sucesso, veio erro: ${lido.erro}`);
    return lido.valores;
}

function erro(form: typeof VAZIO) {
    const lido = lerCondicoes(form);
    if (!('erro' in lido)) throw new Error('esperava erro, veio sucesso');
    return lido.erro;
}

describe('lerCondicoes', () => {
    it('converte o desconto de % para a fração gravada no banco', () => {
        expect(valores({ ...VAZIO, desconto_parceiro: '40' }).desconto_parceiro).toBe(0.4);
        expect(valores({ ...VAZIO, desconto_parceiro: '7.5' }).desconto_parceiro).toBe(0.075);
        expect(valores({ ...VAZIO, desconto_parceiro: '100' }).desconto_parceiro).toBe(1);
    });

    it('aceita vírgula como separador decimal', () => {
        expect(valores({ ...VAZIO, taxa_manipulacao: '12,50' }).taxa_manipulacao).toBe(12.5);
        expect(valores({ ...VAZIO, desconto_parceiro: '7,5' }).desconto_parceiro).toBe(0.075);
    });

    it('trata campo em branco como null, não como zero', () => {
        expect(valores(VAZIO)).toEqual({
            taxa_manipulacao: null,
            custo_embalagens: null,
            desconto_parceiro: null,
            adicional_entrega: null,
            adicional_biscoito: null,
        });
    });

    it('preserva o zero digitado', () => {
        const lidos = valores({ ...VAZIO, adicional_entrega: '0', desconto_parceiro: '0' });
        expect(lidos.adicional_entrega).toBe(0);
        expect(lidos.desconto_parceiro).toBe(0);
    });

    it('lê os cinco campos de uma vez', () => {
        expect(valores({
            taxa_manipulacao: '10',
            custo_embalagens: '5',
            desconto_parceiro: '40',
            adicional_entrega: '20',
            adicional_biscoito: '8',
        })).toEqual({
            taxa_manipulacao: 10,
            custo_embalagens: 5,
            desconto_parceiro: 0.4,
            adicional_entrega: 20,
            adicional_biscoito: 8,
        });
    });

    it('recusa desconto fora de 0 a 100%', () => {
        expect(erro({ ...VAZIO, desconto_parceiro: '120' })).toMatch(/desconto/i);
        expect(erro({ ...VAZIO, desconto_parceiro: '-1' })).toMatch(/desconto/i);
    });

    it('recusa valor negativo em reais', () => {
        expect(erro({ ...VAZIO, taxa_manipulacao: '-5' })).toMatch(/Taxa de Manipulação/i);
        expect(erro({ ...VAZIO, adicional_entrega: '-0.01' })).toMatch(/Frete/i);
    });
});
