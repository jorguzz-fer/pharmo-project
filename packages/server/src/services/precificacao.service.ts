/**
 * Motor de Precificação PharmoPet
 *
 * Fórmula por ingrediente:
 *   custo_efetivo = MAX(valor_custo, custo_referencia)
 *   custo_ingrediente = (dosagem_mg × quantidade / 1000) × custo_efetivo × (markup / 100)
 *
 * Total:
 *   subtotal = Σ ingredientes + taxa_manipulação + custo_embalagens
 *   com_desconto = subtotal × (1 - desconto_parceiro)
 *   valor_final = com_desconto + adicional_entrega
 *   se forma = BISCOITO: valor_final += adicional_biscoito
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Types ---

export interface IngredienteInput {
  codigo_interno?: number;
  insumo_id?: string;
  dosagem_mg: number;    // mg por unidade (cápsula/dose)
  quantidade: number;    // total de unidades (cápsulas/doses)
}

export interface IngredienteResultado {
  codigo_interno: number;
  descricao: string;
  un_manipulacao: string;
  valor_custo: number;
  custo_referencia: number;
  custo_efetivo: number;       // MAX(custo, ref)
  markup: number;
  dosagem_mg: number;
  quantidade: number;
  peso_total_g: number;        // dosagem × quantidade / 1000
  custo_ingrediente: number;   // peso_total × custo_efetivo × markup/100
  disponivel: boolean;
  controlado: boolean;
  lista_controle: string | null;
}

export interface PrecificacaoInput {
  ingredientes: IngredienteInput[];
  forma_farmaceutica: string;  // nome da forma (ex: "CÁPSULAS", "BISCOITOS")
  clinica_id?: string;         // para buscar condições comerciais
}

export interface PrecificacaoResultado {
  ingredientes: IngredienteResultado[];
  total_materia_prima: number;
  taxa_manipulacao: number;
  custo_embalagens: number;
  subtotal: number;              // matéria prima + taxa + embalagens
  desconto_parceiro_pct: number; // 0-1 (ex: 0.4 = 40%)
  desconto_valor: number;        // em R$
  valor_com_desconto: number;
  adicional_entrega: number;
  adicional_biscoito: number;
  valor_final: number;
  forma_farmaceutica: string;
  avisos: string[];
  erros: string[];
}

// --- Service ---

export class PrecificacaoService {
  /**
   * Calcula o preço de uma formulação magistral
   */
  async calcular(input: PrecificacaoInput): Promise<PrecificacaoResultado> {
    const avisos: string[] = [];
    const erros: string[] = [];

    // 1. Buscar condições comerciais do parceiro
    let taxa_manipulacao = 0;
    let custo_embalagens = 0;
    let desconto_parceiro = 0;
    let adicional_entrega = 0;
    let adicional_biscoito = 0;

    if (input.clinica_id) {
      const clinica = await prisma.clinica.findUnique({
        where: { id: input.clinica_id },
        select: {
          nome_fantasia: true,
          taxa_manipulacao: true,
          custo_embalagens: true,
          desconto_parceiro: true,
          adicional_entrega: true,
          adicional_biscoito: true,
        },
      });

      if (clinica) {
        taxa_manipulacao = Number(clinica.taxa_manipulacao) || 0;
        custo_embalagens = Number(clinica.custo_embalagens) || 0;
        desconto_parceiro = Number(clinica.desconto_parceiro) || 0;
        adicional_entrega = Number(clinica.adicional_entrega) || 0;
        adicional_biscoito = Number(clinica.adicional_biscoito) || 0;
      } else {
        avisos.push('Clínica não encontrada — usando valores padrão (sem taxa/desconto)');
      }
    } else {
      avisos.push('Nenhuma clínica informada — preço sem condições comerciais');
    }

    // 2. Verificar forma farmacêutica
    const formaNome = input.forma_farmaceutica?.toUpperCase().trim() || '';
    const isBiscoito = formaNome.includes('BISCOITO') || formaNome.includes('PETISCO');

    // Verificar se a forma existe no banco
    if (formaNome) {
      const formaExiste = await prisma.formaFarmaceutica.findFirst({
        where: { nome: { equals: formaNome, mode: 'insensitive' }, ativo: true },
      });
      if (!formaExiste) {
        avisos.push(`Forma farmacêutica "${input.forma_farmaceutica}" não encontrada no cadastro`);
      }
    }

    // 3. Calcular custo de cada ingrediente
    const ingredientesResultado: IngredienteResultado[] = [];

    for (const ing of input.ingredientes) {
      // Buscar insumo
      let insumo;
      if (ing.insumo_id) {
        insumo = await prisma.insumoFarmaceutico.findUnique({
          where: { id: ing.insumo_id },
          include: {
            regras_excecao: {
              include: { forma: { select: { nome: true } } },
            },
          },
        });
      } else if (ing.codigo_interno) {
        insumo = await prisma.insumoFarmaceutico.findUnique({
          where: { codigo_interno: ing.codigo_interno },
          include: {
            regras_excecao: {
              include: { forma: { select: { nome: true } } },
            },
          },
        });
      }

      if (!insumo) {
        erros.push(`Insumo ${ing.codigo_interno || ing.insumo_id} não encontrado`);
        continue;
      }

      // Verificar disponibilidade
      const estoque = Number(insumo.estoque);
      const disponivel = estoque > 0;
      if (!disponivel) {
        avisos.push(`${insumo.descricao} está sem estoque — entre em contato pelo WhatsApp da PharmoPet`);
      }

      // Verificar regra de exceção com a forma
      if (formaNome) {
        const formaProibida = insumo.regras_excecao.some(
          (r) => r.forma.nome.toUpperCase() === formaNome
        );
        if (formaProibida) {
          erros.push(`${insumo.descricao} não pode ser manipulado na forma "${input.forma_farmaceutica}"`);
        }
      }

      // Verificar controlado
      if (insumo.controlado) {
        const tipo = insumo.lista_controle === 'ANTIMICROBIANO'
          ? 'Antimicrobiano — requer receita específica'
          : insumo.lista_controle
            ? `Lista ${insumo.lista_controle} — requer receituário especial`
            : 'Substância controlada';
        avisos.push(`${insumo.descricao}: ${tipo}`);
      }

      // Calcular preço
      const valor_custo = Number(insumo.valor_custo);
      const custo_referencia = Number(insumo.custo_referencia);
      const custo_efetivo = Math.max(valor_custo, custo_referencia);
      const markup = Number(insumo.markup);

      const dosagem_mg = ing.dosagem_mg;
      const quantidade = ing.quantidade;
      const peso_total_g = (dosagem_mg * quantidade) / 1000;
      const custo_ingrediente = peso_total_g * custo_efetivo * (markup / 100);

      ingredientesResultado.push({
        codigo_interno: insumo.codigo_interno,
        descricao: insumo.descricao,
        un_manipulacao: insumo.un_manipulacao,
        valor_custo,
        custo_referencia,
        custo_efetivo,
        markup,
        dosagem_mg,
        quantidade,
        peso_total_g,
        custo_ingrediente: round2(custo_ingrediente),
        disponivel,
        controlado: insumo.controlado,
        lista_controle: insumo.lista_controle,
      });
    }

    // 4. Calcular totais
    const total_materia_prima = round2(
      ingredientesResultado.reduce((sum, i) => sum + i.custo_ingrediente, 0)
    );

    const subtotal = round2(total_materia_prima + taxa_manipulacao + custo_embalagens);

    const desconto_valor = round2(subtotal * desconto_parceiro);
    const valor_com_desconto = round2(subtotal - desconto_valor);

    let valor_final = round2(valor_com_desconto + adicional_entrega);
    if (isBiscoito) {
      valor_final = round2(valor_final + adicional_biscoito);
    }

    return {
      ingredientes: ingredientesResultado,
      total_materia_prima,
      taxa_manipulacao,
      custo_embalagens,
      subtotal,
      desconto_parceiro_pct: desconto_parceiro,
      desconto_valor,
      valor_com_desconto,
      adicional_entrega,
      adicional_biscoito: isBiscoito ? adicional_biscoito : 0,
      valor_final,
      forma_farmaceutica: input.forma_farmaceutica,
      avisos,
      erros,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
