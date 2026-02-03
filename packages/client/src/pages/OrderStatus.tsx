import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Package, Truck, AlertCircle, Copy } from 'lucide-react';
import { useAuthStore } from '../store/auth';

type OrderStatus = {
    orcamento: {
        id: string;
        valor_total: number;
        status_pagamento: string;
        link_pagamento: string | null;
        data_pagamento: string | null;
        prescricao: {
            medicamento: string;
            dosagem: string;
            quantidade: string;
            tutor: {
                nome: string;
            };
            animal: {
                nome: string;
            };
        };
    };
    pedido: {
        id: string;
        status_producao: string;
        data_producao: string | null;
        data_entrega: string | null;
        observacoes: string | null;
    } | null;
};

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: 'Aguardando Pagamento', color: 'yellow', icon: Clock },
    PAID: { label: 'Pago', color: 'green', icon: CheckCircle },
    AGUARDANDO_PAGAMENTO: { label: 'Aguardando Pagamento', color: 'yellow', icon: Clock },
    PAGAMENTO_CONFIRMADO: { label: 'Pagamento Confirmado', color: 'green', icon: CheckCircle },
    EM_PRODUCAO: { label: 'Em Produção', color: 'blue', icon: Package },
    PRONTO_ENTREGA: { label: 'Pronto para Entrega', color: 'purple', icon: Truck },
    ENTREGUE: { label: 'Entregue', color: 'green', icon: CheckCircle },
};

export function OrderStatus() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [orderData, setOrderData] = useState<OrderStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchOrderStatus = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/prescricoes/${id}/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setOrderData(data);
                }
            } catch (error) {
                console.error('Failed to fetch order status', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderStatus();
        // Poll every 10 seconds for status updates
        const interval = setInterval(fetchOrderStatus, 10000);
        return () => clearInterval(interval);
    }, [id, token]);

    const copyPaymentLink = () => {
        if (orderData?.orcamento.link_pagamento) {
            navigator.clipboard.writeText(orderData.orcamento.link_pagamento);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) return <div className="p-8">Carregando status do pedido...</div>;
    if (!orderData) return <div className="p-8">Pedido não encontrado.</div>;

    const paymentStatus = statusMap[orderData.orcamento.status_pagamento] || statusMap.PENDING;
    const productionStatus = orderData.pedido
        ? statusMap[orderData.pedido.status_producao]
        : null;

    const PaymentIcon = paymentStatus.icon;
    const ProductionIcon = productionStatus?.icon;

    return (
        <div className="space-y-8">
            <div>
                <button
                    onClick={() => navigate('/veterinario/dashboard')}
                    className="text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    ← Voltar ao Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Status do Pedido</h1>
                <p className="text-gray-500">Acompanhe o andamento da sua prescrição</p>
            </div>

            {/* Prescription Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Detalhes da Prescrição</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Medicamento</p>
                        <p className="font-medium text-gray-900">{orderData.orcamento.prescricao.medicamento}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Dosagem</p>
                        <p className="font-medium text-gray-900">{orderData.orcamento.prescricao.dosagem}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tutor</p>
                        <p className="font-medium text-gray-900">{orderData.orcamento.prescricao.tutor.nome}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Animal</p>
                        <p className="font-medium text-gray-900">{orderData.orcamento.prescricao.animal.nome}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Valor Total</p>
                        <p className="font-bold text-gray-900 text-lg">
                            R$ {Number(orderData.orcamento.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 bg-${paymentStatus.color}-50 rounded-lg`}>
                        <PaymentIcon className={`w-6 h-6 text-${paymentStatus.color}-600`} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Pagamento</h2>
                        <p className={`text-sm font-medium text-${paymentStatus.color}-600`}>
                            {paymentStatus.label}
                        </p>
                    </div>
                </div>

                {orderData.orcamento.status_pagamento === 'PENDING' && orderData.orcamento.link_pagamento && (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-yellow-900">Pagamento Pendente</p>
                                    <p className="text-sm text-yellow-700">
                                        Clique no link abaixo para realizar o pagamento via PIX
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={copyPaymentLink}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                            >
                                <Copy className="w-5 h-5" />
                                {copied ? 'Link Copiado!' : 'Copiar Link de Pagamento'}
                            </button>
                        </div>
                    </div>
                )}

                {orderData.orcamento.status_pagamento === 'PAID' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-green-900">Pagamento Confirmado</p>
                                <p className="text-sm text-green-700">
                                    Pago em {new Date(orderData.orcamento.data_pagamento!).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Production Status */}
            {orderData.pedido && productionStatus && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 bg-${productionStatus.color}-50 rounded-lg`}>
                            <ProductionIcon className={`w-6 h-6 text-${productionStatus.color}-600`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Produção</h2>
                            <p className={`text-sm font-medium text-${productionStatus.color}-600`}>
                                {productionStatus.label}
                            </p>
                        </div>
                    </div>

                    {orderData.pedido.observacoes && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">{orderData.pedido.observacoes}</p>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Pagamento Confirmado</p>
                                <p className="text-sm text-gray-500">
                                    {orderData.orcamento.data_pagamento
                                        ? new Date(orderData.orcamento.data_pagamento).toLocaleString('pt-BR')
                                        : '-'}
                                </p>
                            </div>
                        </div>

                        {orderData.pedido.data_producao && (
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Em Produção</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(orderData.pedido.data_producao).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {orderData.pedido.data_entrega && (
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <Truck className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Entregue</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(orderData.pedido.data_entrega).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
