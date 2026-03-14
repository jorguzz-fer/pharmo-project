import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { principioAtivoService } from '../services/principioAtivo.service';
import type { PrincipioAtivo } from '../services/principioAtivo.service';
import { useNavigate } from 'react-router-dom';

export default function PrincipiosAtivos() {
    const navigate = useNavigate();
    const [principios, setPrincipios] = useState<PrincipioAtivo[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroControlado, setFiltroControlado] = useState<boolean | undefined>(undefined);
    const [filtroAtivo, setFiltroAtivo] = useState<boolean>(true);

    useEffect(() => {
        carregarPrincipios();
    }, [filtroControlado, filtroAtivo]);

    const carregarPrincipios = async () => {
        try {
            setLoading(true);
            const data = await principioAtivoService.listarTodos({
                ativo: filtroAtivo,
                controlado: filtroControlado,
                busca: busca || undefined
            });
            setPrincipios(data);
        } catch (error) {
            console.error('Erro ao carregar princípios ativos:', error);
            alert('Erro ao carregar princípios ativos');
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = () => {
        carregarPrincipios();
    };

    const handleDesativar = async (id: string, nome: string) => {
        if (!confirm(`Deseja realmente desativar "${nome}"?`)) {
            return;
        }

        try {
            await principioAtivoService.desativar(id);
            alert('Princípio ativo desativado com sucesso');
            carregarPrincipios();
        } catch (error) {
            console.error('Erro ao desativar:', error);
            alert('Erro ao desativar princípio ativo');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Princípios Ativos
                    </h1>
                    <p className="text-gray-600">
                        Gerencie os medicamentos e ranges terapêuticos do sistema
                    </p>
                </div>

                {/* Filtros e Busca */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Busca */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={busca}
                                        onChange={(e) => setBusca(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                                        placeholder="Nome do medicamento..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <button
                                    onClick={handleBuscar}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Buscar
                                </button>
                            </div>
                        </div>

                        {/* Filtro Controlado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo
                            </label>
                            <select
                                value={filtroControlado === undefined ? 'todos' : filtroControlado ? 'controlado' : 'nao-controlado'}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFiltroControlado(
                                        value === 'todos' ? undefined : value === 'controlado'
                                    );
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="todos">Todos</option>
                                <option value="nao-controlado">Não Controlados</option>
                                <option value="controlado">Controlados</option>
                            </select>
                        </div>

                        {/* Filtro Ativo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filtroAtivo ? 'ativo' : 'inativo'}
                                onChange={(e) => setFiltroAtivo(e.target.value === 'ativo')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ativo">Ativos</option>
                                <option value="inativo">Inativos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Botão Adicionar */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/admin/principios-ativos/novo')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Princípio Ativo
                    </button>
                </div>

                {/* Lista */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando...</p>
                    </div>
                ) : principios.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum princípio ativo encontrado</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Medicamento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Classe Terapêutica
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Concentrações
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ranges
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {principios.map((principio) => (
                                    <tr key={principio.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900">{principio.nome}</p>
                                                    {principio.controlado && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                                                            Controlado
                                                        </span>
                                                    )}
                                                </div>
                                                {principio.nome_cientifico && (
                                                    <p className="text-sm text-gray-500 italic">{principio.nome_cientifico}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">{principio.classe_terapeutica || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {principio.concentracoes?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {principio.ranges?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {principio.ativo ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Inativo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/principios-ativos/${principio.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {principio.ativo && (
                                                    <button
                                                        onClick={() => handleDesativar(principio.id, principio.nome)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Desativar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Resumo */}
                {!loading && principios.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600">
                        Mostrando {principios.length} {principios.length === 1 ? 'medicamento' : 'medicamentos'}
                    </div>
                )}
            </div>
        </div>
    );
}
