import { Router } from 'express';
import { PasswordResetController } from '../controllers/password-reset.controller';

const router = Router();
const passwordResetController = new PasswordResetController();

// Rotas públicas (sem autenticação)
router.post('/password-reset/request', passwordResetController.requestReset);
router.get('/password-reset/validate/:token', passwordResetController.validateToken);
router.post('/password-reset/reset', passwordResetController.resetPassword);

export { router as passwordResetRoutes };
