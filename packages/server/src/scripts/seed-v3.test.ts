/**
 * Garante que recarregar a base não desfaz as correções de preço feitas em
 * Admin > Insumos — e que ainda existe um jeito explícito de forçar o arquivo.
 */

const mockFindUnique = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    insumoFarmaceutico: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
    },
    formaFarmaceutica: { findUnique: jest.fn(), create: jest.fn() },
    regraExcecao: { findUnique: jest.fn(), create: jest.fn() },
    $disconnect: jest.fn(),
  })),
}));

const DO_ARQUIVO = {
  codigo_interno: 665,
  descricao: 'Gabapentina',
  valor_custo: 2,
  custo_referencia: 1,
  markup: 648,
  un_manipulacao: 'mg',
  estoque: 100,
  calculo_tipo: 'Cápsula',
};

jest.mock('fs', () => ({
  existsSync: () => true,
  readFileSync: () => JSON.stringify([DO_ARQUIVO]),
}));

/** Recarrega o módulo para reavaliar a leitura da variável de ambiente. */
function carregarSeed() {
  let seed: typeof import('./seed-v3');
  jest.isolateModules(() => {
    seed = require('./seed-v3');
  });
  return seed!;
}

// O insumo no banco tem preço diferente do arquivo: foi corrigido no painel.
const NO_BANCO = {
  id: 'insumo-1',
  codigo_interno: 665,
  valor_custo: 3.5,
  custo_referencia: 1,
  markup: 648,
};

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.SEED_SOBRESCREVER_CUSTOS;
  mockCreate.mockResolvedValue({});
  mockUpdate.mockResolvedValue({});
});

describe('seedInsumos', () => {
  it('não sobrescreve o preço de um insumo já cadastrado', async () => {
    mockFindUnique.mockResolvedValue(NO_BANCO);

    await carregarSeed().seedInsumos();

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const dados = mockUpdate.mock.calls[0][0].data;
    expect(dados).not.toHaveProperty('valor_custo');
    expect(dados).not.toHaveProperty('custo_referencia');
    expect(dados).not.toHaveProperty('markup');
  });

  it('continua atualizando os demais campos do insumo existente', async () => {
    mockFindUnique.mockResolvedValue(NO_BANCO);

    await carregarSeed().seedInsumos();

    expect(mockUpdate.mock.calls[0][0].data).toEqual({
      descricao: 'Gabapentina',
      un_manipulacao: 'mg',
      estoque: 100,
      calculo_tipo: 'Cápsula',
    });
  });

  it('grava o preço do arquivo em insumo novo', async () => {
    mockFindUnique.mockResolvedValue(null);

    await carregarSeed().seedInsumos();

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          codigo_interno: 665,
          valor_custo: 2,
          custo_referencia: 1,
          markup: 648,
        }),
      })
    );
  });

  it('força os preços do arquivo com SEED_SOBRESCREVER_CUSTOS=true', async () => {
    process.env.SEED_SOBRESCREVER_CUSTOS = 'true';
    mockFindUnique.mockResolvedValue(NO_BANCO);

    await carregarSeed().seedInsumos();

    expect(mockUpdate.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        valor_custo: 2,
        custo_referencia: 1,
        markup: 648,
      })
    );
  });
});
