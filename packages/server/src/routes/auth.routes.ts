import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/auth/veterinario/login', authController.loginVet);

export { router as authRoutes };
