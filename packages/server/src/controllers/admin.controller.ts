import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';

const adminService = new AdminService();

export class AdminController {
    // 1. Dashboard Principal (Metricas Gerais)
    async getDashboardMetrics(_req: Request, res: Response) {
        try {
            const metrics = await adminService.getDashboardMetrics();
            return res.json(metrics);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // 2. Relatório de Vendas
    async getSalesReport(req: Request, res: Response) {
        try {
            const { period } = req.query;
            const report = await adminService.getSalesReports(period as 'day' | 'month' || 'day');
            return res.json(report);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // 2.1. Relatório Financeiro Mensal
    async getFinancialReport(req: Request, res: Response) {
        try {
            const { mes } = req.query;
            const report = await adminService.getFinancialReport(mes as string);
            return res.json(report);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // 3. Follow Ups
    async getFollowUps(_req: Request, res: Response) {
        try {
            const followUps = await adminService.getFollowUps();
            return res.json(followUps);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async markFollowUp(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await adminService.markFollowUp(id);
            return res.status(200).send();
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
