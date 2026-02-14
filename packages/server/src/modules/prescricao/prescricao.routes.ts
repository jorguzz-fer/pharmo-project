import { Router } from 'express';
import { PrescricaoController } from './prescricao.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { createPrescricaoSchema, updatePrescricaoSchema, aceiteForaFaixaSchema, calcularPreviewSchema } from './prescricao.schema';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new PrescricaoController();

router.use(authMiddleware);

// CRUD
router.post('/', requireRole('VETERINARIO', 'ADMIN_CLINICA'), validate({ body: createPrescricaoSchema }), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.findAll));
router.get('/:id', asyncHandler(controller.findById));
router.put('/:id', requireRole('VETERINARIO', 'ADMIN_CLINICA'), validate({ body: updatePrescricaoSchema }), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.cancelar));

// Motor de validacao
router.post('/:id/validar', requireRole('VETERINARIO', 'ADMIN_CLINICA'), asyncHandler(controller.validar));
router.post('/:id/aceite', requireRole('VETERINARIO'), validate({ body: aceiteForaFaixaSchema }), asyncHandler(controller.aceite));
router.post('/:id/assinar', requireRole('VETERINARIO'), asyncHandler(controller.assinar));

// Calculo preview
router.post('/calcular', validate({ body: calcularPreviewSchema }), asyncHandler(controller.calcular));

export const prescricaoRoutes = router;
