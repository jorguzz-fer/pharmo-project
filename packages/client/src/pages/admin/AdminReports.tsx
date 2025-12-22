import { useEffect, useState } from 'react';
import { BarChart, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

type SalesReport = {
    period: 'day' | 'month';
    totalSales: number;
    byVet: Record<string, number>;
};

export function AdminReports() {
    const { token } = useAuthStore();
    const [period, setPeriod] = useState<'day' | 'month'>('day');
    const [report, setReport] = useState<SalesReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:3000/admin/relatorios/vendas?period=${period}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setReport(data);
                }
            } catch (error) {
                console.error('Failed to fetch report', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [token, period]);

    const totalRevenue = report ? Object.values(report.byVet).reduce((a, b) => a + b, 0) : 0;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Relatório de Vendas</h1>
                    <p className="text-gray-500">Desempenho de vendas por período e veterinário.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setPeriod('day')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === 'day'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Últimas 24h
                    </button>
                    <button
                        onClick={() => setPeriod('month')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === 'month'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Último Mês
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="p-12 text-center text-gray-500">Carregando dados...</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Receita Total</p>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <BarChart className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total de Vendas</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{report?.totalSales || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed List */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900">Vendas por Veterinário</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {report?.byVet && Object.entries(report.byVet).map(([name, value]) => (
                                <div key={name} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                                            {name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-900">{name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">
                                        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                            {(!report?.byVet || Object.keys(report.byVet).length === 0) && (
                                <div className="p-8 text-center text-gray-500">
                                    Nenhuma venda registrada neste período.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
