import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Gera Link (Authenticated Vet or System)
router.post('/pagamentos/gerar', authMiddleware, paymentController.generateLink.bind(paymentController));

// Webhooks (públicos; o do Mercado Pago valida assinatura e consulta o gateway)
router.post('/pagamentos/webhook', paymentController.webhook.bind(paymentController));
router.post('/pagamentos/webhook/mercadopago', paymentController.webhookMercadoPago.bind(paymentController));

// Status
router.get('/pagamentos/:id/status', authMiddleware, paymentController.checkStatus.bind(paymentController));

export { router as paymentRoutes };
