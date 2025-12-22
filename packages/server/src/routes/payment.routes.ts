import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Gera Link (Authenticated Vet or System)
router.post('/pagamentos/gerar', authMiddleware, paymentController.generateLink);

// Webhook (Public, but should verify signature)
router.post('/pagamentos/webhook', paymentController.webhook);

// Status
router.get('/pagamentos/:id/status', authMiddleware, paymentController.checkStatus);

export { router as paymentRoutes };
