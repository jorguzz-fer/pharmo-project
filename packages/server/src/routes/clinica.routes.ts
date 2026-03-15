import { Router } from 'express';
import { ClinicaController } from '../controllers/clinica.controller';
import { DocumentoController, upload } from '../controllers/documento.controller';
import { ClinicaLogoController, logoUpload } from '../controllers/clinica-logo.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const clinicaController = new ClinicaController();
const documentoController = new DocumentoController();
const logoController = new ClinicaLogoController();

// Rotas de Clínicas (Admin only)
router.get('/admin/clinicas', authMiddleware, clinicaController.list);
router.get('/admin/clinicas/:id', authMiddleware, clinicaController.getById);
router.post('/admin/clinicas', authMiddleware, clinicaController.create);
router.put('/admin/clinicas/:id', authMiddleware, clinicaController.update);
router.patch('/admin/clinicas/:id/status', authMiddleware, clinicaController.updateStatus);
router.delete('/admin/clinicas/:id', authMiddleware, clinicaController.softDelete);
router.get('/admin/clinicas/:id/metrics', authMiddleware, clinicaController.getMetrics);

// Rotas de Documentos
router.post('/admin/clinicas/:id/documentos', authMiddleware, upload.single('file'), documentoController.uploadDocumento);
router.get('/admin/clinicas/:id/documentos', authMiddleware, documentoController.listDocumentos);
router.delete('/admin/clinicas/:id/documentos/:docId', authMiddleware, documentoController.deleteDocumento);

// Logo da Clínica
router.post('/admin/clinicas/:id/logo', authMiddleware, logoUpload.single('logo'), logoController.uploadLogoAdmin);
router.delete('/admin/clinicas/:id/logo', authMiddleware, logoController.deleteLogo);

// Rotas de Vinculação Clínica-Veterinário
router.get('/admin/clinicas/:id/veterinarios', authMiddleware, clinicaController.listarVeterinarios);
router.post('/admin/clinicas/:id/veterinarios', authMiddleware, clinicaController.vincularVeterinario);
router.delete('/admin/clinicas/:id/veterinarios/:vetId', authMiddleware, clinicaController.desvincularVeterinario);

export { router as clinicaRoutes };
