import { Especie } from '@prisma/client';
import { prisma } from '../../shared/utils/prisma';
import { AppError } from '../../shared/errors/app-error';
import { calcularDoseTotal, calcularQuantidadeTotal, gerarPosologiaTexto } from '../../shared/utils/dosagem';
import { ValidacaoService } from '../validacao/validacao.service';
import { CreatePrescricaoInput, UpdatePrescricaoInput, AceiteForaFaixaInput, CalcularPreviewInput } from './prescricao.schema';
import { AuthUser } from '../../shared/types/express.d';

const validacaoService = new ValidacaoService();

export class PrescricaoService {
  /**
   * Cria uma prescricao (modo A via protocolo ou modo B manual)
   */
  async create(user: AuthUser, data: CreatePrescricaoInput) {
    const clinicaId = user.clinica_id;

    // Verificar tutor pertence a clinica
    const tutor = await prisma.tutor.findFirst({
      where: { id: data.tutor_id, clinica_id: clinicaId },
    });
    if (!tutor) throw AppError.notFound('Tutor nao encontrado nesta clinica');

    // Verificar animal pertence ao tutor
    const animal = await prisma.animal.findFirst({
      where: { id: data.animal_id, tutor_id: data.tutor_id, clinica_id: clinicaId },
    });
    if (!animal) throw AppError.notFound('Animal nao encontrado');
    if (!animal.peso_kg) throw AppError.badRequest('Animal precisa ter peso cadastrado para prescricao');

    // Verificar veterinario
    if (!user.veterinario_id) {
      throw AppError.badRequest('Usuario precisa ser veterinario para criar prescricao');
    }

    const pesoKg = Number(animal.peso_kg);

    // Se modo A (protocolo), carregar itens do protocolo
    let itens = data.itens;
    if (data.protocolo_id && (!itens || itens.length === 0)) {
      const protocolo = await prisma.protocolo.findFirst({
        where: {
          id: data.protocolo_id,
          OR: [{ clinica_id: clinicaId }, { clinica_id: null }],
        },
        include: { itens: { orderBy: { ordem: 'asc' } } },
      });
      if (!protocolo) throw AppError.notFound('Protocolo nao encontrado');

      itens = protocolo.itens.map((pi) => ({
        principio_ativo_id: pi.principio_ativo_id,
        concentracao_id: pi.concentracao_id ?? undefined,
        dose_mg_kg: Number(pi.dose_mg_kg),
        frequencia_horas: pi.frequencia_horas,
        duracao_dias: pi.duracao_dias,
        forma_farmaceutica: 'CAPSULA' as const,
        observacoes: pi.observacoes ?? undefined,
        ordem: pi.ordem,
      }));
    }

    // Calcular totais e gerar posologia para cada item
    const itensComCalculo = await Promise.all(
      itens.map(async (item, index) => {
        const ativo = await prisma.principioAtivo.findUnique({
          where: { id: item.principio_ativo_id },
        });
        if (!ativo) throw AppError.notFound(`Principio ativo ${item.principio_ativo_id} nao encontrado`);

        let concentracao;
        if (item.concentracao_id) {
          concentracao = await prisma.principioAtivoConcentracao.findUnique({
            where: { id: item.concentracao_id },
          });
        }

        const doseTotalMg = calcularDoseTotal(item.dose_mg_kg, pesoKg);
        const quantidadeTotal = calcularQuantidadeTotal(item.frequencia_horas, item.duracao_dias);
        const posologiaTexto = gerarPosologiaTexto({
          principio_ativo: ativo.nome_padronizado,
          forma_farmaceutica: item.forma_farmaceutica,
          concentracao_valor: concentracao ? Number(concentracao.valor) : undefined,
          concentracao_unidade: concentracao?.unidade,
          dose_mg_kg: item.dose_mg_kg,
          frequencia_horas: item.frequencia_horas,
          duracao_dias: item.duracao_dias,
          quantidade_total: quantidadeTotal,
        });

        return {
          principio_ativo_id: item.principio_ativo_id,
          concentracao_id: item.concentracao_id,
          dose_mg_kg: item.dose_mg_kg,
          dose_total_mg: doseTotalMg,
          frequencia_horas: item.frequencia_horas,
          duracao_dias: item.duracao_dias,
          quantidade_total: quantidadeTotal,
          forma_farmaceutica: item.forma_farmaceutica,
          posologia_texto: posologiaTexto,
          observacoes: item.observacoes,
          ordem: item.ordem ?? index,
        };
      }),
    );

    // Criar prescricao
    const prescricao = await prisma.prescricao.create({
      data: {
        clinica_id: clinicaId,
        usuario_id: user.id,
        veterinario_id: user.veterinario_id,
        tutor_id: data.tutor_id,
        animal_id: data.animal_id,
        protocolo_id: data.protocolo_id,
        diagnostico: data.diagnostico,
        observacoes: data.observacoes,
        itens: { create: itensComCalculo },
      },
      include: {
        itens: {
          include: {
            principio_ativo: { select: { id: true, nome_padronizado: true, controlado: true } },
            concentracao: true,
          },
          orderBy: { ordem: 'asc' },
        },
        tutor: { select: { id: true, nome: true } },
        animal: { select: { id: true, nome: true, especie: true, peso_kg: true } },
        veterinario: { select: { id: true, nome: true, crmv: true, uf_crmv: true } },
      },
    });

    return prescricao;
  }

