import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { veterinarianService, type VeterinarianFormData } from '../../services/veterinarianService';

export function AdminVeterinarianForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<VeterinarianFormData>({
        nome: '',
        cpf: '',
        crv: '',
        uf_crmv: '',
        numero_crmv: '',
        email: '',
        telefone: '',
        especialidades: []
    });
    const [especialidadeInput, setEspecialidadeInput] = useState('');

    useEffect(() => {
        if (id) {
            loadVeterinarian();
        }
    }, [id]);

    const loadVeterinarian = async () => {
        try {
            const vet = await veterinarianService.getById(id!);
            setFormData({
                nome: vet.nome,
                cpf: vet.cpf,
                crv: vet.crv,
                uf_crmv: vet.uf_crmv,
                numero_crmv: vet.numero_crmv,
                email: vet.email,
                telefone: vet.telefone,
                especialidades: vet.especialidades || []
            });
        } catch (error) {
            console.error('Error loading veterinarian:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id) {
                await veterinarianService.update(id, formData);
            } else {
                await veterinarianService.create(formData);
            }
            navigate('/admin/veterinarios');
        } catch (error: any) {
            console.error('Error saving veterinarian:', error);
            // Extract error message properly
            let errorMessage = 'Erro ao salvar veterinário';
            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.error) {
                errorMessage = error.error;
            }
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const addEspecialidade = () => {
        if (especialidadeInput.trim()) {
            setFormData({
                ...formData,
                especialidades: [...(formData.especialidades || []), especialidadeInput.trim()]
            });
            setEspecialidadeInput('');
        }
    };

    const removeEspecialidade = (index: number) => {
        setFormData({
            ...formData,
            especialidades: formData.especialidades?.filter((_, i) => i !== index) || []
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/admin/veterinarios')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {id ? 'Editar Veterinário' : 'Novo Veterinário'}
                </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Informações Pessoais</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CPF *
                            </label>
                            <input
                                type="text"
                                name="cpf"
                                value={formData.cpf}
                                onChange={handleChange}
                                required
                                placeholder="000.000.000-00"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone *
                            </label>
                            <input
                                type="tel"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                required
                                placeholder="(00) 00000-0000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Professional Info */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Informações Profissionais</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CRV *
                            </label>
                            <input
                                type="text"
                                name="crv"
                                value={formData.crv}
                                onChange={handleChange}
                                required
                                placeholder="SP-12345"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                UF *
                            </label>
                            <select
                                name="uf_crmv"
                                value={formData.uf_crmv}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="">Selecione</option>
                                <option value="SP">SP</option>
                                <option value="RJ">RJ</option>
                                <option value="MG">MG</option>
                                {/* Add more states */}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número CRMV *
                            </label>
                            <input
                                type="text"
                                name="numero_crmv"
                                value={formData.numero_crmv}
                                onChange={handleChange}
                                required
                                placeholder="12345"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Especialidades */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Especialidades
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={especialidadeInput}
                                onChange={(e) => setEspecialidadeInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEspecialidade())}
                                placeholder="Digite uma especialidade"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={addEspecialidade}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                Adicionar
                            </button>
                        </div>
                        {formData.especialidades && formData.especialidades.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {formData.especialidades.map((esp, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                    >
                                        {esp}
                                        <button
                                            type="button"
                                            onClick={() => removeEspecialidade(idx)}
                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/veterinarios')}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{loading ? 'Salvando...' : 'Salvar Veterinário'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
