"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vetRoutes = void 0;
var express_1 = require("express");
var tutor_controller_1 = require("../controllers/tutor.controller");
var animal_controller_1 = require("../controllers/animal.controller");
var auth_middleware_1 = require("../middlewares/auth.middleware");
var router = (0, express_1.Router)();
exports.vetRoutes = router;
var tutorController = new tutor_controller_1.TutorController();
var animalController = new animal_controller_1.AnimalController();
// Tutores
router.post('/tutores', auth_middleware_1.authMiddleware, tutorController.create);
router.get('/tutores/buscar', auth_middleware_1.authMiddleware, tutorController.search);
// Animais
router.post('/animais', auth_middleware_1.authMiddleware, animalController.create);
router.get('/tutores/:tutorId/animais', auth_middleware_1.authMiddleware, animalController.listByTutor);
