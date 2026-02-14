import { prisma } from '../../shared/utils/prisma';
import { comparePassword } from '../../shared/utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken, getRefreshTokenExpiry } from '../../shared/utils/token';
import { AppError } from '../../shared/errors/app-error';
import { AuthUser } from '../../shared/types/express.d';

export class AuthService {
  async login(email: string, senha: string) {
    const usuario = await prisma.clinicaUsuario.findUnique({
      where: { email },
      include: { clinica: true, veterinario: true },
    });

    if (!usuario || !usuario.ativo) {
      throw AppError.unauthorized('Email ou senha invalidos');
    }

    if (usuario.clinica.status !== 'ATIVA') {
      throw AppError.forbidden('Clinica inativa ou suspensa');
    }

    const senhaValida = await comparePassword(senha, usuario.senha_hash);
    if (!senhaValida) {
      throw AppError.unauthorized('Email ou senha invalidos');
    }

    const payload: AuthUser = {
      id: usuario.id,
      email: usuario.email,
      clinica_id: usuario.clinica_id,
      role: usuario.role,
      veterinario_id: usuario.veterinario_id,
      nome: usuario.nome,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: usuario.id, type: 'user' });

    await prisma.clinicaUsuario.update({
      where: { id: usuario.id },
      data: {
        refresh_token: refreshToken,
        refresh_token_exp: getRefreshTokenExpiry(),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        clinica: {
          id: usuario.clinica.id,
          nome_fantasia: usuario.clinica.nome_fantasia,
          logo_url: usuario.clinica.logo_url,
          cor_primaria: usuario.clinica.cor_primaria,
        },
        veterinario: usuario.veterinario
          ? {
              id: usuario.veterinario.id,
              crmv: usuario.veterinario.crmv,
              uf_crmv: usuario.veterinario.uf_crmv,
            }
          : null,
      },
    };
  }

  async refresh(refreshToken: string) {
    let decoded: { id: string; type: string };
    try {
      decoded = verifyToken<{ id: string; type: string }>(refreshToken);
    } catch {
      throw AppError.unauthorized('Refresh token invalido');
    }

    const usuario = await prisma.clinicaUsuario.findUnique({
      where: { id: decoded.id },
      include: { clinica: true },
    });

    if (!usuario || usuario.refresh_token !== refreshToken || !usuario.ativo) {
      throw AppError.unauthorized('Refresh token invalido');
    }

    if (usuario.refresh_token_exp && usuario.refresh_token_exp < new Date()) {
      throw AppError.unauthorized('Refresh token expirado');
    }

    const payload: AuthUser = {
      id: usuario.id,
      email: usuario.email,
      clinica_id: usuario.clinica_id,
      role: usuario.role,
      veterinario_id: usuario.veterinario_id,
      nome: usuario.nome,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken({ id: usuario.id, type: 'user' });

    await prisma.clinicaUsuario.update({
      where: { id: usuario.id },
      data: {
        refresh_token: newRefreshToken,
        refresh_token_exp: getRefreshTokenExpiry(),
      },
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await prisma.clinicaUsuario.update({
      where: { id: userId },
      data: { refresh_token: null, refresh_token_exp: null },
    });
  }

  async me(userId: string) {
    const usuario = await prisma.clinicaUsuario.findUnique({
      where: { id: userId },
      include: {
        clinica: {
          select: {
            id: true,
            nome_fantasia: true,
            logo_url: true,
            cor_primaria: true,
            cor_secundaria: true,
          },
        },
        veterinario: {
          select: {
            id: true,
            crmv: true,
            uf_crmv: true,
            especialidades: true,
          },
        },
      },
    });

    if (!usuario) {
      throw AppError.notFound('Usuario nao encontrado');
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      clinica: usuario.clinica,
      veterinario: usuario.veterinario,
    };
  }
}
