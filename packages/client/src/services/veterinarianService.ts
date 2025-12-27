import { api } from './api';

export interface Veterinarian {
    id: string;
    nome: string;
    cpf: string;
    crv: string;
    uf_crmv: string;
    numero_crmv: string;
    email: string;
    telefone: string;
    especialidades?: string[];
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    created_at: string;
    updated_at: string;
}

export interface VeterinarianFormData {
    nome: string;
    cpf: string;
    crv: string;
    uf_crmv: string;
    numero_crmv: string;
    email: string;
    telefone: string;
    especialidades?: string[];
}

export const veterinarianService = {
    async getAll(): Promise<Veterinarian[]> {
        return api.get('/admin/veterinarios');
    },

    async getById(id: string): Promise<Veterinarian> {
        return api.get(`/admin/veterinarios/${id}`);
    },

    async search(query: string): Promise<Veterinarian[]> {
        return api.get(`/admin/veterinarios/busca?q=${encodeURIComponent(query)}`);
    },

    async create(data: VeterinarianFormData): Promise<Veterinarian> {
        return api.post('/admin/veterinarios', data);
    },

    async update(id: string, data: Partial<VeterinarianFormData>): Promise<Veterinarian> {
        return api.put(`/admin/veterinarios/${id}`, data);
    },

    async getClinics(veterinarioId: string): Promise<any[]> {
        return api.get(`/admin/veterinarios/${veterinarioId}/clinicas`);
    },

    // Para veterinário logado
    async getMyClinics(): Promise<any[]> {
        return api.get('/veterinario/minhas-clinicas');
    }
};
