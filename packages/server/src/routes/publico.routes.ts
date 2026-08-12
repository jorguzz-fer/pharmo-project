import { Router } from 'express';
import { PublicoController } from '../controllers/publico.controller';

const router = Router();
const controller = new PublicoController();

// Rotas SEM autenticação: o acesso é pelo token do orçamento, que o tutor
// recebe por WhatsApp. Por isso os dados devolvidos são mínimos.
router.get('/orcamentos/:token', controller.consultar.bind(controller));
router.post('/orcamentos/:token/pagar', controller.pagar.bind(controller));
router.get('/orcamentos/:token/pdf', controller.pdf.bind(controller));

export default router;
