import { useEffect } from 'react';
import { usePrescriptionStore } from '../../store/prescription';
import { StepTutor } from './steps/StepTutor';
import { StepAnimal } from './steps/StepAnimal';
import { StepMedication } from './steps/StepMedication';
import { StepReview } from './steps/StepReview';
import { Check } from 'lucide-react';

export function PrescriptionWizard() {
    const { step, reset } = usePrescriptionStore();

    // Reset prescription state when entering the wizard
    useEffect(() => {
        reset();
    }, [reset]);

    const steps = [
        { num: 1, label: 'Tutor' },
        { num: 2, label: 'Paciente' },
        { num: 3, label: 'Prescrição' },
        { num: 4, label: 'Revisão' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Nova Prescrição Digital</h1>
                <p className="text-gray-500">Preencha os dados abaixo para gerar a receita e o link de pagamento.</p>
            </div>

            {/* Steps Timeline */}
            <div className="relative flex justify-between max-w-2xl mx-auto mb-12">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0 transform -translate-y-1/2 rounded-full"></div>
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-green-500 -z-0 transform -translate-y-1/2 rounded-full transition-all duration-500"
                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>

                {steps.map((s) => {
                    const isCompleted = step > s.num;
                    const isCurrent = step === s.num;

                    return (
                        <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${isCompleted ? 'bg-green-600 text-white' :
                                isCurrent ? 'bg-green-600 text-white ring-4 ring-green-100' :
                                    'bg-white border-2 border-gray-300 text-gray-400'
                                }`}>
                                {isCompleted ? <Check className="w-5 h-5" /> : s.num}
                            </div>
                            <span className={`text-xs font-semibold ${isCurrent ? 'text-green-700' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                {step === 1 && <StepTutor />}
                {step === 2 && <StepAnimal />}
                {step === 3 && <StepMedication />}
                {step === 4 && <StepReview />}
            </div>
        </div>
    );
}
