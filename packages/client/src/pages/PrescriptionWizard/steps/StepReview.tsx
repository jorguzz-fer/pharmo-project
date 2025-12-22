import { useState } from 'react';
import { ArrowLeft, Send, Printer, CheckCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePrescriptionStore } from '../../../store/prescription';

export function StepReview() {
    const { tutor, animal, medication, setStep, reset } = usePrescriptionStore();
    const navigate = useNavigate();
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleFinish = async () => {
        setIsSending(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSending(false);
        setIsSuccess(true);

        // Redirect after success
        setTimeout(() => {
            reset();
            navigate('/dashboard');
        }, 3000);
    };

    if (isSuccess) {
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Prescrição Enviada!</h2>
                <p className="text-gray-500 mb-8">O link de pagamento e a receita foram enviados para o WhatsApp do tutor ({tutor?.phone}).</p>
                <div className="animate-pulse text-sm text-gray-400">Redirecionando para o dashboard...</div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">4. Revisão Final</h2>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                {/* Prescription Header Mock */}
                <div className="bg-green-600 text-white p-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold mb-1">Dr. Fernando Jorge</h3>
                        <p className="text-green-100 text-sm">CRMV-SP 123456</p>
                    </div>
                    <FileText className="w-8 h-8 opacity-50" />
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tutor</span>
                            <p className="font-semibold text-gray-900 text-lg">{tutor?.name}</p>
                            <p className="text-gray-500">{tutor?.cpf} • {tutor?.phone}</p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paciente</span>
                            <p className="font-semibold text-gray-900 text-lg">{animal?.name}</p>
                            <p className="text-gray-500">{animal?.species} • {animal?.weight}kg</p>
                        </div>
                    </div>

                    <div className="border-t border-b border-gray-100 py-6 mb-6">
                        <h4 className="font-bold text-gray-900 mb-4">Uso Veterinário</h4>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg text-gray-900">{medication?.drug}</span>
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">{medication?.form}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Dose: {medication?.dosage} • Quantidade: {medication?.amount}</p>
                            <p className="text-sm text-gray-800 italic mt-2">"{medication?.observations}"</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <p>Data: {new Date().toLocaleDateString()}</p>
                        <div className="text-right">
                            <p className="font-bold text-gray-900 text-lg">Orçamento: R$ 250,00</p>
                            <p className="text-xs">Válido por 24h</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between">
                <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    disabled={isSending}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar e Editar
                </button>

                <div className="flex gap-3">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                        disabled={isSending}
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Rascunho
                    </button>
                    <button
                        onClick={handleFinish}
                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transform transition hover:-translate-y-0.5"
                        disabled={isSending}
                    >
                        {isSending ? 'Processando...' : (
                            <>
                                Assinar e Enviar
                                <Send className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
