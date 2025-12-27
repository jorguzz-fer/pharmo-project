import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    crv?: string;
    email: string;
    role: 'VET' | 'ADMIN' | 'OPERATOR' | 'FINANCIAL';
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (crv: string, password?: string) => Promise<void>;
    loginAdmin: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: async (crv: string, password = 'password') => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'https://phamopet-backend-api.en9jpc.easypanel.host';
                    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

                    const response = await fetch(`${baseUrl}/auth/veterinario/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ crv, password })
                    });

                    if (!response.ok) throw new Error('Login failed');

                    const data = await response.json();
                    set({
                        user: { ...data.user, role: 'VET' },
                        token: data.token,
                        isAuthenticated: true
                    });
                } catch (e) {
                    console.error("API Login failed:", e);
                    throw e; // Don't fall back to mock in production
                }
            },
            loginAdmin: async (email, password) => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'https://phamopet-backend-api.en9jpc.easypanel.host';
                    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

                    const response = await fetch(`${baseUrl}/auth/admin/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    if (!response.ok) throw new Error('Login failed');

                    const data = await response.json();
                    set({
                        user: data.user,
                        token: data.token,
                        isAuthenticated: true
                    });
                } catch (e) {
                    console.error("API Login failed:", e);
                    throw e; // Don't fall back to mock in production
                }
            },
            logout: () => {
                // Get current user before clearing
                const currentUser = useAuthStore.getState().user;
                // Save role to localStorage for redirect logic
                if (currentUser?.role) {
                    localStorage.setItem('pharmo-logout-role', currentUser.role);
                }
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'pharmo-auth-storage',
        }
    )
);
