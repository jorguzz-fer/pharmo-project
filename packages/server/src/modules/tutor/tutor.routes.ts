import { Router } from 'express';
import { TutorController } from './tutor.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { createTutorSchema, updateTutorSchema } from './tutor.schema';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new TutorController();

router.use(authMiddleware);

router.post('/', validate({ body: createTutorSchema }), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.findAll));
router.get('/:id', asyncHandler(controller.findById));
router.put('/:id', validate({ body: updateTutorSchema }), asyncHandler(controller.update));

export const tutorRoutes = router;
