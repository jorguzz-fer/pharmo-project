import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Users, Trash2, Edit, Loader2 } from "lucide-react";
import { propostaService } from "@/lib/propostaService";
import { useToast } from "@/hooks/use-toast";
import type { Consultor } from "@shared/schema";

export default function AdminConsultores() {
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [nome, setNome] = useState("");
  const [idConsultor, setIdConsultor] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await propostaService.listConsultores();
      setConsultores(data);
    } catch {
      setConsultores([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setNome(""); setIdConsultor(""); setEmail(""); setWhatsapp("");
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      const payload = { nome, idConsultor, email: email || undefined, whatsapp: whatsapp || undefined };
      if (editingId) {
        await propostaService.updateConsultor(editingId, payload);
        toast({ title: "Consultor atualizado!" });
      } else {
        await propostaService.createConsultor(payload);
        toast({ title: "Consultor cadastrado!" });
      }
      setDialogOpen(false);
      resetForm();
      load();
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    }
  };

  const handleEdit = (c: Consultor) => {
    setEditingId(c.id);
    setNome(c.nome);
    setIdConsultor(c.idConsultor);
    setEmail(c.email || "");
    setWhatsapp(c.whatsapp || "");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await propostaService.deleteConsultor(id);
      toast({ title: "Consultor removido." });
      load();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Consultores</h1>
            <p className="text-slate-500">Gerencie os consultores comerciais.</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Novo Consultor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Consultor" : "Novo Consultor"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nome *</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className="h-12 bg-slate-50" />
                </div>
                <div>
                  <Label>ID do Consultor *</Label>
                  <Input value={idConsultor} onChange={(e) => setIdConsultor(e.target.value)} placeholder="Ex: CONS-001" className="h-12 bg-slate-50" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="h-12 bg-slate-50" />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" className="h-12 bg-slate-50" />
                </div>
                <Button onClick={handleSave} disabled={!nome || !idConsultor} className="w-full h-12 bg-primary hover:bg-primary/90">
                  {editingId ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
        ) : consultores.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum consultor cadastrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {consultores.map((c) => (
              <Card key={c.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {c.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{c.nome}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{c.idConsultor}</Badge>
                          {c.email && <span className="text-xs text-slate-400">{c.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
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
