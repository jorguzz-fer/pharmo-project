import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';

type FinancialReport = {
    periodo: string;
    total_prescricoes: number;
    total_faturamento: number;
    por_veterinario: Array<{
        veterinario_id: string;
        nome: string;
        crv: string;
        email: string;
        prescricoes_count: number;
        valor_total: number;
        prescricoes: Array<{
            id: string;
            data: string;
            tutor: string;
            animal: string;
            medicamento: string;
            valor: number;
            status: string;
        }>;
    }>;
};

export function FinancialReport() {
    const [report, setReport] = useState<FinancialReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [expandedVet, setExpandedVet] = useState<string | null>(null);

    useEffect(() => {
        fetchReport();
    }, [selectedMonth]);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const data = await api.get(`/admin/relatorios/financeiro?mes=${selectedMonth}`);
            setReport(data);
        } catch (error) {
            console.error('Failed to fetch financial report', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8">Carregando relatório...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Relatório Financeiro</h1>
                    <p className="text-gray-500">Faturamento mensal por veterinário</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Download className="w-4 h-4" />
                    Exportar PDF
                </button>
            </div>

            {/* Month Selector */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
                <Calendar className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Período:</label>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Total de Prescrições</p>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{report?.total_prescricoes || 0}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Faturamento Total</p>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">
                        R$ {report?.total_faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Veterinários Ativos</p>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{report?.por_veterinario.length || 0}</h3>
                </div>
            </div>

            {/* Veterinarians Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Faturamento por Veterinário</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veterinário</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CRV</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prescrições</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {report?.por_veterinario.map((vet) => (
                                <>
                                    <tr key={vet.veterinario_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{vet.nome}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vet.crv}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vet.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                            {vet.prescricoes_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                                            R$ {vet.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => setExpandedVet(expandedVet === vet.veterinario_id ? null : vet.veterinario_id)}
                                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                                            >
                                                {expandedVet === vet.veterinario_id ? 'Ocultar' : 'Ver Detalhes'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedVet === vet.veterinario_id && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-gray-900 mb-3">Prescrições Detalhadas</h4>
                                                    <div className="space-y-2">
                                                        {vet.prescricoes.map((p) => (
                                                            <div key={p.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {p.tutor} - {p.animal}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {p.medicamento} • {new Date(p.data).toLocaleDateString('pt-BR')}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{p.status}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                    {report?.por_veterinario.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            Nenhum dado disponível para o período selecionado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
