import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Mail, Phone, Edit, Trash2, FileText, Users, CheckCircle, XCircle } from 'lucide-react';
import { clinicService, type Clinica } from '../../services/clinicService';
import { StatusBadge } from '../../components/StatusBadge';
import { DocumentUpload } from '../../components/DocumentUpload';

export function AdminClinicDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [clinic, setClinic] = useState<Clinica | null>(null);
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState<any[]>([]);
    const [veterinarians, setVeterinarians] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'vets'>('info');

    useEffect(() => {
        if (id) {
            loadClinic();
            loadDocuments();
            loadVeterinarians();
        }
    }, [id]);

    const loadClinic = async () => {
        try {
            setLoading(true);
            const data = await clinicService.getById(id!);
            setClinic(data);
        } catch (error) {
            console.error('Error loading clinic:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async () => {
        try {
            const data = await clinicService.getDocuments(id!);
            setDocuments(data);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    };

    const loadVeterinarians = async () => {
        try {
            const data = await clinicService.getVeterinarians(id!);
            setVeterinarians(data);
        } catch (error) {
            console.error('Error loading veterinarians:', error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!id || !confirm(`Alterar status para ${newStatus}?`)) return;

        try {
            await clinicService.updateStatus(id, newStatus);
            loadClinic();
        } catch (error: any) {
            alert(error.message || 'Erro ao alterar status');
        }
    };

    const handleDocumentUpload = async (file: File, tipo: string) => {
        try {
            await clinicService.uploadDocument(id!, file, tipo);
            loadDocuments();
        } catch (error: any) {
            throw new Error(error.message || 'Erro ao fazer upload');
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('Excluir documento?')) return;

        try {
            await clinicService.deleteDocument(id!, docId);
            loadDocuments();
        } catch (error: any) {
            alert(error.message || 'Erro ao excluir documento');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (!clinic) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Clínica não encontrada</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/admin/clinicas')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{clinic.nome_fantasia}</h1>
                        <p className="text-gray-600">{clinic.razao_social}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <StatusBadge status={clinic.status} type="clinic" />
                    <button
                        onClick={() => navigate(`/admin/clinicas/${id}/editar`)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'info'
                                ? 'border-teal-600 text-teal-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Informações
                    </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'docs'
                                ? 'border-teal-600 text-teal-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <FileText className="w-4 h-4 inline mr-2" />
                        Documentos ({documents.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('vets')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vets'
                                ? 'border-teal-600 text-teal-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        Veterinários ({veterinarians.length})
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h3 className="font-semibold text-lg mb-4">Dados Cadastrais</h3>

                        <div>
                            <label className="text-sm text-gray-600">CNPJ</label>
                            <p className="font-medium">{clinic.cnpj}</p>
                        </div>

                        {clinic.inscricao_estadual && (
                            <div>
                                <label className="text-sm text-gray-600">Inscrição Estadual</label>
                                <p className="font-medium">{clinic.inscricao_estadual}</p>
                            </div>
                        )}

                        <div>
                            <label className="text-sm text-gray-600">Email</label>
                            <p className="font-medium flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>{clinic.email}</span>
                            </p>
                        </div>

                        {clinic.telefone && (
                            <div>
                                <label className="text-sm text-gray-600">Telefone</label>
                                <p className="font-medium flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{clinic.telefone}</span>
                                </p>
                            </div>
                        )}

                        {clinic.whatsapp && (
                            <div>
                                <label className="text-sm text-gray-600">WhatsApp</label>
                                <p className="font-medium">{clinic.whatsapp}</p>
                            </div>
                        )}
                    </div>

                    {/* Address */}
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h3 className="font-semibold text-lg mb-4">Endereço</h3>

                        {clinic.logradouro && (
                            <div>
                                <label className="text-sm text-gray-600">Logradouro</label>
                                <p className="font-medium">{clinic.logradouro}, {clinic.numero}</p>
                                {clinic.complemento && <p className="text-sm text-gray-600">{clinic.complemento}</p>}
                            </div>
                        )}

                        {clinic.bairro && (
                            <div>
                                <label className="text-sm text-gray-600">Bairro</label>
                                <p className="font-medium">{clinic.bairro}</p>
                            </div>
                        )}

                        {clinic.cidade && (
                            <div>
                                <label className="text-sm text-gray-600">Cidade/Estado</label>
                                <p className="font-medium flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>{clinic.cidade}/{clinic.estado}</span>
                                </p>
                            </div>
                        )}

                        {clinic.cep && (
                            <div>
                                <label className="text-sm text-gray-600">CEP</label>
                                <p className="font-medium">{clinic.cep}</p>
                            </div>
                        )}
                    </div>

                    {/* Responsible */}
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h3 className="font-semibold text-lg mb-4">Responsável Legal</h3>

                        <div>
                            <label className="text-sm text-gray-600">Nome</label>
                            <p className="font-medium">{clinic.responsavel_legal}</p>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">CPF</label>
                            <p className="font-medium">{clinic.cpf_responsavel}</p>
                        </div>
                    </div>

                    {/* Status Actions */}
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h3 className="font-semibold text-lg mb-4">Ações de Status</h3>

                        <div className="space-y-2">
                            {clinic.status !== 'APROVADA' && (
                                <button
                                    onClick={() => handleStatusChange('APROVADA')}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Aprovar Clínica</span>
                                </button>
                            )}

                            {clinic.status !== 'SUSPENSA' && (
                                <button
                                    onClick={() => handleStatusChange('SUSPENSA')}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Suspender Clínica</span>
                                </button>
                            )}
                        </div>

                        {clinic.observacoes_internas && (
                            <div className="mt-4 pt-4 border-t">
                                <label className="text-sm text-gray-600">Observações Internas</label>
                                <p className="text-sm mt-1">{clinic.observacoes_internas}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'docs' && (
                <div className="space-y-6">
                    {/* Upload Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-lg mb-4">Upload de Documentos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DocumentUpload
                                onUpload={(file) => handleDocumentUpload(file, 'contrato_social')}
                                tipoDocumento="contrato_social"
                                label="Contrato Social"
                                acceptedTypes=".pdf"
                            />
                            <DocumentUpload
                                onUpload={(file) => handleDocumentUpload(file, 'cartao_cnpj')}
                                tipoDocumento="cartao_cnpj"
                                label="Cartão CNPJ"
                                acceptedTypes=".pdf,.png,.jpg,.jpeg"
                            />
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b">
                            <h3 className="font-semibold text-lg">Documentos Enviados</h3>
                        </div>
                        {documents.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                Nenhum documento enviado
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {documents.map((doc) => (
                                    <li key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            <FileText className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium">{doc.nome_arquivo}</p>
                                                <p className="text-sm text-gray-500">{doc.tipo_documento}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <a
                                                href={doc.url_arquivo}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-teal-600 hover:text-teal-700 text-sm"
                                            >
                                                Ver
                                            </a>
                                            <button
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'vets' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Veterinários Vinculados</h3>
                        <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                            + Vincular Veterinário
                        </button>
                    </div>
                    {veterinarians.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            Nenhum veterinário vinculado
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {veterinarians.map((vet) => (
                                <li key={vet.id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{vet.nome}</p>
                                            <p className="text-sm text-gray-600">CRV: {vet.crv}</p>
                                            {vet.cargo && <p className="text-sm text-gray-500">{vet.cargo}</p>}
                                        </div>
                                        <button className="text-red-600 hover:text-red-700 text-sm">
                                            Desvincular
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
