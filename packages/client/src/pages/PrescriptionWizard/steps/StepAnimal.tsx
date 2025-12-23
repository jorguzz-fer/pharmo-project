import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, ArrowLeft, Cat, Dog, Plus, Loader2 } from 'lucide-react';
import { usePrescriptionStore } from '../../../store/prescription';
import { api } from '../../../services/api';

type AnimalForm = {
    name: string;
    species: string;
    weight: number;
    breed: string; // Added breed field
};

export function StepAnimal() {
    const { setAnimal, setStep, animal: selectedAnimal, tutor } = usePrescriptionStore();
    const { register, handleSubmit } = useForm<AnimalForm>({
        defaultValues: selectedAnimal || {}
    });

    const [animals, setAnimals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Fetch existing animals for tutor
    useEffect(() => {
        if (tutor?.id) {
            setLoading(true);
            api.get(`/tutores/${tutor.id}/animais`)
                .then(setAnimals)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [tutor?.id]);

    const onSubmit = async (data: AnimalForm) => {
        setCreating(true);
        try {
            if (!tutor?.id) throw new Error("Tutor not selected");

            const animalData = {
                tutor_id: tutor.id,
                nome: data.name,
                especie: data.species,
                peso: Number(data.weight), // Convert to number
                raca: data.breed || undefined,
            };

            const newAnimal = await api.post('/animais', animalData);

            setAnimal(newAnimal);
            setStep(3);
        } catch (error) {
            console.error(error);
            alert('Erro ao cadastrar animal');
        } finally {
            setCreating(false);
        }
    };

    const handleSelectAnimal = (a: any) => {
        setAnimal(a);
        setStep(3);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">2. Selecione o Paciente de {tutor?.name}</h2>

            {!showForm && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {loading ? (
                        <div className="col-span-2 text-center py-8 text-gray-500">Carregando animais...</div>
                    ) : animals.map((a) => (
                        <div
                            key={a.id}
                            onClick={() => handleSelectAnimal(a)}
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

                    <div
                        onClick={() => setShowForm(true)}
                        className="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all min-h-[100px]"
                    >
                        <Plus className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">Novo Animal</span>
                    </div>
                </div>
            )}

            {(showForm || animals.length === 0 && !loading) && (
                <>
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
                                <input {...register('name', { required: true })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
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
                                <input type="number" step="0.1" {...register('weight', { required: true })} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
                                <input {...register('breed')} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" placeholder="Ex: SRD" />
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    if (animals.length > 0) setShowForm(false);
                                    else setStep(1);
                                }}
                                className="flex items-center gap-2 px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                            >
                                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                Próximo: Prescrição
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}
