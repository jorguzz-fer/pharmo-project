import { Router } from 'express';
import { InsumoController, FormaFarmaceuticaController } from '../controllers/insumo.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();
const insumoController = new InsumoController();
const formaController = new FormaFarmaceuticaController();

// Insumos Farmacêuticos — leitura liberada para o app do veterinário,
// escrita restrita ao painel administrativo.
router.get('/insumos', authMiddleware, insumoController.buscar);
router.get('/insumos/controlados', authMiddleware, insumoController.listarControlados);
router.get('/insumos/verificar-controlado', authMiddleware, insumoController.verificarControlado);
router.get('/insumos/:id', authMiddleware, insumoController.buscarPorId);
router.post('/insumos', authMiddleware, adminMiddleware, insumoController.criar);
router.put('/insumos/:id', authMiddleware, adminMiddleware, insumoController.atualizar);
router.delete('/insumos/:id', authMiddleware, adminMiddleware, insumoController.inativar);
router.patch('/insumos/:id/controlado', authMiddleware, adminMiddleware, insumoController.toggleControlado);

// Regras de Exceção
router.get('/regras-excecao', authMiddleware, insumoController.listarExcecoes);
router.post('/regras-excecao', authMiddleware, adminMiddleware, insumoController.adicionarExcecao);
router.delete('/regras-excecao/:id', authMiddleware, adminMiddleware, insumoController.removerExcecao);

// Formas Farmacêuticas
router.get('/formas-farmaceuticas', authMiddleware, formaController.listar);

export default router;
