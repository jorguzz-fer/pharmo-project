import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Plus, Trash2, Sparkles, Search, DollarSign } from 'lucide-react';
import { usePrescriptionStore } from '../../../store/prescription';
import { produtoService } from '../../../services/produto.service';
import type { Produto } from '../../../services/produto.service';

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
    const { register, handleSubmit, reset, setValue } = useForm<MedForm>();
    const [showForm, setShowForm] = useState(medications.length === 0);

    // Catalog search state
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
    const [catalogResults, setCatalogResults] = useState<Produto[]>([]);
    const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
    const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
    const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);

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
    }, [catalogSearchTerm]);

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
    // FORM SUBMISSION
    // ============================================================
    const onSubmit = (data: MedForm) => {
        addMedication({
            ...data,
            dosage: data.dosagem_mg_kg || '',
            preco_sugestao: data.preco_sugestao,
            preco_tabela: data.preco_tabela,
        });
        resetForm();
    };

    const resetForm = () => {
        reset();
        setCatalogSearchTerm('');
        setSelectedProduto(null);
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

                        {/* ============ CATALOG SEARCH ============ */}
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
                                            Frequência (horas) *
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
                                            Duração (dias) *
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Forma *</label>
                                        <select
                                            {...register('form', { required: true })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={!selectedProduto}
                                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Adicionar
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
        </div>
    );
}
