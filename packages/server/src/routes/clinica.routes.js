"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clinicaRoutes = void 0;
var express_1 = require("express");
var clinica_controller_1 = require("../controllers/clinica.controller");
var documento_controller_1 = require("../controllers/documento.controller");
var auth_middleware_1 = require("../middlewares/auth.middleware");
var router = (0, express_1.Router)();
exports.clinicaRoutes = router;
var clinicaController = new clinica_controller_1.ClinicaController();
var documentoController = new documento_controller_1.DocumentoController();
// Rotas de Clínicas (Admin only)
router.get('/admin/clinicas', auth_middleware_1.authMiddleware, clinicaController.list);
router.get('/admin/clinicas/:id', auth_middleware_1.authMiddleware, clinicaController.getById);
router.post('/admin/clinicas', auth_middleware_1.authMiddleware, clinicaController.create);
router.put('/admin/clinicas/:id', auth_middleware_1.authMiddleware, clinicaController.update);
router.patch('/admin/clinicas/:id/status', auth_middleware_1.authMiddleware, clinicaController.updateStatus);
router.delete('/admin/clinicas/:id', auth_middleware_1.authMiddleware, clinicaController.softDelete);
router.get('/admin/clinicas/:id/metrics', auth_middleware_1.authMiddleware, clinicaController.getMetrics);
// Rotas de Documentos
router.post('/admin/clinicas/:id/documentos', auth_middleware_1.authMiddleware, documento_controller_1.upload.single('file'), documentoController.uploadDocumento);
router.get('/admin/clinicas/:id/documentos', auth_middleware_1.authMiddleware, documentoController.listDocumentos);
router.delete('/admin/clinicas/:id/documentos/:docId', auth_middleware_1.authMiddleware, documentoController.deleteDocumento);
// Rotas de Vinculação Clínica-Veterinário
router.get('/admin/clinicas/:id/veterinarios', auth_middleware_1.authMiddleware, clinicaController.listarVeterinarios);
router.post('/admin/clinicas/:id/veterinarios', auth_middleware_1.authMiddleware, clinicaController.vincularVeterinario);
router.delete('/admin/clinicas/:id/veterinarios/:vetId', auth_middleware_1.authMiddleware, clinicaController.desvincularVeterinario);
