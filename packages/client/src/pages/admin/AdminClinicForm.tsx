import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { clinicService, type ClinicaFormData } from '../../services/clinicService';

/**
 * Condições comerciais do parceiro. Ficam separadas do restante do formulário
 * porque são numéricas (e o desconto é digitado em %, gravado entre 0 e 1).
 */
const CONDICOES_VAZIAS = {
    taxa_manipulacao: '',
    custo_embalagens: '',
    desconto_parceiro: '',
    adicional_entrega: '',
    adicional_biscoito: '',
};

type CondicoesForm = typeof CONDICOES_VAZIAS;

const CAMPOS_COMERCIAIS: { name: keyof CondicoesForm; label: string; hint: string; step: string; max?: string }[] = [
    {
        name: 'taxa_manipulacao',
        label: 'Taxa de Manipulação (R$)',
        hint: 'Valor fixo cobrado por manipulação',
        step: '0.01',
    },
    {
        name: 'custo_embalagens',
        label: 'Custo de Embalagens (R$)',
        hint: 'Custo fixo de embalagem por pedido',
        step: '0.01',
    },
    {
        name: 'desconto_parceiro',
        label: 'Desconto Parceiro (%)',
        hint: 'Percentual sobre o subtotal (ex: 10 = 10%)',
        step: '0.1',
        max: '100',
    },
    {
        name: 'adicional_entrega',
        label: 'Adicional Entrega (R$)',
        hint: 'Taxa adicional para entrega',
        step: '0.01',
    },
    {
        name: 'adicional_biscoito',
        label: 'Adicional Biscoito (R$)',
        hint: 'Taxa adicional para forma biscoito/petisco',
        step: '0.01',
    },
];

