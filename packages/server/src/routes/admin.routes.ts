import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const adminController = new AdminController();

// Dashboard Metrics (Protected, assume role checking in middleware in future)
router.get('/admin/dashboard', authMiddleware, adminController.getDashboardMetrics);

// Sales Report
router.get('/admin/relatorios/vendas', authMiddleware, adminController.getSalesReport);

export { router as adminRoutes };
