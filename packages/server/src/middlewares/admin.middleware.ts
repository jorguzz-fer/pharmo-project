import { Request, Response, NextFunction } from 'express';

/**
 * Restringe a rota ao painel administrativo.
 * Use depois de `authMiddleware`, que é quem preenche `req.userRole`.
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso restrito ao administrador' });
    }
    return next();
}
