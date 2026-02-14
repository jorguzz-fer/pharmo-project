import PDFDocument from 'pdfkit';
import { prisma } from '../../shared/utils/prisma';
import { AppError } from '../../shared/errors/app-error';

export class PdfService {
  /**
   * Gera PDF da prescricao white-label
   */
  async gerarPdf(clinicaId: string, prescricaoId: string): Promise<Buffer> {
    const prescricao = await prisma.prescricao.findFirst({
      where: { id: prescricaoId, clinica_id: clinicaId },
      include: {
        clinica: true,
        veterinario: true,
        tutor: true,
        animal: true,
        itens: {
          include: {
            principio_ativo: true,
            concentracao: true,
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!prescricao) throw AppError.notFound('Prescricao nao encontrada');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Prescricao - ${prescricao.tutor.nome} - ${prescricao.animal.nome}`,
          Author: prescricao.veterinario.nome,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { clinica, veterinario, tutor, animal, itens } = prescricao;
      const corPrimaria = clinica.cor_primaria || '#2563EB';

      // === CABECALHO ===
      doc.rect(0, 0, doc.page.width, 120).fill(corPrimaria);

      doc.fillColor('#FFFFFF')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(clinica.nome_fantasia, 50, 30, { width: 400 });

      doc.fontSize(9)
        .font('Helvetica')
        .text(`CNPJ: ${clinica.cnpj}`, 50, 58);

      if (clinica.telefone) {
        doc.text(`Tel: ${clinica.telefone}`, 50, 70);
      }

      if (clinica.logradouro) {
        const endereco = [
          clinica.logradouro,
          clinica.numero,
          clinica.bairro,
          clinica.cidade,
          clinica.estado,
        ].filter(Boolean).join(', ');
        doc.text(endereco, 50, 82, { width: 400 });
      }

      doc.text(`Email: ${clinica.email}`, 50, 94);

      // === TITULO ===
      doc.fillColor('#000000')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('PRESCRICAO VETERINARIA', 50, 140, { align: 'center' });

      // Linha
      doc.moveTo(50, 165).lineTo(545, 165).strokeColor(corPrimaria).lineWidth(2).stroke();

      // === DADOS DO VETERINARIO ===
      let y = 180;
      doc.fillColor('#333333')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('VETERINARIO RESPONSAVEL', 50, y);

      y += 18;
      doc.fontSize(10).font('Helvetica')
        .text(`Dr(a). ${veterinario.nome}`, 50, y)
        .text(`CRMV-${veterinario.uf_crmv} ${veterinario.crmv}`, 350, y);

      if (veterinario.especialidades.length > 0) {
        y += 14;
        doc.text(`Especialidades: ${veterinario.especialidades.join(', ')}`, 50, y);
      }

      // === DADOS DO PACIENTE ===
      y += 30;
      doc.fontSize(11).font('Helvetica-Bold')
        .text('PACIENTE', 50, y);

      y += 18;
      doc.fontSize(10).font('Helvetica');

      const idade = animal.data_nascimento
        ? calcularIdade(animal.data_nascimento)
        : 'N/I';

      doc.text(`Animal: ${animal.nome}`, 50, y);
      doc.text(`Especie: ${animal.especie}`, 250, y);
      doc.text(`Raca: ${animal.raca || 'N/I'}`, 400, y);

      y += 14;
      doc.text(`Peso: ${animal.peso_kg}kg`, 50, y);
      doc.text(`Sexo: ${animal.sexo || 'N/I'}`, 250, y);
      doc.text(`Idade: ${idade}`, 400, y);

      // === TUTOR ===
      y += 14;
      doc.text(`Tutor: ${tutor.nome}`, 50, y);
      if (tutor.cpf) doc.text(`CPF: ${tutor.cpf}`, 350, y);

      // === DIAGNOSTICO ===
      if (prescricao.diagnostico) {
        y += 25;
        doc.fontSize(11).font('Helvetica-Bold')
          .text('DIAGNOSTICO / INDICACAO', 50, y);
        y += 16;
        doc.fontSize(10).font('Helvetica')
          .text(prescricao.diagnostico, 50, y, { width: 495 });
        y += doc.heightOfString(prescricao.diagnostico, { width: 495 });
      }

      // === PRESCRICAO ===
      y += 25;
      doc.moveTo(50, y).lineTo(545, y).strokeColor(corPrimaria).lineWidth(1).stroke();
      y += 10;

      doc.fontSize(11).font('Helvetica-Bold')
        .text('FORMULACAO / POSOLOGIA', 50, y);
      y += 20;

      for (let i = 0; i < itens.length; i++) {
        const item = itens[i];

        // Verificar se precisa nova pagina
        if (y > 680) {
          doc.addPage();
          y = 50;
        }

        // Numero do item
        doc.fontSize(10).font('Helvetica-Bold')
          .fillColor(corPrimaria)
          .text(`${i + 1}.`, 50, y);

        // Nome do ativo + concentracao
        const concentracao = item.concentracao
          ? ` ${item.concentracao.valor}${item.concentracao.unidade}`
          : '';

        doc.fillColor('#000000')
          .text(`${item.principio_ativo.nome_padronizado}${concentracao}`, 70, y);

        if (item.principio_ativo.controlado) {
          doc.fillColor('#DC2626')
            .fontSize(8)
            .text(' [CONTROLADO]', 70 + doc.widthOfString(`${item.principio_ativo.nome_padronizado}${concentracao}`) + 5, y + 1);
        }

        y += 16;
        doc.fillColor('#333333').fontSize(9).font('Helvetica');

        // Posologia
        if (item.posologia_texto) {
          doc.text(item.posologia_texto, 70, y, { width: 465 });
          y += doc.heightOfString(item.posologia_texto, { width: 465 });
        }

        // Detalhes tecnicos
        y += 4;
        doc.fontSize(8).fillColor('#666666')
          .text(
            `Dose: ${item.dose_mg_kg}mg/kg | Total/dose: ${item.dose_total_mg}mg | ` +
            `Freq: ${item.frequencia_horas}h | Dias: ${item.duracao_dias} | ` +
            `Qtd total: ${item.quantidade_total} ${item.forma_farmaceutica.toLowerCase()}(s)`,
            70, y,
          );

        if (item.observacoes) {
          y += 12;
          doc.text(`Obs: ${item.observacoes}`, 70, y, { width: 465 });
          y += doc.heightOfString(`Obs: ${item.observacoes}`, { width: 465 });
        }

        y += 15;
      }

      // === OBSERVACOES GERAIS ===
      if (prescricao.observacoes) {
        y += 10;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
          .text('OBSERVACOES', 50, y);
        y += 16;
        doc.fontSize(10).font('Helvetica')
          .text(prescricao.observacoes, 50, y, { width: 495 });
        y += doc.heightOfString(prescricao.observacoes, { width: 495 });
      }

      // === ASSINATURA ===
      y = Math.max(y + 50, 650);
      if (y > 720) {
        doc.addPage();
        y = 200;
      }

      doc.moveTo(150, y).lineTo(400, y).strokeColor('#000000').lineWidth(0.5).stroke();
      y += 5;
      doc.fontSize(10).font('Helvetica-Bold')
        .text(`Dr(a). ${veterinario.nome}`, 150, y, { width: 250, align: 'center' });
      y += 14;
      doc.fontSize(9).font('Helvetica')
        .text(`CRMV-${veterinario.uf_crmv} ${veterinario.crmv}`, 150, y, { width: 250, align: 'center' });

      if (prescricao.signed_at) {
        y += 14;
        doc.fontSize(8).fillColor('#666666')
          .text(`Assinado em: ${prescricao.signed_at.toLocaleDateString('pt-BR')} as ${prescricao.signed_at.toLocaleTimeString('pt-BR')}`, 150, y, { width: 250, align: 'center' });
      }

      // === RODAPE ===
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor('#999999')
          .text(
            `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} | ${clinica.nome_fantasia} | Pagina ${i + 1} de ${pageCount}`,
            50,
            doc.page.height - 30,
            { width: 495, align: 'center' },
          );
      }

      doc.end();
    });
  }
}

function calcularIdade(dataNascimento: Date): string {
  const hoje = new Date();
  const diff = hoje.getTime() - dataNascimento.getTime();
  const anos = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  const meses = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

  if (anos > 0) return `${anos} ano(s) e ${meses} mes(es)`;
  return `${meses} mes(es)`;
}
