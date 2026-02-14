import { Router } from 'express';
import { ValidacaoController } from './validacao.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new ValidacaoController();

router.use(authMiddleware);

router.get('/', asyncHandler(controller.getLogs));
router.get('/:prescricaoId', asyncHandler(controller.getLogsPorPrescricao));

export const validacaoRoutes = router;
