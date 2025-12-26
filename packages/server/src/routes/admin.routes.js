"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
var express_1 = require("express");
var admin_controller_1 = require("../controllers/admin.controller");
var auth_middleware_1 = require("../middlewares/auth.middleware");
var router = (0, express_1.Router)();
exports.adminRoutes = router;
var adminController = new admin_controller_1.AdminController();
// Dashboard Metrics (Protected, assume role checking in middleware in future)
router.get('/admin/dashboard', auth_middleware_1.authMiddleware, adminController.getDashboardMetrics);
// Sales Report
router.get('/admin/relatorios/vendas', auth_middleware_1.authMiddleware, adminController.getSalesReport);
// Financial Report (Monthly)
router.get('/admin/relatorios/financeiro', auth_middleware_1.authMiddleware, adminController.getFinancialReport);
// Follow Ups
router.get('/admin/follow-ups', auth_middleware_1.authMiddleware, adminController.getFollowUps);
router.patch('/admin/follow-ups/:id/done', auth_middleware_1.authMiddleware, adminController.markFollowUp);
