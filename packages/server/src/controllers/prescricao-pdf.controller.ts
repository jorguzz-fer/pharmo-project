import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generatePrescriptionPdf } from '../services/pdf.service';

const prisma = new PrismaClient();

export class PrescricaoPdfController {
    async generatePdf(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const prescricao = await prisma.prescricao.findUnique({
                where: { id },
                include: {
                    veterinario: true,
                    tutor: true,
                    animal: true,
                    clinica: true,
                    medicamentos: true,
                    orcamento: true,
                },
            });

            if (!prescricao) {
                return res.status(404).json({ error: 'Prescrição não encontrada' });
            }

            // Fetch clinic logo if available
            let logoBuffer: Buffer | null = null;
            if (prescricao.clinica?.logo_url) {
                try {
                    const response = await fetch(prescricao.clinica.logo_url);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        logoBuffer = Buffer.from(arrayBuffer);
                    }
                } catch {
                    // If logo fetch fails, continue without it
                }
            }

            // Build medication list: use PrescricaoMedicamento if available, fallback to deprecated fields
            const medicamentos = prescricao.medicamentos.length > 0
                ? prescricao.medicamentos
                : [{
                    medicamento: prescricao.medicamento,
                    codigo_medicamento: null,
                    dosagem: prescricao.dosagem,
                    forma_farmaceutica: prescricao.forma_farmaceutica,
                    quantidade: prescricao.quantidade,
                    observacoes: prescricao.observacoes,
                }];

            const pdfBuffer = await generatePrescriptionPdf(
                {
                    id: prescricao.id,
                    created_at: prescricao.created_at,
                    observacoes: prescricao.observacoes,
                    veterinario: {
                        nome: prescricao.veterinario.nome,
                        crv: prescricao.veterinario.crv,
                        email: prescricao.veterinario.email,
                        telefone: prescricao.veterinario.telefone,
                    },
                    tutor: {
                        nome: prescricao.tutor.nome,
                        cpf: prescricao.tutor.cpf,
                        telefone: prescricao.tutor.telefone,
                        endereco: prescricao.tutor.endereco,
                    },
                    animal: {
                        nome: prescricao.animal.nome,
                        especie: prescricao.animal.especie,
                        raca: prescricao.animal.raca,
                        peso: prescricao.animal.peso,
                    },
                    clinica: prescricao.clinica ? {
                        nome_fantasia: prescricao.clinica.nome_fantasia,
                        cnpj: prescricao.clinica.cnpj,
                        telefone: prescricao.clinica.telefone,
                        whatsapp: prescricao.clinica.whatsapp,
                        email: prescricao.clinica.email,
                        logo_url: prescricao.clinica.logo_url,
                        logradouro: prescricao.clinica.logradouro,
                        numero: prescricao.clinica.numero,
                        complemento: prescricao.clinica.complemento,
                        bairro: prescricao.clinica.bairro,
                        cidade: prescricao.clinica.cidade,
                        estado: prescricao.clinica.estado,
                        cep: prescricao.clinica.cep,
                    } : null,
                    medicamentos,
                    orcamento: prescricao.orcamento ? {
                        valor_total: Number(prescricao.orcamento.valor_total),
                    } : null,
                },
                logoBuffer,
            );

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="receita-${prescricao.id.slice(0, 8)}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            return res.send(pdfBuffer);
        } catch (error) {
            console.error('PDF generation error:', error);
            return res.status(500).json({ error: 'Erro ao gerar PDF' });
        }
    }

    /**
     * Generate a draft PDF from data sent in the request body (no DB lookup required).
     * Used for "Imprimir Rascunho" before the prescription is saved.
     */
    async generateDraftPdf(req: Request, res: Response) {
        try {
            const { veterinario, tutor, animal, medicamentos } = req.body;

            if (!veterinario || !tutor || !animal || !medicamentos || medicamentos.length === 0) {
                return res.status(400).json({ error: 'Dados incompletos para gerar o rascunho' });
            }

            // Try to find the vet's clinic for branding
            let clinicaData = null;
            let logoBuffer: Buffer | null = null;

            const vetId = req.userId;
            if (vetId) {
                const clinicaVet = await prisma.clinicaVeterinario.findFirst({
                    where: { veterinario_id: vetId, status: 'ativo' },
                    include: { clinica: true },
                });

                if (clinicaVet?.clinica) {
                    const c = clinicaVet.clinica;
                    clinicaData = {
                        nome_fantasia: c.nome_fantasia,
                        cnpj: c.cnpj,
                        telefone: c.telefone,
                        whatsapp: c.whatsapp,
                        email: c.email,
                        logo_url: c.logo_url,
                        logradouro: c.logradouro,
                        numero: c.numero,
                        complemento: c.complemento,
                        bairro: c.bairro,
                        cidade: c.cidade,
                        estado: c.estado,
                        cep: c.cep,
                    };

                    if (c.logo_url) {
                        try {
                            const response = await fetch(c.logo_url);
                            if (response.ok) {
                                const arrayBuffer = await response.arrayBuffer();
                                logoBuffer = Buffer.from(arrayBuffer);
                            }
                        } catch { /* skip logo */ }
                    }
                }
            }

            const pdfBuffer = await generatePrescriptionPdf(
                {
                    id: 'RASCUNHO',
                    created_at: new Date(),
                    observacoes: null,
                    veterinario,
                    tutor,
                    animal,
                    clinica: clinicaData,
                    medicamentos,
                },
                logoBuffer,
            );

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="receita-rascunho.pdf"');
            res.setHeader('Content-Length', pdfBuffer.length);
            return res.send(pdfBuffer);
        } catch (error) {
            console.error('Draft PDF generation error:', error);
            return res.status(500).json({ error: 'Erro ao gerar rascunho PDF' });
        }
    }
}
