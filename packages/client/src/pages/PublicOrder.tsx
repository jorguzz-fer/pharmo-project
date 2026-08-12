import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, Package, Truck, Download, Loader2, AlertCircle, PawPrint } from 'lucide-react';

function getBaseUrl() {
    let url = import.meta.env.VITE_API_URL || 'https://phamopet-backend-api.en9jpc.easypanel.host';
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (!url.endsWith('/api')) url = `${url}/api`;
    return url;
}

type Orcamento = {
    token: string;
    valor_total: number;
    status_pagamento: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
    data_pagamento: string | null;
    link_pagamento: string | null;
    status_pedido: string | null;
    tutor: { nome: string; cpf: string };
    animal: { nome: string; especie: string; peso: number | null };
    veterinario: { nome: string; crv: string };
    clinica: { nome: string; telefone: string | null } | null;
    doenca: string | null;
    medicamentos: Array<{
        medicamento: string;
        forma_farmaceutica: string;
        quantidade: string;
        observacoes: string | null;
        preco: number;
    }>;
    emitida_em: string;
};

const etapasPedido: Record<string, { rotulo: string; icone: typeof Package }> = {
    AGUARDANDO_PAGAMENTO: { rotulo: 'Aguardando pagamento', icone: Clock },
    PAGAMENTO_CONFIRMADO: { rotulo: 'Pagamento confirmado', icone: CheckCircle },
    EM_PRODUCAO: { rotulo: 'Em manipulação', icone: Package },
    PRONTO_ENTREGA: { rotulo: 'Pronto para entrega', icone: Truck },
    ENTREGUE: { rotulo: 'Entregue', icone: CheckCircle },
};

const formatarMoeda = (v: number) =>
    `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

export function PublicOrder() {
    const { token } = useParams<{ token: string }>();
    const [dados, setDados] = useState<Orcamento | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [pagando, setPagando] = useState(false);
    const [erroPagamento, setErroPagamento] = useState<string | null>(null);

    const carregar = useCallback(async () => {
        try {
            const resp = await fetch(`${getBaseUrl()}/publico/orcamentos/${token}`);
            if (resp.status === 404) {
                setErro('Não encontramos esta receita. Confira o link que você recebeu.');
                return;
            }
            if (!resp.ok) throw new Error();
            setDados(await resp.json());
            setErro(null);
        } catch {
            setErro('Não foi possível carregar a receita agora. Tente novamente em instantes.');
        } finally {
            setCarregando(false);
        }
    }, [token]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    // Enquanto o pagamento não cai, reconsulta: o tutor volta do checkout para cá
    useEffect(() => {
        if (dados?.status_pagamento === 'PAID') return;
        const intervalo = setInterval(carregar, 15000);
        return () => clearInterval(intervalo);
    }, [dados?.status_pagamento, carregar]);

    const pagar = async () => {
        setPagando(true);
        setErroPagamento(null);
        try {
            const resp = await fetch(`${getBaseUrl()}/publico/orcamentos/${token}/pagar`, {
                method: 'POST',
            });
            const corpo = await resp.json();

            if (!resp.ok) {
                setErroPagamento(
                    corpo.error || 'Não foi possível abrir o pagamento. Fale com a farmácia.'
                );
                return;
            }
            window.location.href = corpo.link;
        } catch {
            setErroPagamento('Não foi possível abrir o pagamento. Verifique sua conexão.');
        } finally {
            setPagando(false);
        }
    };

    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
        );
    }

    if (erro || !dados) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Receita indisponível</h1>
                    <p className="text-gray-600">{erro}</p>
                </div>
            </div>
        );
    }

    const pago = dados.status_pagamento === 'PAID';
    const etapa = dados.status_pedido ? etapasPedido[dados.status_pedido] : null;
    const EtapaIcone = etapa?.icone;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-lg mx-auto space-y-5">

                {/* Cabeçalho */}
                <header className="text-center">
                    <div className="inline-flex items-center gap-2 text-green-700 font-bold text-lg">
                        <PawPrint className="w-5 h-5" />
                        PharmoPet
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mt-3">
                        Receita de {dados.animal.nome}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Prescrita por {dados.veterinario.nome} · CRMV {dados.veterinario.crv}
                    </p>
                </header>

                {/* Situação */}
                {pago ? (
                    <div className="bg-white rounded-xl border border-green-200 p-5">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-gray-900">Pagamento confirmado</p>
                                <p className="text-sm text-gray-600">
                                    {dados.data_pagamento &&
                                        `Pago em ${new Date(dados.data_pagamento).toLocaleDateString('pt-BR')}`}
                                </p>
                            </div>
                        </div>
                        {etapa && EtapaIcone && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                                <EtapaIcone className="w-5 h-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">{etapa.rotulo}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-baseline justify-between mb-4">
                            <span className="text-gray-600">Total</span>
                            <span className="text-3xl font-bold text-gray-900">
                                {formatarMoeda(dados.valor_total)}
                            </span>
                        </div>
                        <button
                            onClick={pagar}
                            disabled={pagando}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                        >
                            {pagando ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Abrindo pagamento...</>
                            ) : (
                                'Pagar agora'
                            )}
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-3">
                            PIX, cartão ou boleto. Você não precisa criar conta.
                        </p>
                        {erroPagamento && (
                            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-amber-800">{erroPagamento}</p>
                                {dados.clinica?.telefone && (
                                    <p className="text-sm text-amber-700 mt-1">
                                        Fale com {dados.clinica.nome}: {dados.clinica.telefone}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Itens */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">O que foi prescrito</h2>
                        {dados.doenca && (
                            <p className="text-sm text-gray-500">Para: {dados.doenca}</p>
                        )}
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {dados.medicamentos.map((m, i) => (
                            <li key={i} className="px-5 py-4">
                                <div className="flex justify-between gap-3">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{m.medicamento}</p>
                                        <p className="text-sm text-gray-500">
                                            {m.forma_farmaceutica} · {m.quantidade}
                                        </p>
                                        {m.observacoes && (
                                            <p className="text-sm text-gray-600 mt-1">{m.observacoes}</p>
                                        )}
                                    </div>
                                    {m.preco > 0 && (
                                        <span className="text-gray-900 font-medium whitespace-nowrap">
                                            {formatarMoeda(m.preco)}
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Paciente */}
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                    <h2 className="font-semibold text-gray-900 mb-3">Paciente</h2>
                    <dl className="grid grid-cols-2 gap-y-2 text-sm">
                        <dt className="text-gray-500">Animal</dt>
                        <dd className="text-gray-900 text-right">{dados.animal.nome}</dd>
                        <dt className="text-gray-500">Espécie</dt>
                        <dd className="text-gray-900 text-right">{dados.animal.especie}</dd>
                        {dados.animal.peso && (
                            <>
                                <dt className="text-gray-500">Peso</dt>
                                <dd className="text-gray-900 text-right">{dados.animal.peso} kg</dd>
                            </>
                        )}
                        <dt className="text-gray-500">Tutor</dt>
                        <dd className="text-gray-900 text-right">{dados.tutor.nome}</dd>
                    </dl>
                </div>

                <a
                    href={`${getBaseUrl()}/publico/orcamentos/${token}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Baixar a receita em PDF
                </a>

                <p className="text-center text-xs text-gray-400 pb-4">
                    Emitida em {new Date(dados.emitida_em).toLocaleDateString('pt-BR')}
                    {dados.clinica && ` · ${dados.clinica.nome}`}
                </p>
            </div>
        </div>
    );
}