  /**
   * Valida prescricao contra faixas terapeuticas
   */
  async validar(clinicaId: string, prescricaoId: string) {
    const prescricao = await prisma.prescricao.findFirst({
      where: { id: prescricaoId, clinica_id: clinicaId },
      include: {
        itens: {
          include: { principio_ativo: true },
        },
        animal: true,
      },
    });

    if (!prescricao) throw AppError.notFound('Prescricao nao encontrada');
    if (!prescricao.animal.peso_kg) throw AppError.badRequest('Animal sem peso cadastrado');

    const resultado = await validacaoService.validarItens(
      prescricao.itens.map((i) => ({
        principio_ativo_id: i.principio_ativo_id,
        dose_mg_kg: Number(i.dose_mg_kg),
      })),
      prescricao.animal.especie,
      Number(prescricao.animal.peso_kg),
    );

    // Registrar logs de validacao para cada item
    for (const item of resultado.itens) {
      const prescItem = prescricao.itens.find((pi) => pi.principio_ativo_id === item.principio_ativo_id);

      await validacaoService.registrarLog({
        prescricao_id: prescricaoId,
        prescricao_item_id: prescItem?.id,
        clinica_id: clinicaId,
        veterinario_id: prescricao.veterinario_id,
        tipo: item.dentroFaixa ? 'DENTRO_FAIXA' : 'FORA_FAIXA_REJEITADO',
        dose_prescrita_mg_kg: item.dose_mg_kg,
        dose_min_mg_kg: item.faixa_min,
        dose_max_mg_kg: item.faixa_max,
        especie: prescricao.animal.especie,
        peso_animal_kg: Number(prescricao.animal.peso_kg),
        principio_ativo_nome: item.principio_ativo_nome,
      });
    }

    // Se todos dentro da faixa, marcar como VALIDADA
    if (resultado.valida) {
      await prisma.prescricao.update({
        where: { id: prescricaoId },
        data: { status: 'VALIDADA' },
      });
    }

    return resultado;
  }

