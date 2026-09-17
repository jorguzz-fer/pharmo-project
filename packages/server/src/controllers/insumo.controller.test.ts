/**
 * Testes do cadastro de insumos pelo painel: as regras que protegem o código
 * interno (único) e o vínculo entre "controlado" e a lista de controle.
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
  })),
}));

import { Request, Response } from 'express';
import { InsumoController } from './insumo.controller';

const controller = new InsumoController();

const INSUMO_VALIDO = {
  codigo_interno: 665,
  descricao: 'Gabapentina',
  valor_custo: 2,
  custo_referencia: 1,
  markup: 648,
  un_manipulacao: 'mg',
  estoque: 100,
  calculo_tipo: 'Cápsula',
};

function mockRes() {
  const res = {} as Response & { status: jest.Mock; json: jest.Mock };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(body: unknown, params: Record<string, string> = {}) {
  return { body, params } as unknown as Request;
}

/** O Prisma devolve o registro salvo; o conteúdo não importa para estes testes. */
const REGISTRO_SALVO = { ...INSUMO_VALIDO, id: 'insumo-1', ativo: true, controlado: false, lista_controle: null, regras_excecao: [] };

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue(REGISTRO_SALVO);
  mockUpdate.mockResolvedValue(REGISTRO_SALVO);
});

describe('InsumoController.criar', () => {
  it('cria quando o código interno está livre', async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = mockRes();

    await controller.criar(mockReq(INSUMO_VALIDO), res);

    expect(mockCreate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('recusa um código interno já usado por insumo ativo', async () => {
    mockFindUnique.mockResolvedValue({ id: 'outro', ativo: true });
    const res = mockRes();

    await controller.criar(mockReq(INSUMO_VALIDO), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('reativa o insumo inativo que já ocupa o código interno', async () => {
    mockFindUnique.mockResolvedValue({ id: 'antigo', ativo: false });
    const res = mockRes();

    await controller.criar(mockReq(INSUMO_VALIDO), res);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'antigo' },
        data: expect.objectContaining({ ativo: true }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejeita custo negativo', async () => {
    const res = mockRes();

    await controller.criar(mockReq({ ...INSUMO_VALIDO, valor_custo: -1 }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('só grava a lista de controle quando o insumo é controlado', async () => {
    mockFindUnique.mockResolvedValue(null);

    await controller.criar(mockReq({ ...INSUMO_VALIDO, controlado: false, lista_controle: 'C1' }), mockRes());
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ controlado: false, lista_controle: null }),
      })
    );

    mockCreate.mockClear();
    await controller.criar(mockReq({ ...INSUMO_VALIDO, controlado: true, lista_controle: 'c1' }), mockRes());
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ controlado: true, lista_controle: 'C1' }),
      })
    );
  });
});

describe('InsumoController.atualizar', () => {
  it('atualiza o custo mantendo o código interno', async () => {
    mockFindUnique.mockResolvedValue({ id: 'insumo-1', codigo_interno: 665, ativo: true });
    const res = mockRes();

    await controller.atualizar(mockReq({ ...INSUMO_VALIDO, valor_custo: 3.5 }, { id: 'insumo-1' }), res);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'insumo-1' },
        data: expect.objectContaining({ valor_custo: 3.5 }),
      })
    );
    expect(res.status).not.toHaveBeenCalledWith(409);
  });

  it('recusa mudar para um código interno de outro insumo', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: 'insumo-1', codigo_interno: 665, ativo: true }) // o que está sendo editado
      .mockResolvedValueOnce({ id: 'insumo-2', codigo_interno: 700, ativo: true }); // o dono do novo código
    const res = mockRes();

    await controller.atualizar(mockReq({ ...INSUMO_VALIDO, codigo_interno: 700 }, { id: 'insumo-1' }), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('devolve 404 para insumo inexistente', async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = mockRes();

    await controller.atualizar(mockReq(INSUMO_VALIDO, { id: 'sumiu' }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('InsumoController.toggleControlado', () => {
  it('exige a lista ao marcar como controlado', async () => {
    const res = mockRes();

    await controller.toggleControlado(mockReq({ controlado: true }, { id: 'insumo-1' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('limpa a lista ao desmarcar', async () => {
    mockFindUnique.mockResolvedValue({ id: 'insumo-1', controlado: true, lista_controle: 'C1' });

    await controller.toggleControlado(mockReq({ controlado: false }, { id: 'insumo-1' }), mockRes());

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { controlado: false, lista_controle: null },
      })
    );
  });
});
