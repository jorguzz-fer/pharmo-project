import { useState, useEffect } from 'react';
import { Plus, Search, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { clinicService, type Clinica } from '../../services/clinicService';
import { StatusBadge } from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';

export function AdminClinics() {
    const navigate = useNavigate();
    const [clinics, setClinics] = useState<Clinica[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [cidadeFilter, setCidadeFilter] = useState('');

    useEffect(() => {
        loadClinics();
    }, [statusFilter, cidadeFilter]);

    const loadClinics = async () => {
        try {
            setLoading(true);
            const data = await clinicService.getAll({
                status: statusFilter || undefined,
                cidade: cidadeFilter || undefined,
                search: search || undefined
            });
            setClinics(data);
        } catch (error) {
            console.error('Error loading clinics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadClinics();
    };

    const filteredClinics = clinics.filter(clinic => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            clinic.nome_fantasia.toLowerCase().includes(searchLower) ||
            clinic.cnpj.includes(search) ||
            clinic.cidade?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Clínicas</h1>
                    <p className="text-gray-600 mt-1">Gerencie clínicas cadastradas no sistema</p>
                </div>
                <button
                    onClick={() => navigate('/admin/clinicas/nova')}
                    className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nova Clínica</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, CNPJ ou cidade..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                            <option value="">Todos os status</option>
                            <option value="PENDENTE">Pendente</option>
                            <option value="EM_ANALISE">Em Análise</option>
                            <option value="APROVADA">Aprovada</option>
                            <option value="SUSPENSA">Suspensa</option>
                            <option value="INATIVA">Inativa</option>
                        </select>
                    </div>

                    {/* City Filter */}
                    <div>
                        <input
                            type="text"
                            placeholder="Filtrar por cidade"
                            value={cidadeFilter}
                            onChange={(e) => setCidadeFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Clinics List */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            ) : filteredClinics.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma clínica encontrada</h3>
                    <p className="text-gray-600">
                        {search || statusFilter || cidadeFilter
                            ? 'Tente ajustar os filtros de busca'
                            : 'Comece cadastrando uma nova clínica'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClinics.map((clinic) => (
                        <div
                            key={clinic.id}
                            onClick={() => navigate(`/admin/clinicas/${clinic.id}`)}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 space-y-4"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                        {clinic.nome_fantasia}
                                    </h3>
                                    <p className="text-sm text-gray-600">{clinic.razao_social}</p>
                                </div>
                                <StatusBadge status={clinic.status} type="clinic" />
                            </div>

                            {/* Info */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Building2 className="w-4 h-4" />
                                    <span>CNPJ: {clinic.cnpj}</span>
                                </div>

                                {clinic.cidade && clinic.estado && (
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <MapPin className="w-4 h-4" />
                                        <span>{clinic.cidade}/{clinic.estado}</span>
                                    </div>
                                )}

                                {clinic.telefone && (
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Phone className="w-4 h-4" />
                                        <span>{clinic.telefone}</span>
                                    </div>
                                )}

                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <span className="truncate">{clinic.email}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    Responsável: {clinic.responsavel_legal}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {!loading && filteredClinics.length > 0 && (
                <div className="text-center text-sm text-gray-600">
                    Mostrando {filteredClinics.length} clínica{filteredClinics.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
