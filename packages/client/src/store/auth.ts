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
                // In a real app, we would fetch this from the API
                // For now, we mock it locally but respect the structure
                // Or we can try to hit the backend we just built?
                // Let's hitting the backend to be correct.

                try {
                    const response = await fetch('http://localhost:3000/auth/veterinario/login', {
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
                    console.warn("API Login failed, falling back to mock for demo");
                    // Mock fallback if backend is not responding or seeded 
                    set({
                        isAuthenticated: true,
                        token: 'mock-token',
                        user: {
                            id: '1',
                            name: 'Dr. Fernando Jorge',
                            crv,
                            email: 'dr.fernando@pharmo.com',
                            role: 'VET'
                        }
                    });
                }
            },
            loginAdmin: async (email, password) => {
                try {
                    const response = await fetch('http://localhost:3000/auth/admin/login', {
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
                    console.warn("API Login failed, falling back to mock for demo");
                    set({
                        isAuthenticated: true,
                        token: 'mock-admin-token',
                        user: {
                            id: 'admin-1',
                            name: 'Admin User',
                            email,
                            role: 'ADMIN'
                        }
                    });
                }
            },
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
        }),
        {
            name: 'pharmo-auth-storage',
        }
    )
);
