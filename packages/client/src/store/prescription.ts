import { create } from 'zustand';

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
    removeMedication: (index: number) => void;
    setMedications: (medications: Medication[]) => void;
    reset: () => void;
}

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
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
    removeMedication: (index) => set((state) => ({ medications: state.medications.filter((_, i) => i !== index) })),
    setMedications: (medications) => set({ medications }),
    reset: () => set({ step: 1, tutor: null, animal: null, doenca: '', medications: [] }),
}));
