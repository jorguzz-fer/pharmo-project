import { Router } from 'express';
import { ClinicaController } from '../controllers/clinica.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const clinicaController = new ClinicaController();

// Rotas de Clínicas (Admin only)
router.get('/admin/clinicas', authMiddleware, clinicaController.list);
router.get('/admin/clinicas/:id', authMiddleware, clinicaController.getById);
router.post('/admin/clinicas', authMiddleware, clinicaController.create);
router.put('/admin/clinicas/:id', authMiddleware, clinicaController.update);
router.patch('/admin/clinicas/:id/status', authMiddleware, clinicaController.updateStatus);
router.delete('/admin/clinicas/:id', authMiddleware, clinicaController.softDelete);
router.get('/admin/clinicas/:id/metrics', authMiddleware, clinicaController.getMetrics);

export { router as clinicaRoutes };
