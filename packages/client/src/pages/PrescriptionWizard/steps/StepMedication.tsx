import React from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Search, Sparkles } from 'lucide-react';
import { usePrescriptionStore } from '../../../store/prescription';

type MedForm = {
    disease: string;
    drug: string;
    dosage: string;
    form: string;
    amount: string;
    observations: string;
};

export function StepMedication() {
    const { setMedication, setStep, medication, animal } = usePrescriptionStore();
    const { register, handleSubmit, setValue, watch } = useForm<MedForm>({
        defaultValues: medication || {}
    });

    const onSubmit = (data: MedForm) => {
        setMedication(data);
        setStep(4);
    };

    watch('disease');

    // Mock "AI" suggestion logic
    const handleDiseaseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const disease = e.target.value;
        if (disease === 'Dermatite Atópica') {
            setValue('drug', 'Apoquel');
            // Simple calculation mock
            const dosage = animal?.weight ? `${animal.weight * 0.5}mg` : 'TBD';
            setValue('dosage', dosage);
            setValue('form', 'Comprimido');
            setValue('amount', '1 caixa');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">3. Prescrição Médica</h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

                {/* Helper Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm">Auxiliar Inteligente</h4>
                        <p className="text-sm text-blue-700">Selecione uma doença do bulário para preenchimento automático baseado no peso do paciente ({animal?.weight}kg).</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico / Doença (Bulário)</label>
                        <div className="relative">
                            <select
                                {...register('disease')}
                                onChange={handleDiseaseSelect}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none appearance-none bg-white"
                            >
                                <option value="">Selecione ou digite para buscar...</option>
                                <option value="Dermatite Atópica">Dermatite Atópica</option>
                                <option value="Otite Externa">Otite Externa</option>
                                <option value="Giardíase">Giardíase</option>
                            </select>
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento</label>
                            <input {...register('drug')} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dosagem Calc.</label>
                            <input {...register('dosage')} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Forma Farmacêutica</label>
                            <select {...register('form')} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none">
                                <option value="Comprimido">Comprimido</option>
                                <option value="Liquido">Líquido / Xarope</option>
                                <option value="Pasta">Pasta Oral</option>
                                <option value="Biscoito">Biscoito Medicamentoso</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                            <input {...register('amount')} className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações / Posologia detalhada</label>
                        <textarea
                            {...register('observations')}
                            rows={3}
                            placeholder="Ex: Dar 1 comprimido a cada 12 horas..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>

                    <div className="flex justify-between pt-4">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="flex items-center gap-2 px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                        >
                            Revisar Prescrição
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
