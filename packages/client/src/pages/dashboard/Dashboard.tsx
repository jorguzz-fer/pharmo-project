import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Pill, Users, Beaker, Plus, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/auth';
import { api } from '../../services/api';

interface DashboardData {
  prescricoes_recentes: any[];
  total_prescricoes: number;
  total_tutores: number;
  total_ativos: number;
  total_protocolos: number;
}

export function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [prescRes, tutorRes] = await Promise.all([
        api.get<{ total: number; prescricoes: any[] }>('/prescricoes?limit=5'),
        api.get<any[]>('/tutores'),
      ]);

      setData({
        prescricoes_recentes: prescRes.data?.prescricoes || [],
        total_prescricoes: prescRes.data?.total || 0,
        total_tutores: Array.isArray(tutorRes.data) ? tutorRes.data.length : 0,
        total_ativos: 0,
        total_protocolos: 0,
      });
    } catch {
      // Dashboard loads even on error
    } finally {
      setLoading(false);
    }
  }

  const statusVariant = (status: string) => {
    const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
      DRAFT: 'default',
      VALIDADA: 'info',
      ASSINADA: 'success',
      ENVIADA: 'success',
      CANCELADA: 'danger',
    };
    return map[status] || 'default';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'Rascunho',
      VALIDADA: 'Validada',
      ASSINADA: 'Assinada',
      ENVIADA: 'Enviada',
      CANCELADA: 'Cancelada',
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ola, {user?.nome?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1">{user?.clinica?.nome_fantasia}</p>
        </div>
        <Link to="/prescricoes/nova">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Prescricao
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: 'Prescricoes', value: data?.total_prescricoes || 0, color: 'text-primary-600 bg-primary-50' },
          { icon: Users, label: 'Tutores', value: data?.total_tutores || 0, color: 'text-blue-600 bg-blue-50' },
          { icon: Pill, label: 'Ativos', value: data?.total_ativos || '-', color: 'text-green-600 bg-green-50' },
          { icon: Beaker, label: 'Protocolos', value: data?.total_protocolos || '-', color: 'text-orange-600 bg-orange-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent prescriptions */}
      <Card title="Prescricoes Recentes" action={
        <Link to="/prescricoes" className="text-sm text-primary-600 hover:text-primary-700">
          Ver todas
        </Link>
      }>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Carregando...</div>
        ) : data?.prescricoes_recentes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma prescricao ainda</p>
            <Link to="/prescricoes/nova">
              <Button variant="outline" size="sm" className="mt-3">Criar primeira prescricao</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.prescricoes_recentes.map((p: any) => (
              <Link
                key={p.id}
                to={`/prescricoes/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.animal?.nome} - {p.tutor?.nome}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      {' - '}{p._count?.itens || 0} item(ns)
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
