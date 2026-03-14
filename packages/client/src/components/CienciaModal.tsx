import { useState } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import type { ValidacaoResultado } from '../services/validacaoClinica.service';

interface CienciaModalProps {
    validacao: ValidacaoResultado;
    onAccept: (motivo: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function CienciaModal({ validacao, onAccept, onCancel, isLoading }: CienciaModalProps) {
    const [motivo, setMotivo] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleSubmit = () => {
        if (motivo.trim().length < 10) {
            alert('A justificativa deve ter no mínimo 10 caracteres');
            return;
        }

        if (!showConfirmation) {
            setShowConfirmation(true);
            return;
        }

        onAccept(motivo);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Dosagem Fora do Range Terapêutico
                            </h2>
                            <p className="text-sm text-gray-500">Aceite de responsabilidade necessário</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-6">
                    {/* Alertas */}
                    {validacao.alertas.length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-900 mb-2">Alertas Críticos:</h3>
                                    <ul className="space-y-1">
                                        {validacao.alertas.map((alerta, index) => (
                                            <li key={index} className="text-sm text-red-800">
                                                {alerta}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Avisos */}
                    {validacao.avisos.length > 0 && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-900 mb-2">Avisos:</h3>
                                    <ul className="space-y-1">
                                        {validacao.avisos.map((aviso, index) => (
                                            <li key={index} className="text-sm text-yellow-800">
                                                {aviso}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comparação de Dosagem */}
                    {validacao.range_encontrado && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Comparação de Dosagem:</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Range Terapêutico:</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {validacao.range_encontrado.dose_min_mg_kg} - {validacao.range_encontrado.dose_max_mg_kg} mg/kg
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Espécie: {validacao.range_encontrado.especie}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Dosagem Prescrita:</p>
                                    <p className="text-lg font-bold text-red-600">
                                        {validacao.dose_mg_kg} mg/kg
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Total: {validacao.dose_total_mg.toFixed(2)} mg
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Campo de Justificativa */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Justificativa Clínica <span className="text-red-600">*</span>
                        </label>
                        <p className="text-xs text-gray-600 mb-2">
                            Explique o motivo clínico para esta dosagem fora do range terapêutico.
                            Esta justificativa será registrada permanentemente para fins de auditoria.
                        </p>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Ex: Paciente geriátrico com insuficiência renal crônica. Redução de dose para minimizar risco de toxicidade..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows={5}
                            disabled={isLoading}
                            required
                        />
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                                Mínimo 10 caracteres
                            </p>
                            <p className={`text-xs font-medium ${motivo.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                                {motivo.length} / 10
                            </p>
                        </div>
                    </div>

                    {/* Confirmação */}
                    {showConfirmation && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-yellow-900 mb-1">
                                        Confirmação Final
                                    </h4>
                                    <p className="text-sm text-yellow-800">
                                        Ao confirmar, você declara ter ciência dos riscos e assume total responsabilidade
                                        pela prescrição desta dosagem fora do range terapêutico estabelecido.
                                        Este registro será permanente e auditável.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancelar e Revisar
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={motivo.trim().length < 10 || isLoading}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${showConfirmation
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processando...
                            </span>
                        ) : showConfirmation ? (
                            'Confirmar e Aceitar Responsabilidade'
                        ) : (
                            'Tenho Ciência e Prosseguir'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
