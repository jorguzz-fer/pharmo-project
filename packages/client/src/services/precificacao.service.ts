import axios from 'axios';

function getBaseUrl() {
  let url = import.meta.env.VITE_API_URL || 'https://api.pharmopet.com.br/api';
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (!url.endsWith('/api')) url = `${url}/api`;
  return url;
}

const API_URL = getBaseUrl();

function getAuthHeader() {
  try {
    const authStorage = localStorage.getItem('pharmo-auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const token = parsed?.state?.token;
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch { /* skip */ }
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --- Types ---

export interface IngredienteInput {
  codigo_interno?: number;
  insumo_id?: string;
  dosagem_mg: number;
  quantidade: number;
}

export interface IngredienteResultado {
  codigo_interno: number;
  descricao: string;
  un_manipulacao: string;
  valor_custo: number;
  custo_referencia: number;
  custo_efetivo: number;
  markup: number;
  dosagem_mg: number;
  quantidade: number;
  peso_total_g: number;
  custo_ingrediente: number;
  disponivel: boolean;
  controlado: boolean;
  lista_controle: string | null;
}

export interface PrecificacaoInput {
  ingredientes: IngredienteInput[];
  forma_farmaceutica: string;
  clinica_id?: string;
}

export interface PrecificacaoResultado {
  ingredientes: IngredienteResultado[];
  total_materia_prima: number;
  taxa_manipulacao: number;
  custo_embalagens: number;
  subtotal: number;
  desconto_parceiro_pct: number;
  desconto_valor: number;
  valor_com_desconto: number;
  adicional_entrega: number;
  adicional_biscoito: number;
  valor_final: number;
  forma_farmaceutica: string;
  avisos: string[];
  erros: string[];
}

// --- Service ---

export const precificacaoService = {
  async calcular(input: PrecificacaoInput): Promise<PrecificacaoResultado> {
    const response = await axios.post(`${API_URL}/precificacao/calcular`, input, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
