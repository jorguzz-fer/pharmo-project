import { useState } from "react";
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
  Save,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { PropostaFormData } from "../index";
import { propostaService } from "@/lib/propostaService";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Props {
  data: PropostaFormData;
  propostaId: string | null;
  setPropostaId: (id: string) => void;
  onBack: () => void;
}

export default function StepEnvio({ data, propostaId, setPropostaId, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const saveProposta = async (): Promise<string> => {
    if (propostaId) return propostaId;

    const payload = {
      consultorId: data.consultorId || undefined,
      clienteNome: data.clienteNome,
      clienteEmail: data.clienteEmail || undefined,
      clienteWhatsapp: data.clienteWhatsapp || undefined,
      clienteEmpresa: data.clienteEmpresa || undefined,
      clienteCnpj: data.clienteCnpj || undefined,
      clienteEstado: data.clienteEstado || undefined,
      clienteCidade: data.clienteCidade || undefined,
      titulo: data.titulo,
      descricao: data.descricao || undefined,
      itens: data.itens,
      valorTotal: data.valorTotal.toFixed(2),
      validadeDias: data.validadeDias,
      observacoes: data.observacoes || undefined,
      status: "RASCUNHO" as const,
    };

    const result = await propostaService.create(payload);
    setPropostaId(result.id);
    return result.id;
  };

  const handleSaveRascunho = async () => {
    setLoading(true);
    try {
      await saveProposta();
      toast({ title: "Rascunho salvo!", description: "Proposta salva como rascunho." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleEnviar = async (metodo: "EMAIL" | "WHATSAPP" | "AMBOS") => {
    setLoading(true);
    try {
      const id = await saveProposta();
      await propostaService.enviar(id, metodo);
      setEnviada(true);
      toast({ title: "Proposta enviada!", description: `Enviada via ${metodo.toLowerCase()}.` });
    } catch {
      toast({ title: "Erro", description: "Não foi possível enviar.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleGerarPDF = async () => {
    setLoading(true);
    try {
      await saveProposta();
      // Generate a simple PDF download via browser
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(generatePDFHTML(data));
        printWindow.document.close();
        printWindow.print();
      }
      toast({ title: "PDF gerado!", description: "A janela de impressão foi aberta." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível gerar o PDF.", variant: "destructive" });
    }
    setLoading(false);
  };

  if (enviada) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Proposta Enviada!</h2>
        <p className="text-slate-500 mb-8">A proposta foi enviada com sucesso para o cliente.</p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => setLocation("/admin/propostas")}>
            Ver Propostas
          </Button>
          <Button onClick={() => setLocation("/admin/propostas/nova")} className="bg-primary hover:bg-primary/90">
            Nova Proposta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-slate-900 text-white rounded-t-xl">
          <CardTitle className="text-lg">Resumo da Proposta</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Consultor</h3>
              <p className="text-sm text-slate-600">{data.consultorNome || "Não informado"}</p>
              <p className="text-xs text-slate-400">ID: {data.consultorIdCodigo || "N/A"}</p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Cliente</h3>
              <p className="text-sm text-slate-600">{data.clienteNome}</p>
              <p className="text-xs text-slate-400">{data.clienteEmpresa}</p>
              <p className="text-xs text-slate-400">
                {data.clienteEmail && `${data.clienteEmail}`}
                {data.clienteEmail && data.clienteWhatsapp && " | "}
                {data.clienteWhatsapp && `${data.clienteWhatsapp}`}
              </p>
              <p className="text-xs text-slate-400">
                {data.clienteCidade && `${data.clienteCidade}`}
                {data.clienteCidade && data.clienteEstado && " - "}
                {data.clienteEstado}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-slate-700 mb-2">{data.titulo}</h3>
            {data.descricao && <p className="text-sm text-slate-500 mb-4">{data.descricao}</p>}

            <div className="bg-slate-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="text-left p-3">Item</th>
                    <th className="text-center p-3">Qtd</th>
                    <th className="text-right p-3">Valor Unit.</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.itens.map((item, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="p-3 text-slate-700">{item.descricao || "-"}</td>
                      <td className="p-3 text-center text-slate-600">{item.quantidade}</td>
                      <td className="p-3 text-right text-slate-600">{formatCurrency(item.valorUnitario)}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(item.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-900 text-white">
                    <td colSpan={3} className="p-3 text-right font-semibold">TOTAL</td>
                    <td className="p-3 text-right font-bold text-primary text-lg">{formatCurrency(data.valorTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex gap-2 text-xs text-slate-400">
            <Badge variant="secondary">Validade: {data.validadeDias} dias</Badge>
            {data.observacoes && <Badge variant="outline">{data.observacoes}</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Ações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => handleEnviar("EMAIL")}
              disabled={loading || !data.clienteEmail}
              className="h-16 flex flex-col gap-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              <span className="text-xs">Enviar por Email</span>
            </Button>

            <Button
              onClick={() => handleEnviar("WHATSAPP")}
              disabled={loading || !data.clienteWhatsapp}
              className="h-16 flex flex-col gap-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
              <span className="text-xs">Enviar por WhatsApp</span>
            </Button>

            <Button
              onClick={() => handleEnviar("AMBOS")}
              disabled={loading || (!data.clienteEmail && !data.clienteWhatsapp)}
              className="h-16 flex flex-col gap-1 bg-primary hover:bg-primary/90"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              <span className="text-xs">Enviar Ambos</span>
            </Button>

            <Button
              onClick={handleGerarPDF}
              disabled={loading}
              variant="outline"
              className="h-16 flex flex-col gap-1"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
              <span className="text-xs">Gerar PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="h-14 px-8 text-lg rounded-xl">
          <ArrowLeft className="mr-2 w-5 h-5" />
          Voltar
        </Button>
        <Button
          onClick={handleSaveRascunho}
          disabled={loading}
          variant="outline"
          className="h-14 px-8 text-lg rounded-xl border-primary text-primary hover:bg-primary/5"
        >
          <Save className="mr-2 w-5 h-5" />
          Salvar Rascunho
        </Button>
      </div>
    </div>
  );
}

function generatePDFHTML(data: PropostaFormData): string {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return `<!DOCTYPE html>
<html><head><title>Proposta - ${data.titulo}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
  .header { background: #0f172a; color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
  .header h1 { color: #f97316; margin: 0 0 5px; }
  .header p { color: #94a3b8; margin: 0; }
  .section { margin-bottom: 25px; }
  .section h3 { color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
  .value { font-size: 14px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; }
  td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .total-row { background: #0f172a; color: white; font-weight: bold; }
  .total-row td { padding: 12px; }
  .total-value { color: #f97316; font-size: 18px; }
  .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
</style></head>
<body>
  <div class="header">
    <h1>${data.titulo}</h1>
    <p>${data.descricao || ""}</p>
  </div>

  <div class="section">
    <h3>Consultor</h3>
    <div class="grid">
      <div><div class="label">Nome</div><div class="value">${data.consultorNome || "N/A"}</div></div>
      <div><div class="label">ID</div><div class="value">${data.consultorIdCodigo || "N/A"}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Cliente</h3>
    <div class="grid">
      <div><div class="label">Nome</div><div class="value">${data.clienteNome}</div></div>
      <div><div class="label">Empresa</div><div class="value">${data.clienteEmpresa || "N/A"}</div></div>
      <div><div class="label">Email</div><div class="value">${data.clienteEmail || "N/A"}</div></div>
      <div><div class="label">WhatsApp</div><div class="value">${data.clienteWhatsapp || "N/A"}</div></div>
      <div><div class="label">CNPJ</div><div class="value">${data.clienteCnpj || "N/A"}</div></div>
      <div><div class="label">Localização</div><div class="value">${data.clienteCidade || ""} ${data.clienteEstado ? "- " + data.clienteEstado : ""}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Itens da Proposta</h3>
    <table>
      <thead><tr><th>Descrição</th><th style="text-align:center">Qtd</th><th style="text-align:right">Valor Unit.</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>
        ${data.itens.map((item) => `<tr><td>${item.descricao}</td><td style="text-align:center">${item.quantidade}</td><td style="text-align:right">${formatCurrency(item.valorUnitario)}</td><td style="text-align:right">${formatCurrency(item.valorTotal)}</td></tr>`).join("")}
      </tbody>
      <tfoot>
        <tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right" class="total-value">${formatCurrency(data.valorTotal)}</td></tr>
      </tfoot>
    </table>
  </div>

  <div class="section">
    <p><strong>Validade:</strong> ${data.validadeDias} dias</p>
    ${data.observacoes ? `<p><strong>Observações:</strong> ${data.observacoes}</p>` : ""}
  </div>

  <div class="footer">
    <p>Proposta gerada em ${new Date().toLocaleDateString("pt-BR")} | WOW+ Saude</p>
  </div>
</body></html>`;
}
