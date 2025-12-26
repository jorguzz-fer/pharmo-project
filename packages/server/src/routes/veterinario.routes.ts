import { Router } from 'express';
import { VeterinarioController } from '../controllers/veterinario.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const veterinarioController = new VeterinarioController();

// Rotas Admin
router.get('/admin/veterinarios', authMiddleware, veterinarioController.list);
router.get('/admin/veterinarios/busca', authMiddleware, veterinarioController.buscar);
router.get('/admin/veterinarios/:id', authMiddleware, veterinarioController.getById);
router.post('/admin/veterinarios', authMiddleware, veterinarioController.create);
router.put('/admin/veterinarios/:id', authMiddleware, veterinarioController.update);
router.get('/admin/veterinarios/:id/clinicas', authMiddleware, veterinarioController.getClinicas);

// Rota para veterinário logado
router.get('/veterinario/minhas-clinicas', authMiddleware, veterinarioController.getMinhasClinicas);

export { router as veterinarioRoutes };
