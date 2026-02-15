import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Pill, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';

interface PrincipioAtivo {
  id: string;
  nome_padronizado: string;
  classe_terapeutica: string | null;
  controlado: boolean;
  concentracoes: { id: string; valor: number; unidade: string; forma_farmaceutica: string }[];
  _count: { faixas_terapeuticas: number };
}

export function AtivosList() {
  const [ativos, setAtivos] = useState<PrincipioAtivo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAtivos();
  }, []);

  async function loadAtivos() {
    try {
      const res = await api.get<PrincipioAtivo[]>(`/principios-ativos${search ? `?search=${search}` : ''}`);
      setAtivos(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadAtivos, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Principios Ativos</h1>
        <Link to="/ativos/novo">
          <Button><Plus className="w-4 h-4 mr-2" />Novo Ativo</Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou classe terapeutica..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : ativos.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum principio ativo cadastrado</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {ativos.map((ativo) => (
            <div
              key={ativo.id}
              onClick={() => navigate(`/ativos/${ativo.id}`)}
              className="bg-white rounded-xl border p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{ativo.nome_padronizado}</h3>
                      {ativo.controlado && (
                        <Badge variant="danger">
                          <Shield className="w-3 h-3 mr-1" />Controlado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{ativo.classe_terapeutica || 'Sem classe'}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{ativo.concentracoes.length} concentracao(oes)</p>
                  <p>{ativo._count.faixas_terapeuticas} faixa(s)</p>
                </div>
              </div>

              {ativo.concentracoes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {ativo.concentracoes.map((c) => (
                    <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {Number(c.valor)}{c.unidade} ({c.forma_farmaceutica.toLowerCase()})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
