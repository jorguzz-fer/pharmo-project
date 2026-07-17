import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  CheckCircle,
  TrendingUp,
  Target,
  ArrowLeft,
  Plus,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { propostaService } from "@/lib/propostaService";

interface DashboardMetrics {
  totalEnviadas: number;
  totalAceitas: number;
  valorTotalAceito: number;
  taxaConversao: number;
  propostasPorEstado: { estado: string; count: number; aceitas: number }[];
  propostasPorMes: { mes: string; enviadas: number; aceitas: number }[];
  propostasPorStatus: { status: string; count: number }[];
  topConsultores: { nome: string; aceitas: number; total: number }[];
  valorAcumuladoPorMes: { mes: string; valor: number }[];
  propostasRecentes: any[];
}

const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "#94a3b8",
  ENVIADA: "#3b82f6",
  VISUALIZADA: "#eab308",
  ACEITA: "#22c55e",
  RECUSADA: "#ef4444",
  EXPIRADA: "#6b7280",
};

const CHART_COLORS = ["#f97316", "#0f172a", "#3b82f6", "#22c55e", "#eab308", "#ef4444"];

export default function PropostasDashboard() {
  const [, setLocation] = useLocation();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propostaService.dashboard().then(setMetrics).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Carregando dashboard...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Nenhum dado disponível ainda.</p>
          <Button onClick={() => setLocation("/admin/propostas/nova")} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Proposta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/admin/propostas")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Propostas
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard de Propostas</h1>
              <p className="text-slate-500">Visão geral do desempenho comercial.</p>
            </div>
          </div>
          <Button onClick={() => setLocation("/admin/propostas/nova")} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nova Proposta
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Propostas Enviadas</p>
                  <p className="text-3xl font-bold mt-1">{metrics.totalEnviadas}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Send className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Propostas Aceitas</p>
                  <p className="text-3xl font-bold mt-1">{metrics.totalAceitas}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Valor Total Aceito</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.valorTotalAceito)}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Taxa de Conversão</p>
                  <p className="text-3xl font-bold mt-1">{metrics.taxaConversao.toFixed(1)}%</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Propostas por Estado */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-600">Propostas por Estado (UF)</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.propostasPorEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.propostasPorEstado}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Enviadas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="aceitas" name="Aceitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">Sem dados</div>
              )}
            </CardContent>
          </Card>

          {/* Propostas por Mês */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-600">Propostas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.propostasPorMes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.propostasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="enviadas" name="Enviadas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="aceitas" name="Aceitas" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">Sem dados</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribuição por Status */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-600">Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.propostasPorStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.propostasPorStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {metrics.propostasPorStatus.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">Sem dados</div>
              )}
            </CardContent>
          </Card>

          {/* Top Consultores */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-600">Top Consultores</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topConsultores.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.topConsultores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="nome" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="aceitas" name="Aceitas" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="total" name="Total" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">Sem dados</div>
              )}
            </CardContent>
          </Card>

          {/* Valor Acumulado */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-600">Valor Acumulado (R$)</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.valorAcumuladoPorMes.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={metrics.valorAcumuladoPorMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      name="Valor Acumulado"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">Sem dados</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Propostas Recentes */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-600">Propostas Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.propostasRecentes.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left p-3 text-slate-600">Número</th>
                    <th className="text-left p-3 text-slate-600">Cliente</th>
                    <th className="text-right p-3 text-slate-600">Valor</th>
                    <th className="text-center p-3 text-slate-600">Status</th>
                    <th className="text-left p-3 text-slate-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.propostasRecentes.map((p: any) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-25 cursor-pointer"
                      onClick={() => setLocation(`/admin/propostas/${p.id}`)}>
                      <td className="p-3 font-mono text-xs text-slate-500">{p.numeroProposta}</td>
                      <td className="p-3">{p.clienteNome}</td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(parseFloat(p.valorTotal || "0"))}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          className={`text-xs ${
                            p.status === "ACEITA" ? "bg-green-100 text-green-700" :
                            p.status === "ENVIADA" ? "bg-blue-100 text-blue-700" :
                            p.status === "RECUSADA" ? "bg-red-100 text-red-700" :
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                Nenhuma proposta ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
