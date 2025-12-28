import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users as UsersIcon, FileText } from 'lucide-react';
import { useClinicAuthStore } from '../../store/clinicAuth';

interface Veterinario {
    id: string;
    nome: string;
    crv: string;
    email: string;
    telefone: string;
    totalPrescricoes: number;
    vinculadoEm: string;
}

export function ClinicVeterinarians() {
    const { logout } = useClinicAuthStore();
    const navigate = useNavigate();
    const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVeterinarios();
    }, []);

    const fetchVeterinarios = async () => {
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
            const response = await fetch(`${API_URL}/api/clinicas/veterinarios`, {
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
                throw new Error('Erro ao carregar veterinários');
            }

            const data = await response.json();
            setVeterinarios(data.veterinarios);
        } catch (error: any) {
            console.error('Error fetching veterinarios:', error);
            setError(error.message || 'Erro ao carregar veterinários');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Carregando veterinários...
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
                        onClick={fetchVeterinarios}
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
                <h1 className="text-2xl font-bold text-gray-900">Veterinários</h1>
                <p className="text-gray-500">Veterinários vinculados à sua clínica</p>
            </div>

            {/* Veterinarians Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {veterinarios.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                        <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhum veterinário vinculado</p>
                    </div>
                ) : (
                    veterinarios.map((vet) => (
                        <div key={vet.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <UsersIcon className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">{vet.nome}</h3>
                                    <p className="text-sm text-gray-500">CRV: {vet.crv}</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="truncate">{vet.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{vet.telefone}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                    <span className="text-gray-600">
                                        <span className="font-semibold text-gray-900">{vet.totalPrescricoes}</span> prescrições
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400">
                                    Desde {new Date(vet.vinculadoEm).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
