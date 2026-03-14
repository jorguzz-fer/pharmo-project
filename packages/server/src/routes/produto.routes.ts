import { Router } from 'express';
import { ProdutoController } from '../controllers/produto.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const produtoController = new ProdutoController();

router.get('/', authMiddleware, produtoController.listar);
router.get('/:id', authMiddleware, produtoController.buscarPorId);

export default router;
