import { Router } from 'express';
import { PdfController } from './pdf.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new PdfController();

router.use(authMiddleware);

// GET /api/prescricoes/:id/pdf
router.get('/:id/pdf', asyncHandler(controller.gerarPdf));

export const pdfRoutes = router;
