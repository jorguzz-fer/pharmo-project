/**
 * Testes do motor de precificação, focados nas condições comerciais:
 * de onde vem cada parâmetro (clínica, valor informado, padrão) e como
 * ele entra no valor final.
 */

const mockClinicaFindUnique = jest.fn();
const mockInsumoFindUnique = jest.fn();
const mockFormaFindFirst = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    clinica: { findUnique: mockClinicaFindUnique },
    insumoFarmaceutico: { findUnique: mockInsumoFindUnique },
    formaFarmaceutica: { findFirst: mockFormaFindFirst },
  })),
}));

import { PrecificacaoService } from './precificacao.service';

const service = new PrecificacaoService();

// 100 mg × 10 doses = 1 g × R$ 2,00/g × markup 2x = R$ 4,00 de matéria-prima
const INSUMO = {
  id: 'insumo-1',
  codigo_interno: 665,
  descricao: 'Gabapentina',
  valor_custo: 2,
  custo_referencia: 1,
  markup: 200,
  un_manipulacao: 'mg',
  estoque: 100,
  controlado: false,
  lista_controle: null,
  regras_excecao: [],
};

const INGREDIENTES = [{ codigo_interno: 665, dosagem_mg: 100, quantidade: 10 }];

const CLINICA = {
  nome_fantasia: 'Clínica Teste',
  taxa_manipulacao: 10,
  custo_embalagens: 5,
  desconto_parceiro: 0.4,
  adicional_entrega: 20,
  adicional_biscoito: 8,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockInsumoFindUnique.mockResolvedValue(INSUMO);
  mockFormaFindFirst.mockResolvedValue({ id: 'forma-1', nome: 'CÁPSULAS', ativo: true });
  mockClinicaFindUnique.mockResolvedValue(CLINICA);
});

describe('PrecificacaoService — condições da clínica', () => {
  it('usa os valores cadastrados quando nada é informado', async () => {
    const r = await service.calcular({
      ingredientes: INGREDIENTES,
      forma_farmaceutica: 'CÁPSULAS',
      clinica_id: 'clinica-1',
    });

    expect(r.total_materia_prima).toBe(4);
    expect(r.subtotal).toBe(19); // 4 + 10 + 5
    expect(r.desconto_valor).toBe(7.6); // 40% de 19
    expect(r.valor_com_desconto).toBe(11.4);
    expect(r.valor_final).toBe(31.4); // + 20 de entrega
    expect(r.condicoes_origem.desconto_parceiro).toBe('clinica');
  });

  it('marca como padrão os parâmetros sem clínica e sem valores informados', async () => {
    const r = await service.calcular({
      ingredientes: INGREDIENTES,
      forma_farmaceutica: 'CÁPSULAS',
    });

    expect(r.valor_final).toBe(4);
    expect(r.condicoes_origem.taxa_manipulacao).toBe('padrao');
    expect(r.avisos).toContain('Nenhuma clínica informada — preço sem condições comerciais');
  });
});

describe('PrecificacaoService — condições informadas manualmente', () => {
  it('calcula só com os valores informados, sem clínica', async () => {
    const r = await service.calcular({
      ingredientes: INGREDIENTES,
      forma_farmaceutica: 'CÁPSULAS',
      condicoes: {
        taxa_manipulacao: 10,
        custo_embalagens: 5,
        desconto_parceiro: 0.4,
        adicional_entrega: 20,
      },
    });

    expect(r.valor_final).toBe(31.4);
    expect(mockClinicaFindUnique).not.toHaveBeenCalled();
    expect(r.condicoes_origem.custo_embalagens).toBe('manual');
    expect(r.condicoes_origem.adicional_biscoito).toBe('padrao');
  });

  it('sobrepõe campo a campo o cadastro da clínica', async () => {
    const r = await service.calcular({
      ingredientes: INGREDIENTES,
      forma_farmaceutica: 'CÁPSULAS',
      clinica_id: 'clinica-1',
      condicoes: { desconto_parceiro: 0.5 }, // 40% da clínica → 50%
    });

    expect(r.desconto_parceiro_pct).toBe(0.5);
    expect(r.desconto_valor).toBe(9.5); // 50% de 19
    expect(r.valor_final).toBe(29.5); // 9,5 + 20 de entrega
    expect(r.condicoes_origem.desconto_parceiro).toBe('manual');
    // O que não foi informado continua vindo da clínica
    expect(r.taxa_manipulacao).toBe(10);
    expect(r.condicoes_origem.taxa_manipulacao).toBe('clinica');
    expect(r.avisos.some((a) => a.includes('substitui o cadastro da clínica'))).toBe(true);
  });

  it('aceita zero como valor informado, sem cair no cadastro da clínica', async () => {
    const r = await service.calcular({
      ingredientes: INGREDIENTES,
      forma_farmaceutica: 'CÁPSULAS',
      clinica_id: 'clinica-1',
      condicoes: { adicional_entrega: 0, desconto_parceiro: 0 },
    });

    expect(r.adicional_entrega).toBe(0);
    expect(r.desconto_valor).toBe(0);
    expect(r.valor_final).toBe(19); // subtotal cheio, sem desconto nem frete
    expect(r.condicoes_origem.adicional_entrega).toBe('manual');
  });

  it('aplica o adicional de biscoito informado somente na forma biscoito', async () => {
    mockFormaFindFirst.mockResolvedValue({ id: 'forma-2', nome: 'BISCOITOS', ativo: true });

    const biscoito = await service.calcular({
      ingredientes: INGREDIENTES,
      forma_farmaceutica: 'BISCOITOS',
      condicoes: { adicional_biscoito: 8 },
    });
    expect(biscoito.adicional_biscoito).toBe(8);
    expect(biscoito.valor_final).toBe(12); // 4 de matéria-prima + 8

    mockFormaFindFirst.mockResolvedValue({ id: 'forma-1', nome: 'CÁPSULAS', ativo: true });
    const capsula = await service.calcular({
      ingredientes: INGREDIENTES,
      forma_farmaceutica: 'CÁPSULAS',
      condicoes: { adicional_biscoito: 8 },
    });
    expect(capsula.adicional_biscoito).toBe(0);
    expect(capsula.valor_final).toBe(4);
  });
});
