import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface MedicamentoResult {
    id: string;
    codigo: string;
    nome: string;
    linha_terapeutica: string;
    forma_farmaceutica: string;
    indicacao: string;
    formula: string;
    modo_uso: string;
    especie: string[];
    observacoes: string | null;
}

export interface PrincipioAtivoResult {
    id: string;
    principio_ativo: string;
    doenca: string;
    posologia: string;
    contraindicacoes: string | null;
    species: string | null;
    route_hint: string | null;
}

/**
 * Full-text search in PostgreSQL for medications matching the query
 */
export async function searchMedications(query: string, limit = 15): Promise<MedicamentoResult[]> {
    // Clean query for tsquery - use OR (|) for broader matching
    const searchTerms = query
        .replace(/[^\w\sáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/g, '')
        .split(/\s+/)
        .filter(w => w.length >= 2);

    if (searchTerms.length === 0) return [];

    // Try full-text search first with OR operator for broader results
    const tsquery = searchTerms.map(w => `${w}:*`).join(' | ');

    try {
        const results = await prisma.$queryRawUnsafe<MedicamentoResult[]>(`
            SELECT id, codigo, nome, linha_terapeutica, forma_farmaceutica,
                   indicacao, formula, modo_uso, especie, observacoes,
                   ts_rank(
                       to_tsvector('portuguese', nome || ' ' || indicacao || ' ' || COALESCE(observacoes, '') || ' ' || linha_terapeutica),
                       to_tsquery('portuguese', $1)
                   ) AS rank
            FROM bulario_magistral
            WHERE to_tsvector('portuguese', nome || ' ' || indicacao || ' ' || COALESCE(observacoes, '') || ' ' || linha_terapeutica)
                  @@ to_tsquery('portuguese', $1)
            ORDER BY rank DESC
            LIMIT $2
        `, tsquery, limit);

        if (results.length > 0) return results;
    } catch (error) {
        console.warn('Full-text search failed, trying ILIKE fallback:', error);
    }

    // Fallback: ILIKE search (always runs if full-text returned 0 results)
    console.log('Full-text returned 0 results, falling back to ILIKE for:', query);
    return prisma.bularioMagistral.findMany({
        where: {
            OR: searchTerms.flatMap(term => [
                { indicacao: { contains: term, mode: 'insensitive' as const } },
                { nome: { contains: term, mode: 'insensitive' as const } },
                { linha_terapeutica: { contains: term, mode: 'insensitive' as const } },
                { observacoes: { contains: term, mode: 'insensitive' as const } },
            ]),
        },
        select: {
            id: true,
            codigo: true,
            nome: true,
            linha_terapeutica: true,
            forma_farmaceutica: true,
            indicacao: true,
            formula: true,
            modo_uso: true,
            especie: true,
            observacoes: true,
        },
        take: limit,
    });
}

/**
 * Search in base Bulario table (principios ativos from CSV)
 */
export async function searchPrincipiosAtivos(
    query: string,
    species?: 'cão' | 'gato' | null,
    limit = 10
): Promise<PrincipioAtivoResult[]> {
    const searchTerms = query
        .replace(/[^\w\sáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/g, '')
        .split(/\s+/)
        .filter(w => w.length >= 2);

    if (searchTerms.length === 0) return [];

    const speciesFilter = species ? { species } : undefined;

    const orConditions = searchTerms.flatMap(term => [
        { principio_ativo: { contains: term, mode: 'insensitive' as const } },
        { doenca: { contains: term, mode: 'insensitive' as const } },
    ]);

    return prisma.bulario.findMany({
        where: {
            AND: [
                { OR: orConditions },
                ...(speciesFilter ? [speciesFilter] : []),
            ],
        },
        select: {
            id: true,
            principio_ativo: true,
            doenca: true,
            posologia: true,
            contraindicacoes: true,
            species: true,
            route_hint: true,
        },
        orderBy: { principio_ativo: 'asc' },
        take: limit,
    });
}

/**
 * Generate a recommendation using GPT-4o-mini
 */
export async function generateRecommendation(
    pergunta: string,
    medicamentos: MedicamentoResult[],
    principiosAtivos: PrincipioAtivoResult[] = []
): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY não configurada');
    }

    // Build context from magistral medications
    const medContext = medicamentos.map(m => `
---
Código: ${m.codigo}
Nome: ${m.nome}
Linha: ${m.linha_terapeutica}
Forma: ${m.forma_farmaceutica}
Indicação: ${m.indicacao}
Fórmula: ${m.formula}
Modo de uso: ${m.modo_uso}
Espécies: ${m.especie.join(', ')}
${m.observacoes ? `Observações: ${m.observacoes}` : ''}
`).join('\n');

    // Build context from princípios ativos (base Bulario)
    const principioContext = principiosAtivos.length > 0
        ? principiosAtivos.map(p => `
---
Princípio Ativo: ${p.principio_ativo}
Indicação: ${p.doenca}
Posologia: ${p.posologia}
${p.species ? `Espécie: ${p.species}` : ''}
${p.route_hint ? `Via: ${p.route_hint}` : ''}
${p.contraindicacoes ? `Contraindicações: ${p.contraindicacoes}` : ''}
`).join('\n')
        : '';

    const systemPrompt = `Você é um assistente veterinário especializado em medicamentos magistrais da PharmoPet.
Seu papel é ajudar veterinários a encontrar o medicamento magistral mais adequado para cada caso clínico.

REGRAS IMPORTANTES:
- Baseie suas recomendações EXCLUSIVAMENTE nos medicamentos do catálogo fornecido abaixo
- Nunca invente medicamentos ou dosagens que não estejam no catálogo
- Sempre inclua o código do medicamento (ex: 7.1) para facilitar a prescrição quando disponível
- Seja conciso e direto nas recomendações
- Se não encontrar medicamentos adequados no catálogo, diga claramente
- Considere a espécie do animal ao recomendar
- Mencione contraindicações quando relevante

CATÁLOGO DE FÓRMULAS MAGISTRAIS:
${medContext || 'Nenhuma fórmula magistral encontrada para esta busca.'}

${principioContext ? `BULÁRIO DE PRINCÍPIOS ATIVOS:
${principioContext}` : ''}`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: pergunta },
        ],
        temperature: 0.3,
        max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || 'Não foi possível gerar uma recomendação.';
}
