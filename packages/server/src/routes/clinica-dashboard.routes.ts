import { Router } from 'express';
import { clinicaDashboardController } from '../controllers/clinica-dashboard.controller';
import { clinicAuthMiddleware } from '../middleware/clinicAuth.middleware';

const router = Router();

// Rota protegida - requer autenticação
router.get('/dashboard', clinicAuthMiddleware, (req, res) =>
    clinicaDashboardController.getDashboard(req, res)
);

export default router;
