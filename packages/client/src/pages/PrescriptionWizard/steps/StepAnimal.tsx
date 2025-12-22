import { useForm } from 'react-hook-form';
import { ArrowRight, ArrowLeft, Cat, Dog, Plus } from 'lucide-react';
import { usePrescriptionStore } from '../../../store/prescription';

type AnimalForm = {
    name: string;
    species: string;
    weight: number;
};

export function StepAnimal() {
    const { setAnimal, setStep, animal } = usePrescriptionStore();
    const { register, handleSubmit } = useForm<AnimalForm>({
        defaultValues: animal || {}
    });

    const onSubmit = (data: AnimalForm) => {
        setAnimal({ ...data, id: 'mock-animal-id' });
        setStep(3);
    };

    // Mock animals linked to tutor
    const existingAnimals = [
        { id: '1', name: 'Thor', species: 'Cão', breed: 'Golden', weight: 32 },
        { id: '2', name: 'Luna', species: 'Gato', breed: 'Siames', weight: 4 },
    ];

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">2. Selecione o Paciente</h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
                {existingAnimals.map((a) => (
                    <div
                        key={a.id}
                        onClick={() => {
                            setAnimal(a);
                            setStep(3);
                        }}
                        className="cursor-pointer bg-white p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-green-200 text-gray-500 group-hover:text-green-700">
                            {a.species === 'Cão' ? <Dog className="w-6 h-6" /> : <Cat className="w-6 h-6" />}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">{a.name}</p>
                            <p className="text-sm text-gray-500">{a.breed} • {a.weight}kg</p>
                        </div>
                    </div>
                ))}

                <div className="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all">
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Novo Animal</span>
                </div>
            </div>

            <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Cadastro de Novo Paciente</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Paciente</label>
                        <input {...register('name')} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
                        <select {...register('species')} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none">
                            <option value="Cão">Cão</option>
                            <option value="Gato">Gato</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                        <input type="number" step="0.1" {...register('weight')} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
                    </div>
                </div>

                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex items-center gap-2 px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                    >
                        Próximo: Prescrição
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
