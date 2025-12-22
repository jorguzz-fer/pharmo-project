import { Pill, Users, TrendingUp, Clock } from 'lucide-react';

export function Dashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Bem-vindo de volta, Dr. Fernando.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Prescrições Hoje', value: '12', icon: Pill, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Tutores Ativos', value: '450', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Receita Gerada', value: 'R$ 2.4k', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Aguard. Aprovação', value: '5', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
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
                    <button className="text-sm text-green-600 hover:text-green-700 font-medium">Ver todas</button>
                </div>
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Tutor</th>
                            <th className="px-6 py-4">Animal</th>
                            <th className="px-6 py-4">Medicamento</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Data</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">Ana Silva</td>
                                <td className="px-6 py-4">Thor (Golden)</td>
                                <td className="px-6 py-4">Apoquel 5.4mg</td>
                                <td className="px-6 py-4">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Enviado</span>
                                </td>
                                <td className="px-6 py-4">22 Dez, 14:30</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
