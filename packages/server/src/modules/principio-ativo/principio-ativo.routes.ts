import { Router } from 'express';
import { PrincipioAtivoController } from './principio-ativo.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import {
  createPrincipioAtivoSchema,
  updatePrincipioAtivoSchema,
  createConcentracaoSchema,
  createFaixaSchema,
} from './principio-ativo.schema';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new PrincipioAtivoController();

router.use(authMiddleware);

// CRUD Principio Ativo
router.post('/', requireRole('ADMIN_CLINICA', 'FARMACEUTICO'), validate({ body: createPrincipioAtivoSchema }), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.findAll));
router.get('/:id', asyncHandler(controller.findById));
router.put('/:id', requireRole('ADMIN_CLINICA', 'FARMACEUTICO'), validate({ body: updatePrincipioAtivoSchema }), asyncHandler(controller.update));
router.delete('/:id', requireRole('ADMIN_CLINICA'), asyncHandler(controller.delete));

// Concentracoes
router.post('/:id/concentracoes', requireRole('ADMIN_CLINICA', 'FARMACEUTICO'), validate({ body: createConcentracaoSchema }), asyncHandler(controller.addConcentracao));
router.put('/:id/concentracoes/:cid', requireRole('ADMIN_CLINICA', 'FARMACEUTICO'), asyncHandler(controller.updateConcentracao));
router.delete('/:id/concentracoes/:cid', requireRole('ADMIN_CLINICA'), asyncHandler(controller.deleteConcentracao));

// Faixas Terapeuticas
router.post('/:id/faixas', requireRole('ADMIN_CLINICA', 'FARMACEUTICO', 'VETERINARIO'), validate({ body: createFaixaSchema }), asyncHandler(controller.addFaixa));
router.put('/:id/faixas/:fid', requireRole('ADMIN_CLINICA', 'FARMACEUTICO', 'VETERINARIO'), asyncHandler(controller.updateFaixa));
router.delete('/:id/faixas/:fid', requireRole('ADMIN_CLINICA'), asyncHandler(controller.deleteFaixa));

export const principioAtivoRoutes = router;
