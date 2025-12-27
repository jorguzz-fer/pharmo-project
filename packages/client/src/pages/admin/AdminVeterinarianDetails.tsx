import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, Mail, Phone, Edit, Building2 } from 'lucide-react';
import { veterinarianService, type Veterinarian } from '../../services/veterinarianService';
import { StatusBadge } from '../../components/StatusBadge';

export function AdminVeterinarianDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vet, setVet] = useState<Veterinarian | null>(null);
    const [clinics, setClinics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadVeterinarian();
            loadClinics();
        }
    }, [id]);

    const loadVeterinarian = async () => {
        try {
            setLoading(true);
            const data = await veterinarianService.getById(id!);
            setVet(data);
        } catch (error) {
            console.error('Error loading veterinarian:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadClinics = async () => {
        try {
            const data = await veterinarianService.getClinics(id!);
            setClinics(data);
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (!vet) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Veterinário não encontrado</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/admin/veterinarios')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vet.nome}</h1>
                        <p className="text-gray-600">CRV: {vet.crv}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <StatusBadge status={vet.status} type="vet" />
                    <button
                        onClick={() => navigate(`/admin/veterinarios/${id}/editar`)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                        <Stethoscope className="w-5 h-5 text-teal-600" />
                        <span>Informações Pessoais</span>
                    </h3>

                    <div>
                        <label className="text-sm text-gray-600">Nome Completo</label>
                        <p className="font-medium">{vet.nome}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">CPF</label>
                        <p className="font-medium">{vet.cpf}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="font-medium flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{vet.email}</span>
                        </p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Telefone</label>
                        <p className="font-medium flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{vet.telefone}</span>
                        </p>
                    </div>
                </div>

                {/* Professional Info */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Informações Profissionais</h3>

                    <div>
                        <label className="text-sm text-gray-600">CRV</label>
                        <p className="font-medium">{vet.crv}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">UF do CRMV</label>
                        <p className="font-medium">{vet.uf_crmv}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Número do CRMV</label>
                        <p className="font-medium">{vet.numero_crmv}</p>
                    </div>

                    {vet.especialidades && vet.especialidades.length > 0 && (
                        <div>
                            <label className="text-sm text-gray-600 mb-2 block">Especialidades</label>
                            <div className="flex flex-wrap gap-2">
                                {vet.especialidades.map((esp: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                    >
                                        {esp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Clinics */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h3 className="font-semibold text-lg flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-teal-600" />
                        <span>Clínicas Vinculadas ({clinics.length})</span>
                    </h3>
                </div>
                {clinics.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        Nenhuma clínica vinculada
                    </div>
                ) : (
                    <ul className="divide-y">
                        {clinics.map((clinic) => (
                            <li
                                key={clinic.id}
                                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => navigate(`/admin/clinicas/${clinic.id}`)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{clinic.nome_fantasia}</p>
                                        <p className="text-sm text-gray-600">
                                            {clinic.cidade}/{clinic.estado}
                                        </p>
                                        {clinic.cargo && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Cargo: {clinic.cargo}
                                            </p>
                                        )}
                                    </div>
                                    <StatusBadge status={clinic.status} type="clinic" />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
