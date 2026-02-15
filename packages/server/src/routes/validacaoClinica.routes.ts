import { Router } from 'express';
import { ValidacaoClinicaController } from '../controllers/validacaoClinica.controller';

const router = Router();
const controller = new ValidacaoClinicaController();

// Validação de dosagem
router.post('/dosagem', controller.validarDosagem.bind(controller));

// Registro de ciência
router.post('/registrar-ciencia', controller.registrarCiencia.bind(controller));

// Buscar logs
router.get('/logs/:prescricao_id', controller.buscarLogsPorPrescricao.bind(controller));
router.get('/logs/veterinario/:veterinario_id', controller.buscarLogsPorVeterinario.bind(controller));

// Relatório (admin apenas)
router.get('/relatorio-logs', controller.relatorioLogsCiencia.bind(controller));

// Cálculos
router.post('/calcular-quantidade', controller.calcularQuantidade.bind(controller));

export default router;
