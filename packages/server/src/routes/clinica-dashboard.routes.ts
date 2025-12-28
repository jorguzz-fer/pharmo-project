import { Router } from 'express';
import { clinicaDashboardController } from '../controllers/clinica-dashboard.controller';
import { clinicAuthMiddleware } from '../middleware/clinicAuth.middleware';

const router = Router();

// Rota protegida - requer autenticação
router.get('/dashboard', clinicAuthMiddleware, (req, res) =>
    clinicaDashboardController.getDashboard(req, res)
);

router.get('/prescricoes', clinicAuthMiddleware, (req, res) =>
    clinicaDashboardController.getPrescricoes(req, res)
);

router.get('/veterinarios', clinicAuthMiddleware, (req, res) =>
    clinicaDashboardController.getVeterinarios(req, res)
);

export default router;
