import { useForm } from 'react-hook-form';
import { ArrowRight, Search } from 'lucide-react';
import { usePrescriptionStore } from '../../../store/prescription';

type TutorForm = {
    cpf: string;
    name: string;
    phone: string;
};

export function StepTutor() {
    const { setTutor, setStep, tutor } = usePrescriptionStore();
    const { register, handleSubmit, setValue } = useForm<TutorForm>({
        defaultValues: tutor || {}
    });

    const onSubmit = (data: TutorForm) => {
        // Mock simulation of API response with ID
        setTutor({ ...data, id: 'mock-tutor-id' });
        setStep(2);
    };

    const handleSearch = () => {
        // Mock search logic
        console.log('Searching for CPF...');
        // Simulate finding a user
        setValue('name', 'Maria Silva');
        setValue('phone', '(11) 99999-9999');
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">1. Identificação do Tutor</h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Buscar por CPF"
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    <button
                        type="button"
                        onClick={handleSearch}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
                    >
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
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
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                        >
                            Próximo: Animal
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
