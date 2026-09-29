import { apiRequest } from "./queryClient";

export const propostaService = {
  // Propostas
  async list(filters?: Record<string, string>) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/propostas?${params}`, { credentials: "include" });
    if (!res.ok) throw new Error("Erro ao listar propostas");
    return res.json();
  },

  async get(id: string) {
    const res = await fetch(`/api/propostas/${id}`, { credentials: "include" });
    if (!res.ok) throw new Error("Proposta não encontrada");
    return res.json();
  },

  async create(data: any) {
    const res = await apiRequest("POST", "/api/propostas", data);
    return res.json();
  },

  async update(id: string, data: any) {
    const res = await apiRequest("PUT", `/api/propostas/${id}`, data);
    return res.json();
  },

  async delete(id: string) {
    await apiRequest("DELETE", `/api/propostas/${id}`);
  },

  async enviar(id: string, metodo: "EMAIL" | "WHATSAPP" | "AMBOS") {
    const res = await apiRequest("POST", `/api/propostas/${id}/enviar`, { metodo });
    return res.json();
  },

  async dashboard() {
    const res = await fetch("/api/propostas/dashboard", { credentials: "include" });
    if (!res.ok) throw new Error("Erro ao carregar dashboard");
    return res.json();
  },

  // Consultores
  async listConsultores() {
    const res = await fetch("/api/consultores", { credentials: "include" });
    if (!res.ok) throw new Error("Erro ao listar consultores");
    return res.json();
  },

  async createConsultor(data: any) {
    const res = await apiRequest("POST", "/api/consultores", data);
    return res.json();
  },

  async updateConsultor(id: string, data: any) {
    const res = await apiRequest("PUT", `/api/consultores/${id}`, data);
    return res.json();
  },

  async deleteConsultor(id: string) {
    await apiRequest("DELETE", `/api/consultores/${id}`);
  },

  // Metas
  async listMetas() {
    const res = await fetch("/api/metas", { credentials: "include" });
    if (!res.ok) throw new Error("Erro ao listar metas");
    return res.json();
  },

  async createMeta(data: any) {
    const res = await apiRequest("POST", "/api/metas", data);
    return res.json();
  },

  async updateMeta(id: string, data: any) {
    const res = await apiRequest("PUT", `/api/metas/${id}`, data);
    return res.json();
  },

  async deleteMeta(id: string) {
    await apiRequest("DELETE", `/api/metas/${id}`);
  },
};
