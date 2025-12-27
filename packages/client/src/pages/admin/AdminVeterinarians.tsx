import { useState, useEffect } from 'react';
import { Plus, Search, User, Phone, Mail, Stethoscope } from 'lucide-react';
import { veterinarianService, type Veterinarian } from '../../services/veterinarianService';
import { StatusBadge } from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';

export function AdminVeterinarians() {
    const navigate = useNavigate();
    const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadVeterinarians();
    }, []);

    const loadVeterinarians = async () => {
        try {
            setLoading(true);
            const data = await veterinarianService.getAll();
            setVeterinarians(data);
        } catch (error) {
            console.error('Error loading veterinarians:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredVeterinarians = veterinarians.filter(vet => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            vet.nome.toLowerCase().includes(searchLower) ||
            vet.crv.toLowerCase().includes(searchLower) ||
            vet.cpf.includes(search) ||
            vet.email.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Veterinários</h1>
                    <p className="text-gray-600 mt-1">Gerencie veterinários cadastrados no sistema</p>
                </div>
                <button
                    onClick={() => navigate('/admin/veterinarios/novo')}
                    className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Novo Veterinário</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CRV, CPF ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Veterinarians List */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            ) : filteredVeterinarians.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum veterinário encontrado</h3>
                    <p className="text-gray-600">
                        {search
                            ? 'Tente ajustar os termos de busca'
                            : 'Comece cadastrando um novo veterinário'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Veterinário
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CRV
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contato
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Especialidades
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVeterinarians.map((vet) => (
                                <tr
                                    key={vet.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/admin/veterinarios/${vet.id}`)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                                                <Stethoscope className="h-5 w-5 text-teal-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {vet.nome}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    CPF: {vet.cpf}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{vet.crv}</div>
                                        <div className="text-sm text-gray-500">{vet.uf_crmv}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                                                <Phone className="w-3 h-3" />
                                                <span>{vet.telefone}</span>
                                            </div>
                                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                                                <Mail className="w-3 h-3" />
                                                <span className="truncate max-w-xs">{vet.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {vet.especialidades && vet.especialidades.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {vet.especialidades.slice(0, 2).map((esp: string, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                                        >
                                                            {esp}
                                                        </span>
                                                    ))}
                                                    {vet.especialidades.length > 2 && (
                                                        <span className="text-xs text-gray-500">
                                                            +{vet.especialidades.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={vet.status} type="vet" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/admin/veterinarios/${vet.id}`);
                                            }}
                                            className="text-teal-600 hover:text-teal-900"
                                        >
                                            Ver detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Summary */}
            {!loading && filteredVeterinarians.length > 0 && (
                <div className="text-center text-sm text-gray-600">
                    Mostrando {filteredVeterinarians.length} veterinário{filteredVeterinarians.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
