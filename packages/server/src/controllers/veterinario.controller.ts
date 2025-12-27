import { Request, Response } from 'express';
import { VeterinarioService } from '../services/veterinario.service';
import { z } from 'zod';

const veterinarioService = new VeterinarioService();

export class VeterinarioController {
    async create(req: Request, res: Response) {
        const schema = z.object({
            nome: z.string().min(3),
            cpf: z.string().min(11), // Accept CPF with or without formatting
            crv: z.string().min(5), // Accept flexible CRV format (e.g., SP-43210 or SP43210)
            uf_crmv: z.string().length(2).optional(), // Optional for backward compatibility
            numero_crmv: z.string().optional(), // Optional for backward compatibility
            email: z.string().email(),
            telefone: z.string(),
            especialidades: z.array(z.string()).optional()
        });

        try {
            const data = schema.parse(req.body);
            const veterinario = await veterinarioService.create(data);
            return res.status(201).json(veterinario);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
                return res.status(400).json({ error: errorMessages });
            }
            console.error('Error creating veterinario:', error);
            return res.status(400).json({ error: error.message || 'Erro ao criar veterinário' });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const veterinarios = await veterinarioService.list();
            return res.json(veterinarios);
        } catch (error) {
            console.error('Error listing veterinarios:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const veterinario = await veterinarioService.getById(id);

            if (!veterinario) {
                return res.status(404).json({ error: 'Veterinário não encontrado' });
            }

            return res.json(veterinario);
        } catch (error) {
            console.error('Error getting veterinario:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async buscar(req: Request, res: Response) {
        try {
            const { q } = req.query;

            if (!q) {
                return res.status(400).json({ error: 'Parâmetro "q" é obrigatório' });
            }

            const veterinario = await veterinarioService.buscar(q as string);

            if (!veterinario) {
                return res.status(404).json({ error: 'Veterinário não encontrado' });
            }

            return res.json(veterinario);
        } catch (error) {
            console.error('Error searching veterinario:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const veterinario = await veterinarioService.update(id, req.body);
            return res.json(veterinario);
        } catch (error) {
            console.error('Error updating veterinario:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getClinicas(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const clinicas = await veterinarioService.getClinicas(id);
            return res.json(clinicas);
        } catch (error) {
            console.error('Error getting clinicas:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Endpoint para veterinário logado ver suas clínicas
    async getMinhasClinicas(req: Request, res: Response) {
        try {
            const veterinarioId = req.userId!;
            const clinicas = await veterinarioService.getClinicas(veterinarioId);

            // Filtrar apenas clínicas aprovadas
            const clinicasAprovadas = clinicas.filter(c => c.status === 'APROVADA');

            return res.json(clinicasAprovadas);
        } catch (error) {
            console.error('Error getting minhas clinicas:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
