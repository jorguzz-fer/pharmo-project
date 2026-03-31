import { api } from './api';

export interface Clinica {
    id: string;
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    inscricao_estadual?: string;
    email: string;
    telefone?: string;
    whatsapp?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    logo_url?: string;
    responsavel_legal: string;
    cpf_responsavel: string;
    status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADA' | 'SUSPENSA' | 'INATIVA';
    observacoes_internas?: string;
    // Condições comerciais (por parceiro)
    taxa_manipulacao?: number | null;
    custo_embalagens?: number | null;
    desconto_parceiro?: number | null;
    adicional_entrega?: number | null;
    adicional_biscoito?: number | null;
    created_at: string;
    updated_at: string;
    approved_at?: string;
    approved_by?: string;
}

export interface ClinicaFormData {
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    inscricao_estadual?: string;
    email: string;
    telefone?: string;
    whatsapp?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    responsavel_legal: string;
    cpf_responsavel: string;
    observacoes_internas?: string;
}

export interface ClinicaFilters {
    status?: string;
    cidade?: string;
    search?: string;
}

export const clinicService = {
    async getAll(filters?: ClinicaFilters): Promise<Clinica[]> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.cidade) params.append('cidade', filters.cidade);
        if (filters?.search) params.append('search', filters.search);

        const query = params.toString();
        return api.get(`/admin/clinicas${query ? `?${query}` : ''}`);
    },

    async getById(id: string): Promise<Clinica> {
        return api.get(`/admin/clinicas/${id}`);
    },

    async create(data: ClinicaFormData): Promise<Clinica> {
        return api.post('/admin/clinicas', data);
    },

    async update(id: string, data: Partial<ClinicaFormData>): Promise<Clinica> {
        return api.put(`/admin/clinicas/${id}`, data);
    },

    async updateStatus(id: string, status: string): Promise<Clinica> {
        return api.patch(`/admin/clinicas/${id}/status`, { status });
    },

    async delete(id: string): Promise<void> {
        return api.delete(`/admin/clinicas/${id}`);
    },

    async getMetrics(id: string): Promise<any> {
        return api.get(`/admin/clinicas/${id}/metrics`);
    },

    // Veterinários
    async getVeterinarians(clinicaId: string): Promise<any[]> {
        return api.get(`/admin/clinicas/${clinicaId}/veterinarios`);
    },

    async linkVeterinarian(clinicaId: string, veterinarioId: string, cargo?: string): Promise<any> {
        return api.post(`/admin/clinicas/${clinicaId}/veterinarios`, {
            veterinario_id: veterinarioId,
            cargo
        });
    },

    async unlinkVeterinarian(clinicaId: string, veterinarioId: string): Promise<void> {
        return api.delete(`/admin/clinicas/${clinicaId}/veterinarios/${veterinarioId}`);
    },

    // Documentos
    async getDocuments(clinicaId: string): Promise<any[]> {
        return api.get(`/admin/clinicas/${clinicaId}/documentos`);
    },

    async uploadDocument(clinicaId: string, file: File, tipo: string): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipo_documento', tipo);

        // Get token from Zustand persist storage
        const authStorage = localStorage.getItem('pharmo-auth-storage');
        let token = null;

        if (authStorage) {
            try {
                const parsed = JSON.parse(authStorage);
                token = parsed.state?.token;
            } catch (e) {
                console.error('Failed to parse auth storage:', e);
            }
        }

        console.log('📤 Uploading document...');
        console.log('Token exists:', !!token);
        console.log('File:', file.name, file.size, 'bytes');
        console.log('Tipo:', tipo);

        const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'https://api.pharmopet.com.br'}/api/admin/clinicas/${clinicaId}/documentos`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            }
        );

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload error:', response.status, errorText);

            if (response.status === 403 || response.status === 401) {
                throw new Error('Acesso negado. Faça login novamente.');
            }

            throw new Error(errorText || 'Erro ao fazer upload do documento');
        }

        return response.json();
    },

    async deleteDocument(clinicaId: string, documentoId: string): Promise<void> {
        return api.delete(`/admin/clinicas/${clinicaId}/documentos/${documentoId}`);
    },

    // Logo
    async uploadLogo(clinicaId: string, file: File): Promise<{ logo_url: string }> {
        const formData = new FormData();
        formData.append('logo', file);

        const authStorage = localStorage.getItem('pharmo-auth-storage');
        let token = null;
        if (authStorage) {
            try {
                const parsed = JSON.parse(authStorage);
                token = parsed.state?.token;
            } catch { /* skip */ }
        }

        let baseUrl = import.meta.env.VITE_API_URL || 'https://phamopet-backend-api.en9jpc.easypanel.host';
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
        if (!baseUrl.endsWith('/api')) baseUrl = `${baseUrl}/api`;

        const response = await fetch(
            `${baseUrl}/admin/clinicas/${clinicaId}/logo`,
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Erro ao fazer upload do logo');
        }

        return response.json();
    },

    async deleteLogo(clinicaId: string): Promise<void> {
        return api.delete(`/admin/clinicas/${clinicaId}/logo`);
    },

    async updateComercial(clinicaId: string, data: {
        taxa_manipulacao?: number | null;
        custo_embalagens?: number | null;
        desconto_parceiro?: number | null;
        adicional_entrega?: number | null;
        adicional_biscoito?: number | null;
    }): Promise<Clinica> {
        return api.put(`/admin/clinicas/${clinicaId}`, data);
    }
};
