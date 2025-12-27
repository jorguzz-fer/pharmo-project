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

app.use(helmet());
app.use(cors());
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

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
