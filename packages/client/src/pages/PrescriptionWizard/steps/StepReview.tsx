import { useState } from 'react';
import { ArrowLeft, Send, Download, CheckCircle, FileText, Loader2, AlertTriangle, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePrescriptionStore } from '../../../store/prescription';
import { useAuthStore } from '../../../store/auth';
import { api } from '../../../services/api';
import { validacaoClinicaService } from '../../../services/validacaoClinica.service';

function getBaseUrl() {
    let url = import.meta.env.VITE_API_URL || 'https://phamopet-backend-api.en9jpc.easypanel.host';
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (!url.endsWith('/api')) url = `${url}/api`;
    return url;
}

export function StepReview() {
    const { tutor, animal, medications, doenca, setStep, reset } = usePrescriptionStore();
    const { user, token } = useAuthStore();
    const navigate = useNavigate();
    const [isSending, setIsSending] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [expandedBreakdown, setExpandedBreakdown] = useState<number | null>(null);
    const [envioResultado, setEnvioResultado] = useState<{ enviado: boolean; motivo?: string } | null>(null);

    const handlePrintDraft = async () => {
        if (!user || !tutor || !animal || medications.length === 0) {
            alert('Dados incompletos para gerar o rascunho.');
            return;
        }

        setIsPrinting(true);
        try {
            const body = {
                veterinario: {
                    nome: user.name,
                    crv: user.crv || '',
                    email: user.email,
                    telefone: '',
                },
                tutor: {
                    nome: tutor.name || tutor.nome || '',
                    cpf: tutor.cpf || '',
                    telefone: tutor.phone || tutor.telefone || '',
                },
                animal: {
                    nome: animal.name || animal.nome || '',
                    especie: animal.species || animal.especie || '',
                    raca: animal.breed || animal.raca || null,
                    peso: animal.weight || animal.peso || null,
                },
                medicamentos: medications.map(m => ({
                    medicamento: m.drug,
                    codigo_medicamento: m.codigo || null,
                    dosagem: m.dosage,
                    forma_farmaceutica: m.form,
                    quantidade: m.amount,
                    observacoes: m.observations || null,
                })),
            };

            const response = await fetch(`${getBaseUrl()}/prescricoes/rascunho/pdf`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar PDF');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const tutorName = (tutor.name || tutor.nome || 'receita').replace(/\s+/g, '_');
            a.download = `receita_${tutorName}_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('PDF error:', error);
            alert('Erro ao gerar o rascunho: ' + (error?.message || 'Erro desconhecido'));
        } finally {
            setIsPrinting(false);
        }
    };

    const handleFinish = async () => {
        setIsSending(true);
        try {
            // Validate required data
            if (!tutor?.id || !animal?.id || !user?.id || medications.length === 0) {
                console.error("Missing data", { tutor, animal, user, medications });
                alert('Erro: Dados incompletos. Adicione pelo menos um medicamento.');
                setIsSending(false);
                return;
            }

            // Envia a prescrição completa: todos os medicamentos e os preços praticados
            const data = {
                veterinario_id: user.id,
                tutor_id: tutor.id,
                animal_id: animal.id,
                doenca: doenca || undefined,
                medicamentos: medications.map(m => ({
                    codigo_medicamento: m.codigo || null,
                    medicamento: m.drug,
                    dosagem: m.dosage,
                    forma_farmaceutica: m.form,
                    quantidade: m.amount,
                    observacoes: m.observations || null,
                    preco_sugestao: Number(m.preco_sugestao ?? 0),
                    preco_tabela: Number(m.preco_tabela ?? 0),
                    is_magistral: Boolean(m.is_magistral),
                })),
            };

            const response = await api.post('/prescricoes', data);
            const prescricaoId = response.prescricao?.id;

            // Grava as ciências de dose fora do range (só agora existe prescricao_id)
            if (prescricaoId) {
                const comCiencia = medications.filter(m => m.ciencia);
                for (const med of comCiencia) {
                    try {
                        await validacaoClinicaService.registrarCiencia({
                            prescricao_id: prescricaoId,
                            animal_id: animal.id,
                            ...med.ciencia!,
                        });
                    } catch (err) {
                        // A prescrição já existe; falha no log é reportada, não desfaz o cadastro
                        console.error('Falha ao registrar ciência de dose:', err);
                    }
                }
            }

            let envio: { enviado?: boolean; motivo?: string } = {};
            if (prescricaoId) {
                envio = await api.post(`/prescricoes/${prescricaoId}/enviar`, {});
            }
            setEnvioResultado({
                enviado: Boolean(envio.enviado),
                motivo: envio.motivo,
            });

            setIsSending(false);
            setIsSuccess(true);

            // Redirect after success
            setTimeout(() => {
                reset();
                navigate('/veterinario/dashboard');
            }, envio.enviado ? 3000 : 6000);

        } catch (error: any) {
            console.error(error);
            const msg = error?.message || 'Erro desconhecido';

            // If vet session is invalid, force re-login
            if (msg.includes('logout') || msg.includes('Sessão expirada') || msg.includes('Veterinário não encontrado')) {
                alert('Sua sessão expirou ou seus dados mudaram. Você será redirecionado para o login.');
                const { logout } = useAuthStore.getState();
                logout();
                navigate('/login');
                return;
            }

            alert('Erro ao criar prescrição: ' + msg);
            setIsSending(false);
        }
    };

    if (isSuccess) {
        const enviado = envioResultado?.enviado;
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${enviado ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {enviado
                        ? <CheckCircle className="w-8 h-8 text-green-600" />
                        : <AlertTriangle className="w-8 h-8 text-amber-600" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {enviado ? 'Prescrição Enviada!' : 'Prescrição Registrada'}
                </h2>
                {enviado ? (
                    <p className="text-gray-500 mb-8">
                        O link de pagamento e a receita foram enviados para o WhatsApp do tutor ({tutor?.phone || tutor?.telefone}).
                    </p>
                ) : (
                    <div className="mb-8 space-y-2">
                        <p className="text-gray-600">
                            A prescrição e o orçamento foram salvos, mas <strong>não foram enviados ao tutor</strong>.
                        </p>
                        {envioResultado?.motivo && (
                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                {envioResultado.motivo}
                            </p>
                        )}
                        <p className="text-sm text-gray-500">
                            Use "Salvar em PDF" para entregar a receita ao tutor.
                        </p>
                    </div>
                )}
                <div className="animate-pulse text-sm text-gray-400">Redirecionando para o dashboard...</div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">4. Revisão Final</h2>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                {/* Prescription Header */}
                <div className="bg-green-600 text-white p-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold mb-1">{user?.name}</h3>
                        <p className="text-green-100 text-sm">CRMV {user?.crv}</p>
                    </div>
                    <FileText className="w-8 h-8 opacity-50" />
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tutor</span>
                            <p className="font-semibold text-gray-900 text-lg">{tutor?.name || tutor?.nome}</p>
                            <p className="text-gray-500">{tutor?.cpf} • {tutor?.phone || tutor?.telefone}</p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paciente</span>
                            <p className="font-semibold text-gray-900 text-lg">{animal?.name || animal?.nome}</p>
                            <p className="text-gray-500">{animal?.species || animal?.especie} • {animal?.weight || animal?.peso}kg</p>
                        </div>
                    </div>

                    <div className="border-t border-b border-gray-100 py-6 mb-6">
                        {/* Banner de controlados */}
                        {medications.some(m => m.controlado) && (
                            <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Atenção: Prescrição contém medicamento(s) controlado(s)</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        {medications.filter(m => m.controlado).map(m => {
                                            const tipo = m.lista_controle === 'ANTIMICROBIANO'
                                                ? 'Antimicrobiano - requer receita específica'
                                                : m.lista_controle
                                                    ? `Lista ${m.lista_controle} - requer receituário especial`
                                                    : 'Controlado';
                                            return `${m.drug} (${tipo})`;
                                        }).join(' | ')}
                                    </p>
                                </div>
                            </div>
                        )}

                        <h4 className="font-bold text-gray-900 mb-4">Uso Veterinário ({medications.length} medicamento{medications.length > 1 ? 's' : ''})</h4>

                        <div className="space-y-3">
                            {medications.map((med, index) => (
                                <div key={index} className={`p-4 rounded-lg border ${
                                    med.is_magistral
                                        ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
                                        : 'bg-gray-50 border-gray-100'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-lg text-gray-900">{med.drug}</span>
                                            {med.is_magistral && (
                                                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                                    <FlaskConical className="w-3 h-3" />
                                                    MAGISTRAL
                                                </span>
                                            )}
                                            {med.codigo && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                                                    {med.codigo}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {med.controlado && (
                                                <span className={`text-xs px-2 py-1 rounded font-bold ${
                                                    med.lista_controle === 'ANTIMICROBIANO'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {med.lista_controle === 'ANTIMICROBIANO' ? 'Antimicrobiano' : `Controlado ${med.lista_controle || ''}`}
                                                </span>
                                            )}
                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">{med.form}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Dose: {med.dosage} • Quantidade: {med.amount}</p>
                                    {med.observations && (
                                        <p className="text-sm text-gray-800 italic mt-2">"{med.observations}"</p>
                                    )}
                                    {(med.preco_sugestao || med.preco_tabela) && (
                                        <div className="flex gap-4 mt-2 pt-2 border-t border-gray-200 text-sm items-center flex-wrap">
                                            <span className="text-green-700 font-medium">
                                                {med.is_magistral ? 'Valor final: ' : 'Venda: '}
                                                R$ {Number(med.preco_sugestao || 0).toFixed(2).replace('.', ',')}
                                            </span>
                                            {!med.is_magistral && med.preco_tabela !== undefined && (
                                                <span className="text-blue-700 font-medium">
                                                    Clínica: R$ {Number(med.preco_tabela || 0).toFixed(2).replace('.', ',')}
                                                </span>
                                            )}
                                            {med.is_magistral && med.magistral_breakdown && (
                                                <button
                                                    onClick={() => setExpandedBreakdown(expandedBreakdown === index ? null : index)}
                                                    className="ml-auto text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-1"
                                                >
                                                    {expandedBreakdown === index ? (
                                                        <>Ocultar detalhes <ChevronUp className="w-3 h-3" /></>
                                                    ) : (
                                                        <>Ver detalhes <ChevronDown className="w-3 h-3" /></>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Breakdown detalhado para magistral */}
                                    {med.is_magistral && med.magistral_breakdown && expandedBreakdown === index && (
                                        <div className="mt-3 pt-3 border-t border-indigo-200 bg-white/60 rounded-lg p-3 text-sm space-y-2">
                                            <div>
                                                <p className="font-semibold text-indigo-900 mb-1">Ingredientes:</p>
                                                <div className="space-y-1">
                                                    {med.magistral_breakdown.ingredientes.map((ing: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-xs">
                                                            <span className="text-gray-700">
                                                                {ing.descricao} ({ing.dosagem_mg}mg × {ing.quantidade})
                                                            </span>
                                                            <span className="text-gray-900 font-medium">R$ {Number(ing.custo_ingrediente).toFixed(2).replace('.', ',')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1 pt-2 border-t border-indigo-100">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Matéria prima</span>
                                                    <span>R$ {Number(med.magistral_breakdown.total_materia_prima).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">+ Taxa manipulação</span>
                                                    <span>R$ {Number(med.magistral_breakdown.taxa_manipulacao).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">+ Embalagens</span>
                                                    <span>R$ {Number(med.magistral_breakdown.custo_embalagens).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span>Subtotal</span>
                                                    <span>R$ {Number(med.magistral_breakdown.subtotal).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                {med.magistral_breakdown.desconto_parceiro_pct > 0 && (
                                                    <div className="flex justify-between text-xs text-green-700">
                                                        <span>Desconto ({(med.magistral_breakdown.desconto_parceiro_pct * 100).toFixed(0)}%)</span>
                                                        <span>- R$ {Number(med.magistral_breakdown.desconto_valor).toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                )}
                                                {med.magistral_breakdown.adicional_entrega > 0 && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-600">+ Entrega</span>
                                                        <span>R$ {Number(med.magistral_breakdown.adicional_entrega).toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                )}
                                                {med.magistral_breakdown.adicional_biscoito > 0 && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-600">+ Biscoito</span>
                                                        <span>R$ {Number(med.magistral_breakdown.adicional_biscoito).toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-bold text-indigo-900 pt-1 border-t border-indigo-200">
                                                    <span>VALOR FINAL</span>
                                                    <span>R$ {Number(med.magistral_breakdown.valor_final).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <p>Data: {new Date().toLocaleDateString()}</p>
                        <div className="text-right">
                            {medications.some(m => m.preco_sugestao) ? (
                                <>
                                    <p className="font-bold text-gray-900 text-lg">
                                        Total Cliente: R$ {medications.reduce((sum, m) => sum + Number(m.preco_sugestao || 0), 0).toFixed(2).replace('.', ',')}
                                    </p>
                                    <p className="text-sm text-blue-600 font-medium">
                                        Total Clínica: R$ {medications.reduce((sum, m) => sum + Number(m.preco_tabela || 0), 0).toFixed(2).replace('.', ',')}
                                    </p>
                                </>
                            ) : (
                                <p className="font-bold text-gray-900 text-lg">Orçamento: Calculado...</p>
                            )}
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
                        onClick={handlePrintDraft}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        disabled={isSending || isPrinting}
                    >
                        {isPrinting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {isPrinting ? 'Gerando...' : 'Salvar em PDF'}
                    </button>
                    <button
                        onClick={handleFinish}
                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transform transition hover:-translate-y-0.5 disabled:opacity-50"
                        disabled={isSending}
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
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
