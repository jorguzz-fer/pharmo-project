import { Router } from 'express';
import { UsuarioController } from './usuario.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { createUsuarioSchema, updateUsuarioSchema } from './usuario.schema';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new UsuarioController();

router.use(authMiddleware);
router.use(requireRole('ADMIN_CLINICA'));

router.post('/', validate({ body: createUsuarioSchema }), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.findAll));
router.get('/:id', asyncHandler(controller.findById));
router.put('/:id', validate({ body: updateUsuarioSchema }), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.deactivate));

export const usuarioRoutes = router;
