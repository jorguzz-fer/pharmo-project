import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    crv: string;
    email: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (crv: string) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    login: async (crv: string) => {
        // Mock login
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({
            isAuthenticated: true,
            user: {
                id: '1',
                name: 'Dr. Fernando Jorge',
                crv,
                email: 'dr.fernando@pharmo.com'
            }
        });
    },
    logout: () => set({ user: null, isAuthenticated: false }),
}));
