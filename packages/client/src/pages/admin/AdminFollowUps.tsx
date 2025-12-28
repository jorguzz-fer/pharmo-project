import { useEffect, useState } from 'react';
import { Phone, Check, Clock, User, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

type FollowUp = {
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

export function AdminFollowUps() {
    const { token } = useAuthStore();
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFollowUps = async () => {
        try {
            const response = await fetch('http://localhost:3000/admin/follow-ups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFollowUps(data);
            }
        } catch (error) {
            console.error('Failed to fetch follow ups', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkDone = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:3000/admin/follow-ups/${id}/done`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                // Remove from list locally
                setFollowUps(current => current.filter(fu => fu.id !== id));
            }
        } catch (error) {
            console.error('Failed to update follow up', error);
        }
    };

    useEffect(() => {
        fetchFollowUps();
    }, [token]);

    if (isLoading) return <div className="p-8">Carregando tarefas...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Follow-ups Pendentes</h1>
                <p className="text-gray-500">Contatos ativos para conversão de orçamentos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followUps.map((item) => {
                    const prescricao = item.pedido.orcamento.prescricao;
                    return (
                        <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 text-primary-700 bg-primary-50 px-3 py-1 rounded-full w-fit">
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

                {followUps.length === 0 && (
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
