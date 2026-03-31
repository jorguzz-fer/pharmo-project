import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.pharmopet.com.br/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  // Fallback: try Zustand persist storage
  if (!token) {
    try {
      const authStorage = localStorage.getItem('pharmo-auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        const t = parsed?.state?.token;
        if (t) return { Authorization: `Bearer ${t}` };
      }
    } catch { /* skip */ }
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface InsumoFarmaceutico {
  id: string;
  codigo_interno: number;
  descricao: string;
  valor_custo: number;
  custo_referencia: number;
  markup: number;
  un_manipulacao: string;
  estoque: number;
  calculo_tipo: string;
  controlado: boolean;
  lista_controle: string | null;
  custo_efetivo: number;
  disponivel: boolean;
  formas_proibidas: string[];
}

export interface FormaFarmaceutica {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface RegraExcecao {
  id: string;
  insumo_codigo: number;
  insumo_descricao: string;
  forma_nome: string;
  descricao: string | null;
}

export const insumoService = {
  async buscar(busca: string, page = 1, limit = 20, somenteDisponivel = false) {
    const params = new URLSearchParams();
    if (busca && busca.trim().length >= 2) params.append('busca', busca.trim());
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (somenteDisponivel) params.append('somente_disponivel', 'true');

    const response = await axios.get(`${API_URL}/insumos?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async buscarPorId(id: string) {
    const response = await axios.get(`${API_URL}/insumos/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async listarControlados() {
    const response = await axios.get(`${API_URL}/insumos/controlados`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async toggleControlado(id: string, controlado: boolean, lista_controle?: string) {
    const response = await axios.patch(`${API_URL}/insumos/${id}/controlado`, {
      controlado,
      lista_controle,
    }, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export const regraExcecaoService = {
  async listar() {
    const response = await axios.get(`${API_URL}/regras-excecao`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async adicionar(insumo_id: string, forma_id: string, descricao?: string) {
    const response = await axios.post(`${API_URL}/regras-excecao`, {
      insumo_id,
      forma_id,
      descricao,
    }, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async remover(id: string) {
    const response = await axios.delete(`${API_URL}/regras-excecao/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export const formaFarmaceuticaService = {
  async listar(): Promise<FormaFarmaceutica[]> {
    const response = await axios.get(`${API_URL}/formas-farmaceuticas`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  },
};
