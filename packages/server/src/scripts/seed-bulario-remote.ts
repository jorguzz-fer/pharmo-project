/**
 * Script para enviar os dados do Bulário Magistral para o servidor de produção
 * via API endpoint.
 *
 * Uso: npx tsx src/scripts/seed-bulario-remote.ts <API_URL> <JWT_SECRET> <JSON_PATH>
 * Exemplo: npx tsx src/scripts/seed-bulario-remote.ts https://pharmopet-server.easypanel.host/api meu-jwt-secret /caminho/bulario-parsed.json
 */

import * as fs from 'fs';

async function main() {
    const apiUrl = process.argv[2];
    const adminKey = process.argv[3];
    const jsonPath = process.argv[4];

    if (!apiUrl || !adminKey || !jsonPath) {
        console.error('Uso: npx tsx src/scripts/seed-bulario-remote.ts <API_URL> <JWT_SECRET> <JSON_PATH>');
        console.error('Exemplo: npx tsx src/scripts/seed-bulario-remote.ts https://server.example.com/api meu-secret ./bulario-parsed.json');
        process.exit(1);
    }

    if (!fs.existsSync(jsonPath)) {
        console.error(`Arquivo não encontrado: ${jsonPath}`);
        process.exit(1);
    }

    const medications = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`📦 Carregando ${medications.length} medicamentos de ${jsonPath}`);

    // Send in batches of 50 to avoid payload limits
    const batchSize = 50;
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < medications.length; i += batchSize) {
        const batch = medications.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(medications.length / batchSize);

        console.log(`\n📤 Enviando lote ${batchNum}/${totalBatches} (${batch.length} medicamentos)...`);

        try {
            const response = await fetch(`${apiUrl}/bulario/seed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medications: batch, adminKey }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`   ❌ HTTP ${response.status}: ${text}`);
                totalErrors += batch.length;
                continue;
            }

            const result = await response.json();
            totalInserted += result.inserted;
            totalErrors += result.errors;

            console.log(`   ✅ Inseridos: ${result.inserted}, Erros: ${result.errors}`);
            if (result.errorDetails?.length > 0) {
                result.errorDetails.forEach((e: string) => console.log(`      ⚠️ ${e}`));
            }
        } catch (error: any) {
            console.error(`   ❌ Erro de rede: ${error.message}`);
            totalErrors += batch.length;
        }
    }

    console.log(`\n📊 Resultado final:`);
    console.log(`   ✅ Inseridos/Atualizados: ${totalInserted}`);
    console.log(`   ❌ Erros: ${totalErrors}`);
}

main().catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
});
