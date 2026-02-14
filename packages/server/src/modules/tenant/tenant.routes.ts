import { Router } from 'express';
import { TenantController } from './tenant.controller';
import { authMiddleware, adminAuthMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { createTenantSchema, updateTenantSchema, updateBrandingSchema } from './tenant.schema';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new TenantController();

// Super-admin cria tenant
router.post('/', adminAuthMiddleware, validate({ body: createTenantSchema }), asyncHandler(controller.create));

// Rotas autenticadas - o usuario acessa sua propria clinica
router.get('/me', authMiddleware, asyncHandler(controller.findById));
router.put('/me', authMiddleware, requireRole('ADMIN_CLINICA'), validate({ body: updateTenantSchema }), asyncHandler(controller.update));
router.patch('/me/branding', authMiddleware, requireRole('ADMIN_CLINICA'), validate({ body: updateBrandingSchema }), asyncHandler(controller.updateBranding));
router.get('/me/config', authMiddleware, asyncHandler(controller.getConfig));

// Super-admin acessa qualquer tenant
router.get('/:id', adminAuthMiddleware, asyncHandler(controller.findById));
router.put('/:id', adminAuthMiddleware, validate({ body: updateTenantSchema }), asyncHandler(controller.update));

export const tenantRoutes = router;
