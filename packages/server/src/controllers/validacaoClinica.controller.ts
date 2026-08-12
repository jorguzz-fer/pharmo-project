import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ValidacaoClinicaService } from '../services/validacaoClinica.service';

const prisma = new PrismaClient();

export class ValidacaoClinicaController {
    /**
     * POST /api/validacao/dosagem
     * Validar dosagem de um medicamento
     */
    async validarDosagem(req: Request, res: Response) {
        try {
            const {
                principio_ativo_id,
                animal_id,
                dosagem_mg_kg,
                frequencia_horas,
                duracao_dias
            } = req.body;

            // Validar campos obrigatórios
            if (!principio_ativo_id || !animal_id || !dosagem_mg_kg || !frequencia_horas || !duracao_dias) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obrigatórios: principio_ativo_id, animal_id, dosagem_mg_kg, frequencia_horas, duracao_dias'
                });
            }

            const service = new ValidacaoClinicaService(prisma);
            const resultado = await service.validarDosagem({
                principio_ativo_id,
                animal_id,
                dosagem_mg_kg: parseFloat(dosagem_mg_kg),
                frequencia_horas: parseInt(frequencia_horas),
                duracao_dias: parseInt(duracao_dias)
            });

            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            console.error('Erro ao validar dosagem:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao validar dosagem'
            });
        }
    }

    /**
     * POST /api/validacao/registrar-ciencia
     * Registrar log de ciência quando veterinário aceita dosagem fora do range
     */
    async registrarCiencia(req: Request, res: Response) {
        try {
            const {
                prescricao_id,
                principio_ativo_id,
                animal_id,
                dosagem_prescrita_mg_kg,
                peso_animal_kg,
                dose_min_esperada_mg_kg,
                dose_max_esperada_mg_kg,
                motivo
            } = req.body;

            // Validar campos obrigatórios
            if (!prescricao_id || !principio_ativo_id || !animal_id || !motivo) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obrigatórios: prescricao_id, principio_ativo_id, animal_id, motivo'
                });
            }

            // Pegar veterinário do token (authMiddleware preenche req.userId)
            const veterinario_id = req.userId;
            if (!veterinario_id) {
                return res.status(401).json({
                    success: false,
                    error: 'Veterinário não autenticado'
                });
            }

            // Pegar IP e User-Agent
            const ip_address = req.ip || req.socket.remoteAddress;
            const user_agent = req.headers['user-agent'];

            const service = new ValidacaoClinicaService(prisma);
            const log = await service.registrarCiencia({
                prescricao_id,
                veterinario_id,
                principio_ativo_id,
                animal_id,
                dosagem_prescrita_mg_kg: parseFloat(dosagem_prescrita_mg_kg),
                peso_animal_kg: parseFloat(peso_animal_kg),
                dose_min_esperada_mg_kg: parseFloat(dose_min_esperada_mg_kg),
                dose_max_esperada_mg_kg: parseFloat(dose_max_esperada_mg_kg),
                motivo,
                ip_address,
                user_agent
            });

            res.status(201).json({
                success: true,
                data: log,
                message: 'Log de ciência registrado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao registrar ciência:', error);

            if (error.message?.includes('Justificativa')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro ao registrar log de ciência'
            });
        }
    }

    /**
     * GET /api/validacao/logs/:prescricao_id
     * Buscar logs de ciência por prescrição
     */
    async buscarLogsPorPrescricao(req: Request, res: Response) {
        try {
            const { prescricao_id } = req.params;

            const service = new ValidacaoClinicaService(prisma);
            const logs = await service.buscarLogsPorPrescricao(prescricao_id);

            res.json({
                success: true,
                data: logs
            });
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar logs de ciência'
            });
        }
    }

    /**
     * GET /api/validacao/logs/veterinario/:veterinario_id
     * Buscar logs de ciência por veterinário
     */
    async buscarLogsPorVeterinario(req: Request, res: Response) {
        try {
            const { veterinario_id } = req.params;
            const { limite } = req.query;

            const service = new ValidacaoClinicaService(prisma);
            const logs = await service.buscarLogsPorVeterinario(
                veterinario_id,
                limite ? parseInt(limite as string) : undefined
            );

            res.json({
                success: true,
                data: logs
            });
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar logs de ciência'
            });
        }
    }

    /**
     * GET /api/validacao/relatorio-logs
     * Relatório de logs de ciência (apenas ADMIN)
     */
    async relatorioLogsCiencia(req: Request, res: Response) {
        try {
            if (req.userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Apenas administradores podem acessar este relatório.'
                });
            }

            const { data_inicio, data_fim, veterinario_id, principio_ativo_id } = req.query;

            const filtros: any = {};

            if (data_inicio) {
                filtros.data_inicio = new Date(data_inicio as string);
            }

            if (data_fim) {
                filtros.data_fim = new Date(data_fim as string);
            }

            if (veterinario_id) {
                filtros.veterinario_id = veterinario_id as string;
            }

            if (principio_ativo_id) {
                filtros.principio_ativo_id = principio_ativo_id as string;
            }

            const service = new ValidacaoClinicaService(prisma);
            const logs = await service.relatorioLogsCiencia(filtros);

            res.json({
                success: true,
                data: logs,
                total: logs.length
            });
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao gerar relatório de logs'
            });
        }
    }

    /**
     * POST /api/validacao/calcular-quantidade
     * Calcular quantidade total de medicamento necessária
     */
    async calcularQuantidade(req: Request, res: Response) {
        try {
            const {
                dosagem_mg_kg,
                peso_kg,
                frequencia_horas,
                duracao_dias,
                concentracao_mg
            } = req.body;

            if (!dosagem_mg_kg || !peso_kg || !frequencia_horas || !duracao_dias) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obrigatórios: dosagem_mg_kg, peso_kg, frequencia_horas, duracao_dias'
                });
            }

            const service = new ValidacaoClinicaService(prisma);
            const resultado = service.calcularQuantidadeTotal({
                dosagem_mg_kg: parseFloat(dosagem_mg_kg),
                peso_kg: parseFloat(peso_kg),
                frequencia_horas: parseInt(frequencia_horas),
                duracao_dias: parseInt(duracao_dias),
                concentracao_mg: concentracao_mg ? parseFloat(concentracao_mg) : undefined
            });

            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            console.error('Erro ao calcular quantidade:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao calcular quantidade'
            });
        }
    }
}
