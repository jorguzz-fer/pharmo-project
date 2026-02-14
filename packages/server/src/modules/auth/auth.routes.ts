import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { loginSchema, refreshSchema } from './auth.schema';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new AuthController();

router.post('/login', validate({ body: loginSchema }), asyncHandler(controller.login));
router.post('/refresh', validate({ body: refreshSchema }), asyncHandler(controller.refresh));
router.post('/logout', authMiddleware, asyncHandler(controller.logout));
router.get('/me', authMiddleware, asyncHandler(controller.me));

export const authRoutes = router;
