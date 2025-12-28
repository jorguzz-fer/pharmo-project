import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileText } from 'lucide-react';
import { useClinicAuthStore } from '../../store/clinicAuth';

interface Prescricao {
    id: string;
    medicamento: string;
    created_at: string;
    status: string;
    veterinario: {
        nome: string;
        crv: string;
        email: string;
    };
    animal: {
        nome: string;
        especie: string;
        tutor: {
            nome: string;
            telefone: string;
        };
    };
    orcamento?: {
        status_pagamento: string;
        valor_total: number;
    };
}

export function ClinicPrescriptions() {
    const { logout } = useClinicAuthStore();
    const navigate = useNavigate();
    const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPrescricoes();
    }, []);

    const fetchPrescricoes = async () => {
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
            const response = await fetch(`${API_URL}/api/clinicas/prescricoes`, {
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
                throw new Error('Erro ao carregar prescrições');
            }

            const data = await response.json();
            setPrescricoes(data.prescricoes);
        } catch (error: any) {
            console.error('Error fetching prescricoes:', error);
            setError(error.message || 'Erro ao carregar prescrições');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Carregando prescrições...
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
                        onClick={fetchPrescricoes}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Prescrições</h1>
                <p className="text-gray-500">Todas as prescrições dos veterinários vinculados</p>
            </div>

            {/* Prescriptions Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Veterinário</th>
                                <th className="px-6 py-4 whitespace-nowrap">Animal</th>
                                <th className="px-6 py-4 whitespace-nowrap">Tutor</th>
                                <th className="px-6 py-4 whitespace-nowrap">Medicamento</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {prescricoes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">Nenhuma prescrição encontrada</p>
                                    </td>
                                </tr>
                            ) : (
                                prescricoes.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{p.veterinario.nome}</p>
                                                <p className="text-xs text-gray-500">{p.veterinario.crv}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{p.animal.nome}</p>
                                                <p className="text-xs text-gray-500">{p.animal.especie}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-gray-900">{p.animal.tutor.nome}</p>
                                                <p className="text-xs text-gray-500">{p.animal.tutor.telefone}</p>
                                            </div>
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
    );
}
