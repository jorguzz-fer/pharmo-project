import { create } from 'zustand';

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
