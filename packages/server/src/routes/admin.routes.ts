import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const adminController = new AdminController();

// Dashboard Metrics (Protected, assume role checking in middleware in future)
router.get('/admin/dashboard', authMiddleware, adminController.getDashboardMetrics);

// Sales Report
router.get('/admin/relatorios/vendas', authMiddleware, adminController.getSalesReport);

// Follow Ups
router.get('/admin/follow-ups', authMiddleware, adminController.getFollowUps);
router.patch('/admin/follow-ups/:id/done', authMiddleware, adminController.markFollowUp);

export { router as adminRoutes };
