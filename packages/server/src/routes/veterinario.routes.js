"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.veterinarioRoutes = void 0;
var express_1 = require("express");
var veterinario_controller_1 = require("../controllers/veterinario.controller");
var auth_middleware_1 = require("../middlewares/auth.middleware");
var router = (0, express_1.Router)();
exports.veterinarioRoutes = router;
var veterinarioController = new veterinario_controller_1.VeterinarioController();
// Rotas Admin
router.get('/admin/veterinarios', auth_middleware_1.authMiddleware, veterinarioController.list);
router.get('/admin/veterinarios/busca', auth_middleware_1.authMiddleware, veterinarioController.buscar);
router.get('/admin/veterinarios/:id', auth_middleware_1.authMiddleware, veterinarioController.getById);
router.post('/admin/veterinarios', auth_middleware_1.authMiddleware, veterinarioController.create);
router.put('/admin/veterinarios/:id', auth_middleware_1.authMiddleware, veterinarioController.update);
router.get('/admin/veterinarios/:id/clinicas', auth_middleware_1.authMiddleware, veterinarioController.getClinicas);
// Rota para veterinário logado
router.get('/veterinario/minhas-clinicas', auth_middleware_1.authMiddleware, veterinarioController.getMinhasClinicas);
