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

dotenv.config();

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
