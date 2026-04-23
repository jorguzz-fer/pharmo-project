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

type Medication = {
    id?: string;
    codigo?: string;
    dosagem_mg_kg?: string;
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
};

interface PrescriptionState {
    step: number;
    tutor: { id?: string; name: string; cpf: string; phone: string; nome?: string; telefone?: string } | null;
    animal: { id?: string; name: string; weight: number; species?: string; breed?: string; nome?: string; peso?: number; especie?: string; raca?: string } | null;
    medications: Medication[];

    setStep: (step: number) => void;
    setTutor: (tutor: PrescriptionState['tutor']) => void;
    setAnimal: (animal: PrescriptionState['animal']) => void;
    addMedication: (medication: Medication) => void;
    removeMedication: (index: number) => void;
    setMedications: (medications: Medication[]) => void;
    reset: () => void;
}

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
    step: 1,
    tutor: null,
    animal: null,
    medications: [],

    setStep: (step) => set({ step }),
    setTutor: (tutor) => set({ tutor }),
    setAnimal: (animal) => set({ animal }),
    addMedication: (medication) => set((state) => ({ medications: [...state.medications, medication] })),
    removeMedication: (index) => set((state) => ({ medications: state.medications.filter((_, i) => i !== index) })),
    setMedications: (medications) => set({ medications }),
    reset: () => set({ step: 1, tutor: null, animal: null, medications: [] }),
}));
