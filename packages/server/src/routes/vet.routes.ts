import { Router } from 'express';
import { TutorController } from '../controllers/tutor.controller';
import { AnimalController } from '../controllers/animal.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const tutorController = new TutorController();
const animalController = new AnimalController();

// Tutores
router.post('/tutores', authMiddleware, tutorController.create);
router.get('/tutores/buscar', authMiddleware, tutorController.search);

// Animais
router.post('/animais', authMiddleware, animalController.create);
router.get('/tutores/:tutorId/animais', authMiddleware, animalController.listByTutor);

export { router as vetRoutes };
