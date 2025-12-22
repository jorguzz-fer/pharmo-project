import { useEffect, useState } from 'react';
import { TrendingUp, Users, ShoppingBag, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

type DashboardMetrics = {
    revenue: {
        total: number;
        count: number;
    };
    production_pipeline: {
        AGUARDANDO_PAGAMENTO?: number;
        PAGAMENTO_CONFIRMADO?: number;
        EM_PRODUCAO?: number;
        PRONTO_ENTREGA?: number;
        ENTREGUE?: number;
    };
    top_performers: Array<{
        veterinario_id: string;
        _count: { id: number };
    }>;
};

export function AdminDashboard() {
    const { token } = useAuthStore();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('http://localhost:3000/admin/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMetrics(data);
                }
            } catch (error) {
                console.error('Failed to fetch metrics', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, [token]);

    if (isLoading) return <div className="p-8">Carregando métricas...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-gray-500">Visão geral da operação PharmoPet</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Receita Total</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            R$ {metrics?.revenue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Vendas Confirmadas</p>
                        <h3 className="text-2xl font-bold text-gray-900">{metrics?.revenue.count || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Em Produção</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {(metrics?.production_pipeline?.EM_PRODUCAO || 0) + (metrics?.production_pipeline?.PAGAMENTO_CONFIRMADO || 0)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Production Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Status dos Pedidos</h2>
                    <div className="space-y-4">
                        {Object.entries(metrics?.production_pipeline || {}).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">{status.replace('_', ' ')}</span>
                                <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">{count}</span>
                            </div>
                        ))}
                        {Object.keys(metrics?.production_pipeline || {}).length === 0 && (
                            <p className="text-gray-500 text-center py-4">Nenhum pedido ativo.</p>
                        )}
                    </div>
                </div>

                {/* Top Vets Placeholder */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Top Veterinários</h2>
                    <div className="space-y-4">
                        {metrics?.top_performers.map((vet) => (
                            <div key={vet.veterinario_id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                                        V
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Vet ID: {vet.veterinario_id.substring(0, 8)}...</p>
                                        <p className="text-xs text-gray-500">{vet._count.id} prescrições</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {metrics?.top_performers.length === 0 && (
                            <p className="text-gray-500 text-center py-4">Nenhum dado disponível.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
