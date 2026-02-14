import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { errorHandler } from './shared/middleware/error-handler';

// Module routes
import { authRoutes } from './modules/auth/auth.routes';
import { tenantRoutes } from './modules/tenant/tenant.routes';
import { usuarioRoutes } from './modules/usuario/usuario.routes';
import { tutorRoutes } from './modules/tutor/tutor.routes';
import { animalRoutes } from './modules/animal/animal.routes';
import { principioAtivoRoutes } from './modules/principio-ativo/principio-ativo.routes';
import { protocoloRoutes } from './modules/protocolo/protocolo.routes';
import { prescricaoRoutes } from './modules/prescricao/prescricao.routes';
import { validacaoRoutes } from './modules/validacao/validacao.routes';
import { pdfRoutes } from './modules/pdf/pdf.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '10mb' }));

// === API Routes ===
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tutores', tutorRoutes);
app.use('/api/animais', animalRoutes);
app.use('/api/principios-ativos', principioAtivoRoutes);
app.use('/api/protocolos', protocoloRoutes);
app.use('/api/prescricoes', prescricaoRoutes);
app.use('/api/prescricoes', pdfRoutes);
app.use('/api/validacoes', validacaoRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Rota nao encontrada' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`PharmoPet API v2 running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
