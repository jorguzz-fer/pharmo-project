import { useState } from "react";
import { Check } from "lucide-react";
import StepConfiguracao from "./steps/StepConfiguracao";
import StepConteudo from "./steps/StepConteudo";
import StepEnvio from "./steps/StepEnvio";

export interface PropostaFormData {
  // Step 1 - Configuração
  consultorId: string;
  consultorNome: string;
  consultorIdCodigo: string;
  clienteNome: string;
  clienteEmail: string;
  clienteWhatsapp: string;
  clienteEmpresa: string;
  clienteCnpj: string;
  clienteEstado: string;
  clienteCidade: string;

  // Step 2 - Conteúdo
  titulo: string;
  descricao: string;
  itens: PropostaItemForm[];
  validadeDias: number;
  observacoes: string;

  // Computed
  valorTotal: number;
}

export interface PropostaItemForm {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

const initialData: PropostaFormData = {
  consultorId: "",
  consultorNome: "",
  consultorIdCodigo: "",
  clienteNome: "",
  clienteEmail: "",
  clienteWhatsapp: "",
  clienteEmpresa: "",
  clienteCnpj: "",
  clienteEstado: "",
  clienteCidade: "",
  titulo: "",
  descricao: "",
  itens: [{ descricao: "", quantidade: 1, valorUnitario: 0, valorTotal: 0 }],
  validadeDias: 30,
  observacoes: "",
  valorTotal: 0,
};

const steps = [
  { num: 1, label: "Configuração" },
  { num: 2, label: "Conteúdo" },
  { num: 3, label: "Envio" },
];

export default function PropostaWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PropostaFormData>(initialData);
  const [propostaId, setPropostaId] = useState<string | null>(null);

  const updateFormData = (data: Partial<PropostaFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Proposta Comercial</h1>
          <p className="text-slate-500">Preencha os dados para criar e enviar a proposta.</p>
        </div>

        {/* Steps Timeline */}
        <div className="relative flex justify-between max-w-xl mx-auto mb-12">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-0 transform -translate-y-1/2 rounded-full" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-primary -z-0 transform -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />

          {steps.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    isCompleted
                      ? "bg-primary text-white"
                      : isCurrent
                      ? "bg-primary text-white ring-4 ring-orange-100"
                      : "bg-white border-2 border-slate-300 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs font-semibold ${isCurrent ? "text-primary" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {step === 1 && (
            <StepConfiguracao
              data={formData}
              onChange={updateFormData}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepConteudo
              data={formData}
              onChange={updateFormData}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepEnvio
              data={formData}
              propostaId={propostaId}
              setPropostaId={setPropostaId}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
