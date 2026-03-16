/**
 * Script para parsear os documentos .docx do Bulário Magistral
 * e inserir no banco de dados PostgreSQL.
 *
 * Uso: npx tsx src/scripts/parse-bulario.ts [caminho-da-pasta]
 */

import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';

// Only import Prisma if not in export-json mode
const isExportMode = process.argv.includes('--export-json');
let prisma: any = null;
if (!isExportMode) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
}

// Map de nomes de arquivo → linha terapêutica
const LINHA_MAP: Record<string, string> = {
    'antial\u00e9rgica': 'Antial\u00e9rgica Oral',
    'antialergica': 'Antial\u00e9rgica Oral',
    'antif\u00fangica': 'Antif\u00fangica Oral',
    'antifungica': 'Antif\u00fangica Oral',
    'antimicrobiana': 'Antimicrobiana Oral',
    'dermatol\u00f3gica': 'Dermatol\u00f3gica',
    'dermatologica': 'Dermatol\u00f3gica',
    'nutrac\u00eautica': 'Nutrac\u00eautica',
    'nutraceutica': 'Nutrac\u00eautica',
    'odontol\u00f3gica': 'Odontol\u00f3gica',
    'odontologica': 'Odontol\u00f3gica',
    'otol\u00f3gica': 'Otol\u00f3gica',
    'otologica': 'Otol\u00f3gica',
    'antiparasit\u00e1ria': 'Antiparasit\u00e1ria',
    'antiparasitaria': 'Antiparasit\u00e1ria',
    'reumatol\u00f3gica': 'Reumatol\u00f3gica e Articular',
    'reumatologica': 'Reumatol\u00f3gica e Articular',
    'oncol\u00f3gica': 'Oncol\u00f3gica',
    'oncologica': 'Oncol\u00f3gica',
    'cardiovascular': 'Cardiovascular',
    'transd\u00e9rmica': 'Transd\u00e9rmica',
    'transdermica': 'Transd\u00e9rmica',
    'end\u00f3crina': 'End\u00f3crina',
    'endocrina': 'End\u00f3crina',
    'gastrointestinal': 'Gastrointestinal',
    'genito-urin\u00e1ria': 'Genito-Urin\u00e1ria',
    'genito-urinaria': 'Genito-Urin\u00e1ria',
    'hepatoprotetora': 'Hepatoprotetora',
    'imunol\u00f3gica': 'Imunol\u00f3gica',
    'imunologica': 'Imunol\u00f3gica',
    'nervosa': 'Nervosa',
    'respirat\u00f3ria': 'Respirat\u00f3ria',
    'respiratoria': 'Respirat\u00f3ria',
};

function stripDiacritics(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectLinha(filename: string): string {
    const lower = stripDiacritics(filename).toLowerCase();
    for (const [key, value] of Object.entries(LINHA_MAP)) {
        if (lower.includes(stripDiacritics(key))) return value;
    }
    return 'Desconhecida';
}

function extractSpecies(text: string): string[] {
    const species: string[] = [];
    const lower = text.toLowerCase();
    if (lower.includes('cães') || lower.includes('cão') || lower.includes('canino')) species.push('cães');
    if (lower.includes('gatos') || lower.includes('gato') || lower.includes('felino')) species.push('gatos');
    if (lower.includes('equino') || lower.includes('cavalos')) species.push('equinos');
    if (lower.includes('aves')) species.push('aves');
    if (species.length === 0) species.push('cães', 'gatos'); // default
    return [...new Set(species)];
}

interface ParsedMedication {
    codigo: string;
    nome: string;
    linha_terapeutica: string;
    forma_farmaceutica: string;
    indicacao: string;
    diferencial: string | null;
    formula: string;
    modo_uso: string;
    especie: string[];
    observacoes: string | null;
    controlado: boolean;
}

const CONTROLLED_KEYWORDS = [
    'controlado', 'receita especial', 'notificação', 'portaria 344',
    'morfina', 'tramadol', 'diazepam', 'fenobarbital', 'ketamina',
    'gabapentina', 'pregabalina', 'codeína',
];

function isControlled(text: string): boolean {
    const lower = text.toLowerCase();
    return CONTROLLED_KEYWORDS.some(kw => lower.includes(kw));
}

function parseMedications(text: string, linha: string): ParsedMedication[] {
    const medications: ParsedMedication[] = [];

    // Split text into sections by medication codes (e.g., "7.1", "4.3.2", "1.1")
    // Match patterns like "7.1 " or "7.1." at the start of a line, or "4.3.2 "
    const lines = text.split('\n');
    let currentMed: Partial<ParsedMedication> | null = null;
    let currentField = '';
    let currentContent = '';

    // Regex for medication code header (e.g., "7.1 Gel Otológico..." or "4.3.2 Pasta...")
    const codeRegex = /^(\d+\.\d+(?:\.\d+)?)\s+(.+)/;

    // Field labels we're looking for
    const fieldLabels: Record<string, string> = {
        'forma farmacêutica': 'forma_farmaceutica',
        'indicação': 'indicacao',
        'indicação clínica': 'indicacao',
        'diferencial': 'diferencial',
        'diferencial pharmo pet': 'diferencial',
        'fórmula magistral': 'formula',
        'fórmula': 'formula',
        'modo de usar': 'modo_uso',
        'modo de uso': 'modo_uso',
        'posologia': 'modo_uso',
        'observações': 'observacoes',
        'observação': 'observacoes',
        'obs': 'observacoes',
        'linha exclusiva': '_skip',
        'linha técnica': '_skip',
    };

    function saveCurrent() {
        if (currentMed && currentField && currentContent.trim()) {
            const field = currentField;
            if (field !== '_skip') {
                (currentMed as any)[field] = currentContent.trim();
            }
        }
    }

    function finalizeMed() {
        if (currentMed && currentMed.codigo && currentMed.nome) {
            const fullText = [
                currentMed.indicacao || '',
                currentMed.formula || '',
                currentMed.observacoes || '',
            ].join(' ');

            medications.push({
                codigo: currentMed.codigo,
                nome: currentMed.nome,
                linha_terapeutica: linha,
                forma_farmaceutica: currentMed.forma_farmaceutica || '',
                indicacao: currentMed.indicacao || '',
                diferencial: currentMed.diferencial || null,
                formula: currentMed.formula || '',
                modo_uso: currentMed.modo_uso || '',
                especie: extractSpecies(currentMed.indicacao || ''),
                observacoes: currentMed.observacoes || null,
                controlado: isControlled(fullText),
            });
        }
    }

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check if this is a new medication header
        const codeMatch = trimmed.match(codeRegex);
        if (codeMatch) {
            // Save current field content
            saveCurrent();
            // Finalize previous medication
            finalizeMed();
            // Start new medication
            currentMed = {
                codigo: codeMatch[1],
                nome: codeMatch[2].trim(),
            };
            currentField = '';
            currentContent = '';
            continue;
        }

        // Check if this line starts a known field
        const lowerTrimmed = trimmed.toLowerCase();
        let foundField = false;
        for (const [label, field] of Object.entries(fieldLabels)) {
            if (lowerTrimmed.startsWith(label + ':') || lowerTrimmed.startsWith(label + ' :')) {
                // Save previous field
                saveCurrent();
                currentField = field;
                // Extract content after the label
                const colonIdx = trimmed.indexOf(':');
                currentContent = colonIdx >= 0 ? trimmed.substring(colonIdx + 1).trim() : '';
                foundField = true;
                break;
            }
        }

        // If not a new field, append to current content
        if (!foundField && currentMed) {
            if (currentField) {
                currentContent += '\n' + trimmed;
            }
        }
    }

    // Don't forget the last medication
    saveCurrent();
    finalizeMed();

    return medications;
}

