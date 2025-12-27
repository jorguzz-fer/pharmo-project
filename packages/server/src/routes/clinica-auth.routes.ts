import { Router } from 'express';
import { clinicaAuthController } from '../controllers/clinica-auth.controller';

const router = Router();

// Rotas públicas (não requerem autenticação)
router.post('/clinica/login', (req, res) => clinicaAuthController.login(req, res));
router.post('/clinica/forgot-password', (req, res) => clinicaAuthController.forgotPassword(req, res));
router.post('/clinica/reset-password', (req, res) => clinicaAuthController.resetPassword(req, res));

// Rota administrativa (para definir senha inicial)
router.post('/clinica/set-initial-password', (req, res) => clinicaAuthController.setInitialPassword(req, res));

export default router;
