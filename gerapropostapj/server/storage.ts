import {
  type User, type InsertUser,
  type Consultor, type InsertConsultor,
  type Proposta, type InsertProposta,
  type PropostaEnvio, type InsertPropostaEnvio,
  type MetaProposta, type InsertMetaProposta,
  type PropostaItem,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Consultores
  getConsultores(): Promise<Consultor[]>;
  getConsultor(id: string): Promise<Consultor | undefined>;
  createConsultor(data: InsertConsultor): Promise<Consultor>;
  updateConsultor(id: string, data: Partial<InsertConsultor>): Promise<Consultor | undefined>;
  deleteConsultor(id: string): Promise<boolean>;

  // Propostas
  getPropostas(filters?: PropostaFilters): Promise<Proposta[]>;
  getProposta(id: string): Promise<Proposta | undefined>;
  createProposta(data: InsertProposta): Promise<Proposta>;
  updateProposta(id: string, data: Partial<InsertProposta>): Promise<Proposta | undefined>;
  deleteProposta(id: string): Promise<boolean>;
  getNextNumeroProposta(): Promise<string>;

  // Envios
  getEnviosByProposta(propostaId: string): Promise<PropostaEnvio[]>;
  createEnvio(data: InsertPropostaEnvio): Promise<PropostaEnvio>;

  // Metas
  getMetas(): Promise<MetaProposta[]>;
  getMeta(id: string): Promise<MetaProposta | undefined>;
  createMeta(data: InsertMetaProposta): Promise<MetaProposta>;
  updateMeta(id: string, data: Partial<InsertMetaProposta>): Promise<MetaProposta | undefined>;
  deleteMeta(id: string): Promise<boolean>;

  // Dashboard
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

export interface PropostaFilters {
  status?: string;
  estado?: string;
  consultorId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface DashboardMetrics {
  totalEnviadas: number;
  totalAceitas: number;
  valorTotalAceito: number;
  taxaConversao: number;
  propostasPorEstado: { estado: string; count: number; aceitas: number }[];
  propostasPorMes: { mes: string; enviadas: number; aceitas: number }[];
  propostasPorStatus: { status: string; count: number }[];
  topConsultores: { nome: string; aceitas: number; total: number }[];
  valorAcumuladoPorMes: { mes: string; valor: number }[];
  propostasRecentes: Proposta[];
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private consultoresMap: Map<string, Consultor>;
  private propostasMap: Map<string, Proposta>;
  private enviosMap: Map<string, PropostaEnvio>;
  private metasMap: Map<string, MetaProposta>;
  private propostaCounter: number;

  constructor() {
    this.users = new Map();
    this.consultoresMap = new Map();
    this.propostasMap = new Map();
    this.enviosMap = new Map();
    this.metasMap = new Map();
    this.propostaCounter = 0;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Consultores
  async getConsultores(): Promise<Consultor[]> {
    return Array.from(this.consultoresMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getConsultor(id: string): Promise<Consultor | undefined> {
    return this.consultoresMap.get(id);
  }

  async createConsultor(data: InsertConsultor): Promise<Consultor> {
    const id = randomUUID();
    const now = new Date();
    const consultor: Consultor = {
      id,
      nome: data.nome,
      idConsultor: data.idConsultor,
      email: data.email ?? null,
      whatsapp: data.whatsapp ?? null,
      ativo: data.ativo ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.consultoresMap.set(id, consultor);
    return consultor;
  }

  async updateConsultor(id: string, data: Partial<InsertConsultor>): Promise<Consultor | undefined> {
    const existing = this.consultoresMap.get(id);
    if (!existing) return undefined;
    const updated: Consultor = { ...existing, ...data, updatedAt: new Date() };
    this.consultoresMap.set(id, updated);
    return updated;
  }

  async deleteConsultor(id: string): Promise<boolean> {
    return this.consultoresMap.delete(id);
  }

  // Propostas
  async getPropostas(filters?: PropostaFilters): Promise<Proposta[]> {
    let result = Array.from(this.propostasMap.values());

    if (filters?.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters?.estado) {
      result = result.filter(p => p.clienteEstado === filters.estado);
    }
    if (filters?.consultorId) {
      result = result.filter(p => p.consultorId === filters.consultorId);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProposta(id: string): Promise<Proposta | undefined> {
    return this.propostasMap.get(id);
  }

  async getNextNumeroProposta(): Promise<string> {
    this.propostaCounter++;
    const year = new Date().getFullYear();
    return `PRP-${year}-${String(this.propostaCounter).padStart(4, "0")}`;
  }

  async createProposta(data: InsertProposta): Promise<Proposta> {
    const id = randomUUID();
    const now = new Date();
    const numeroProposta = await this.getNextNumeroProposta();
    const proposta: Proposta = {
      id,
      numeroProposta,
      consultorId: data.consultorId ?? null,
      clienteNome: data.clienteNome,
      clienteEmail: data.clienteEmail ?? null,
      clienteWhatsapp: data.clienteWhatsapp ?? null,
      clienteEmpresa: data.clienteEmpresa ?? null,
      clienteCnpj: data.clienteCnpj ?? null,
      clienteEstado: data.clienteEstado ?? null,
      clienteCidade: data.clienteCidade ?? null,
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      itens: (data.itens as PropostaItem[]) ?? [],
      valorTotal: data.valorTotal ?? "0",
      validadeDias: data.validadeDias ?? 30,
      observacoes: data.observacoes ?? null,
      status: data.status ?? "RASCUNHO",
      metodoEnvio: data.metodoEnvio ?? null,
      pdfUrl: data.pdfUrl ?? null,
      dataEnvio: data.dataEnvio ?? null,
      dataVisualizacao: data.dataVisualizacao ?? null,
      dataResposta: data.dataResposta ?? null,
      dataExpiracao: data.dataExpiracao ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.propostasMap.set(id, proposta);
    return proposta;
  }

  async updateProposta(id: string, data: Partial<InsertProposta>): Promise<Proposta | undefined> {
    const existing = this.propostasMap.get(id);
    if (!existing) return undefined;
    const updated: Proposta = { ...existing, ...data, updatedAt: new Date() } as Proposta;
    this.propostasMap.set(id, updated);
    return updated;
  }

  async deleteProposta(id: string): Promise<boolean> {
    return this.propostasMap.delete(id);
  }

  // Envios
  async getEnviosByProposta(propostaId: string): Promise<PropostaEnvio[]> {
    return Array.from(this.enviosMap.values()).filter(e => e.propostaId === propostaId);
  }

  async createEnvio(data: InsertPropostaEnvio): Promise<PropostaEnvio> {
    const id = randomUUID();
    const envio: PropostaEnvio = {
      id,
      propostaId: data.propostaId,
      metodo: data.metodo,
      destinatario: data.destinatario,
      status: data.status ?? "PENDENTE",
      errorMessage: data.errorMessage ?? null,
      createdAt: new Date(),
    };
    this.enviosMap.set(id, envio);
    return envio;
  }

  // Metas
  async getMetas(): Promise<MetaProposta[]> {
    return Array.from(this.metasMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getMeta(id: string): Promise<MetaProposta | undefined> {
    return this.metasMap.get(id);
  }

  async createMeta(data: InsertMetaProposta): Promise<MetaProposta> {
    const id = randomUUID();
    const now = new Date();
    const meta: MetaProposta = {
      id,
      periodo: data.periodo,
      tipo: data.tipo ?? "mensal",
      metaValor: data.metaValor ?? null,
      metaQuantidade: data.metaQuantidade ?? null,
      consultorId: data.consultorId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.metasMap.set(id, meta);
    return meta;
  }

  async updateMeta(id: string, data: Partial<InsertMetaProposta>): Promise<MetaProposta | undefined> {
    const existing = this.metasMap.get(id);
    if (!existing) return undefined;
    const updated: MetaProposta = { ...existing, ...data, updatedAt: new Date() } as MetaProposta;
    this.metasMap.set(id, updated);
    return updated;
  }

  async deleteMeta(id: string): Promise<boolean> {
    return this.metasMap.delete(id);
  }

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const all = Array.from(this.propostasMap.values());
    const enviadas = all.filter(p => p.status !== "RASCUNHO");
    const aceitas = all.filter(p => p.status === "ACEITA");

    const totalEnviadas = enviadas.length;
    const totalAceitas = aceitas.length;
    const valorTotalAceito = aceitas.reduce((sum, p) => sum + parseFloat(p.valorTotal || "0"), 0);
    const taxaConversao = totalEnviadas > 0 ? (totalAceitas / totalEnviadas) * 100 : 0;

    // Por estado
    const estadoMap = new Map<string, { count: number; aceitas: number }>();
    enviadas.forEach(p => {
      const estado = p.clienteEstado || "N/A";
      const curr = estadoMap.get(estado) || { count: 0, aceitas: 0 };
      curr.count++;
      if (p.status === "ACEITA") curr.aceitas++;
      estadoMap.set(estado, curr);
    });
    const propostasPorEstado = Array.from(estadoMap.entries()).map(([estado, data]) => ({
      estado, ...data,
    }));

    // Por mês
    const mesMap = new Map<string, { enviadas: number; aceitas: number }>();
    all.forEach(p => {
      const mes = new Date(p.createdAt).toISOString().slice(0, 7);
      const curr = mesMap.get(mes) || { enviadas: 0, aceitas: 0 };
      if (p.status !== "RASCUNHO") curr.enviadas++;
      if (p.status === "ACEITA") curr.aceitas++;
      mesMap.set(mes, curr);
    });
    const propostasPorMes = Array.from(mesMap.entries())
      .map(([mes, data]) => ({ mes, ...data }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    // Por status
    const statusMap = new Map<string, number>();
    all.forEach(p => {
      statusMap.set(p.status, (statusMap.get(p.status) || 0) + 1);
    });
    const propostasPorStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status, count,
    }));

    // Top consultores
    const consultorMap = new Map<string, { nome: string; aceitas: number; total: number }>();
    for (const p of enviadas) {
      if (p.consultorId) {
        const consultor = this.consultoresMap.get(p.consultorId);
        const nome = consultor?.nome || "Desconhecido";
        const curr = consultorMap.get(p.consultorId) || { nome, aceitas: 0, total: 0 };
        curr.total++;
        if (p.status === "ACEITA") curr.aceitas++;
        consultorMap.set(p.consultorId, curr);
      }
    }
    const topConsultores = Array.from(consultorMap.values())
      .sort((a, b) => b.aceitas - a.aceitas)
      .slice(0, 10);

    // Valor acumulado por mês
    const valorMesMap = new Map<string, number>();
    aceitas.forEach(p => {
      const mes = new Date(p.createdAt).toISOString().slice(0, 7);
      valorMesMap.set(mes, (valorMesMap.get(mes) || 0) + parseFloat(p.valorTotal || "0"));
    });
    let acumulado = 0;
    const valorAcumuladoPorMes = Array.from(valorMesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => {
        acumulado += valor;
        return { mes, valor: acumulado };
      });

    // Recentes
    const propostasRecentes = all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalEnviadas,
      totalAceitas,
      valorTotalAceito,
      taxaConversao,
      propostasPorEstado,
      propostasPorMes,
      propostasPorStatus,
      topConsultores,
      valorAcumuladoPorMes,
      propostasRecentes,
    };
  }
}

export const storage = new MemStorage();
