import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.routes';
import { vetRoutes } from './routes/vet.routes';
import { prescricaoRoutes } from './routes/prescricao.routes';
import { paymentRoutes } from './routes/payment.routes';
import { adminRoutes } from './routes/admin.routes';
import { clinicaRoutes } from './routes/clinica.routes';
import { veterinarioRoutes } from './routes/veterinario.routes';
import { passwordResetRoutes } from './routes/password-reset.routes';
import clinicaAuthRoutes from './routes/clinica-auth.routes';
import clinicaDashboardRoutes from './routes/clinica-dashboard.routes';
import principioAtivoRoutes from './routes/principioAtivo.routes';
import validacaoClinicaRoutes from './routes/validacaoClinica.routes';
import produtoRoutes from './routes/produto.routes';

// Try to load .env file (optional - Easypanel uses system env vars)
dotenv.config();

// Log environment variables for debugging
console.log('🔧 Environment Variables Check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS to allow frontend
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://pharmopet.com.br',
        'https://www.pharmopet.com.br',
        'https://app.pharmopet.com.br'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', vetRoutes);
app.use('/api', prescricaoRoutes);
app.use('/api', paymentRoutes);
app.use('/api', adminRoutes);
app.use('/api', clinicaRoutes);
app.use('/api', veterinarioRoutes);
app.use('/api', passwordResetRoutes);
app.use('/api/auth', clinicaAuthRoutes);
app.use('/api/clinicas', clinicaDashboardRoutes);
app.use('/api/principios-ativos', principioAtivoRoutes);
app.use('/api/validacao', validacaoClinicaRoutes);
app.use('/api/produtos', produtoRoutes);

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
