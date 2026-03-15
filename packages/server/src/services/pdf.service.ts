import PDFDocument from 'pdfkit';

interface MedicamentoData {
    medicamento: string;
    codigo_medicamento?: string | null;
    dosagem: string;
    forma_farmaceutica: string;
    quantidade: string;
    observacoes?: string | null;
}

interface PrescricaoPdfData {
    id: string;
    created_at: Date;
    observacoes?: string | null;
    veterinario: {
        nome: string;
        crv: string;
        email: string;
        telefone: string;
    };
    tutor: {
        nome: string;
        cpf: string;
        telefone?: string | null;
        endereco?: string | null;
    };
    animal: {
        nome: string;
        especie: string;
        raca?: string | null;
        peso?: number | null;
    };
    clinica?: {
        nome_fantasia: string;
        cnpj: string;
        telefone?: string | null;
        whatsapp?: string | null;
        email: string;
        logo_url?: string | null;
        logradouro?: string | null;
        numero?: string | null;
        complemento?: string | null;
        bairro?: string | null;
        cidade?: string | null;
        estado?: string | null;
        cep?: string | null;
    } | null;
    medicamentos: MedicamentoData[];
    orcamento?: {
        valor_total: number | string;
    } | null;
}

function formatAddress(clinica: PrescricaoPdfData['clinica']): string {
    if (!clinica) return '';
    const parts: string[] = [];
    if (clinica.logradouro) {
        let addr = clinica.logradouro;
        if (clinica.numero) addr += `, ${clinica.numero}`;
        if (clinica.complemento) addr += ` - ${clinica.complemento}`;
        parts.push(addr);
    }
    if (clinica.bairro) parts.push(clinica.bairro);
    const cidadeEstado = [clinica.cidade, clinica.estado].filter(Boolean).join(' - ');
    if (cidadeEstado) parts.push(cidadeEstado);
    if (clinica.cep) parts.push(`CEP: ${clinica.cep}`);
    return parts.join(' | ');
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export async function generatePrescriptionPdf(
    data: PrescricaoPdfData,
    logoBuffer?: Buffer | null
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 50, right: 50 },
        });

        const chunks: Uint8Array[] = [];
        doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

        // ── HEADER: Clinic branding ──
        const headerTop = doc.y;

        if (logoBuffer) {
            try {
                doc.image(logoBuffer, doc.page.margins.left, headerTop, {
                    width: 80,
                    height: 80,
                    fit: [80, 80],
                });
            } catch {
                // If logo fails to load, skip it
            }
        }

        const headerTextX = logoBuffer ? doc.page.margins.left + 95 : doc.page.margins.left;
        const headerTextWidth = logoBuffer ? pageWidth - 95 : pageWidth;

        if (data.clinica) {
            doc.font('Helvetica-Bold').fontSize(16)
                .text(data.clinica.nome_fantasia, headerTextX, headerTop, { width: headerTextWidth });
            doc.font('Helvetica').fontSize(9)
                .text(`CNPJ: ${data.clinica.cnpj}`, headerTextX, doc.y + 2, { width: headerTextWidth });

            const address = formatAddress(data.clinica);
            if (address) {
                doc.text(address, headerTextX, doc.y + 1, { width: headerTextWidth });
            }
            const contacts = [data.clinica.telefone, data.clinica.whatsapp, data.clinica.email]
                .filter(Boolean).join(' | ');
            if (contacts) {
                doc.text(contacts, headerTextX, doc.y + 1, { width: headerTextWidth });
            }
        } else {
            // No clinic — show vet name as header
            doc.font('Helvetica-Bold').fontSize(16)
                .text(data.veterinario.nome, headerTextX, headerTop, { width: headerTextWidth });
            doc.font('Helvetica').fontSize(9)
                .text(`CRMV: ${data.veterinario.crv}`, headerTextX, doc.y + 2, { width: headerTextWidth });
        }

        // Move Y below header (ensure we're past the logo)
        const yAfterHeader = Math.max(doc.y + 10, headerTop + (logoBuffer ? 90 : 0));
        doc.y = yAfterHeader;

        // ── Green divider ──
        doc.rect(doc.page.margins.left, doc.y, pageWidth, 3)
            .fill('#16a34a');
        doc.y += 12;

        // ── Title ──
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#000')
            .text('RECEITA VETERINÁRIA', { align: 'center' });
        doc.moveDown(0.3);

        doc.font('Helvetica').fontSize(9).fillColor('#666')
            .text(`Receita Nº ${data.id.slice(0, 8).toUpperCase()} | Data: ${formatDate(data.created_at)}`, { align: 'center' });
        doc.moveDown(1);

        // ── Veterinário ──
        const sectionY = doc.y;
        doc.rect(doc.page.margins.left, sectionY, pageWidth, 1).fill('#e5e7eb');
        doc.y = sectionY + 6;

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#16a34a')
            .text('VETERINÁRIO RESPONSÁVEL');
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(10).fillColor('#000')
            .text(`${data.veterinario.nome} — CRMV ${data.veterinario.crv}`);
        doc.font('Helvetica').fontSize(9).fillColor('#555')
            .text(`${data.veterinario.email} | ${data.veterinario.telefone}`);
        doc.moveDown(0.8);

        // ── Tutor + Animal side by side ──
        doc.rect(doc.page.margins.left, doc.y, pageWidth, 1).fill('#e5e7eb');
        doc.y += 6;

        const colWidth = pageWidth / 2 - 10;

        // Tutor (left)
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#16a34a')
            .text('TUTOR', doc.page.margins.left, doc.y, { width: colWidth });
        const tutorLabelY = doc.y;
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(10).fillColor('#000')
            .text(data.tutor.nome, doc.page.margins.left, doc.y, { width: colWidth });
        doc.font('Helvetica').fontSize(9).fillColor('#555')
            .text(`CPF: ${data.tutor.cpf}`, doc.page.margins.left, doc.y, { width: colWidth });
        if (data.tutor.telefone) {
            doc.text(`Tel: ${data.tutor.telefone}`, doc.page.margins.left, doc.y, { width: colWidth });
        }
        const tutorEndY = doc.y;

        // Animal (right)
        const rightX = doc.page.margins.left + colWidth + 20;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#16a34a')
            .text('PACIENTE', rightX, tutorLabelY, { width: colWidth });
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(10).fillColor('#000')
            .text(data.animal.nome, rightX, doc.y, { width: colWidth });
        doc.font('Helvetica').fontSize(9).fillColor('#555');
        const animalDetails = [data.animal.especie, data.animal.raca].filter(Boolean).join(' | ');
        doc.text(animalDetails, rightX, doc.y, { width: colWidth });
        if (data.animal.peso) {
            doc.text(`Peso: ${data.animal.peso} kg`, rightX, doc.y, { width: colWidth });
        }

        doc.y = Math.max(tutorEndY, doc.y) + 12;

        // ── Medicamentos ──
        doc.rect(doc.page.margins.left, doc.y, pageWidth, 1).fill('#e5e7eb');
        doc.y += 6;

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#16a34a')
            .text(`MEDICAMENTOS (${data.medicamentos.length})`);
        doc.moveDown(0.5);

        data.medicamentos.forEach((med, i) => {
            // Check if we need a new page
            if (doc.y > doc.page.height - 120) {
                doc.addPage();
            }

            // Med box
            const boxY = doc.y;
            doc.rect(doc.page.margins.left, boxY, pageWidth, 0).fill('#f9fafb');

            doc.font('Helvetica-Bold').fontSize(10).fillColor('#000')
                .text(`${i + 1}. ${med.medicamento}`, doc.page.margins.left + 5, boxY + 2, { width: pageWidth - 10 });

            if (med.codigo_medicamento) {
                doc.font('Helvetica').fontSize(8).fillColor('#2563eb')
                    .text(`Cód: ${med.codigo_medicamento}`, doc.page.margins.left + 5, doc.y, { width: pageWidth - 10 });
            }

            doc.font('Helvetica').fontSize(9).fillColor('#333');
            doc.text(`Dosagem: ${med.dosagem}  |  Forma: ${med.forma_farmaceutica}  |  Qtd: ${med.quantidade}`,
                doc.page.margins.left + 5, doc.y + 2, { width: pageWidth - 10 });

            if (med.observacoes) {
                doc.font('Helvetica-Oblique').fontSize(9).fillColor('#555')
                    .text(`Obs: ${med.observacoes}`, doc.page.margins.left + 5, doc.y + 2, { width: pageWidth - 10 });
            }

            doc.moveDown(0.6);
            doc.rect(doc.page.margins.left, doc.y, pageWidth, 0.5).fill('#e5e7eb');
            doc.y += 4;
        });

        // ── Observações gerais ──
        if (data.observacoes) {
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#16a34a')
                .text('OBSERVAÇÕES');
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(9).fillColor('#333')
                .text(data.observacoes);
        }

        // ── Footer: Signature line ──
        doc.moveDown(2);

        if (doc.y > doc.page.height - 140) {
            doc.addPage();
        }

        // Signature line
        const sigLineY = doc.y + 30;
        const sigLineWidth = 250;
        const sigLineX = (doc.page.width - sigLineWidth) / 2;

        doc.moveTo(sigLineX, sigLineY)
            .lineTo(sigLineX + sigLineWidth, sigLineY)
            .stroke('#333');

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000')
            .text(data.veterinario.nome, sigLineX, sigLineY + 5, {
                width: sigLineWidth, align: 'center',
            });
        doc.font('Helvetica').fontSize(9).fillColor('#555')
            .text(`CRMV ${data.veterinario.crv}`, sigLineX, doc.y, {
                width: sigLineWidth, align: 'center',
            });

        // Date at bottom
        doc.moveDown(1.5);
        doc.font('Helvetica').fontSize(8).fillColor('#999')
            .text(`Documento gerado em ${new Date().toLocaleString('pt-BR')} | Válido por 24 horas`, {
                align: 'center',
            });

        doc.end();
    });
}