async function processFile(filePath: string): Promise<ParsedMedication[]> {
    const filename = path.basename(filePath);
    const linha = detectLinha(filename);

    console.log(`📄 Processing: ${filename}`);
    console.log(`   Linha: ${linha}`);

    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    const medications = parseMedications(text, linha);
    console.log(`   Found ${medications.length} medications`);

    return medications;
}

async function main() {
    // Filter out flags from argv to get directory path
    const positionalArgs = process.argv.slice(2).filter(a => !a.startsWith('--'));
    const bularioDir = positionalArgs[0] || path.resolve(__dirname, '../../../../../../Bulario/drive-download-20260315T234254Z-3-001');

    if (!fs.existsSync(bularioDir)) {
        console.error(`❌ Directory not found: ${bularioDir}`);
        console.log('Usage: npx tsx src/scripts/parse-bulario.ts [path-to-bulario-folder]');
        process.exit(1);
    }

    const files = fs.readdirSync(bularioDir)
        .filter(f => f.endsWith('.docx') && !f.startsWith('~'))
        .map(f => path.join(bularioDir, f));

    console.log(`\n🔬 Bulário Magistral Parser`);
    console.log(`   Found ${files.length} .docx files\n`);

    let totalMeds = 0;
    const allMedications: ParsedMedication[] = [];

    for (const file of files) {
        const meds = await processFile(file);
        allMedications.push(...meds);
        totalMeds += meds.length;
    }

    console.log(`\n📊 Total medications parsed: ${totalMeds}`);

    // Print summary by linha
    const byLinha = allMedications.reduce((acc, m) => {
        acc[m.linha_terapeutica] = (acc[m.linha_terapeutica] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log(`\n📋 Summary by Linha Terapêutica:`);
    for (const [linha, count] of Object.entries(byLinha).sort((a, b) => b[1] - a[1])) {
        console.log(`   ${linha}: ${count}`);
    }

    // Export mode: write JSON file
    if (isExportMode) {
        const outputPath = path.resolve(bularioDir, '..', 'bulario-parsed.json');
        fs.writeFileSync(outputPath, JSON.stringify(allMedications, null, 2), 'utf-8');
        console.log(`\n📦 Exported to: ${outputPath}`);
        console.log(`   ${allMedications.length} medications saved as JSON`);
        return;
    }

    // DB mode: insert into database
    console.log(`   Inserting into database...\n`);
    let inserted = 0;
    let errors = 0;

    for (const med of allMedications) {
        try {
            await prisma.bularioMagistral.upsert({
                where: { codigo: med.codigo },
                update: {
                    nome: med.nome,
                    linha_terapeutica: med.linha_terapeutica,
                    forma_farmaceutica: med.forma_farmaceutica,
                    indicacao: med.indicacao,
                    diferencial: med.diferencial,
                    formula: med.formula,
                    modo_uso: med.modo_uso,
                    especie: med.especie,
                    observacoes: med.observacoes,
                    controlado: med.controlado,
                },
                create: med,
            });
            inserted++;
        } catch (error: any) {
            console.error(`   ❌ Error with ${med.codigo}: ${error.message}`);
            errors++;
        }
    }

    console.log(`✅ Done! Inserted/Updated: ${inserted}`);
    if (errors > 0) console.log(`   Errors: ${errors}`);
    await prisma.$disconnect();
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
