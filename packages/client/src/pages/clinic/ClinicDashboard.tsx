import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Users, TrendingUp, Clock, Loader2, LogOut } from 'lucide-react';
import { useClinicAuthStore } from '../../store/clinicAuth';

interface DashboardData {
    metrics: {
        prescricoesHoje: number;
        veterinariosAtivos: number;
        receitaEstimada30d: number;
        aguardandoPagamento: number;
    };
    prescricoes: any[];
}

export function ClinicDashboard() {
    const { user, logout } = useClinicAuthStore();
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const authStorage = localStorage.getItem('clinic-auth-storage');
            let token = null;

            if (authStorage) {
                const parsed = JSON.parse(authStorage);
                token = parsed.state?.token;
            }

            if (!token) {
                navigate('/clinica/login');
                return;
            }

            const API_URL = import.meta.env.VITE_API_URL || 'https://api.pharmopet.com.br';
            const response = await fetch(`${API_URL}/api/clinicas/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    navigate('/clinica/login');
                    return;
                }
                throw new Error('Erro ao carregar dashboard');
            }

            const dashboardData = await response.json();
            setData(dashboardData);
        } catch (error: any) {
            console.error('Error fetching dashboard:', error);
            setError(error.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/clinica/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Carregando dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao Carregar</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-500">Bem-vindo, {user?.name}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Sair
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            label: 'Prescrições Hoje',
                            value: data?.metrics.prescricoesHoje.toString() || '0',
                            icon: Pill,
                            color: 'text-blue-600',
                            bg: 'bg-blue-50'
                        },
                        {
                            label: 'Veterinários Ativos',
                            value: data?.metrics.veterinariosAtivos.toString() || '0',
                            icon: Users,
                            color: 'text-green-600',
                            bg: 'bg-green-50'
                        },
                        {
                            label: 'Receita (30d)',
                            value: `R$ ${data?.metrics.receitaEstimada30d.toFixed(2) || '0,00'}`,
                            icon: TrendingUp,
                            color: 'text-purple-600',
                            bg: 'bg-purple-50'
                        },
                        {
                            label: 'Aguard. Pagamento',
                            value: data?.metrics.aguardandoPagamento.toString() || '0',
                            icon: Clock,
                            color: 'text-orange-600',
                            bg: 'bg-orange-50'
                        },
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
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900">Últimas Prescrições</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">Veterinário</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Animal</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Medicamento</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {!data?.prescricoes || data.prescricoes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500">
                                            Nenhuma prescrição encontrada
                                        </td>
                                    </tr>
                                ) : (
                                    data.prescricoes.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                {p.veterinario?.nome || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {p.animal?.nome || '-'} ({p.animal?.especie || 'Pet'})
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.medicamento}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.orcamento?.status_pagamento === 'PAID'
                                                        ? 'bg-green-100 text-green-700'
                                                        : p.status === 'SENT'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {p.orcamento?.status_pagamento === 'PAID'
                                                        ? 'Pago'
                                                        : p.status === 'SENT'
                                                            ? 'Enviado'
                                                            : 'Rascunho'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(p.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