  /**
   * Aceitar prescricao fora do range com motivo juridico
   */
  async aceiteForaFaixa(
    user: AuthUser,
    prescricaoId: string,
    data: AceiteForaFaixaInput,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const clinicaId = user.clinica_id;

    const prescricao = await prisma.prescricao.findFirst({
      where: { id: prescricaoId, clinica_id: clinicaId },
      include: {
        itens: { include: { principio_ativo: true } },
        animal: true,
      },
    });

    if (!prescricao) throw AppError.notFound('Prescricao nao encontrada');
    if (prescricao.status !== 'DRAFT') {
      throw AppError.badRequest('Prescricao ja foi validada ou assinada');
    }

    // Registrar aceite para cada item
    for (const aceite of data.itens_aceite) {
      const prescItem = prescricao.itens.find((i) => i.id === aceite.prescricao_item_id);
      if (!prescItem) {
        throw AppError.notFound(`Item ${aceite.prescricao_item_id} nao encontrado na prescricao`);
      }

      // Buscar faixa para registrar no log
      const faixas = await prisma.faixaTerapeutica.findMany({
        where: {
          principio_ativo_id: prescItem.principio_ativo_id,
          especie: prescricao.animal.especie,
        },
      });

      const faixa = faixas[0];

      await validacaoService.registrarLog({
        prescricao_id: prescricaoId,
        prescricao_item_id: aceite.prescricao_item_id,
        clinica_id: clinicaId,
        veterinario_id: user.veterinario_id!,
        tipo: 'FORA_FAIXA_ACEITO',
        dose_prescrita_mg_kg: Number(prescItem.dose_mg_kg),
        dose_min_mg_kg: faixa ? Number(faixa.dose_min_mg_kg) : undefined,
        dose_max_mg_kg: faixa ? Number(faixa.dose_max_mg_kg) : undefined,
        especie: prescricao.animal.especie,
        peso_animal_kg: Number(prescricao.animal.peso_kg!),
        principio_ativo_nome: prescItem.principio_ativo.nome_padronizado,
        motivo_aceite: aceite.motivo_aceite,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }

    // Marcar como validada (com aceite)
    const updated = await prisma.prescricao.update({
      where: { id: prescricaoId },
      data: { status: 'VALIDADA' },
    });

    return { prescricao: updated, aceites_registrados: data.itens_aceite.length };
  }

  /**
   * Assinar prescricao
   */
  async assinar(user: AuthUser, prescricaoId: string) {
    const prescricao = await prisma.prescricao.findFirst({
      where: { id: prescricaoId, clinica_id: user.clinica_id },
    });

    if (!prescricao) throw AppError.notFound('Prescricao nao encontrada');
    if (prescricao.status !== 'VALIDADA') {
      throw AppError.badRequest('Prescricao precisa estar validada antes de assinar');
    }
    if (prescricao.veterinario_id !== user.veterinario_id) {
      throw AppError.forbidden('Somente o veterinario responsavel pode assinar');
    }

    return prisma.prescricao.update({
      where: { id: prescricaoId },
      data: { status: 'ASSINADA', signed_at: new Date() },
    });
  }

  /**
   * Listar prescricoes da clinica
   */
  async findAll(clinicaId: string, filtros: {
    status?: string;
    veterinario_id?: string;
    tutor_id?: string;
    animal_id?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { clinica_id: clinicaId };
    if (filtros.status) where.status = filtros.status;
    if (filtros.veterinario_id) where.veterinario_id = filtros.veterinario_id;
    if (filtros.tutor_id) where.tutor_id = filtros.tutor_id;
    if (filtros.animal_id) where.animal_id = filtros.animal_id;

    const [total, prescricoes] = await Promise.all([
      prisma.prescricao.count({ where }),
      prisma.prescricao.findMany({
        where,
        include: {
          tutor: { select: { id: true, nome: true } },
          animal: { select: { id: true, nome: true, especie: true } },
          veterinario: { select: { id: true, nome: true, crmv: true } },
          _count: { select: { itens: true } },
        },
        orderBy: { created_at: 'desc' },
        take: filtros.limit || 50,
        skip: filtros.offset || 0,
      }),
    ]);

    return { total, prescricoes };
  }

  /**
   * Detalhe da prescricao
   */
  async findById(clinicaId: string, id: string) {
    const prescricao = await prisma.prescricao.findFirst({
      where: { id, clinica_id: clinicaId },
      include: {
        tutor: true,
        animal: true,
        veterinario: true,
        protocolo: { select: { id: true, codigo: true, nome: true } },
        clinica: {
          select: {
            id: true, nome_fantasia: true, cnpj: true,
            logo_url: true, cor_primaria: true,
            telefone: true, email: true,
            logradouro: true, numero: true, bairro: true, cidade: true, estado: true, cep: true,
          },
        },
        itens: {
          include: {
            principio_ativo: true,
            concentracao: true,
          },
          orderBy: { ordem: 'asc' },
        },
        validacao_logs: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!prescricao) throw AppError.notFound('Prescricao nao encontrada');
    return prescricao;
  }

  /**
   * Atualizar prescricao (somente DRAFT)
   */
  async update(clinicaId: string, id: string, data: UpdatePrescricaoInput) {
    const prescricao = await prisma.prescricao.findFirst({
      where: { id, clinica_id: clinicaId },
    });

    if (!prescricao) throw AppError.notFound('Prescricao nao encontrada');
    if (prescricao.status !== 'DRAFT') {
      throw AppError.badRequest('Somente prescricoes em rascunho podem ser editadas');
    }

    // Se itens foram atualizados, recalcular
    if (data.itens) {
      const animal = await prisma.animal.findUnique({ where: { id: prescricao.animal_id } });
      if (!animal?.peso_kg) throw AppError.badRequest('Animal sem peso');

      const pesoKg = Number(animal.peso_kg);

      // Deletar itens antigos e criar novos
      await prisma.prescricaoItem.deleteMany({ where: { prescricao_id: id } });

      const novosItens = await Promise.all(
        data.itens.map(async (item, index) => {
          const ativo = await prisma.principioAtivo.findUnique({
            where: { id: item.principio_ativo_id },
          });
          if (!ativo) throw AppError.notFound(`Principio ativo nao encontrado`);

          const doseTotalMg = Number((item.dose_mg_kg * pesoKg).toFixed(2));
          const quantidadeTotal = calcularQuantidadeTotal(item.frequencia_horas, item.duracao_dias);

          return {
            prescricao_id: id,
            principio_ativo_id: item.principio_ativo_id,
            concentracao_id: item.concentracao_id,
            dose_mg_kg: item.dose_mg_kg,
            dose_total_mg: doseTotalMg,
            frequencia_horas: item.frequencia_horas,
            duracao_dias: item.duracao_dias,
            quantidade_total: quantidadeTotal,
            forma_farmaceutica: item.forma_farmaceutica,
            posologia_texto: gerarPosologiaTexto({
              principio_ativo: ativo.nome_padronizado,
              forma_farmaceutica: item.forma_farmaceutica,
              dose_mg_kg: item.dose_mg_kg,
              frequencia_horas: item.frequencia_horas,
              duracao_dias: item.duracao_dias,
              quantidade_total: quantidadeTotal,
            }),
            observacoes: item.observacoes,
            ordem: item.ordem ?? index,
          };
        }),
      );

      await prisma.prescricaoItem.createMany({ data: novosItens });
    }

    return prisma.prescricao.update({
      where: { id },
      data: {
        diagnostico: data.diagnostico,
        observacoes: data.observacoes,
      },
      include: {
        itens: {
          include: { principio_ativo: true, concentracao: true },
          orderBy: { ordem: 'asc' },
        },
      },
    });
  }

  /**
   * Cancelar prescricao
   */
  async cancelar(clinicaId: string, id: string) {
    const prescricao = await prisma.prescricao.findFirst({
      where: { id, clinica_id: clinicaId },
    });
    if (!prescricao) throw AppError.notFound('Prescricao nao encontrada');

    return prisma.prescricao.update({
      where: { id },
      data: { status: 'CANCELADA' },
    });
  }

  /**
   * Preview de calculo (sem salvar)
   */
  async calcularPreview(clinicaId: string, data: CalcularPreviewInput) {
    const animal = await prisma.animal.findFirst({
      where: { id: data.animal_id, clinica_id: clinicaId },
    });
    if (!animal?.peso_kg) throw AppError.badRequest('Animal sem peso cadastrado');

    const pesoKg = Number(animal.peso_kg);

    const resultado = await Promise.all(
      data.itens.map(async (item) => {
        const ativo = await prisma.principioAtivo.findUnique({
          where: { id: item.principio_ativo_id },
        });

        const doseTotalMg = calcularDoseTotal(item.dose_mg_kg, pesoKg);
        const quantidadeTotal = calcularQuantidadeTotal(item.frequencia_horas, item.duracao_dias);

        return {
          principio_ativo: ativo?.nome_padronizado || 'Desconhecido',
          dose_mg_kg: item.dose_mg_kg,
          dose_total_mg: doseTotalMg,
          frequencia_horas: item.frequencia_horas,
          duracao_dias: item.duracao_dias,
          quantidade_total: quantidadeTotal,
          peso_animal_kg: pesoKg,
        };
      }),
    );

    // Validar contra faixas
    const validacao = await validacaoService.validarItens(
      data.itens.map((i) => ({
        principio_ativo_id: i.principio_ativo_id,
        dose_mg_kg: i.dose_mg_kg,
      })),
      animal.especie,
      pesoKg,
    );

    return { itens: resultado, validacao };
  }
}
