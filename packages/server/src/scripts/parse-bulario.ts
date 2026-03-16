/**
 * Script para parsear os documentos .docx do Bulário Magistral
 * e inserir no banco de dados PostgreSQL.
 *
 * Uso: npx tsx src/scripts/parse-bulario.ts [caminho-da-pasta]
 */

import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map de nomes de arquivo → linha terapêutica
const LINHA_MAP: Record<string, string> = {
    'antialérgica': 'Antialérgica Oral',
    'antifúngica': 'Antifúngica Oral',
    'antimicrobiana': 'Antimicrobiana Oral',
    'dermatológica': 'Dermatológica',
    'nutracêutica': 'Nutracêutica',
    'odontológica': 'Odontológica',
    'otológica': 'Otológica',
    'antiparasitária': 'Antiparasitária',
    'reumatológica': 'Reumatológica e Articular',
    'oncológica': 'Oncológica',
    'cardiovascular': 'Cardiovascular',
    'transdérmica': 'Transdérmica',
    'endócrina': 'Endócrina',
    'gastrointestinal': 'Gastrointestinal',
    'genito-urinária': 'Genito-Urinária',
    'hepatoprotetora': 'Hepatoprotetora',
    'imunológica': 'Imunológica',
    'nervosa': 'Nervosa',
    'respiratória': 'Respiratória',
};

function detectLinha(filename: string): string {
    const lower = filename.toLowerCase();
    for (const [key, value] of Object.entries(LINHA_MAP)) {
        if (lower.includes(key)) return value;
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
    const bularioDir = process.argv[2] || path.resolve(__dirname, '../../../../../../Bulario/drive-download-20260315T234254Z-3-001');

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
    console.log(`   Inserting into database...\n`);

    // Upsert all medications
    let inserted = 0;
    let updated = 0;
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

            // Check if it was an insert or update
            inserted++;
        } catch (error: any) {
            console.error(`   ❌ Error with ${med.codigo}: ${error.message}`);
            errors++;
        }
    }

    console.log(`✅ Done!`);
    console.log(`   Inserted/Updated: ${inserted}`);
    if (errors > 0) console.log(`   Errors: ${errors}`);

    // Print summary by linha
    const byLinha = allMedications.reduce((acc, m) => {
        acc[m.linha_terapeutica] = (acc[m.linha_terapeutica] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log(`\n📋 Summary by Linha Terapêutica:`);
    for (const [linha, count] of Object.entries(byLinha).sort((a, b) => b[1] - a[1])) {
        console.log(`   ${linha}: ${count}`);
    }

    await prisma.$disconnect();
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