/** Texto do input para número, aceitando vírgula como separador decimal. */
function paraNumero(valor: string): number | undefined {
    if (!valor.trim()) return undefined;
    const n = parseFloat(valor.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
}

export function AdminClinicForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [formData, setFormData] = useState<ClinicaFormData>({
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        inscricao_estadual: '',
        email: '',
        telefone: '',
        whatsapp: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        responsavel_legal: '',
        cpf_responsavel: '',
        observacoes_internas: ''
    });
    const [comercialData, setComercialData] = useState<CondicoesForm>(CONDICOES_VAZIAS);

    useEffect(() => {
        if (id) {
            loadClinic();
        }
    }, [id]);

    const loadClinic = async () => {
        try {
            const clinic = await clinicService.getById(id!);
            setFormData({
                nome_fantasia: clinic.nome_fantasia,
                razao_social: clinic.razao_social,
                cnpj: clinic.cnpj,
                inscricao_estadual: clinic.inscricao_estadual || '',
                email: clinic.email,
                telefone: clinic.telefone || '',
                whatsapp: clinic.whatsapp || '',
                cep: clinic.cep || '',
                logradouro: clinic.logradouro || '',
                numero: clinic.numero || '',
                complemento: clinic.complemento || '',
                bairro: clinic.bairro || '',
                cidade: clinic.cidade || '',
                estado: clinic.estado || '',
                responsavel_legal: clinic.responsavel_legal,
                cpf_responsavel: clinic.cpf_responsavel,
                observacoes_internas: clinic.observacoes_internas || ''
            });
            setComercialData({
                taxa_manipulacao: clinic.taxa_manipulacao != null ? String(clinic.taxa_manipulacao) : '',
                custo_embalagens: clinic.custo_embalagens != null ? String(clinic.custo_embalagens) : '',
                desconto_parceiro: clinic.desconto_parceiro != null ? String(Number(clinic.desconto_parceiro) * 100) : '',
                adicional_entrega: clinic.adicional_entrega != null ? String(clinic.adicional_entrega) : '',
                adicional_biscoito: clinic.adicional_biscoito != null ? String(clinic.adicional_biscoito) : '',
            });
        } catch (error) {
            console.error('Error loading clinic:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const desconto = paraNumero(comercialData.desconto_parceiro);
        if (desconto !== undefined && (desconto < 0 || desconto > 100)) {
            alert('O desconto deve estar entre 0 e 100%');
            return;
        }

        // Campo em branco vira null: a clínica fica sem aquela condição, e o
        // motor de precificação trata como zero.
        const condicoes = {
            taxa_manipulacao: paraNumero(comercialData.taxa_manipulacao) ?? null,
            custo_embalagens: paraNumero(comercialData.custo_embalagens) ?? null,
            desconto_parceiro: desconto !== undefined ? desconto / 100 : null,
            adicional_entrega: paraNumero(comercialData.adicional_entrega) ?? null,
            adicional_biscoito: paraNumero(comercialData.adicional_biscoito) ?? null,
        };

        setLoading(true);

        try {
            const payload = { ...formData, ...condicoes };
            if (id) {
                await clinicService.update(id, payload);
            } else {
                await clinicService.create(payload);
            }
            navigate('/admin/clinicas');
        } catch (error: any) {
            console.error('Error saving clinic:', error);
            // Extract error message properly
            let errorMessage = 'Erro ao salvar clínica';
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleComercialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setComercialData({
            ...comercialData,
            [e.target.name]: e.target.value
        });
    };

    const handleCepBlur = async () => {
        const cep = (formData.cep || '').replace(/\D/g, '');

        if (cep.length !== 8) return;

        setLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                alert('CEP não encontrado');
                return;
            }

            setFormData({
                ...formData,
                logradouro: data.logradouro || '',
                bairro: data.bairro || '',
                cidade: data.localidade || '',
                estado: data.uf || ''
            });
        } catch (error) {
            console.error('Error fetching CEP:', error);
            alert('Erro ao buscar CEP');
        } finally {
            setLoadingCep(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/admin/clinicas')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {id ? 'Editar Clínica' : 'Nova Clínica'}
                </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Dados Cadastrais</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Fantasia *
                            </label>
                            <input
                                type="text"
                                name="nome_fantasia"
                                value={formData.nome_fantasia}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Razão Social *
                            </label>
                            <input
                                type="text"
                                name="razao_social"
                                value={formData.razao_social}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CNPJ *
                            </label>
                            <input
                                type="text"
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleChange}
                                required
                                placeholder="00.000.000/0000-00"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Inscrição Estadual
                            </label>
                            <input
                                type="text"
                                name="inscricao_estadual"
                                value={formData.inscricao_estadual}
                                onChange={handleChange}
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
                                Telefone
                            </label>
                            <input
                                type="tel"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                placeholder="(00) 0000-0000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                WhatsApp
                            </label>
                            <input
                                type="tel"
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
                                placeholder="(00) 00000-0000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Endereço</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CEP
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="cep"
                                    value={formData.cep}
                                    onChange={handleChange}
                                    onBlur={handleCepBlur}
                                    placeholder="00000-000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                {loadingCep && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                                    </div>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Digite o CEP e pressione Tab para buscar o endereço</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Logradouro
                            </label>
                            <input
                                type="text"
                                name="logradouro"
                                value={formData.logradouro}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número
                            </label>
                            <input
                                type="text"
                                name="numero"
                                value={formData.numero}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Complemento
                            </label>
                            <input
                                type="text"
                                name="complemento"
                                value={formData.complemento}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bairro
                            </label>
                            <input
                                type="text"
                                name="bairro"
                                value={formData.bairro}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cidade
                            </label>
                            <input
                                type="text"
                                name="cidade"
                                value={formData.cidade}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="">Selecione</option>
                                <option value="SP">SP</option>
                                <option value="RJ">RJ</option>
                                <option value="MG">MG</option>
                                {/* Add more states */}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Responsible */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Responsável Legal</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                name="responsavel_legal"
                                value={formData.responsavel_legal}
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
                                name="cpf_responsavel"
                                value={formData.cpf_responsavel}
                                onChange={handleChange}
                                required
                                placeholder="000.000.000-00"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Commercial Conditions */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-1">Condições Comerciais</h3>
                        <p className="text-sm text-gray-500">
                            Taxas, desconto e adicionais deste parceiro, usados no motor de precificação.
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        Campo em branco vale <strong>zero</strong> no cálculo — sem desconto, sem frete, sem taxa.
                        O preço sai mesmo assim, então preencha o que já estiver acordado.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {CAMPOS_COMERCIAIS.map((campo) => (
                            <div key={campo.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {campo.label}
                                </label>
                                <input
                                    type="number"
                                    name={campo.name}
                                    value={comercialData[campo.name]}
                                    onChange={handleComercialChange}
                                    step={campo.step}
                                    min="0"
                                    max={campo.max}
                                    placeholder="0,00"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                <p className="mt-1 text-xs text-gray-500">{campo.hint}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Internal Notes */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Observações Internas</h3>

                    <textarea
                        name="observacoes_internas"
                        value={formData.observacoes_internas}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Anotações internas visíveis apenas para administradores..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/clinicas')}
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
                        <span>{loading ? 'Salvando...' : 'Salvar Clínica'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
