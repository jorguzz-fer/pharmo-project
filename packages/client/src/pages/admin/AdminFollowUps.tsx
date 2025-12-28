import { useEffect, useState } from 'react';
import { Phone, Check, Clock, User, FileText, Building2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';

type PaymentFollowUp = {
    id: string;
    data_contato: string;
    pedido: {
        orcamento: {
            prescricao: {
                medicamento: string;
                tutor: {
                    nome: string;
                    telefone: string | null;
                };
                animal: {
                    nome: string;
                };
            };
        };
    };
};

type PendingApproval = {
    id: string;
    type: 'PENDING_APPROVAL';
    clinic_name: string;
    razao_social: string;
    email: string;
    telefone: string;
    cnpj: string;
    responsavel_legal: string;
    created_at: string;
    priority: string;
};

type FollowUpData = {
    paymentFollowUps: PaymentFollowUp[];
    pendingApprovals: PendingApproval[];
    summary: {
        totalPaymentFollowUps: number;
        totalPendingApprovals: number;
        totalTasks: number;
    };
};

export function AdminFollowUps() {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [data, setData] = useState<FollowUpData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'payments' | 'approvals'>('all');

    const fetchFollowUps = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://api.pharmopet.com.br';
            const response = await fetch(`${API_URL}/admin/follow-ups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const followUpData = await response.json();
                setData(followUpData);
            }
        } catch (error) {
            console.error('Failed to fetch follow ups', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkDone = async (id: string) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://api.pharmopet.com.br';
            const response = await fetch(`${API_URL}/admin/follow-ups/${id}/done`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok && data) {
                setData({
                    ...data,
                    paymentFollowUps: data.paymentFollowUps.filter(fu => fu.id !== id)
                });
            }
        } catch (error) {
            console.error('Failed to update follow up', error);
        }
    };

    const handleApproveClinic = (clinicId: string) => {
        navigate(`/admin/clinicas/${clinicId}`);
    };

    useEffect(() => {
        fetchFollowUps();
    }, [token]);

    if (isLoading) return <div className="p-8">Carregando tarefas...</div>;
    if (!data) return <div className="p-8">Erro ao carregar dados</div>;

    const totalTasks = data.summary.totalTasks;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Follow-ups Pendentes</h1>
                <p className="text-gray-500">
                    {totalTasks} {totalTasks === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Todas ({totalTasks})
                    </button>
                    <button
                        onClick={() => setActiveTab('approvals')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'approvals'
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Aprovações Pendentes ({data.summary.totalPendingApprovals})
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'payments'
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Pagamentos Pendentes ({data.summary.totalPaymentFollowUps})
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pending Approvals */}
                {(activeTab === 'all' || activeTab === 'approvals') &&
                    data.pendingApprovals.map((approval) => (
                        <div
                            key={approval.id}
                            className="bg-white p-6 rounded-xl border-2 border-orange-200 shadow-sm flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-1 rounded-full w-fit">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-bold">APROVAÇÃO PENDENTE</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building2 className="w-5 h-5 text-orange-600" />
                                        <h3 className="font-bold text-gray-900">{approval.clinic_name}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 ml-7">{approval.razao_social}</p>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                                    <div className="text-sm">
                                        <span className="font-medium text-gray-700">CNPJ:</span>
                                        <span className="text-gray-600 ml-2">{approval.cnpj}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium text-gray-700">Email:</span>
                                        <span className="text-gray-600 ml-2">{approval.email}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium text-gray-700">Responsável:</span>
                                        <span className="text-gray-600 ml-2">{approval.responsavel_legal}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Cadastrado em: {new Date(approval.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => handleApproveClinic(approval.id)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-medium"
                                >
                                    <Building2 className="w-4 h-4" />
                                    Revisar e Aprovar
                                </button>
                            </div>
                        </div>
                    ))}

                {/* Payment Follow-ups */}
                {(activeTab === 'all' || activeTab === 'payments') &&
                    data.paymentFollowUps.map((item) => {
                        const prescricao = item.pedido.orcamento.prescricao;
                        return (
                            <div
                                key={item.id}
                                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-1 rounded-full w-fit">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs font-bold">
                                                {new Date(item.data_contato).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <h3 className="font-bold text-gray-900">{prescricao.tutor.nome}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-6">Pet: {prescricao.animal.nome}</p>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">Interesse:</span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{prescricao.medicamento}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between gap-4">
                                    <a
                                        href={`tel:${prescricao.tutor.telefone}`}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                        Ligar
                                    </a>
                                    <button
                                        onClick={() => handleMarkDone(item.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                    >
                                        <Check className="w-4 h-4" />
                                        Concluir
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                {/* Empty State */}
                {totalTasks === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Tudo em dia!</h3>
                        <p className="text-gray-500">Não há follow-ups pendentes no momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
