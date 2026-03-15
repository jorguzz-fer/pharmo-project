import { Router } from 'express';
import { ProdutoController } from '../controllers/produto.controller';

const router = Router();
const produtoController = new ProdutoController();

// Rotas públicas (catálogo de consulta)
router.get('/', produtoController.listar);
router.get('/:id', produtoController.buscarPorId);

export default router;
