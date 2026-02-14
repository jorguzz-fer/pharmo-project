import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { verifyToken } from '../utils/token';
import { AuthUser, AdminUser } from '../types/express.d';
import { ClinicaUsuarioRole } from '@prisma/client';

/**
 * Middleware que autentica usuario da clinica via JWT
 * Injeta user e clinicaId no request
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token nao fornecido');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken<AuthUser>(token);
    req.user = decoded;
    req.clinicaId = decoded.clinica_id;
    next();
  } catch {
    throw AppError.unauthorized('Token invalido ou expirado');
  }
}

/**
 * Middleware que autentica admin da plataforma
 */
export function adminAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token nao fornecido');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken<AdminUser>(token);
    if (!decoded.role) {
      throw AppError.unauthorized('Token invalido');
    }
    req.admin = decoded;
    next();
  } catch {
    throw AppError.unauthorized('Token invalido ou expirado');
  }
}

/**
 * Middleware que restringe acesso por role
 */
export function requireRole(...roles: ClinicaUsuarioRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden(`Acesso restrito a: ${roles.join(', ')}`);
    }
    next();
  };
}

/**
 * Middleware que garante isolamento por tenant
 * Todas as queries devem filtrar por clinica_id
 */
export function tenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user?.clinica_id) {
    throw AppError.unauthorized('Clinica nao identificada no token');
  }
  req.clinicaId = req.user.clinica_id;
  next();
}
