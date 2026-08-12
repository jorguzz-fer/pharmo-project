import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Plus, Trash2, Sparkles, Search, DollarSign, MessageCircle, Send, X, Loader2, Bot, FlaskConical } from 'lucide-react';
import { usePrescriptionStore, type CienciaPendente } from '../../../store/prescription';
import { produtoService } from '../../../services/produto.service';
import type { Produto } from '../../../services/produto.service';
import { formaFarmaceuticaService, insumoService, type FormaFarmaceutica } from '../../../services/insumo.service';
import { api } from '../../../services/api';
import { MagistralBuilder } from '../components/MagistralBuilder';
import { CienciaModal } from '../../../components/CienciaModal';
import { validacaoClinicaService, type ValidacaoResultado } from '../../../services/validacaoClinica.service';
import { principioAtivoService } from '../../../services/principioAtivo.service';

type MedForm = {
    codigo?: string;
    principio_ativo_id: string;
    drug: string;
    dosagem_mg_kg: string;
    frequencia_horas: string;
    duracao_dias: string;
    form: string;
    amount: string;
    observations: string;
    preco_sugestao?: number;
    preco_tabela?: number;
};

type AiMessage = {
    role: 'user' | 'assistant';
    content: string;
    medicamentos?: Array<{
        codigo: string;
        nome: string;
        linha_terapeutica: string;
        forma_farmaceutica: string;
        indicacao: string;
        modo_uso: string;
    }>;
};

