import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClinicUser {
    id: string;
    name: string;
    email: string;
    role: 'CLINIC';
}

interface ClinicAuthState {
    user: ClinicUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

export const useClinicAuthStore = create<ClinicAuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: async (email: string, password: string) => {
                const API_URL = import.meta.env.VITE_API_URL || 'https://api.pharmopet.com.br';

                const response = await fetch(`${API_URL}/api/auth/clinica/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Erro ao fazer login');
                }

                const data = await response.json();
                set({
                    user: data.user,
                    token: data.token,
                    isAuthenticated: true
                });
            },

            logout: () => set({ user: null, token: null, isAuthenticated: false }),
        }),
        {
            name: 'clinic-auth-storage',
        }
    )
);
