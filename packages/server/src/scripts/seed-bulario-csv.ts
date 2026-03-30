/**
 * Script: seed-bulario-csv.ts
 * Importa o arquivo bulario_ai_ready.csv para a tabela `bulario`.
 *
 * Uso:
 *   npx tsx src/scripts/seed-bulario-csv.ts [caminho_do_csv]
 *
 * Exemplo:
 *   npx tsx src/scripts/seed-bulario-csv.ts ../../base/V2/bulario_ai_ready.csv
 *
 * O script faz UPSERT por (principio_ativo + species), então é seguro rodar múltiplas vezes.
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CsvRow {
  record_id: string;
  active_ingredient: string;
  clinical_indication: string;
  contraindications: string;
  source_file: string;
  source_sheet: string;
  source_row: string;
  species: string;
  dosage_raw: string;
  route_hint: string;
}

// ---------------------------------------------------------------------------
// Parser CSV simples (lida com campos entre aspas contendo vírgulas e quebras)
// ---------------------------------------------------------------------------
function parseCsv(content: string): CsvRow[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      // Double-quote escape: ""
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  const splitLine = (line: string): string[] => {
    const cols: string[] = [];
    let col = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { col += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        cols.push(col.trim());
        col = '';
      } else {
        col += c;
      }
    }
    cols.push(col.trim());
    return cols;
  };

  const headers = splitLine(lines[0]);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (cols[idx] ?? '').trim();
    });
    rows.push(row as unknown as CsvRow);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Normaliza a espécie para PT-BR
// ---------------------------------------------------------------------------
function normalizeSpecies(species: string): string | null {
  const s = species.toLowerCase().trim();
  if (s === 'dog') return 'cão';
  if (s === 'cat') return 'gato';
  if (!s) return null;
  return s;
}

// ---------------------------------------------------------------------------
// Detecta se o medicamento é controlado
// ---------------------------------------------------------------------------
function isControlado(indication: string, ingredient: string): boolean {
  const text = `${indication} ${ingredient}`.toUpperCase();
  return text.includes('CONTROLADO') || text.includes('PSICOTRÓPICO') || text.includes('ENTORPECENTE');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const csvPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '../../../base/V2/bulario_ai_ready.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Arquivo CSV não encontrado: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📂 Lendo CSV: ${csvPath}`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCsv(content);
  console.log(`📊 Total de linhas no CSV: ${rows.length}`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  for (const row of rows) {
    const principioAtivo = row.active_ingredient?.trim();
    if (!principioAtivo) continue;

    const speciesNorm = normalizeSpecies(row.species);

    try {
      const existing = await prisma.bulario.findFirst({
        where: {
          principio_ativo: principioAtivo,
          species: speciesNorm,
        },
      });

      if (existing) {
        await prisma.bulario.update({
          where: { id: existing.id },
          data: {
            doenca: row.clinical_indication || '',
            posologia: row.dosage_raw || '',
            contraindicacoes: row.contraindications || null,
            controlado: isControlado(row.clinical_indication, principioAtivo),
            route_hint: row.route_hint || null,
            source_record_id: row.record_id ? parseInt(row.record_id) : null,
          },
        });
        updated++;
      } else {
        await prisma.bulario.create({
          data: {
            principio_ativo: principioAtivo,
            doenca: row.clinical_indication || '',
            posologia: row.dosage_raw || '',
            contraindicacoes: row.contraindications || null,
            controlado: isControlado(row.clinical_indication, principioAtivo),
            species: speciesNorm,
            route_hint: row.route_hint || null,
            source_record_id: row.record_id ? parseInt(row.record_id) : null,
          },
        });
        inserted++;
      }
    } catch (err: any) {
      errors++;
      errorDetails.push(`[${principioAtivo} / ${speciesNorm}] ${err.message}`);
    }
  }

  console.log('\n✅ Seed concluído!');
  console.log(`   📥 Inseridos: ${inserted}`);
  console.log(`   🔄 Atualizados: ${updated}`);
  console.log(`   ❌ Erros: ${errors}`);

  if (errorDetails.length > 0) {
    console.log('\n⚠️  Detalhes dos erros:');
    errorDetails.slice(0, 10).forEach(e => console.log(`   - ${e}`));
    if (errorDetails.length > 10) {
      console.log(`   ... e mais ${errorDetails.length - 10} erros`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
