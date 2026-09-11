import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Search, Loader2 } from 'lucide-react';
import { usePrescriptionStore } from '../../../store/prescription';
import { api } from '../../../services/api';

type TutorForm = {
    cpf: string;
    name: string;
    phone: string;
    entrega_na_clinica: boolean;
    endereco_entrega: string;
};

export function StepTutor() {
    const { setTutor, setStep, tutor } = usePrescriptionStore();
    const { register, handleSubmit, setValue, watch } = useForm<TutorForm>({
        defaultValues: tutor || {}
    });
    const entregaNaClinica = watch('entrega_na_clinica');
    const [isLoading, setIsLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchCpf, setSearchCpf] = useState('');

    const onSubmit = async (data: TutorForm) => {
        setIsLoading(true);
        try {
            // Sempre grava: o endpoint é um upsert por CPF, então um tutor já
            // cadastrado tem os dados de entrega atualizados em vez de ignorados.
            const tutorData = {
                nome: data.name,
                cpf: data.cpf,
                telefone: data.phone,
                entrega_na_clinica: Boolean(data.entrega_na_clinica),
                endereco_entrega: data.entrega_na_clinica ? undefined : data.endereco_entrega,
                // email is optional
            };

            const newTutor = await api.post('/tutores', tutorData);
            // Map backend fields to frontend format
            setTutor({
                ...newTutor,
                name: newTutor.nome || data.name,
                phone: newTutor.telefone || data.phone,
                cpf: newTutor.cpf || data.cpf,
            });
            setStep(2);
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || 'Erro desconhecido';

            // If tutor already exists (fallback for old API), search and use existing
            if (errorMessage.includes('já cadastrado') || errorMessage.includes('CPF')) {
                try {
                    const cpf = data.cpf.replace(/\D/g, '');
                    const existing = await api.get(`/tutores/buscar?cpf=${cpf}`);
                    if (existing?.id) {
                        setTutor({ ...existing, name: existing.nome, phone: existing.telefone });
                        setStep(2);
                        return;
                    }
                } catch { /* fall through to error alert */ }
            }

            alert(`Erro ao salvar tutor: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        setSearchLoading(true);
        try {
            const cpf = searchCpf?.replace(/\D/g, '');
            if (!cpf) return alert('Digite um CPF');

            const response = await api.get(`/tutores/buscar?cpf=${cpf}`);
            const found = response;

            if (found && found.id) {
                setValue('cpf', found.cpf);
                setValue('name', found.nome);
                setValue('phone', found.telefone);
                setValue('entrega_na_clinica', Boolean(found.entrega_na_clinica));
                setValue('endereco_entrega', found.endereco_entrega || '');
                setTutor({ ...found, name: found.nome, phone: found.telefone }); // Map to frontend format
            } else {
                alert('Tutor não encontrado. Preencha os dados para cadastrar.');
                setTutor(null); // Clear previous selection
            }
        } catch (error: any) {
            console.error(error);
            // Check if it's a 404 (not found) error
            if (error.message?.includes('não encontrado') || error.message?.includes('404')) {
                alert('Tutor não encontrado. Preencha os dados para cadastrar.');
                setTutor(null);
            } else {
                alert('Erro ao buscar tutor: ' + (error.message || 'Erro desconhecido'));
            }
        } finally {
            setSearchLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">1. Identificação do Tutor</h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchCpf}
                            onChange={(e) => setSearchCpf(e.target.value)}
                            placeholder="Buscar por CPF"
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={searchLoading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                        {searchLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Buscar
                    </button>
                </div>

                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Ou cadastre um novo</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                            <input
                                {...register('name', { required: true })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF (Confirmar)</label>
                            <input
                                {...register('cpf', { required: true })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input
                                {...register('phone', { required: true })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Entrega: na clínica parceira ou no endereço do tutor */}
                    <div className="mt-6 border-t border-gray-100 pt-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Entrega</h3>
                        <label className="flex items-center gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('entrega_na_clinica')}
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            Entregar na clínica
                        </label>

                        {!entregaNaClinica && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Endereço de entrega
                                </label>
                                <textarea
                                    {...register('endereco_entrega')}
                                    rows={2}
                                    placeholder="Rua, número, complemento, bairro, cidade/UF e CEP"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Próximo: Animal
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
