"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
var express_1 = require("express");
var payment_controller_1 = require("../controllers/payment.controller");
var auth_middleware_1 = require("../middlewares/auth.middleware");
var router = (0, express_1.Router)();
exports.paymentRoutes = router;
var paymentController = new payment_controller_1.PaymentController();
// Gera Link (Authenticated Vet or System)
router.post('/pagamentos/gerar', auth_middleware_1.authMiddleware, paymentController.generateLink);
// Webhook (Public, but should verify signature)
router.post('/pagamentos/webhook', paymentController.webhook);
// Status
router.get('/pagamentos/:id/status', auth_middleware_1.authMiddleware, paymentController.checkStatus);
