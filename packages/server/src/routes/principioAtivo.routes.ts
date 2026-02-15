import { Router } from 'express';
import { PrincipioAtivoController } from '../controllers/principioAtivo.controller';

const router = Router();
const controller = new PrincipioAtivoController();

// Rotas públicas (autenticadas)
router.get('/', controller.listar.bind(controller));
router.get('/classes-terapeuticas', controller.listarClassesTerapeuticas.bind(controller));
router.get('/:id', controller.buscarPorId.bind(controller));
router.get('/:id/concentracoes', controller.buscarConcentracoes.bind(controller));

// Rotas admin apenas
router.post('/', controller.criar.bind(controller));
router.put('/:id', controller.atualizar.bind(controller));
router.delete('/:id', controller.desativar.bind(controller));
router.post('/:id/concentracoes', controller.adicionarConcentracao.bind(controller));
router.post('/:id/ranges', controller.adicionarRange.bind(controller));

export default router;
