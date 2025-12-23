import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Plus, Trash2, Sparkles } from 'lucide-react';
import { usePrescriptionStore } from '../../../store/prescription';

type MedForm = {
    codigo?: string;
    drug: string;
    dosage: string;
    form: string;
    amount: string;
    observations: string;
};

export function StepMedication() {
    const { medications, addMedication, removeMedication, setStep, animal } = usePrescriptionStore();
    const { register, handleSubmit, reset, setValue } = useForm<MedForm>();
    const [showForm, setShowForm] = useState(medications.length === 0);

    const onSubmit = (data: MedForm) => {
        addMedication(data);
        reset();
        setShowForm(false);
    };

    const handleNext = () => {
        if (medications.length === 0) {
            alert('Adicione pelo menos um medicamento');
            return;
        }
        setStep(4);
    };

    const handleQuickFill = () => {
        if (animal?.peso || animal?.weight) {
            const weight = animal.peso || animal.weight || 0;
            setValue('drug', 'Apoquel');
            setValue('dosage', `${(weight * 0.5).toFixed(1)}mg`);
            setValue('form', 'Comprimido');
            setValue('amount', '1 caixa');
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">3. Prescrição Médica</h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-bold text-blue-900 text-sm">Auxiliar Inteligente</h4>
                        <p className="text-sm text-blue-700">
                            Adicione múltiplos medicamentos. Peso do paciente: {animal?.peso || animal?.weight || 0}kg
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleQuickFill}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                        Preencher Exemplo
                    </button>
                </div>

                {medications.length > 0 && (
                    <div className="mb-6 space-y-3">
                        <h3 className="font-semibold text-gray-900">Medicamentos Adicionados ({medications.length})</h3>
                        {medications.map((med, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-bold text-gray-900">{med.drug}</h4>
                                        {med.codigo && (
                                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                                Cód: {med.codigo}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">Dosagem:</span> {med.dosage}
                                        </div>
                                        <div>
                                            <span className="font-medium">Forma:</span> {med.form}
                                        </div>
                                        <div>
                                            <span className="font-medium">Qtd:</span> {med.amount}
                                        </div>
                                    </div>
                                    {med.observations && (
                                        <p className="text-sm text-gray-600 mt-2">{med.observations}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMedication(index)}
                                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!showForm && (
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Adicionar Medicamento</span>
                    </button>
                )}

                {showForm && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-gray-900">Novo Medicamento</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código do Medicamento (opcional)
                                </label>
                                <input
                                    {...register('codigo')}
                                    placeholder="Ex: MED-001"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Medicamento *
                                </label>
                                <input
                                    {...register('drug', { required: true })}
                                    placeholder="Ex: Apoquel"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dosagem *</label>
                                <input
                                    {...register('dosage', { required: true })}
                                    placeholder="Ex: 10mg"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Forma *</label>
                                <select
                                    {...register('form', { required: true })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none"
                                >
                                    <option value="Comprimido">Comprimido</option>
                                    <option value="Liquido">Líquido / Xarope</option>
                                    <option value="Pasta">Pasta Oral</option>
                                    <option value="Biscoito">Biscoito Medicamentoso</option>
                                    <option value="Injetável">Injetável</option>
                                    <option value="Pomada">Pomada/Creme</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                                <input
                                    {...register('amount', { required: true })}
                                    placeholder="Ex: 1 caixa"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Observações / Posologia
                            </label>
                            <textarea
                                {...register('observations')}
                                rows={2}
                                placeholder="Ex: Dar 1 comprimido a cada 12 horas..."
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                            >
                                Adicionar
                            </button>
                            {medications.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        reset();
                                        setShowForm(false);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                )}

                <div className="flex justify-between pt-6 border-t mt-6">
                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex items-center gap-2 px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                    >
                        Revisar Prescrição
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