export function StepMedication() {
    const { medications, addMedication, removeMedication, setStep, animal, doenca, setDoenca } = usePrescriptionStore();
    const { register, handleSubmit, reset, setValue } = useForm<MedForm>();
    const [showForm, setShowForm] = useState(medications.length === 0);

    // Validação clínica de dose por peso
    const [validacao, setValidacao] = useState<ValidacaoResultado | null>(null);
    const [pendente, setPendente] = useState<{ dados: MedForm; principio_ativo_id: string } | null>(null);
    const [validando, setValidando] = useState(false);

    // Catalog search state
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
    const [catalogResults, setCatalogResults] = useState<Produto[]>([]);
    const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
    const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
    const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
    // Ref para código alvo da IA (não causa re-render, evita loop no useEffect)
    const targetCodigoRef = useRef<string | null>(null);
    // Mensagem quando produto da IA não existe no catálogo
    const [aiProductNotFound, setAiProductNotFound] = useState<string | null>(null);

    // Formas Farmacêuticas do banco
    const [formasFarma, setFormasFarma] = useState<FormaFarmaceutica[]>([]);

    // Controlado info
    const [controladoInfo, setControladoInfo] = useState<{ controlado: boolean; substancias: Array<{ nome: string; lista: string }> } | null>(null);

    // AI Assistant state
    const [showAssistant, setShowAssistant] = useState(false);
    const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Magistral Builder state
    const [showMagistral, setShowMagistral] = useState(false);
    const [vetClinicaId, setVetClinicaId] = useState<string | undefined>(undefined);

    // Carrega clínica do veterinário (pega a primeira se houver múltiplas)
    useEffect(() => {
        api.get('/veterinario/minhas-clinicas')
            .then((resp: any) => {
                const clinicas = resp?.clinicas || resp?.data || resp;
                if (Array.isArray(clinicas) && clinicas.length > 0) {
                    setVetClinicaId(clinicas[0].id);
                }
            })
            .catch(() => {
                // Se falhar, apenas segue sem clínica (preço sem condições)
            });
    }, []);

    // ============================================================
    // CATALOG SEARCH (PharmoPet products)
    // ============================================================
    useEffect(() => {
        if (catalogSearchTerm.length < 2) {
            setCatalogResults([]);
            setShowCatalogDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setIsSearchingCatalog(true);
                const response = await produtoService.buscar(catalogSearchTerm, 1, 15);
                const results = response.data;
                setCatalogResults(results);

                // Se veio do assistente IA com código alvo, tenta match exato
                const target = targetCodigoRef.current;
                if (target) {
                    targetCodigoRef.current = null;
                    const exactMatch = results.find(
                        (p) => p.codigo.trim() === target.trim()
                    );
                    if (exactMatch) {
                        handleSelectProduto(exactMatch);
                        return; // auto-selecionou, não abre dropdown
                    } else {
                        // Produto sugerido pela IA não existe no catálogo
                        setAiProductNotFound(target);
                        setCatalogSearchTerm('');
                        setCatalogResults([]);
                        setShowCatalogDropdown(false);
                        return;
                    }
                }
                setShowCatalogDropdown(true);
            } catch (error) {
                console.error('Erro ao buscar produtos:', error);
                setCatalogResults([]);
            } finally {
                setIsSearchingCatalog(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [catalogSearchTerm]);

    // Carregar formas farmacêuticas do banco
    useEffect(() => {
        formaFarmaceuticaService.listar()
            .then(setFormasFarma)
            .catch(() => setFormasFarma([]));
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiMessages]);

    const handleSelectProduto = async (produto: Produto) => {
        setSelectedProduto(produto);
        setCatalogSearchTerm(produto.nome);
        setValue('codigo', produto.codigo);
        setValue('drug', produto.nome);
        setValue('preco_sugestao', Number(produto.preco_sugestao));
        setValue('preco_tabela', Number(produto.preco_tabela));
        setShowCatalogDropdown(false);

        // Verificar se contém substância controlada
        try {
            const check = await insumoService.verificarControlado(produto.nome);
            setControladoInfo(check);
        } catch {
            setControladoInfo(null);
        }
    };

    // ============================================================
    // AI ASSISTANT
    // ============================================================
    const handleAiSubmit = async () => {
        if (!aiInput.trim() || aiLoading) return;

        const pergunta = aiInput.trim();
        setAiInput('');
        setAiMessages(prev => [...prev, { role: 'user', content: pergunta }]);
        setAiLoading(true);

        try {
            const response = await api.post('/assistente/consultar', { pergunta });
            setAiMessages(prev => [...prev, {
                role: 'assistant',
                content: response.resposta,
                medicamentos: response.medicamentos,
            }]);
        } catch (error: any) {
            setAiMessages(prev => [...prev, {
                role: 'assistant',
                content: error.message || 'Erro ao consultar o assistente. Tente novamente.',
            }]);
        } finally {
            setAiLoading(false);
        }
    };

    const handleAiSearchProduct = async (medName: string, medCodigo?: string) => {
        setShowAssistant(false);
        setShowForm(true);
        setAiProductNotFound(null);

        if (medCodigo) {
            targetCodigoRef.current = medCodigo; // sem re-render
            setCatalogSearchTerm(medCodigo);
        } else {
            targetCodigoRef.current = null;
            setCatalogSearchTerm(medName);
        }
    };

    // ============================================================
    // FORM SUBMISSION
    // ============================================================
    const adicionarAoCarrinho = (data: MedForm, extras?: { principio_ativo_id?: string; ciencia?: CienciaPendente }) => {
        addMedication({
            ...data,
            dosage: data.dosagem_mg_kg || '',
            preco_sugestao: data.preco_sugestao,
            preco_tabela: data.preco_tabela,
            controlado: controladoInfo?.controlado || false,
            lista_controle: controladoInfo?.substancias?.[0]?.lista || undefined,
            principio_ativo_id: extras?.principio_ativo_id,
            ciencia: extras?.ciencia,
        });
        resetForm();
    };

    /**
     * Antes de adicionar, confere a dose contra o range terapêutico da espécie/peso.
     * Sem princípio ativo mapeado ou sem range cadastrado, segue sem bloquear —
     * a validação é uma rede de segurança, não um impedimento à prescrição.
     */
    const onSubmit = async (data: MedForm) => {
        if (!animal?.id) {
            adicionarAoCarrinho(data);
            return;
        }

        setValidando(true);
        try {
            const principio = await principioAtivoService.resolverPorNome(data.drug);

            if (!principio) {
                adicionarAoCarrinho(data);
                return;
            }

            const resultado = await validacaoClinicaService.validarDosagem({
                principio_ativo_id: principio.id,
                animal_id: animal.id,
                dosagem_mg_kg: parseFloat(data.dosagem_mg_kg),
                frequencia_horas: parseInt(data.frequencia_horas),
                duracao_dias: parseInt(data.duracao_dias),
            });

            if (resultado.requer_ciencia) {
                // Abre o modal: o medicamento só entra depois da justificativa
                setValidacao(resultado);
                setPendente({ dados: data, principio_ativo_id: principio.id });
                return;
            }

            adicionarAoCarrinho(data, { principio_ativo_id: principio.id });
        } catch (error) {
            console.error('Falha na validação de dose:', error);
            adicionarAoCarrinho(data);
        } finally {
            setValidando(false);
        }
    };

    const handleCienciaAceite = (motivo: string) => {
        if (!pendente || !validacao) return;

        const pesoAnimal = Number(animal?.peso ?? animal?.weight ?? 0);
        adicionarAoCarrinho(pendente.dados, {
            principio_ativo_id: pendente.principio_ativo_id,
            ciencia: {
                principio_ativo_id: pendente.principio_ativo_id,
                dosagem_prescrita_mg_kg: validacao.dose_mg_kg,
                peso_animal_kg: pesoAnimal,
                dose_min_esperada_mg_kg: validacao.range_encontrado?.dose_min_mg_kg ?? 0,
                dose_max_esperada_mg_kg: validacao.range_encontrado?.dose_max_mg_kg ?? 0,
                motivo,
            },
        });

        setValidacao(null);
        setPendente(null);
    };

    const handleCienciaCancelar = () => {
        setValidacao(null);
        setPendente(null);
    };

    const resetForm = () => {
        reset();
        setCatalogSearchTerm('');
        setSelectedProduto(null);
        setCatalogResults([]);
        setShowForm(false);
        setControladoInfo(null);
    };

    const handleMagistralConfirm = (dados: {
        drug: string;
        form: string;
        amount: string;
        dosage: string;
        preco_sugestao: number;
        preco_tabela: number;
        controlado: boolean;
        lista_controle?: string;
        is_magistral: boolean;
        magistral_breakdown: any;
        observations: string;
    }) => {
        addMedication({
            drug: dados.drug,
            dosage: dados.dosage,
            form: dados.form,
            amount: dados.amount,
            observations: dados.observations,
            preco_sugestao: dados.preco_sugestao,
            preco_tabela: dados.preco_tabela,
            controlado: dados.controlado,
            lista_controle: dados.lista_controle,
            is_magistral: true,
            magistral_breakdown: dados.magistral_breakdown,
        });
        setShowMagistral(false);
    };

    const handleNext = () => {
        if (medications.length === 0) {
            alert('Adicione pelo menos um medicamento');
            return;
        }
        setStep(4);
    };

    const formatPrice = (price: number | string | undefined) => {
        if (price === undefined || price === null) return '—';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return `R$ ${num.toFixed(2).replace('.', ',')}`;
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">3. Prescricao Medica</h2>

            {/* Magistral Builder Modal */}
            {showMagistral && (
                <MagistralBuilder
                    clinicaId={vetClinicaId}
                    onCancel={() => setShowMagistral(false)}
                    onConfirm={handleMagistralConfirm}
                />
            )}

            {/* Ciência de dose fora do range terapêutico */}
            {validacao && (
                <CienciaModal
                    validacao={validacao}
                    onAccept={handleCienciaAceite}
                    onCancel={handleCienciaCancelar}
                />
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                {/* Doença / indicação da prescrição */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Doença / Indicação
                    </label>
                    <input
                        value={doenca}
                        onChange={(e) => setDoenca(e.target.value)}
                        placeholder="Ex: Otite bacteriana, doença renal crônica..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Fica registrada na prescrição e alimenta os relatórios por doença.
                    </p>
                </div>

                {/* Action Buttons: AI Assistant + Magistral Builder */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {/* AI Assistant Banner */}
                    <button
                        type="button"
                        onClick={() => setShowAssistant(!showAssistant)}
                        className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 flex gap-3 items-center hover:from-purple-100 hover:to-blue-100 transition-all text-left"
                    >
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-purple-900 text-sm">Assistente PharmoPet</h4>
                            <p className="text-xs text-purple-700">
                                Sugestões clínicas por IA
                            </p>
                        </div>
                        <MessageCircle className="w-5 h-5 text-purple-500" />
                    </button>

                    {/* Magistral Builder Banner */}
                    <button
                        type="button"
                        onClick={() => setShowMagistral(true)}
                        className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 flex gap-3 items-center hover:from-indigo-100 hover:to-purple-100 transition-all text-left"
                    >
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <FlaskConical className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-indigo-900 text-sm">Formulação Magistral</h4>
                            <p className="text-xs text-indigo-700">
                                Monte fórmula e veja preço em tempo real
                            </p>
                        </div>
                        <Plus className="w-5 h-5 text-indigo-500" />
                    </button>
                </div>

                {/* AI Assistant Panel */}
                {showAssistant && (
                    <div className="mb-6 border border-purple-200 rounded-xl overflow-hidden">
                        <div className="bg-purple-600 text-white px-4 py-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5" />
                                <span className="font-semibold text-sm">Assistente IA - Bulario Magistral</span>
                            </div>
                            <button onClick={() => setShowAssistant(false)} className="hover:bg-purple-700 rounded p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {aiMessages.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    <Bot className="w-12 h-12 mx-auto mb-3 text-purple-300" />
                                    <p className="font-medium text-gray-700 mb-2">Como posso ajudar?</p>
                                    <p className="text-sm">Descreva o caso clinico do paciente.</p>
                                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                        {[
                                            `Cachorro ${animal?.peso || animal?.weight || 10}kg com otite`,
                                            'Gato com alergia cutanea',
                                            'Cachorro com problema hepatico',
                                        ].map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() => { setAiInput(suggestion); }}
                                                className="text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-50"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {aiMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-800'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                                        {/* Medication suggestions from AI */}
                                        {msg.medicamentos && msg.medicamentos.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                <p className="text-xs font-semibold text-gray-500 uppercase">Medicamentos sugeridos:</p>
                                                {msg.medicamentos.map((med, j) => (
                                                    <div key={j} className="bg-purple-50 border border-purple-100 rounded-lg p-2.5">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <span className="text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-mono">
                                                                        {med.codigo}
                                                                    </span>
                                                                    <span className="font-semibold text-sm text-gray-900 truncate">{med.nome}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600">{med.forma_farmaceutica}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAiSearchProduct(med.nome, med.codigo)}
                                                                className="ml-2 text-xs bg-purple-600 text-white px-2.5 py-1 rounded-md hover:bg-purple-700 flex-shrink-0"
                                                            >
                                                                Buscar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {aiLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                        <span className="text-sm text-gray-500">Analisando...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="border-t border-gray-200 p-3 bg-white flex gap-2">
                            <input
                                type="text"
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAiSubmit()}
                                placeholder="Ex: Cachorro 15kg com inflamacao no ouvido..."
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                disabled={aiLoading}
                            />
                            <button
                                type="button"
                                onClick={handleAiSubmit}
                                disabled={aiLoading || !aiInput.trim()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Medication list */}
                {medications.length > 0 && (
                    <div className="mb-6 space-y-3">
                        <h3 className="font-semibold text-gray-900">Medicamentos Adicionados ({medications.length})</h3>
                        {medications.map((med, index) => (
                            <div key={index} className={`p-4 rounded-lg border flex justify-between items-start ${
                                med.is_magistral
                                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
                                    : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <h4 className="font-bold text-gray-900">{med.drug}</h4>
                                        {med.is_magistral && (
                                            <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                                <FlaskConical className="w-3 h-3" />
                                                MAGISTRAL
                                            </span>
                                        )}
                                        {med.codigo && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                                                {med.codigo}
                                            </span>
                                        )}
                                        {med.controlado && (
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                med.lista_controle === 'ANTIMICROBIANO'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {med.lista_controle === 'ANTIMICROBIANO' ? 'Antimicrobiano' : `Controlado ${med.lista_controle || ''}`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">Dosagem:</span> {med.is_magistral ? med.dosage : `${med.dosagem_mg_kg || med.dosage} mg/kg`}
                                        </div>
                                        <div>
                                            <span className="font-medium">Forma:</span> {med.form}
                                        </div>
                                        <div>
                                            <span className="font-medium">Qtd:</span> {med.amount}
                                        </div>
                                    </div>
                                    {(med.preco_sugestao || med.preco_tabela) && (
                                        <div className="flex gap-4 mt-2 text-sm">
                                            <span className="text-green-700 font-medium">
                                                <DollarSign className="w-3.5 h-3.5 inline -mt-0.5" />
                                                {med.is_magistral ? 'Valor final' : 'Cliente'}: {formatPrice(med.preco_sugestao)}
                                            </span>
                                            {!med.is_magistral && (
                                                <span className="text-blue-700 font-medium">
                                                    <DollarSign className="w-3.5 h-3.5 inline -mt-0.5" />
                                                    Clinica: {formatPrice(med.preco_tabela)}
                                                </span>
                                            )}
                                            {med.is_magistral && med.magistral_breakdown && (
                                                <span className="text-gray-500 text-xs">
                                                    ({med.magistral_breakdown.ingredientes.length} ingrediente{med.magistral_breakdown.ingredientes.length > 1 ? 's' : ''})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {med.observations && (
                                        <p className="text-sm text-gray-600 mt-2 italic">"{med.observations}"</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMedication(index)}
                                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add medication button */}
                {!showForm && (
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Adicionar Medicamento</span>
                    </button>
                )}

                {/* Medication form */}
                {showForm && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-gray-900">Novo Medicamento</h3>

                        {/* ============ CATALOG SEARCH ============ */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Buscar no Catalogo (nome ou codigo) *
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={catalogSearchTerm}
                                    onChange={(e) => { setAiProductNotFound(null); setCatalogSearchTerm(e.target.value); }}
                                    onFocus={() => catalogSearchTerm.length >= 2 && setShowCatalogDropdown(true)}
                                    placeholder="Ex: Meloxicam, Sildenafil, 11.14..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                {isSearchingCatalog && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                    </div>
                                )}
                            </div>

                            {/* Catalog Dropdown */}
                            {showCatalogDropdown && catalogResults.length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                                    {catalogResults.map((produto) => (
                                        <button
                                            key={produto.id}
                                            type="button"
                                            onClick={() => handleSelectProduto(produto)}
                                            className="w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono font-medium">
                                                            {produto.codigo}
                                                        </span>
                                                        <p className="font-semibold text-gray-900 truncate">{produto.nome}</p>
                                                    </div>
                                                </div>
                                                <div className="ml-3 text-right flex-shrink-0">
                                                    <p className="text-sm font-bold text-green-700">
                                                        {formatPrice(produto.preco_sugestao)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Clinica: {formatPrice(produto.preco_tabela)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {showCatalogDropdown && catalogResults.length === 0 && catalogSearchTerm.length >= 2 && !isSearchingCatalog && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                                    Nenhum produto encontrado para "{catalogSearchTerm}"
                                </div>
                            )}


                            {/* Selected product card */}
                            {selectedProduto && (
                                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-mono font-medium">
                                                    {selectedProduto.codigo}
                                                </span>
                                                <span className="font-semibold text-green-900">{selectedProduto.nome}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-green-800">
                                                {formatPrice(selectedProduto.preco_sugestao)}
                                            </p>
                                            <p className="text-xs text-green-700">
                                                Clinica: {formatPrice(selectedProduto.preco_tabela)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Alerta de controlado */}
                            {controladoInfo?.controlado && (
                                <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <span className="text-amber-600 text-lg leading-none">&#9888;</span>
                                        <div>
                                            <p className="text-sm font-semibold text-amber-800">Medicamento Controlado</p>
                                            {controladoInfo.substancias.map((s, idx) => (
                                                <p key={idx} className="text-xs text-amber-700">
                                                    {s.nome} — <span className="font-bold">{s.lista || 'Controlado'}</span>
                                                    {s.lista === 'ANTIMICROBIANO' && ' (Requer receita antimicrobiana)'}
                                                    {['C1', 'B1', 'A2'].includes(s.lista) && ' (Requer receituário especial)'}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hidden fields */}
                        <input type="hidden" {...register('principio_ativo_id')} />
                        <input type="hidden" {...register('drug', { required: true })} />
                        <input type="hidden" {...register('codigo')} />
                        <input type="hidden" {...register('preco_sugestao')} />
                        <input type="hidden" {...register('preco_tabela')} />

                        {/* Dosage Fields — shown when product is selected */}
                        {selectedProduto && (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dosagem (mg/kg) *
                                        </label>
                                        <input
                                            {...register('dosagem_mg_kg', { required: true })}
                                            type="number"
                                            step="0.01"
                                            placeholder="Ex: 0.1"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Frequencia (horas) *
                                        </label>
                                        <select
                                            {...register('frequencia_horas', { required: true })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        >
                                            <option value="">Selecione</option>
                                            <option value="6">A cada 6h</option>
                                            <option value="8">A cada 8h</option>
                                            <option value="12">A cada 12h</option>
                                            <option value="24">A cada 24h</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Duracao (dias) *
                                        </label>
                                        <input
                                            {...register('duracao_dias', { required: true })}
                                            type="number"
                                            placeholder="Ex: 7"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Forma Farmacêutica *</label>
                                        <select
                                            {...register('form', { required: true })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        >
                                            <option value="">Selecione</option>
                                            {formasFarma.length > 0
                                                ? formasFarma.map((f) => (
                                                    <option key={f.id} value={f.nome}>{f.nome}</option>
                                                ))
                                                : <>
                                                    <option value="CÁPSULAS">CÁPSULAS</option>
                                                    <option value="BISCOITOS">BISCOITOS</option>
                                                    <option value="SUSPENSÃO ORAL">SUSPENSÃO ORAL</option>
                                                    <option value="PASTA ORAL">PASTA ORAL</option>
                                                    <option value="GEL TRANSDERMICO">GEL TRANSDÉRMICO</option>
                                                    <option value="CREME TÓPICO">CREME TÓPICO</option>
                                                    <option value="SHAMPOO">SHAMPOO</option>
                                                    <option value="SACHÊ">SACHÊ</option>
                                                </>
                                            }
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                                        <input
                                            {...register('amount', { required: true })}
                                            placeholder="Ex: 1 caixa"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Observacoes / Posologia
                                    </label>
                                    <textarea
                                        {...register('observations')}
                                        rows={2}
                                        placeholder="Ex: Dar 1 comprimido a cada 12 horas..."
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={!selectedProduto || validando}
                                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {validando ? 'Validando dose...' : 'Adicionar'}
                            </button>
                            {medications.length > 0 && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                )}

                <div className="flex justify-between pt-6 border-t mt-6">
                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex items-center gap-2 px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                    >
                        Revisar Prescricao
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
