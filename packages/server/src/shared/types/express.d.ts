import { ClinicaUsuarioRole, AdminRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  clinica_id: string;
  role: ClinicaUsuarioRole;
  veterinario_id?: string | null;
  nome: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  nome: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      admin?: AdminUser;
      clinicaId?: string;
    }
  }
}

export {};
