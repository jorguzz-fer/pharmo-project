import { Router } from 'express';
import { BularioController } from '../controllers/bulario.controller';
import { PrescricaoController } from '../controllers/prescricao.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const bularioController = new BularioController();
const prescricaoController = new PrescricaoController();

// Bulário
router.get('/bulario/buscar', authMiddleware, bularioController.search);

// Prescrições
router.post('/prescricoes', authMiddleware, prescricaoController.create);
router.get('/prescricoes', authMiddleware, prescricaoController.listByVet);
router.post('/prescricoes/:id/enviar', authMiddleware, prescricaoController.sendToClient);

export { router as prescricaoRoutes };
