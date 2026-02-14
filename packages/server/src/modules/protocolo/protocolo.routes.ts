import { Router } from 'express';
import { ProtocoloController } from './protocolo.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { createProtocoloSchema, updateProtocoloSchema } from './protocolo.schema';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new ProtocoloController();

router.use(authMiddleware);

router.post('/', requireRole('ADMIN_CLINICA', 'VETERINARIO'), validate({ body: createProtocoloSchema }), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.findAll));
router.get('/:id', asyncHandler(controller.findById));
router.put('/:id', requireRole('ADMIN_CLINICA', 'VETERINARIO'), validate({ body: updateProtocoloSchema }), asyncHandler(controller.update));
router.delete('/:id', requireRole('ADMIN_CLINICA'), asyncHandler(controller.delete));

export const protocoloRoutes = router;
