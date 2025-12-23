import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Search, Loader2 } from 'lucide-react';
import { usePrescriptionStore } from '../../../store/prescription';
import { api } from '../../../services/api';

type TutorForm = {
    cpf: string;
    name: string;
    phone: string;
};

export function StepTutor() {
    const { setTutor, setStep, tutor } = usePrescriptionStore();
    const { register, handleSubmit, setValue, watch } = useForm<TutorForm>({
        defaultValues: tutor || {}
    });
    const [isLoading, setIsLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const cpfValue = watch('cpf');

    const onSubmit = async (data: TutorForm) => {
        setIsLoading(true);
        try {
            // Check if we already have an ID (from search)
            if (tutor?.id && tutor.cpf === data.cpf) {
                setTutor({ ...tutor, ...data });
                setStep(2);
                return;
            }

            // Otherwise create new tutor
            const newTutor = await api.post('/tutores', data);
            setTutor(newTutor);
            setStep(2);
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar tutor. Verifique os dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!cpfValue) return;
        setSearchLoading(true);
        try {
            const results = await api.get(`/tutores/buscar?cpf=${cpfValue}`);
            if (results && results.length > 0) {
                const found = results[0];
                setValue('name', found.name);
                setValue('phone', found.phone);
                setTutor(found); // Save text status with ID
            } else {
                alert('Tutor não encontrado. Preencha os dados para cadastrar.');
                setTutor(null); // Clear previous selection
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao buscar tutor');
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
                            {...register('cpf')}
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
