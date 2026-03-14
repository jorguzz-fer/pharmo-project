import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  preco_sugestao: number;
  preco_tabela: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProdutoListResponse {
  data: Produto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ProdutoService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async buscar(busca: string, page = 1, limit = 20): Promise<ProdutoListResponse> {
    const params = new URLSearchParams();
    if (busca && busca.trim().length >= 2) {
      params.append('busca', busca.trim());
    }
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await axios.get(`${API_URL}/produtos?${params}`, {
      headers: this.getAuthHeader(),
    });

    return response.data;
  }

  async buscarPorId(id: string): Promise<Produto> {
    const response = await axios.get(`${API_URL}/produtos/${id}`, {
      headers: this.getAuthHeader(),
    });

    return response.data.data;
  }
}

export const produtoService = new ProdutoService();
