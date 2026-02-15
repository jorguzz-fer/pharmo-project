const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: { field: string; message: string }[];
}

class ApiClient {
  private getToken(): string | null {
    try {
      const stored = localStorage.getItem('pharmopet-auth');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed.state?.accessToken || null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      localStorage.removeItem('pharmopet-auth');
      window.location.href = '/login';
      throw new Error('Sessao expirada');
    }

    const data = await res.json().catch(() => ({ success: false, message: res.statusText }));

    if (!res.ok) {
      const msg = data.message || data.errors?.[0]?.message || 'Erro na requisicao';
      throw new Error(msg);
    }

    return data;
  }

  get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, body?: any) {
    return this.request<T>('POST', endpoint, body);
  }

  put<T>(endpoint: string, body?: any) {
    return this.request<T>('PUT', endpoint, body);
  }

  patch<T>(endpoint: string, body?: any) {
    return this.request<T>('PATCH', endpoint, body);
  }

  delete<T>(endpoint: string) {
    return this.request<T>('DELETE', endpoint);
  }

  async getBlob(endpoint: string): Promise<Blob> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, { headers });

    if (!res.ok) throw new Error('Erro ao baixar arquivo');
    return res.blob();
  }
}

export const api = new ApiClient();
