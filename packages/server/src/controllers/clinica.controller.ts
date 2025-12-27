import { Request, Response } from 'express';
import { ClinicaService } from '../services/clinica.service';
import { z } from 'zod';

const clinicaService = new ClinicaService();

export class ClinicaController {
    async create(req: Request, res: Response) {
        const schema = z.object({
            nome_fantasia: z.string().min(3),
            razao_social: z.string().min(3),
            cnpj: z.string().min(14), // Accept CNPJ with or without formatting
            inscricao_estadual: z.string().optional(),
            email: z.string().email(),
            telefone: z.string().optional(),
            whatsapp: z.string().optional(),
            cep: z.string().optional(),
            logradouro: z.string().optional(),
            numero: z.string().optional(),
            complemento: z.string().optional(),
            bairro: z.string().optional(),
            cidade: z.string().optional(),
            estado: z.string().length(2).optional(),
            responsavel_legal: z.string().min(3),
            cpf_responsavel: z.string(),
            observacoes_internas: z.string().optional()
        });

        try {
            console.log('📝 Creating clinic with data:', JSON.stringify(req.body, null, 2));
            const data = schema.parse(req.body);
            console.log('✅ Validation passed, creating clinic...');

            const clinica = await clinicaService.create(data);
            console.log('✅ Clinic created successfully:', clinica.id);

            // Enviar email de cadastro (não bloquear se falhar)
            try {
                const { EmailService } = await import('../services/email.service');
                const emailService = new EmailService();
                await emailService.sendClinicaCadastrada(clinica);
            } catch (emailError) {
                console.error('Error sending email (non-blocking):', emailError);
                // Não falhar a criação da clínica se o email falhar
            }

            return res.status(201).json(clinica);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error('❌ Validation error:', error.issues);
                const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
                return res.status(400).json({ error: errorMessages });
            }
            console.error('❌ Error creating clinica:', error);
            console.error('Error stack:', (error as Error).stack);
            return res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const { status, cidade, search } = req.query;
            const clinicas = await clinicaService.list({
                status: status as any,
                cidade: cidade as string,
                search: search as string
            });
            return res.json(clinicas);
        } catch (error) {
            console.error('Error listing clinicas:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const clinica = await clinicaService.getById(id);

            if (!clinica) {
                return res.status(404).json({ error: 'Clínica não encontrada' });
            }

            return res.json(clinica);
        } catch (error) {
            console.error('Error getting clinica:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const clinica = await clinicaService.update(id, req.body);
            return res.json(clinica);
        } catch (error) {
            console.error('Error updating clinica:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.userId; // do authMiddleware

            const clinica = await clinicaService.updateStatus(id, status, userId!);
            return res.json(clinica);
        } catch (error) {
            console.error('Error updating status:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async softDelete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const clinica = await clinicaService.softDelete(id);
            return res.json(clinica);
        } catch (error) {
            console.error('Error deleting clinica:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMetrics(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const metrics = await clinicaService.getMetrics(id);
            return res.json(metrics);
        } catch (error) {
            console.error('Error getting metrics:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Vinculação de Veterinários
    async vincularVeterinario(req: Request, res: Response) {
        try {
            const { id: clinicaId } = req.params;
            const { veterinario_id, cargo } = req.body;

            if (!veterinario_id) {
                return res.status(400).json({ error: 'veterinario_id é obrigatório' });
            }

            const { ClinicaVeterinarioService } = await import('../services/clinica-veterinario.service');
            const service = new ClinicaVeterinarioService();

            const vinculacao = await service.vincular(clinicaId, veterinario_id, cargo);
            return res.status(201).json(vinculacao);
        } catch (error: any) {
            console.error('Error vinculando veterinario:', error);
            return res.status(400).json({ error: error.message || 'Erro ao vincular veterinário' });
        }
    }

    async desvincularVeterinario(req: Request, res: Response) {
        try {
            const { id: clinicaId, vetId } = req.params;

            const { ClinicaVeterinarioService } = await import('../services/clinica-veterinario.service');
            const service = new ClinicaVeterinarioService();

            const vinculacao = await service.desvincular(clinicaId, vetId);
            return res.json(vinculacao);
        } catch (error: any) {
            console.error('Error desvinculando veterinario:', error);
            return res.status(400).json({ error: error.message || 'Erro ao desvincular veterinário' });
        }
    }

    async listarVeterinarios(req: Request, res: Response) {
        try {
            const { id: clinicaId } = req.params;

            const { ClinicaVeterinarioService } = await import('../services/clinica-veterinario.service');
            const service = new ClinicaVeterinarioService();

            const veterinarios = await service.listarVeterinarios(clinicaId);
            return res.json(veterinarios);
        } catch (error) {
            console.error('Error listing veterinarios:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
