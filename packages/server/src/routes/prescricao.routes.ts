import { Router } from 'express';
import { BularioController } from '../controllers/bulario.controller';
import { PrescricaoController } from '../controllers/prescricao.controller';
import { PrescricaoPdfController } from '../controllers/prescricao-pdf.controller';
import { AiAssistantController } from '../controllers/ai-assistant.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const bularioController = new BularioController();
const prescricaoController = new PrescricaoController();
const pdfController = new PrescricaoPdfController();
const aiAssistantController = new AiAssistantController();

// Bulário
router.get('/bulario/buscar', authMiddleware, bularioController.search);

// Assistente IA
router.post('/assistente/consultar', authMiddleware, aiAssistantController.consultar);

// Prescrições
router.post('/prescricoes', authMiddleware, prescricaoController.create);
router.get('/prescricoes', authMiddleware, prescricaoController.listByVet);
router.post('/prescricoes/:id/enviar', authMiddleware, prescricaoController.sendToClient);
router.get('/prescricoes/:id/status', authMiddleware, prescricaoController.getOrderStatus);

// PDF
router.get('/prescricoes/:id/pdf', authMiddleware, pdfController.generatePdf);
router.post('/prescricoes/rascunho/pdf', authMiddleware, pdfController.generateDraftPdf);

export { router as prescricaoRoutes };
