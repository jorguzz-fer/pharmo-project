import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ValidacaoResultado {
    valido: boolean;
    alertas: string[];
    avisos: string[];
    dose_total_mg: number;
    dose_mg_kg: number;
    doses_por_dia: number;
    dose_diaria_total_mg: number;
    range_encontrado?: {
        dose_min_mg_kg: number;
        dose_max_mg_kg: number;
        especie: string;
        peso_min_kg?: number;
        peso_max_kg?: number;
    };
    requer_ciencia: boolean;
}

export interface ValidacaoDosagemParams {
    principio_ativo_id: string;
    animal_id: string;
    dosagem_mg_kg: number;
    frequencia_horas: number;
    duracao_dias: number;
}

export interface RegistroCienciaParams {
    prescricao_id: string;
    principio_ativo_id: string;
    animal_id: string;
    dosagem_prescrita_mg_kg: number;
    peso_animal_kg: number;
    dose_min_esperada_mg_kg: number;
    dose_max_esperada_mg_kg: number;
    motivo: string;
}

export interface LogCiencia {
    id: string;
    prescricao_id: string;
    veterinario_id: string;
    principio_ativo_id: string;
    animal_id: string;
    dosagem_prescrita_mg_kg: number;
    peso_animal_kg: number;
    dose_total_mg: number;
    dose_min_esperada_mg_kg: number;
    dose_max_esperada_mg_kg: number;
    motivo: string;
    aceite_veterinario: boolean;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    veterinario?: {
        nome: string;
        crv: string;
    };
    principioAtivo?: {
        nome: string;
    };
    animal?: {
        nome: string;
        especie: string;
    };
}

class ValidacaoClinicaService {
    private getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async validarDosagem(params: ValidacaoDosagemParams): Promise<ValidacaoResultado> {
        const response = await axios.post(
            `${API_URL}/validacao/dosagem`,
            params,
            { headers: this.getAuthHeader() }
        );

        return response.data.data;
    }

    async registrarCiencia(params: RegistroCienciaParams): Promise<LogCiencia> {
        const response = await axios.post(
            `${API_URL}/validacao/registrar-ciencia`,
            params,
            { headers: this.getAuthHeader() }
        );

        return response.data.data;
    }

    async buscarLogsPorPrescricao(prescricaoId: string): Promise<LogCiencia[]> {
        const response = await axios.get(
            `${API_URL}/validacao/logs/${prescricaoId}`,
            { headers: this.getAuthHeader() }
        );

        return response.data.data;
    }

    async buscarLogsPorVeterinario(veterinarioId: string, limite?: number): Promise<LogCiencia[]> {
        const params = limite ? `?limite=${limite}` : '';
        const response = await axios.get(
            `${API_URL}/validacao/logs/veterinario/${veterinarioId}${params}`,
            { headers: this.getAuthHeader() }
        );

        return response.data.data;
    }

    async relatorioLogsCiencia(filtros?: {
        data_inicio?: string;
        data_fim?: string;
        veterinario_id?: string;
        principio_ativo_id?: string;
    }): Promise<LogCiencia[]> {
        const params = new URLSearchParams();

        if (filtros?.data_inicio) {
            params.append('data_inicio', filtros.data_inicio);
        }
        if (filtros?.data_fim) {
            params.append('data_fim', filtros.data_fim);
        }
        if (filtros?.veterinario_id) {
            params.append('veterinario_id', filtros.veterinario_id);
        }
        if (filtros?.principio_ativo_id) {
            params.append('principio_ativo_id', filtros.principio_ativo_id);
        }

        const response = await axios.get(
            `${API_URL}/validacao/relatorio-logs?${params}`,
            { headers: this.getAuthHeader() }
        );

        return response.data.data;
    }

    async calcularQuantidade(params: {
        dosagem_mg_kg: number;
        peso_kg: number;
        frequencia_horas: number;
        duracao_dias: number;
        concentracao_mg?: number;
    }): Promise<{
        dose_por_aplicacao_mg: number;
        doses_por_dia: number;
        dose_diaria_total_mg: number;
        dose_total_mg: number;
        unidades_necessarias?: number;
    }> {
        const response = await axios.post(
            `${API_URL}/validacao/calcular-quantidade`,
            params,
            { headers: this.getAuthHeader() }
        );

        return response.data.data;
    }
}

export const validacaoClinicaService = new ValidacaoClinicaService();
