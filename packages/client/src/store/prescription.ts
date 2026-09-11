import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type MagistralIngrediente = {
    codigo_interno: number;
    descricao: string;
    dosagem_mg: number;
    quantidade: number;
    custo_ingrediente?: number;
    controlado?: boolean;
    lista_controle?: string | null;
};

export type MagistralBreakdown = {
    ingredientes: MagistralIngrediente[];
    total_materia_prima: number;
    taxa_manipulacao: number;
    custo_embalagens: number;
    subtotal: number;
    desconto_parceiro_pct: number;
    desconto_valor: number;
    valor_com_desconto: number;
    adicional_entrega: number;
    adicional_biscoito: number;
    valor_final: number;
    forma_farmaceutica: string;
    avisos: string[];
};

/**
 * Ciência registrada pelo veterinário para uma dose fora do range terapêutico.
 * Fica pendente no store porque o log exige o ID da prescrição, que só existe
 * depois que ela é criada — é gravado logo após a criação.
 */
export type CienciaPendente = {
    principio_ativo_id: string;
    dosagem_prescrita_mg_kg: number;
    peso_animal_kg: number;
    dose_min_esperada_mg_kg: number;
    dose_max_esperada_mg_kg: number;
    motivo: string;
};

type Medication = {
    id?: string;
    codigo?: string;
    dosagem_mg_kg?: string;
    frequencia_horas?: string;
    duracao_dias?: string;
    principio_ativo_id?: string;
    drug: string;
    dosage: string;
    form: string;
    amount: string;
    observations: string;
    preco_sugestao?: number;
    preco_tabela?: number;
    controlado?: boolean;
    lista_controle?: string;
    // Magistral fields
    is_magistral?: boolean;
    magistral_breakdown?: MagistralBreakdown;
    /**
     * Ingredientes como o veterinário os informou no Formulador. O breakdown
     * devolvido pelo servidor não carrega a dose original, então guardamos
     * aqui para reabrir a fórmula em edição.
     */
    magistral_ingredientes?: Array<{
        codigo_interno: number;
        descricao: string;
        dosagem_mg: number;
    }>;
    /**
     * Posologia da formulação. Vale para a fórmula inteira, não por ingrediente:
     * todos os princípios ativos compõem a mesma cápsula/dose.
     */
    magistral_posologia?: {
        dias?: number;
        frequencia_horas?: number;
        aroma?: string;
        uso_continuo?: boolean;
    };
    // Validação clínica
    ciencia?: CienciaPendente;
};

interface PrescriptionState {
    step: number;
    tutor: { id?: string; name: string; cpf: string; phone: string; nome?: string; telefone?: string } | null;
    animal: { id?: string; name: string; weight: number; species?: string; breed?: string; nome?: string; peso?: number; especie?: string; raca?: string } | null;
    doenca: string;
    medications: Medication[];

    setStep: (step: number) => void;
    setTutor: (tutor: PrescriptionState['tutor']) => void;
    setAnimal: (animal: PrescriptionState['animal']) => void;
    setDoenca: (doenca: string) => void;
    addMedication: (medication: Medication) => void;
    updateMedication: (index: number, medication: Medication) => void;
    removeMedication: (index: number) => void;
    setMedications: (medications: Medication[]) => void;
    reset: () => void;
}

/**
 * Estado da prescrição em andamento.
 *
 * Persistido em sessionStorage ("memória da prescrição"): o veterinário pode
 * voltar etapas, recarregar a página ou reabrir um item para editar sem perder
 * o que já preencheu. A sessão limpa ao fechar a aba, e `reset()` zera tudo ao
 * concluir a prescrição — evitando dados velhos numa próxima receita.
 */
export const usePrescriptionStore = create<PrescriptionState>()(
    persist(
        (set) => ({
            step: 1,
            tutor: null,
            animal: null,
            doenca: '',
            medications: [],

            setStep: (step) => set({ step }),
            setTutor: (tutor) => set({ tutor }),
            setAnimal: (animal) => set({ animal }),
            setDoenca: (doenca) => set({ doenca }),
            addMedication: (medication) => set((state) => ({ medications: [...state.medications, medication] })),
            updateMedication: (index, medication) =>
                set((state) => ({
                    medications: state.medications.map((m, i) => (i === index ? medication : m)),
                })),
            removeMedication: (index) => set((state) => ({ medications: state.medications.filter((_, i) => i !== index) })),
            setMedications: (medications) => set({ medications }),
            reset: () => set({ step: 1, tutor: null, animal: null, doenca: '', medications: [] }),
        }),
        {
            name: 'pharmo-prescricao-rascunho',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
