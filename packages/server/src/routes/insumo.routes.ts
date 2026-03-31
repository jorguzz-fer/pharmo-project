import { Router } from 'express';
import { InsumoController, FormaFarmaceuticaController } from '../controllers/insumo.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const insumoController = new InsumoController();
const formaController = new FormaFarmaceuticaController();

// Insumos Farmacêuticos
router.get('/insumos', authMiddleware, insumoController.buscar);
router.get('/insumos/:id', authMiddleware, insumoController.buscarPorId);

// Formas Farmacêuticas
router.get('/formas-farmaceuticas', authMiddleware, formaController.listar);

export default router;
