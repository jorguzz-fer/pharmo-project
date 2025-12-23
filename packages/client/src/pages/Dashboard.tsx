import { useState, useEffect } from 'react';
import { Pill, Users, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';

export function Dashboard() {
    const { user } = useAuthStore();
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/prescricoes')
            .then(data => {
                setPrescriptions(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Calculate metrics
    const prescriptionsToday = prescriptions.filter(p => new Date(p.created_at).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)).length;
    // mock some for now as we don't have separate endpoints
    const tutorsCount = new Set(prescriptions.map(p => p.tutor_id)).size;
    const pendingCount = prescriptions.filter(p => p.orcamento?.status_pagamento === 'PENDING').length;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Bem-vindo de volta, {user?.name}.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Prescrições Hoje', value: prescriptionsToday.toString(), icon: Pill, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Tutores Atendidos', value: tutorsCount.toString(), icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Receita Est. (30d)', value: 'R$ --', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Aguard. Pagamento', value: pendingCount.toString(), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Prescriptions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Últimas Prescrições</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Tutor</th>
                                <th className="px-6 py-4 whitespace-nowrap">Animal</th>
                                <th className="px-6 py-4 whitespace-nowrap">Medicamento</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-6">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                                        </div>
                                    </td>
                                </tr>
                            ) : prescriptions.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-6">Nenhuma prescrição encontrada.</td></tr>
                            ) : prescriptions.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.tutor?.name || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{p.animal?.name || '-'} ({p.animal?.species || 'Pet'})</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{p.medicamento}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.orcamento?.status_pagamento === 'PAID' ? 'bg-green-100 text-green-700' :
                                                p.status === 'SENT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {p.orcamento?.status_pagamento === 'PAID' ? 'Pago' :
                                                p.status === 'SENT' ? 'Enviado' : 'Rascunho'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
