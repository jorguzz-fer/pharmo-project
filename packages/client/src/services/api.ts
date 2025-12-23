import { useAuthStore } from '../store/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://phamopet-backend-api.en9jpc.easypanel.host';

export const api = {
    async get(endpoint: string) {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        if (!res.ok) {
            const error = await res.text();
            throw new Error(error);
        }
        return res.json();
    },

    async post(endpoint: string, data: any) {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.text();
            throw new Error(error);
        }
        return res.json();
    }
};
