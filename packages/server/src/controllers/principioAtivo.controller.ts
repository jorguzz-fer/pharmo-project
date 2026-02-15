import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrincipioAtivoService } from '../services/principioAtivo.service';

const prisma = new PrismaClient();

export class PrincipioAtivoController {
    /**
     * GET /api/principios-ativos
     * Listar todos os princípios ativos com filtros opcionais
     */
    async listar(req: Request, res: Response) {
        try {
            const { ativo, controlado, classe_terapeutica, busca } = req.query;

            const filtros = {
                ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined,
                controlado: controlado === 'true' ? true : controlado === 'false' ? false : undefined,
                classe_terapeutica: classe_terapeutica as string,
                busca: busca as string
            };

            const service = new PrincipioAtivoService(prisma);
            const principios = await service.listarTodos(filtros);

            res.json({
                success: true,
                data: principios,
                total: principios.length
            });
        } catch (error) {
            console.error('Erro ao listar princípios ativos:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao listar princípios ativos'
            });
        }
    }

    /**
     * GET /api/principios-ativos/:id
     * Buscar princípio ativo por ID
     */
    async buscarPorId(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const service = new PrincipioAtivoService(prisma);
            const principio = await service.buscarPorId(id);

            if (!principio) {
                return res.status(404).json({
                    success: false,
                    error: 'Princípio ativo não encontrado'
                });
            }

            res.json({
                success: true,
                data: principio
            });
        } catch (error) {
            console.error('Erro ao buscar princípio ativo:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar princípio ativo'
            });
        }
    }

    /**
     * POST /api/principios-ativos
     * Criar novo princípio ativo (apenas ADMIN)
     */
    async criar(req: Request, res: Response) {
        try {
            // Verificar se é admin
            if ((req as any).user?.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Apenas administradores podem criar princípios ativos.'
                });
            }

            const service = new PrincipioAtivoService(prisma);
            const principio = await service.criar(req.body);

            res.status(201).json({
                success: true,
                data: principio,
                message: 'Princípio ativo criado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao criar princípio ativo:', error);

            // Erro de duplicação (nome único)
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    error: 'Já existe um princípio ativo com este nome'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro ao criar princípio ativo'
            });
        }
    }

    /**
     * PUT /api/principios-ativos/:id
     * Atualizar princípio ativo (apenas ADMIN)
     */
    async atualizar(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado'
                });
            }

            const { id } = req.params;
            const service = new PrincipioAtivoService(prisma);
            const principio = await service.atualizar(id, req.body);

            res.json({
                success: true,
                data: principio,
                message: 'Princípio ativo atualizado com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao atualizar princípio ativo:', error);

            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    error: 'Princípio ativo não encontrado'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro ao atualizar princípio ativo'
            });
        }
    }

    /**
     * DELETE /api/principios-ativos/:id
     * Desativar princípio ativo (soft delete)
     */
    async desativar(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado'
                });
            }

            const { id } = req.params;
            const service = new PrincipioAtivoService(prisma);
            await service.desativar(id);

            res.json({
                success: true,
                message: 'Princípio ativo desativado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao desativar princípio ativo:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao desativar princípio ativo'
            });
        }
    }

    /**
     * GET /api/principios-ativos/:id/concentracoes
     * Buscar concentrações válidas
     */
    async buscarConcentracoes(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { forma_farmaceutica } = req.query;

            const service = new PrincipioAtivoService(prisma);
            const concentracoes = await service.buscarConcentracoes(
                id,
                forma_farmaceutica as string
            );

            res.json({
                success: true,
                data: concentracoes
            });
        } catch (error) {
            console.error('Erro ao buscar concentrações:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao buscar concentrações'
            });
        }
    }

    /**
     * POST /api/principios-ativos/:id/concentracoes
     * Adicionar concentração
     */
    async adicionarConcentracao(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado'
                });
            }

            const { id } = req.params;
            const service = new PrincipioAtivoService(prisma);
            const concentracao = await service.adicionarConcentracao(id, req.body);

            res.status(201).json({
                success: true,
                data: concentracao,
                message: 'Concentração adicionada com sucesso'
            });
        } catch (error: any) {
            console.error('Erro ao adicionar concentração:', error);

            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    error: 'Esta concentração já existe'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro ao adicionar concentração'
            });
        }
    }

    /**
     * POST /api/principios-ativos/:id/ranges
     * Adicionar range terapêutico
     */
    async adicionarRange(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado'
                });
            }

            const { id } = req.params;
            const service = new PrincipioAtivoService(prisma);
            const range = await service.adicionarRange(id, req.body);

            res.status(201).json({
                success: true,
                data: range,
                message: 'Range terapêutico adicionado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao adicionar range:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao adicionar range terapêutico'
            });
        }
    }

    /**
     * GET /api/principios-ativos/classes-terapeuticas
     * Listar classes terapêuticas únicas
     */
    async listarClassesTerapeuticas(req: Request, res: Response) {
        try {
            const service = new PrincipioAtivoService(prisma);
            const classes = await service.listarClassesTerapeuticas();

            res.json({
                success: true,
                data: classes
            });
        } catch (error) {
            console.error('Erro ao listar classes terapêuticas:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao listar classes terapêuticas'
            });
        }
    }
}
