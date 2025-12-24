import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../services/api';

type DashboardMetrics = {
    revenue: {
        total: number;
        count: number;
    };
    production_pipeline: {
        DRAFT?: number;
        SIGNED?: number;
        SENT?: number;
    };
    top_performers: Array<{
        veterinario_id: string;
        nome: string;
        crv: string;
        prescricoes_count: number;
    }>;
};

type FollowUp = {
    id: string;
    data_contato: string;
    observacoes: string;
    pedido: {
        orcamento: {
            prescricao: {
                tutor: { nome: string };
                animal: { nome: string };
            };
        };
    };
};

export function AdminDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsData, followUpsData] = await Promise.all([
                    api.get('/admin/dashboard'),
                    api.get('/admin/follow-ups')
                ]);
                setMetrics(metricsData);
                setFollowUps(followUpsData);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

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
                        <p className="text-sm text-gray-500 font-medium">Faturamento (Mês)</p>
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
                        <p className="text-sm text-gray-500 font-medium">Prescrições (Mês)</p>
                        <h3 className="text-2xl font-bold text-gray-900">{metrics?.revenue.count || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Enviadas</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {metrics?.production_pipeline?.SENT || 0}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Production Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Status das Prescrições</h2>
                    <div className="space-y-4">
                        {Object.entries(metrics?.production_pipeline || {}).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">{status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                                <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">{count}</span>
                            </div>
                        ))}
                        {Object.keys(metrics?.production_pipeline || {}).length === 0 && (
                            <p className="text-gray-500 text-center py-4">Nenhuma prescrição ativa.</p>
                        )}
                    </div>
                </div>

                {/* Top Vets Placeholder */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Top Veterinários</h2>
                    <div className="space-y-4">
                        {metrics?.top_performers.map((vet, index) => (
                            <div key={vet.veterinario_id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{vet.nome}</p>
                                        <p className="text-xs text-gray-500">CRV: {vet.crv} • {vet.prescricoes_count} prescrições</p>
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

            {/* Follow-ups Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Follow-ups Pendentes</h2>
                <div className="space-y-3">
                    {followUps.map((followUp) => (
                        <div key={followUp.id} className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition-colors">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                    {followUp.pedido.orcamento.prescricao.tutor.nome} - {followUp.pedido.orcamento.prescricao.animal.nome}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{followUp.observacoes}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Contato: {new Date(followUp.data_contato).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Concluir
                            </button>
                        </div>
                    ))}
                    {followUps.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Nenhum follow-up pendente.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
