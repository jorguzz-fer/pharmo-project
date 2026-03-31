import { Router } from 'express';
import { InsumoController, FormaFarmaceuticaController } from '../controllers/insumo.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const insumoController = new InsumoController();
const formaController = new FormaFarmaceuticaController();

// Insumos Farmacêuticos
router.get('/insumos', authMiddleware, insumoController.buscar);
router.get('/insumos/controlados', authMiddleware, insumoController.listarControlados);
router.get('/insumos/verificar-controlado', authMiddleware, insumoController.verificarControlado);
router.get('/insumos/:id', authMiddleware, insumoController.buscarPorId);
router.patch('/insumos/:id/controlado', authMiddleware, insumoController.toggleControlado);

// Regras de Exceção
router.get('/regras-excecao', authMiddleware, insumoController.listarExcecoes);
router.post('/regras-excecao', authMiddleware, insumoController.adicionarExcecao);
router.delete('/regras-excecao/:id', authMiddleware, insumoController.removerExcecao);

// Formas Farmacêuticas
router.get('/formas-farmaceuticas', authMiddleware, formaController.listar);

export default router;
