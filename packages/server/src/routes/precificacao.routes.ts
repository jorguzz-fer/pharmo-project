import { Router } from 'express';
import { PrecificacaoController } from '../controllers/precificacao.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const controller = new PrecificacaoController();

router.post('/precificacao/calcular', authMiddleware, controller.calcular);

export default router;
