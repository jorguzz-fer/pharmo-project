"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prescricaoRoutes = void 0;
var express_1 = require("express");
var bulario_controller_1 = require("../controllers/bulario.controller");
var prescricao_controller_1 = require("../controllers/prescricao.controller");
var auth_middleware_1 = require("../middlewares/auth.middleware");
var router = (0, express_1.Router)();
exports.prescricaoRoutes = router;
var bularioController = new bulario_controller_1.BularioController();
var prescricaoController = new prescricao_controller_1.PrescricaoController();
// Bulário
router.get('/bulario/buscar', auth_middleware_1.authMiddleware, bularioController.search);
// Prescrições
router.post('/prescricoes', auth_middleware_1.authMiddleware, prescricaoController.create);
router.get('/prescricoes', auth_middleware_1.authMiddleware, prescricaoController.listByVet);
router.post('/prescricoes/:id/enviar', auth_middleware_1.authMiddleware, prescricaoController.sendToClient);
router.get('/prescricoes/:id/status', auth_middleware_1.authMiddleware, prescricaoController.getOrderStatus);
