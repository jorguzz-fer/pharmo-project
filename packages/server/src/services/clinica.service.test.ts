/**
 * Testes do cadastro de clínica, focados nas condições comerciais que agora
 * entram já na criação.
 */

const mockClinicaCreate = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    clinica: { create: mockClinicaCreate },
  })),
  ClinicaStatus: { PENDENTE: 'PENDENTE', APROVADA: 'APROVADA' },
}));

import { ClinicaService } from './clinica.service';

const service = new ClinicaService();

const CADASTRO = {
  nome_fantasia: 'Clínica Teste',
  razao_social: 'Clínica Teste LTDA',
  cnpj: '12.345.678/0001-90',
  email: 'contato@teste.com.br',
  responsavel_legal: 'Fulano de Tal',
  cpf_responsavel: '123.456.789-00',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockClinicaCreate.mockResolvedValue({ id: 'clinica-1' });
});

describe('ClinicaService.create', () => {
  it('grava as condições comerciais informadas no cadastro', async () => {
    await service.create({
      ...CADASTRO,
      taxa_manipulacao: 10,
      custo_embalagens: 5,
      desconto_parceiro: 0.4,
      adicional_entrega: 20,
      adicional_biscoito: 8,
    });

    expect(mockClinicaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taxa_manipulacao: 10,
          custo_embalagens: 5,
          desconto_parceiro: 0.4,
          adicional_entrega: 20,
          adicional_biscoito: 8,
        }),
      })
    );
  });

  it('deixa como null a condição não informada', async () => {
    await service.create({ ...CADASTRO, taxa_manipulacao: 10 });

    expect(mockClinicaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taxa_manipulacao: 10,
          custo_embalagens: null,
          desconto_parceiro: null,
          adicional_entrega: null,
          adicional_biscoito: null,
        }),
      })
    );
  });

  it('preserva o zero informado, em vez de trocar por null', async () => {
    await service.create({ ...CADASTRO, desconto_parceiro: 0, adicional_entrega: 0 });

    expect(mockClinicaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          desconto_parceiro: 0,
          adicional_entrega: 0,
        }),
      })
    );
  });

  it('limpa a formatação do CNPJ', async () => {
    await service.create(CADASTRO);

    expect(mockClinicaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cnpj: '12345678000190' }),
      })
    );
  });
});
