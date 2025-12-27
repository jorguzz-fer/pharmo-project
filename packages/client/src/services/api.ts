import { useAuthStore } from '../store/auth';

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'https://phamopet-backend-api.en9jpc.easypanel.host';
    // Remove trailing slash if present
    if (url.endsWith('/')) url = url.slice(0, -1);
    // Add /api if not present
    if (!url.endsWith('/api')) url = `${url}/api`;
    return url;
};

const API_URL = getBaseUrl();

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
            if (res.status === 401) {
                // Token invalid or expired - logout user
                useAuthStore.getState().logout();
                window.location.href = '/login';
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.error || error.message || 'Erro na requisição');
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
            if (res.status === 401) {
                // Token invalid or expired - logout user
                useAuthStore.getState().logout();
                window.location.href = '/login';
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.error || error.message || 'Erro na requisição');
        }
        return res.json();
    },

    async put(endpoint: string, data: any) {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            if (res.status === 401) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.error || error.message || 'Erro na requisição');
        }
        return res.json();
    },

    async patch(endpoint: string, data: any) {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            if (res.status === 401) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.error || error.message || 'Erro na requisição');
        }
        return res.json();
    },

    async delete(endpoint: string) {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        if (!res.ok) {
            if (res.status === 401) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.error || error.message || 'Erro na requisição');
        }
        return res.json();
    }
};
