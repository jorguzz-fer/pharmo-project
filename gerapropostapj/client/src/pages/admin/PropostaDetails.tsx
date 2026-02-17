import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  Mail,
  MessageCircle,
  FileDown,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { propostaService } from "@/lib/propostaService";
import { useToast } from "@/hooks/use-toast";
import type { Proposta, PropostaItem } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-700",
  ENVIADA: "bg-blue-100 text-blue-700",
  VISUALIZADA: "bg-yellow-100 text-yellow-700",
  ACEITA: "bg-green-100 text-green-700",
  RECUSADA: "bg-red-100 text-red-700",
  EXPIRADA: "bg-gray-100 text-gray-700",
};

export default function PropostaDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (params.id) {
      propostaService.get(params.id).then(setProposta).catch(() => {}).finally(() => setLoading(false));
    }
  }, [params.id]);

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      typeof val === "string" ? parseFloat(val) : val
    );

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const handleEnviar = async (metodo: "EMAIL" | "WHATSAPP" | "AMBOS") => {
    if (!proposta) return;
    setSending(true);
    try {
      const updated = await propostaService.enviar(proposta.id, metodo);
      setProposta(updated);
      toast({ title: "Proposta enviada!", description: `Enviada via ${metodo.toLowerCase()}.` });
    } catch {
      toast({ title: "Erro", description: "Não foi possível enviar.", variant: "destructive" });
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Proposta não encontrada.</p>
      </div>
    );
  }

  const itens = (proposta.itens || []) as PropostaItem[];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/admin/propostas")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{proposta.numeroProposta}</h1>
            <p className="text-sm text-slate-500">{proposta.titulo}</p>
          </div>
          <Badge className={STATUS_COLORS[proposta.status] || "bg-slate-100"}>
            {proposta.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-sm text-slate-500">Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold">{proposta.clienteNome}</p>
              {proposta.clienteEmpresa && <p className="text-sm text-slate-500">{proposta.clienteEmpresa}</p>}
              {proposta.clienteEmail && <p className="text-sm text-slate-500">{proposta.clienteEmail}</p>}
              {proposta.clienteWhatsapp && <p className="text-sm text-slate-500">{proposta.clienteWhatsapp}</p>}
              {proposta.clienteEstado && (
                <p className="text-sm text-slate-500">
                  {proposta.clienteCidade && `${proposta.clienteCidade} - `}{proposta.clienteEstado}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-sm text-slate-500">Datas</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Criada</span>
                <span>{formatDate(proposta.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enviada</span>
                <span>{formatDate(proposta.dataEnvio)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiração</span>
                <span>{formatDate(proposta.dataExpiracao)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validade</span>
                <span>{proposta.validadeDias} dias</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Itens */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Itens da Proposta</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left p-4 text-slate-600">Descrição</th>
                  <th className="text-center p-4 text-slate-600">Qtd</th>
                  <th className="text-right p-4 text-slate-600">Valor Unit.</th>
                  <th className="text-right p-4 text-slate-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="p-4">{item.descricao}</td>
                    <td className="p-4 text-center">{item.quantidade}</td>
                    <td className="p-4 text-right">{formatCurrency(item.valorUnitario)}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(item.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white">
                  <td colSpan={3} className="p-4 text-right font-semibold">TOTAL</td>
                  <td className="p-4 text-right font-bold text-primary text-lg">
                    {formatCurrency(proposta.valorTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {proposta.observacoes && (
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500"><strong>Observações:</strong> {proposta.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {proposta.status === "RASCUNHO" && (
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex gap-3 flex-wrap">
              <Button
                onClick={() => handleEnviar("EMAIL")}
                disabled={sending || !proposta.clienteEmail}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar por Email
              </Button>
              <Button
                onClick={() => handleEnviar("WHATSAPP")}
                disabled={sending || !proposta.clienteWhatsapp}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar por WhatsApp
              </Button>
              <Button
                onClick={() => handleEnviar("AMBOS")}
                disabled={sending}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Ambos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
