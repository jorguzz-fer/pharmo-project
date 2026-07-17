import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  Send,
  FileDown,
  BarChart3,
  Filter,
  FileText,
} from "lucide-react";
import { propostaService } from "@/lib/propostaService";
import type { Proposta } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-700",
  ENVIADA: "bg-blue-100 text-blue-700",
  VISUALIZADA: "bg-yellow-100 text-yellow-700",
  ACEITA: "bg-green-100 text-green-700",
  RECUSADA: "bg-red-100 text-red-700",
  EXPIRADA: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA: "Enviada",
  VISUALIZADA: "Visualizada",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  EXPIRADA: "Expirada",
};

export default function PropostasList() {
  const [, setLocation] = useLocation();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const loadPropostas = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (filterStatus && filterStatus !== "all") filters.status = filterStatus;
      const data = await propostaService.list(filters);
      setPropostas(data);
    } catch {
      setPropostas([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPropostas();
  }, [filterStatus]);

  const filtered = propostas.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.clienteNome.toLowerCase().includes(s) ||
      p.titulo.toLowerCase().includes(s) ||
      p.numeroProposta.toLowerCase().includes(s) ||
      (p.clienteEmpresa?.toLowerCase().includes(s) ?? false)
    );
  });

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      typeof val === "string" ? parseFloat(val) : val
    );

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Propostas Comerciais</h1>
            <p className="text-slate-500">Gerencie todas as propostas enviadas.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation("/admin/propostas/dashboard")}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button onClick={() => setLocation("/admin/propostas/nova")} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Proposta
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por cliente, empresa, título..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 bg-slate-50"
                />
              </div>
              <div className="flex gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] h-10">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                    <SelectItem value="ENVIADA">Enviada</SelectItem>
                    <SelectItem value="VISUALIZADA">Visualizada</SelectItem>
                    <SelectItem value="ACEITA">Aceita</SelectItem>
                    <SelectItem value="RECUSADA">Recusada</SelectItem>
                    <SelectItem value="EXPIRADA">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Carregando propostas...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma proposta encontrada.</p>
                <Button
                  onClick={() => setLocation("/admin/propostas/nova")}
                  className="mt-4 bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Proposta
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left p-4 font-semibold text-slate-600">Número</th>
                      <th className="text-left p-4 font-semibold text-slate-600">Cliente</th>
                      <th className="text-left p-4 font-semibold text-slate-600 hidden md:table-cell">Estado</th>
                      <th className="text-right p-4 font-semibold text-slate-600">Valor</th>
                      <th className="text-center p-4 font-semibold text-slate-600">Status</th>
                      <th className="text-left p-4 font-semibold text-slate-600 hidden md:table-cell">Data</th>
                      <th className="text-center p-4 font-semibold text-slate-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-25 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-xs text-slate-500">{p.numeroProposta}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{p.clienteNome}</div>
                          <div className="text-xs text-slate-400">{p.clienteEmpresa || p.titulo}</div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-slate-600">{p.clienteEstado || "-"}</span>
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-800">
                          {formatCurrency(p.valorTotal)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={STATUS_COLORS[p.status] || "bg-slate-100"}>
                            {STATUS_LABELS[p.status] || p.status}
                          </Badge>
                        </td>
                        <td className="p-4 hidden md:table-cell text-slate-500">
                          {formatDate(p.createdAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/admin/propostas/${p.id}`)}
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
