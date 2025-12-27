import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function clinicAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role !== 'CLINIC') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Adicionar usuário ao request
        (req as any).user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Token inválido' });
    }
}
