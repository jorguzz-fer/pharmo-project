import { Router } from 'express';
import { AnimalController } from './animal.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import { createAnimalSchema, updateAnimalSchema } from './animal.schema';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();
const controller = new AnimalController();

router.use(authMiddleware);

router.post('/', validate({ body: createAnimalSchema }), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.findAll));
router.get('/:id', asyncHandler(controller.findById));
router.put('/:id', validate({ body: updateAnimalSchema }), asyncHandler(controller.update));

export const animalRoutes = router;
