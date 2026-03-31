import { useState, useEffect } from 'react';
import { Search, FlaskConical, Shield, Ban, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { insumoService, regraExcecaoService, formaFarmaceuticaService } from '../../services/insumo.service';
import type { InsumoFarmaceutico, FormaFarmaceutica, RegraExcecao } from '../../services/insumo.service';

type Tab = 'insumos' | 'controlados' | 'excecoes';

export function AdminInsumos() {
    const [activeTab, setActiveTab] = useState<Tab>('insumos');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    // Insumos tab
    const [insumos, setInsumos] = useState<InsumoFarmaceutico[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Controlados tab
    const [controlados, setControlados] = useState<InsumoFarmaceutico[]>([]);

    // Exceções tab
    const [excecoes, setExcecoes] = useState<RegraExcecao[]>([]);
    const [formas, setFormas] = useState<FormaFarmaceutica[]>([]);
    const [showAddExcecao, setShowAddExcecao] = useState(false);
    const [addExcecaoInsumo, setAddExcecaoInsumo] = useState('');
    const [addExcecaoForma, setAddExcecaoForma] = useState('');
    const [searchInsumo, setSearchInsumo] = useState('');
    const [insumoResults, setInsumoResults] = useState<InsumoFarmaceutico[]>([]);
    const [selectedInsumo, setSelectedInsumo] = useState<InsumoFarmaceutico | null>(null);

    useEffect(() => {
        if (activeTab === 'insumos') loadInsumos();
        if (activeTab === 'controlados') loadControlados();
        if (activeTab === 'excecoes') { loadExcecoes(); loadFormas(); }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'insumos') loadInsumos();
    }, [page]);

    const loadInsumos = async () => {
        setLoading(true);
        try {
            const data = await insumoService.buscar(search, page, 20);
            setInsumos(data.data);
            setTotalPages(data.totalPages);
            setTotal(data.total);
        } catch (error) {
            console.error('Erro ao carregar insumos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadControlados = async () => {
        setLoading(true);
        try {
            const data = await insumoService.listarControlados();
            setControlados(data.data);
        } catch (error) {
            console.error('Erro ao carregar controlados:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadExcecoes = async () => {
        setLoading(true);
        try {
            const data = await regraExcecaoService.listar();
            setExcecoes(data.data);
        } catch (error) {
            console.error('Erro ao carregar exceções:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFormas = async () => {
        try {
            const data = await formaFarmaceuticaService.listar();
            setFormas(data);
        } catch (error) {
            console.error('Erro ao carregar formas:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadInsumos();
    };

    const handleToggleControlado = async (insumo: InsumoFarmaceutico) => {
        const novoEstado = !insumo.controlado;
        let lista = '';
        if (novoEstado) {
            lista = prompt('Informe a lista de controle (ex: C1, B1, A2, ANTIMICROBIANO):') || '';
            if (!lista) return;
        }
        try {
            await insumoService.toggleControlado(insumo.id, novoEstado, lista);
            if (activeTab === 'controlados') loadControlados();
            else loadInsumos();
        } catch (error: any) {
            alert(error?.response?.data?.error || 'Erro ao atualizar');
        }
    };

    const handleSearchInsumoForExcecao = async () => {
        if (searchInsumo.trim().length < 2) return;
        try {
            const data = await insumoService.buscar(searchInsumo, 1, 10);
            setInsumoResults(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddExcecao = async () => {
        if (!selectedInsumo || !addExcecaoForma) {
            alert('Selecione o insumo e a forma farmacêutica');
            return;
        }
        try {
            await regraExcecaoService.adicionar(selectedInsumo.id, addExcecaoForma);
            setShowAddExcecao(false);
            setSelectedInsumo(null);
            setSearchInsumo('');
            setAddExcecaoForma('');
            setInsumoResults([]);
            loadExcecoes();
        } catch (error: any) {
            alert(error?.response?.data?.error || 'Erro ao adicionar exceção');
        }
    };

    const handleRemoveExcecao = async (id: string) => {
        if (!confirm('Remover esta regra de exceção?')) return;
        try {
            await regraExcecaoService.remover(id);
            loadExcecoes();
        } catch (error: any) {
            alert(error?.response?.data?.error || 'Erro ao remover');
        }
    };

    const getListaBadge = (lista: string | null) => {
        if (!lista) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">Sem lista</span>;
        const colors: Record<string, string> = {
            'C1': 'bg-red-100 text-red-700',
            'B1': 'bg-orange-100 text-orange-700',
            'A2': 'bg-purple-100 text-purple-700',
            'ANTIMICROBIANO': 'bg-blue-100 text-blue-700',
        };
        return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${colors[lista] || 'bg-gray-100 text-gray-700'}`}>{lista}</span>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Insumos Farmacêuticos</h1>
                <p className="text-gray-600 mt-1">Gerenciar base de insumos, controlados e regras de exceção</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('insumos')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'insumos'
                            ? 'border-teal-600 text-teal-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FlaskConical className="w-4 h-4 inline mr-2" />
                        Todos os Insumos ({total})
                    </button>
                    <button
                        onClick={() => setActiveTab('controlados')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'controlados'
                            ? 'border-teal-600 text-teal-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Shield className="w-4 h-4 inline mr-2" />
                        Controlados ({controlados.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('excecoes')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'excecoes'
                            ? 'border-teal-600 text-teal-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Ban className="w-4 h-4 inline mr-2" />
                        Regras de Exceção ({excecoes.length})
                    </button>
                </nav>
            </div>

            {/* Tab: Todos os Insumos */}
            {activeTab === 'insumos' && (
                <div className="space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome ou código..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                            Buscar
                        </button>
                    </form>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Un</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custo Efetivo</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Markup</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estoque</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {insumos.map((insumo) => (
                                            <tr key={insumo.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-mono text-gray-600">{insumo.codigo_interno}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {insumo.descricao}
                                                    {insumo.formas_proibidas.length > 0 && (
                                                        <span className="ml-2 text-xs text-red-500" title={`Não faz em: ${insumo.formas_proibidas.join(', ')}`}>
                                                            <Ban className="w-3 h-3 inline" />
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{insumo.un_manipulacao}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">R$ {insumo.custo_efetivo.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-600">{insumo.markup}x</td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {insumo.disponivel ? (
                                                        <span className="text-green-600">{Number(insumo.estoque).toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-red-500">Sem estoque</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {insumo.controlado ? getListaBadge(insumo.lista_controle) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleToggleControlado(insumo)}
                                                        className={`text-xs px-2 py-1 rounded ${insumo.controlado
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                        title={insumo.controlado ? 'Remover controle' : 'Marcar como controlado'}
                                                    >
                                                        <Shield className="w-3 h-3 inline" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-4 py-3 border-t flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Página {page} de {totalPages} ({total} insumos)
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Controlados */}
            {activeTab === 'controlados' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        </div>
                    ) : controlados.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Nenhum insumo controlado cadastrado</div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lista</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Un</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custo Efetivo</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estoque</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Exceções</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {controlados.map((insumo) => (
                                            <tr key={insumo.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-mono text-gray-600">{insumo.codigo_interno}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{insumo.descricao}</td>
                                                <td className="px-4 py-3 text-center">{getListaBadge(insumo.lista_controle)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{insumo.un_manipulacao}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                    R$ {(Math.max(insumo.valor_custo, insumo.custo_referencia)).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {insumo.disponivel ? (
                                                        <span className="text-green-600">{Number(insumo.estoque).toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-red-500">0</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {insumo.formas_proibidas.length > 0 ? (
                                                        <span className="text-xs text-red-600">
                                                            {insumo.formas_proibidas.join(', ')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleToggleControlado(insumo)}
                                                        className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                                                        title="Remover controle"
                                                    >
                                                        Remover
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Regras de Exceção */}
            {activeTab === 'excecoes' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowAddExcecao(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Regra
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        </div>
                    ) : excecoes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Nenhuma regra de exceção cadastrada</div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insumo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma Proibida</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {excecoes.map((exc) => (
                                        <tr key={exc.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-mono text-gray-600">{exc.insumo_codigo}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{exc.insumo_descricao}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                                                    {exc.forma_nome}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{exc.descricao || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleRemoveExcecao(exc.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Remover regra"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Modal: Adicionar Exceção */}
                    {showAddExcecao && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Nova Regra de Exceção</h3>
                                    <button onClick={() => { setShowAddExcecao(false); setSelectedInsumo(null); setInsumoResults([]); setSearchInsumo(''); }}>
                                        <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                    </button>
                                </div>

                                {/* Buscar Insumo */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Insumo</label>
                                    {selectedInsumo ? (
                                        <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                            <span className="text-sm font-medium">
                                                [{selectedInsumo.codigo_interno}] {selectedInsumo.descricao}
                                            </span>
                                            <button onClick={() => setSelectedInsumo(null)} className="text-gray-400 hover:text-gray-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={searchInsumo}
                                                    onChange={(e) => setSearchInsumo(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearchInsumoForExcecao()}
                                                    placeholder="Buscar insumo por nome ou código..."
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                />
                                                <button onClick={handleSearchInsumoForExcecao} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                                                    <Search className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {insumoResults.length > 0 && (
                                                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                                                    {insumoResults.map((ins) => (
                                                        <button
                                                            key={ins.id}
                                                            onClick={() => { setSelectedInsumo(ins); setInsumoResults([]); }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                                        >
                                                            [{ins.codigo_interno}] {ins.descricao}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Forma Farmacêutica */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma Farmacêutica Proibida</label>
                                    <select
                                        value={addExcecaoForma}
                                        onChange={(e) => setAddExcecaoForma(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="">Selecione a forma...</option>
                                        {formas.map((f) => (
                                            <option key={f.id} value={f.id}>{f.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => { setShowAddExcecao(false); setSelectedInsumo(null); }}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddExcecao}
                                        disabled={!selectedInsumo || !addExcecaoForma}
                                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                                    >
                                        Adicionar Regra
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
