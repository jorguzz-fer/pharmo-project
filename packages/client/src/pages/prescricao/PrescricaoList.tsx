import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Download, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';

interface Prescricao {
  id: string;
  status: string;
  diagnostico: string | null;
  created_at: string;
  tutor: { id: string; nome: string };
  animal: { id: string; nome: string; especie: string };
  veterinario: { id: string; nome: string; crmv: string };
  _count: { itens: number };
}

export function PrescricaoList() {
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadPrescricoes();
  }, [statusFilter]);

  async function loadPrescricoes() {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get<{ total: number; prescricoes: Prescricao[] }>(`/prescricoes${params}`);
      setPrescricoes(res.data?.prescricoes || []);
      setTotal(res.data?.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf(id: string) {
    try {
      const blob = await api.getBlob(`/prescricoes/${id}/pdf`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      alert('Erro ao gerar PDF');
    }
  }

  const statusVariant = (s: string) => {
    const m: Record<string, any> = { DRAFT: 'default', VALIDADA: 'info', ASSINADA: 'success', ENVIADA: 'success', CANCELADA: 'danger' };
    return m[s] || 'default';
  };

  const statusLabel = (s: string) => {
    const m: Record<string, string> = { DRAFT: 'Rascunho', VALIDADA: 'Validada', ASSINADA: 'Assinada', ENVIADA: 'Enviada', CANCELADA: 'Cancelada' };
    return m[s] || s;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescricoes</h1>
          <p className="text-sm text-gray-500 mt-1">{total} prescricao(oes)</p>
        </div>
        <Link to="/prescricoes/nova">
          <Button><Plus className="w-4 h-4 mr-2" />Nova Prescricao</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'DRAFT', 'VALIDADA', 'ASSINADA', 'ENVIADA'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              statusFilter === s
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'Todas' : statusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : prescricoes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma prescricao encontrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {prescricoes.map((p) => (
            <div key={p.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <Link to={`/prescricoes/${p.id}`} className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.animal.nome} ({p.animal.especie.toLowerCase()})
                      </p>
                      <p className="text-sm text-gray-500">
                        Tutor: {p.tutor.nome} | Vet: {p.veterinario.nome}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(p.created_at).toLocaleDateString('pt-BR')} | {p._count.itens} medicamento(s)
                        {p.diagnostico && ` | ${p.diagnostico}`}
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                  {(p.status === 'ASSINADA' || p.status === 'ENVIADA') && (
                    <button onClick={() => downloadPdf(p.id)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Baixar PDF">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
