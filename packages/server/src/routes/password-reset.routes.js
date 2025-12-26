"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetRoutes = void 0;
var express_1 = require("express");
var password_reset_controller_1 = require("../controllers/password-reset.controller");
var router = (0, express_1.Router)();
exports.passwordResetRoutes = router;
var passwordResetController = new password_reset_controller_1.PasswordResetController();
// Rotas públicas (sem autenticação)
router.post('/password-reset/request', passwordResetController.requestReset);
router.get('/password-reset/validate/:token', passwordResetController.validateToken);
router.post('/password-reset/reset', passwordResetController.resetPassword);
