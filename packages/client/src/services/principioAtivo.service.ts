import axios from 'axios';

function getBaseUrl() {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (!url.endsWith('/api')) url = `${url}/api`;
    return url;
}

const API_URL = getBaseUrl();

export interface PrincipioAtivo {
    id: string;
    nome: string;
    nome_cientifico?: string;
    classe_terapeutica?: string;
    controlado: boolean;
    texto_palatavel?: string;
    observacoes?: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;
    concentracoes?: Concentracao[];
    ranges?: RangeTerapeutico[];
}

export interface Concentracao {
    id: string;
    principio_ativo_id: string;
    valor: number;
    unidade: string;
    forma_farmaceutica?: string;
    created_at: string;
}

export interface RangeTerapeutico {
    id: string;
    principio_ativo_id: string;
    especie: string;
    peso_min_kg?: number;
    peso_max_kg?: number;
    dose_min_mg_kg: number;
    dose_max_mg_kg: number;
    frequencia_horas?: number;
    duracao_max_dias?: number;
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

export interface PrincipioAtivoFilters {
    ativo?: boolean;
    controlado?: boolean;
    classe_terapeutica?: string;
    busca?: string;
}

export interface PrincipioAtivoCreateInput {
    nome: string;
    nome_cientifico?: string;
    classe_terapeutica?: string;
    controlado?: boolean;
    texto_palatavel?: string;
    observacoes?: string;
    concentracoes?: Array<{
        valor: number;
        unidade: string;
        forma_farmaceutica?: string;
    }>;
    ranges?: Array<{
        especie: string;
        peso_min_kg?: number;
        peso_max_kg?: number;
        dose_min_mg_kg: number;
        dose_max_mg_kg: number;
        frequencia_horas?: number;
        duracao_max_dias?: number;
        observacoes?: string;
    }>;
}

class PrincipioAtivoService {
    private getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async listarTodos(filtros?: PrincipioAtivoFilters): Promise<PrincipioAtivo[]> {
        const params = new URLSearchParams();

        if (filtros?.ativo !== undefined) {
            params.append('ativo', filtros.ativo.toString());
        }
        if (filtros?.controlado !== undefined) {
            params.append('controlado', filtros.controlado.toString());
        }
        if (filtros?.classe_terapeutica) {
            params.append('classe_terapeutica', filtros.classe_terapeutica);
        }
        if (filtros?.busca) {
            params.append('busca', filtros.busca);
        }

        const response = await axios.get(`${API_URL}/principios-ativos?${params}`, {
            headers: this.getAuthHeader()
        });

        return response.data.data;
    }

    async buscarPorId(id: string): Promise<PrincipioAtivo> {
        const response = await axios.get(`${API_URL}/principios-ativos/${id}`, {
            headers: this.getAuthHeader()
        });

        return response.data.data;
    }

    async criar(data: PrincipioAtivoCreateInput): Promise<PrincipioAtivo> {
        const response = await axios.post(`${API_URL}/principios-ativos`, data, {
            headers: this.getAuthHeader()
        });

        return response.data.data;
    }

    async atualizar(id: string, data: Partial<PrincipioAtivoCreateInput>): Promise<PrincipioAtivo> {
        const response = await axios.put(`${API_URL}/principios-ativos/${id}`, data, {
            headers: this.getAuthHeader()
        });

        return response.data.data;
    }

    async desativar(id: string): Promise<void> {
        await axios.delete(`${API_URL}/principios-ativos/${id}`, {
            headers: this.getAuthHeader()
        });
    }

    async buscarConcentracoes(id: string, formaFarmaceutica?: string): Promise<Concentracao[]> {
        const params = formaFarmaceutica ? `?forma_farmaceutica=${formaFarmaceutica}` : '';
        const response = await axios.get(`${API_URL}/principios-ativos/${id}/concentracoes${params}`, {
            headers: this.getAuthHeader()
        });

        return response.data.data;
    }

    async adicionarConcentracao(
        id: string,
        concentracao: { valor: number; unidade: string; forma_farmaceutica?: string }
    ): Promise<Concentracao> {
        const response = await axios.post(
            `${API_URL}/principios-ativos/${id}/concentracoes`,
            concentracao,
            { headers: this.getAuthHeader() }
        );

        return response.data.data;
    }

    async adicionarRange(
        id: string,
        range: {
            especie: string;
            peso_min_kg?: number;
            peso_max_kg?: number;
            dose_min_mg_kg: number;
            dose_max_mg_kg: number;
            frequencia_horas?: number;
            duracao_max_dias?: number;
            observacoes?: string;
        }
    ): Promise<RangeTerapeutico> {
        const response = await axios.post(
            `${API_URL}/principios-ativos/${id}/ranges`,
            range,
            { headers: this.getAuthHeader() }
        );

        return response.data.data;
    }

    async listarClassesTerapeuticas(): Promise<string[]> {
        const response = await axios.get(`${API_URL}/principios-ativos/classes-terapeuticas`, {
            headers: this.getAuthHeader()
        });

        return response.data.data;
    }
}

export const principioAtivoService = new PrincipioAtivoService();
