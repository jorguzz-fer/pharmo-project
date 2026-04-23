import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Search, Loader2, AlertTriangle, Info, FlaskConical } from 'lucide-react';
import { insumoService, formaFarmaceuticaService, type InsumoFarmaceutico, type FormaFarmaceutica } from '../../../services/insumo.service';
import { precificacaoService, type PrecificacaoResultado } from '../../../services/precificacao.service';

interface IngredienteForm {
    codigo_interno: number;
    descricao: string;
    dosagem_mg: number;
    quantidade: number;
}

interface MagistralBuilderProps {
    clinicaId?: string;
    onCancel: () => void;
    onConfirm: (dados: {
        drug: string;
        form: string;
        amount: string;
        dosage: string;
        preco_sugestao: number;
        preco_tabela: number;
        controlado: boolean;
        lista_controle?: string;
        is_magistral: boolean;
        magistral_breakdown: PrecificacaoResultado;
        observations: string;
    }) => void;
}

export function MagistralBuilder({ clinicaId, onCancel, onConfirm }: MagistralBuilderProps) {
    const [ingredientes, setIngredientes] = useState<IngredienteForm[]>([]);
    const [formas, setFormas] = useState<FormaFarmaceutica[]>([]);
    const [formaSelecionada, setFormaSelecionada] = useState('');

    // Busca de insumos
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<InsumoFarmaceutico[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [dosagemAtual, setDosagemAtual] = useState('');
    const [quantidadeAtual, setQuantidadeAtual] = useState('');
    const [insumoSelecionado, setInsumoSelecionado] = useState<InsumoFarmaceutico | null>(null);

    // Precificação
    const [resultado, setResultado] = useState<PrecificacaoResultado | null>(null);
    const [calculando, setCalculando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Campo nome da formulação
    const [nomeFormulacao, setNomeFormulacao] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Carregar formas farmacêuticas
    useEffect(() => {
        formaFarmaceuticaService.listar()
            .then(setFormas)
            .catch(() => setFormas([]));
    }, []);

    // Buscar insumos com debounce
    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                setIsSearching(true);
                const resp = await insumoService.buscar(searchTerm, 1, 10);
                setSearchResults(resp.data || []);
                setShowDropdown(true);
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchTerm]);

    // Recalcular preço sempre que ingredientes/forma mudarem
    useEffect(() => {
        if (ingredientes.length === 0 || !formaSelecionada) {
            setResultado(null);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setCalculando(true);
                setErro(null);
                const resp = await precificacaoService.calcular({
                    ingredientes: ingredientes.map(i => ({
                        codigo_interno: i.codigo_interno,
                        dosagem_mg: i.dosagem_mg,
                        quantidade: i.quantidade,
                    })),
                    forma_farmaceutica: formaSelecionada,
                    clinica_id: clinicaId,
                });
                setResultado(resp);
                if (resp.erros && resp.erros.length > 0) {
                    setErro(resp.erros.join('; '));
                }
            } catch (e: any) {
                setErro(e?.response?.data?.error || e?.message || 'Erro ao calcular preço');
                setResultado(null);
            } finally {
                setCalculando(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [ingredientes, formaSelecionada, clinicaId]);

    const handleSelectInsumo = (insumo: InsumoFarmaceutico) => {
        setInsumoSelecionado(insumo);
        setSearchTerm(insumo.descricao);
        setShowDropdown(false);
    };

    const handleAddIngrediente = () => {
        if (!insumoSelecionado) return;
        const dosagem = parseFloat(dosagemAtual);
        const quantidade = parseInt(quantidadeAtual, 10);
        if (!dosagem || dosagem <= 0) return alert('Dosagem inválida');
        if (!quantidade || quantidade <= 0) return alert('Quantidade inválida');

        // Evitar duplicação
        if (ingredientes.some(i => i.codigo_interno === insumoSelecionado.codigo_interno)) {
            return alert('Esse ingrediente já foi adicionado');
        }

        setIngredientes(prev => [...prev, {
            codigo_interno: insumoSelecionado.codigo_interno,
            descricao: insumoSelecionado.descricao,
            dosagem_mg: dosagem,
            quantidade,
        }]);
        // Reset
        setInsumoSelecionado(null);
        setSearchTerm('');
        setDosagemAtual('');
        setQuantidadeAtual('');
    };

    const handleRemoveIngrediente = (codigo: number) => {
        setIngredientes(prev => prev.filter(i => i.codigo_interno !== codigo));
    };

    const canConfirm = resultado && !calculando && ingredientes.length > 0 && formaSelecionada && nomeFormulacao.trim().length > 0 && (!resultado.erros || resultado.erros.length === 0);

    const handleConfirm = () => {
        if (!resultado || !canConfirm) return;

        // Determinar se tem controlado
        const controlados = resultado.ingredientes.filter(i => i.controlado);
        const temControlado = controlados.length > 0;
        const listaControle = controlados[0]?.lista_controle || undefined;

        // Quantidade total (usar a quantidade do primeiro ingrediente como referência,
        // tipicamente todos têm a mesma quantidade em uma formulação)
        const qtdReferencia = ingredientes[0]?.quantidade || 0;

        onConfirm({
            drug: nomeFormulacao.trim(),
            form: formaSelecionada,
            amount: `${qtdReferencia} ${formaSelecionada.toLowerCase().includes('cáps') ? 'cápsulas' : formaSelecionada.toLowerCase().includes('biscoito') ? 'biscoitos' : 'doses'}`,
            dosage: ingredientes.map(i => `${i.descricao} ${i.dosagem_mg}mg`).join(' + '),
            preco_sugestao: resultado.valor_final,
            preco_tabela: resultado.subtotal,
            controlado: temControlado,
            lista_controle: listaControle || undefined,
            is_magistral: true,
            magistral_breakdown: resultado,
            observations: observacoes,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <FlaskConical className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Formulação Magistral</h3>
                            <p className="text-sm text-indigo-100">Preço calculado em tempo real</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="hover:bg-white/10 p-2 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    {/* Nome da formulação */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Nome da formulação *</label>
                        <input
                            type="text"
                            value={nomeFormulacao}
                            onChange={(e) => setNomeFormulacao(e.target.value)}
                            placeholder="Ex: Fórmula para otite, Fórmula imunossupressora..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Forma farmacêutica */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Forma farmacêutica *</label>
                        <select
                            value={formaSelecionada}
                            onChange={(e) => setFormaSelecionada(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Selecione...</option>
                            {formas.map(f => (
                                <option key={f.id} value={f.nome}>{f.nome}</option>
                            ))}
                        </select>
                    </div>

                    {/* Adicionar ingredientes */}
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                            <Plus className="w-4 h-4 text-indigo-600" />
                            <h4 className="font-semibold text-gray-800">Adicionar ingrediente</h4>
                        </div>

                        {/* Busca de insumo */}
                        <div className="relative mb-3">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setInsumoSelecionado(null); }}
                                placeholder="Digite código ou nome do insumo (ex: gabapentina, 665)..."
                                className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2 focus:ring-2 focus:ring-indigo-500"
                            />
                            {isSearching && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-gray-400" />}

                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelectInsumo(item)}
                                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b last:border-b-0 flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="font-mono text-xs text-indigo-600">{item.codigo_interno}</div>
                                                <div className="text-sm text-gray-800">{item.descricao}</div>
                                            </div>
                                            <div className="text-xs flex gap-2 items-center">
                                                {item.controlado && (
                                                    <span className={`px-2 py-0.5 rounded font-bold ${
                                                        item.lista_controle === 'ANTIMICROBIANO'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {item.lista_controle || 'CTRL'}
                                                    </span>
                                                )}
                                                {!item.disponivel && (
                                                    <span className="px-2 py-0.5 rounded font-bold bg-gray-200 text-gray-600">Sem estoque</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dosagem + quantidade + botão */}
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4">
                                <label className="text-xs text-gray-600">Dosagem (mg) por unidade</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={dosagemAtual}
                                    onChange={(e) => setDosagemAtual(e.target.value)}
                                    placeholder="Ex: 20"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    disabled={!insumoSelecionado}
                                />
                            </div>
                            <div className="col-span-4">
                                <label className="text-xs text-gray-600">Qtd (cáps/doses)</label>
                                <input
                                    type="number"
                                    step="1"
                                    value={quantidadeAtual}
                                    onChange={(e) => setQuantidadeAtual(e.target.value)}
                                    placeholder="Ex: 60"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    disabled={!insumoSelecionado}
                                />
                            </div>
                            <div className="col-span-4 flex items-end">
                                <button
                                    onClick={handleAddIngrediente}
                                    disabled={!insumoSelecionado || !dosagemAtual || !quantidadeAtual}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de ingredientes adicionados */}
                    {ingredientes.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Ingredientes ({ingredientes.length})</h4>
                            <div className="space-y-2">
                                {ingredientes.map(ing => {
                                    const resultadoIng = resultado?.ingredientes.find(r => r.codigo_interno === ing.codigo_interno);
                                    return (
                                        <div key={ing.codigo_interno} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{ing.codigo_interno}</span>
                                                <div>
                                                    <div className="font-medium text-gray-900">{ing.descricao}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {ing.dosagem_mg}mg × {ing.quantidade} = {((ing.dosagem_mg * ing.quantidade) / 1000).toFixed(2)}g total
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {resultadoIng && (
                                                    <span className="text-sm font-semibold text-green-700">
                                                        R$ {resultadoIng.custo_ingrediente.toFixed(2).replace('.', ',')}
                                                    </span>
                                                )}
                                                <button onClick={() => handleRemoveIngrediente(ing.codigo_interno)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Avisos e erros */}
                    {resultado?.avisos && resultado.avisos.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <ul className="text-xs text-amber-800 space-y-1">
                                {resultado.avisos.map((a, i) => <li key={i}>• {a}</li>)}
                            </ul>
                        </div>
                    )}
                    {erro && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{erro}</p>
                        </div>
                    )}

                    {/* Observações */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Observações (posologia)</label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Ex: Administrar 1 cápsula de 8/8h por 7 dias..."
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Breakdown do preço */}
                    {resultado && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                            <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                Detalhamento do preço
                                {calculando && <Loader2 className="w-4 h-4 animate-spin" />}
                            </h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Matéria prima</span>
                                    <span className="font-medium">R$ {resultado.total_materia_prima.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Taxa de manipulação</span>
                                    <span className="font-medium">R$ {resultado.taxa_manipulacao.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Embalagens</span>
                                    <span className="font-medium">R$ {resultado.custo_embalagens.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="flex justify-between border-t border-indigo-200 pt-1 mt-1">
                                    <span className="font-medium text-gray-700">Subtotal</span>
                                    <span className="font-semibold">R$ {resultado.subtotal.toFixed(2).replace('.', ',')}</span>
                                </div>
                                {resultado.desconto_parceiro_pct > 0 && (
                                    <div className="flex justify-between text-green-700">
                                        <span>Desconto parceiro ({(resultado.desconto_parceiro_pct * 100).toFixed(0)}%)</span>
                                        <span className="font-medium">- R$ {resultado.desconto_valor.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                )}
                                {resultado.adicional_entrega > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">+ Entrega</span>
                                        <span className="font-medium">R$ {resultado.adicional_entrega.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                )}
                                {resultado.adicional_biscoito > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">+ Biscoito</span>
                                        <span className="font-medium">R$ {resultado.adicional_biscoito.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t-2 border-indigo-300 pt-2 mt-2">
                                    <span className="font-bold text-indigo-900">VALOR FINAL</span>
                                    <span className="font-bold text-xl text-indigo-700">R$ {resultado.valor_final.toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 flex justify-between items-center bg-gray-50">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Adicionar à prescrição
                    </button>
                </div>
            </div>
        </div>
    );
}
