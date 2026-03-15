import { Router } from 'express';
import { clinicaDashboardController } from '../controllers/clinica-dashboard.controller';
import { ClinicaLogoController, logoUpload } from '../controllers/clinica-logo.controller';
import { clinicAuthMiddleware } from '../middleware/clinicAuth.middleware';

const router = Router();
const logoController = new ClinicaLogoController();

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

// Logo da clínica (própria)
router.post('/logo', clinicAuthMiddleware, logoUpload.single('logo'), (req, res) =>
    logoController.uploadLogoOwn(req, res)
);
router.delete('/logo', clinicAuthMiddleware, (req, res) =>
    logoController.deleteLogo(req, res)
);

export default router;
