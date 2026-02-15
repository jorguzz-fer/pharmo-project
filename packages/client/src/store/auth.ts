import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

interface Clinica {
  id: string;
  nome_fantasia: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria?: string | null;
}

interface Veterinario {
  id: string;
  crmv: string;
  uf_crmv: string;
  especialidades?: string[];
}

interface User {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN_CLINICA' | 'VETERINARIO' | 'RECEPCIONISTA' | 'FARMACEUTICO';
  clinica: Clinica;
  veterinario: Veterinario | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, senha: string) => {
        const res = await api.post<{
          access_token: string;
          refresh_token: string;
          usuario: User;
        }>('/auth/login', { email, senha });

        if (!res.data) throw new Error('Resposta invalida');

        set({
          user: res.data.usuario as User,
          accessToken: res.data.access_token,
          refreshToken: res.data.refresh_token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        const token = get().accessToken;
        if (token) {
          api.post('/auth/logout').catch(() => {});
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAuth: async () => {
        const rt = get().refreshToken;
        if (!rt) {
          get().logout();
          return;
        }

        try {
          const res = await api.post<{
            access_token: string;
            refresh_token: string;
          }>('/auth/refresh', { refresh_token: rt });

          if (res.data) {
            set({
              accessToken: res.data.access_token,
              refreshToken: res.data.refresh_token,
            });
          }
        } catch {
          get().logout();
        }
      },

      fetchMe: async () => {
        try {
          const res = await api.get<User>('/auth/me');
          if (res.data) {
            set({ user: res.data });
          }
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'pharmopet-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
