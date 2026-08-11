import { Router } from 'express';
import { ValidacaoClinicaController } from '../controllers/validacaoClinica.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const controller = new ValidacaoClinicaController();

// Todas as rotas exigem autenticação: os logs de ciência identificam o
// veterinário responsável e não podem ser gravados sem token.
router.use(authMiddleware);

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
