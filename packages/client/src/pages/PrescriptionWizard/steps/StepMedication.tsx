import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Plus, Trash2, Sparkles, AlertCircle, CheckCircle, Search, Package, FlaskConical, DollarSign } from 'lucide-react';
import { usePrescriptionStore } from '../../../store/prescription';
import { principioAtivoService } from '../../../services/principioAtivo.service';
import { produtoService } from '../../../services/produto.service';
import { validacaoClinicaService } from '../../../services/validacaoClinica.service';
import { CienciaModal } from '../../../components/CienciaModal';
import type { PrincipioAtivo } from '../../../services/principioAtivo.service';
import type { Produto } from '../../../services/produto.service';
import type { ValidacaoResultado } from '../../../services/validacaoClinica.service';

type SearchMode = 'catalogo' | 'principio';

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

export function StepMedication() {
    const { medications, addMedication, removeMedication, setStep, animal } = usePrescriptionStore();
    const { register, handleSubmit, reset, setValue, watch } = useForm<MedForm>();
    const [showForm, setShowForm] = useState(medications.length === 0);

    // Search mode: catalog or principio ativo
    const [searchMode, setSearchMode] = useState<SearchMode>('catalogo');

    // Catalog search state
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
    const [catalogResults, setCatalogResults] = useState<Produto[]>([]);
    const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
    const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
    const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);

    // Principio ativo autocomplete state
    const [principios, setPrincipios] = useState<PrincipioAtivo[]>([]);
    const [filteredPrincipios, setFilteredPrincipios] = useState<PrincipioAtivo[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [selectedPrincipio, setSelectedPrincipio] = useState<PrincipioAtivo | null>(null);

    // Validation state
    const [validacao, setValidacao] = useState<ValidacaoResultado | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [showCienciaModal, setShowCienciaModal] = useState(false);
    const [pendingMedication, setPendingMedication] = useState<MedForm | null>(null);

    // Watch form fields for real-time validation
    const dosagem = watch('dosagem_mg_kg');
    const frequencia = watch('frequencia_horas');
    const duracao = watch('duracao_dias');

    // Load principios ativos on mount
    useEffect(() => {
        loadPrincipios();
    }, []);

    const loadPrincipios = async () => {
        try {
            const data = await principioAtivoService.listarTodos({ ativo: true });
            setPrincipios(data);
        } catch (error) {
            console.error('Erro ao carregar princípios ativos:', error);
        }
    };

    // ============================================================
    // CATALOG SEARCH (PharmoPet products)
    // ============================================================
    useEffect(() => {
        if (searchMode !== 'catalogo') return;
        if (catalogSearchTerm.length < 2) {
            setCatalogResults([]);
            setShowCatalogDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setIsSearchingCatalog(true);
                const response = await produtoService.buscar(catalogSearchTerm, 1, 15);
                setCatalogResults(response.data);
                setShowCatalogDropdown(true);
            } catch (error) {
                console.error('Erro ao buscar produtos:', error);
                setCatalogResults([]);
            } finally {
                setIsSearchingCatalog(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [catalogSearchTerm, searchMode]);

    const handleSelectProduto = (produto: Produto) => {
        setSelectedProduto(produto);
        setCatalogSearchTerm(produto.nome);
        setValue('codigo', produto.codigo);
        setValue('drug', produto.nome);
        setValue('preco_sugestao', Number(produto.preco_sugestao));
        setValue('preco_tabela', Number(produto.preco_tabela));
        setShowCatalogDropdown(false);
    };

    // ============================================================
    // PRINCIPIO ATIVO SEARCH (existing flow)
    // ============================================================
    useEffect(() => {
        if (searchMode !== 'principio') return;
        if (searchTerm.length >= 2) {
            const filtered = principios.filter(p =>
                p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.nome_cientifico?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPrincipios(filtered);
            setShowAutocomplete(true);
        } else {
            setFilteredPrincipios([]);
            setShowAutocomplete(false);
        }
    }, [searchTerm, principios, searchMode]);

    // Real-time validation
    const validateDosage = useCallback(async () => {
        if (!selectedPrincipio || !animal?.id || !dosagem || !frequencia || !duracao) {
            setValidacao(null);
            return;
        }

        try {
            setIsValidating(true);
            const resultado = await validacaoClinicaService.validarDosagem({
                principio_ativo_id: selectedPrincipio.id,
                animal_id: animal.id,
                dosagem_mg_kg: parseFloat(dosagem),
                frequencia_horas: parseInt(frequencia),
                duracao_dias: parseInt(duracao)
            });
            setValidacao(resultado);
        } catch (error) {
            console.error('Erro ao validar dosagem:', error);
            setValidacao(null);
        } finally {
            setIsValidating(false);
        }
    }, [selectedPrincipio, animal, dosagem, frequencia, duracao]);

    useEffect(() => {
        const timer = setTimeout(() => {
            validateDosage();
        }, 500);
        return () => clearTimeout(timer);
    }, [validateDosage]);

    const handleSelectPrincipio = (principio: PrincipioAtivo) => {
        setSelectedPrincipio(principio);
        setSearchTerm(principio.nome);
        setValue('principio_ativo_id', principio.id);
        setValue('drug', principio.nome);
        setShowAutocomplete(false);

        if (principio.concentracoes && principio.concentracoes.length > 0) {
            const firstConc = principio.concentracoes[0];
            setValue('form', firstConc.forma_farmaceutica || 'Comprimido');
        }
    };

    // ============================================================
    // FORM SUBMISSION
    // ============================================================
    const onSubmit = (data: MedForm) => {
        if (searchMode === 'principio' && validacao && validacao.requer_ciencia) {
            setPendingMedication(data);
            setShowCienciaModal(true);
            return;
        }

        addMedication({
            ...data,
            dosage: data.dosagem_mg_kg || '',
            preco_sugestao: data.preco_sugestao,
            preco_tabela: data.preco_tabela,
        });
        resetForm();
    };

    const handleCienciaAccept = async (motivo: string) => {
        if (!pendingMedication || !validacao || !animal) return;

        try {
            addMedication({
                ...pendingMedication,
                dosage: pendingMedication.dosagem_mg_kg || '',
                observations: `${pendingMedication.observations}\n\n[CIÊNCIA REGISTRADA: ${motivo}]`
            });

            setShowCienciaModal(false);
            setPendingMedication(null);
            resetForm();
        } catch (error) {
            console.error('Erro ao registrar ciência:', error);
            alert('Erro ao registrar log de ciência');
        }
    };

    const resetForm = () => {
        reset();
        setSearchTerm('');
        setCatalogSearchTerm('');
        setSelectedPrincipio(null);
        setSelectedProduto(null);
        setValidacao(null);
        setCatalogResults([]);
        setShowForm(false);
    };

    const handleNext = () => {
        if (medications.length === 0) {
            alert('Adicione pelo menos um medicamento');
            return;
        }
        setStep(4);
    };

    const handleQuickFill = () => {
        if (animal?.peso || animal?.weight) {
            const meloxicam = principios.find(p => p.nome.toLowerCase().includes('meloxicam'));
            if (meloxicam) {
                setSearchMode('principio');
                handleSelectPrincipio(meloxicam);
                setValue('dosagem_mg_kg', '0.1');
                setValue('frequencia_horas', '24');
                setValue('duracao_dias', '5');
                setValue('amount', '1 caixa');
            }
        }
    };

    const isFormReady = searchMode === 'catalogo' ? !!selectedProduto : !!selectedPrincipio;

    const formatPrice = (price: number | string | undefined) => {
        if (price === undefined || price === null) return '—';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return `R$ ${num.toFixed(2).replace('.', ',')}`;
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">3. Prescrição Médica</h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-bold text-blue-900 text-sm">Auxiliar Inteligente</h4>
                        <p className="text-sm text-blue-700">
                            Adicione múltiplos medicamentos. Peso do paciente: {animal?.peso || animal?.weight || 0}kg
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleQuickFill}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                        Preencher Exemplo
                    </button>
                </div>

                {/* Medication list */}
                {medications.length > 0 && (
                    <div className="mb-6 space-y-3">
                        <h3 className="font-semibold text-gray-900">Medicamentos Adicionados ({medications.length})</h3>
                        {medications.map((med, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-bold text-gray-900">{med.drug}</h4>
                                        {med.codigo && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                                                {med.codigo}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">Dosagem:</span> {med.dosagem_mg_kg || med.dosage} mg/kg
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
                                                Cliente: {formatPrice(med.preco_sugestao)}
                                            </span>
                                            <span className="text-blue-700 font-medium">
                                                <DollarSign className="w-3.5 h-3.5 inline -mt-0.5" />
                                                Clínica: {formatPrice(med.preco_tabela)}
                                            </span>
                                        </div>
                                    )}
                                    {med.observations && (
                                        <p className="text-sm text-gray-600 mt-2">{med.observations}</p>
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

                        {/* ============ SEARCH MODE TABS ============ */}
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchMode('catalogo');
                                    setSearchTerm('');
                                    setSelectedPrincipio(null);
                                    setValidacao(null);
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${
                                    searchMode === 'catalogo'
                                        ? 'bg-green-600 text-white shadow-inner'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Package className="w-4 h-4" />
                                Catálogo PharmoPet
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchMode('principio');
                                    setCatalogSearchTerm('');
                                    setSelectedProduto(null);
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${
                                    searchMode === 'principio'
                                        ? 'bg-blue-600 text-white shadow-inner'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <FlaskConical className="w-4 h-4" />
                                Princípio Ativo
                            </button>
                        </div>

                        {/* ============ CATALOG SEARCH ============ */}
                        {searchMode === 'catalogo' && (
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Buscar no Catálogo (nome ou código) *
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={catalogSearchTerm}
                                        onChange={(e) => setCatalogSearchTerm(e.target.value)}
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
                                                            Clínica: {formatPrice(produto.preco_tabela)}
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
                                                    Clínica: {formatPrice(selectedProduto.preco_tabela)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ============ PRINCIPIO ATIVO SEARCH ============ */}
                        {searchMode === 'principio' && (
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Buscar Princípio Ativo *
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onFocus={() => searchTerm.length >= 2 && setShowAutocomplete(true)}
                                        placeholder="Digite o nome do princípio ativo..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {showAutocomplete && filteredPrincipios.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {filteredPrincipios.map((principio) => (
                                            <button
                                                key={principio.id}
                                                type="button"
                                                onClick={() => handleSelectPrincipio(principio)}
                                                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{principio.nome}</p>
                                                        {principio.nome_cientifico && (
                                                            <p className="text-sm text-gray-500 italic">{principio.nome_cientifico}</p>
                                                        )}
                                                        <p className="text-xs text-gray-600 mt-1">{principio.classe_terapeutica}</p>
                                                    </div>
                                                    {principio.controlado && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                                            Controlado
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Hidden fields */}
                        <input type="hidden" {...register('principio_ativo_id')} />
                        <input type="hidden" {...register('drug', { required: true })} />
                        <input type="hidden" {...register('codigo')} />
                        <input type="hidden" {...register('preco_sugestao')} />
                        <input type="hidden" {...register('preco_tabela')} />

                        {/* Dosage Fields — shown when something is selected */}
                        {isFormReady && (
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
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Frequência (horas) *
                                        </label>
                                        <select
                                            {...register('frequencia_horas', { required: true })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            Duração (dias) *
                                        </label>
                                        <input
                                            {...register('duracao_dias', { required: true })}
                                            type="number"
                                            placeholder="Ex: 7"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Real-time Validation Feedback (principio ativo mode only) */}
                                {searchMode === 'principio' && isValidating && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="text-sm text-gray-600">Validando dosagem...</span>
                                    </div>
                                )}

                                {searchMode === 'principio' && validacao && !isValidating && (
                                    <div className={`border rounded-lg p-4 ${validacao.valido && !validacao.requer_ciencia
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                        }`}>
                                        <div className="flex items-start gap-3">
                                            {validacao.valido && !validacao.requer_ciencia ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                {validacao.valido && !validacao.requer_ciencia ? (
                                                    <>
                                                        <h4 className="font-semibold text-green-900 mb-1">
                                                            ✓ Dosagem Dentro do Range Terapêutico
                                                        </h4>
                                                        {validacao.range_encontrado && (
                                                            <p className="text-sm text-green-800">
                                                                Range: {validacao.range_encontrado.dose_min_mg_kg} - {validacao.range_encontrado.dose_max_mg_kg} mg/kg
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-green-800 mt-1">
                                                            Dose total: {validacao.dose_total_mg.toFixed(2)} mg ({validacao.doses_por_dia}x ao dia)
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h4 className="font-semibold text-red-900 mb-2">
                                                            ⚠️ Atenção: Dosagem Fora do Range
                                                        </h4>
                                                        {validacao.alertas.map((alerta, i) => (
                                                            <p key={i} className="text-sm text-red-800 mb-1">{alerta}</p>
                                                        ))}
                                                        {validacao.avisos.map((aviso, i) => (
                                                            <p key={i} className="text-sm text-yellow-800 mb-1">{aviso}</p>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Forma *</label>
                                        <select
                                            {...register('form', { required: true })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Comprimido">Comprimido</option>
                                            <option value="Cápsula">Cápsula</option>
                                            <option value="Liquido">Líquido / Xarope</option>
                                            <option value="Suspensão">Suspensão</option>
                                            <option value="Pasta">Pasta Oral</option>
                                            <option value="Petisco">Petisco Medicamentoso</option>
                                            <option value="Gel">Gel</option>
                                            <option value="Pomada">Pomada/Creme</option>
                                            <option value="Sachê">Sachê</option>
                                            <option value="Xampu">Xampu</option>
                                            <option value="Solução">Solução</option>
                                            <option value="Injetável">Injetável</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                                        <input
                                            {...register('amount', { required: true })}
                                            placeholder="Ex: 1 caixa"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Observações / Posologia
                                    </label>
                                    <textarea
                                        {...register('observations')}
                                        rows={2}
                                        placeholder="Ex: Dar 1 comprimido a cada 12 horas..."
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={!isFormReady || isValidating}
                                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {searchMode === 'principio' && validacao?.requer_ciencia ? 'Adicionar com Ciência' : 'Adicionar'}
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
                        Revisar Prescrição
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Ciência Modal */}
            {showCienciaModal && validacao && (
                <CienciaModal
                    validacao={validacao}
                    onAccept={handleCienciaAccept}
                    onCancel={() => {
                        setShowCienciaModal(false);
                        setPendingMedication(null);
                    }}
                />
            )}
        </div>
    );
}
