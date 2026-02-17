import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Target, Trash2, Edit, Loader2 } from "lucide-react";
import { propostaService } from "@/lib/propostaService";
import { useToast } from "@/hooks/use-toast";
import type { MetaProposta } from "@shared/schema";

export default function AdminMetasProposta() {
  const [metas, setMetas] = useState<MetaProposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [periodo, setPeriodo] = useState("");
  const [tipo, setTipo] = useState("mensal");
  const [metaValor, setMetaValor] = useState("");
  const [metaQuantidade, setMetaQuantidade] = useState("");

  const loadMetas = async () => {
    setLoading(true);
    try {
      const data = await propostaService.listMetas();
      setMetas(data);
    } catch {
      setMetas([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMetas();
  }, []);

  const resetForm = () => {
    setPeriodo("");
    setTipo("mensal");
    setMetaValor("");
    setMetaQuantidade("");
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      const payload = {
        periodo,
        tipo,
        metaValor: metaValor || undefined,
        metaQuantidade: metaQuantidade ? parseInt(metaQuantidade) : undefined,
      };

      if (editingId) {
        await propostaService.updateMeta(editingId, payload);
        toast({ title: "Meta atualizada!" });
      } else {
        await propostaService.createMeta(payload);
        toast({ title: "Meta criada!" });
      }

      setDialogOpen(false);
      resetForm();
      loadMetas();
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar a meta.", variant: "destructive" });
    }
  };

  const handleEdit = (meta: MetaProposta) => {
    setEditingId(meta.id);
    setPeriodo(meta.periodo);
    setTipo(meta.tipo);
    setMetaValor(meta.metaValor || "");
    setMetaQuantidade(meta.metaQuantidade?.toString() || "");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await propostaService.deleteMeta(id);
      toast({ title: "Meta removida." });
      loadMetas();
    } catch {
      toast({ title: "Erro", description: "Não foi possível remover.", variant: "destructive" });
    }
  };

  const formatCurrency = (val: string | number | null) => {
    if (!val) return "-";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      typeof val === "string" ? parseFloat(val) : val
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestão de Metas</h1>
            <p className="text-slate-500">Configure metas de propostas por período.</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Meta" : "Nova Meta"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Período</Label>
                  <Input
                    placeholder="Ex: 2026-02"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="h-12 bg-slate-50"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger className="h-12 bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meta de Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100000.00"
                    value={metaValor}
                    onChange={(e) => setMetaValor(e.target.value)}
                    className="h-12 bg-slate-50"
                  />
                </div>
                <div>
                  <Label>Meta de Quantidade (propostas)</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={metaQuantidade}
                    onChange={(e) => setMetaQuantidade(e.target.value)}
                    className="h-12 bg-slate-50"
                  />
                </div>
                <Button onClick={handleSave} className="w-full h-12 bg-primary hover:bg-primary/90">
                  {editingId ? "Atualizar" : "Criar Meta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : metas.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="p-12 text-center">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma meta configurada.</p>
              <p className="text-sm text-slate-400">Crie sua primeira meta para acompanhar o desempenho.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {metas.map((meta) => (
              <Card key={meta.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          Período: {meta.periodo}
                          <span className="ml-2 text-xs font-normal text-slate-400 uppercase">({meta.tipo})</span>
                        </h3>
                        <div className="flex gap-4 mt-1 text-sm text-slate-500">
                          {meta.metaValor && (
                            <span>Valor: <strong className="text-slate-700">{formatCurrency(meta.metaValor)}</strong></span>
                          )}
                          {meta.metaQuantidade && (
                            <span>Quantidade: <strong className="text-slate-700">{meta.metaQuantidade} propostas</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(meta)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(meta.id)} className="text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
