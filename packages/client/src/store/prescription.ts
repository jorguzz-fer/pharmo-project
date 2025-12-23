import { create } from 'zustand';

interface PrescriptionState {
    step: number;
    tutor: { id?: string; name: string; cpf: string; phone: string; nome?: string; telefone?: string } | null;
    animal: { id?: string; name: string; weight: number; species?: string; breed?: string; nome?: string; peso?: number; especie?: string; raca?: string } | null;
    medication: {
        disease: string;
        drug: string;
        dosage: string;
        form: string;
        amount: string;
        observations: string;
    } | null;

    setStep: (step: number) => void;
    setTutor: (tutor: PrescriptionState['tutor']) => void;
    setAnimal: (animal: PrescriptionState['animal']) => void;
    setMedication: (medication: PrescriptionState['medication']) => void;
    reset: () => void;
}

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
    step: 1,
    tutor: null,
    animal: null,
    medication: null,

    setStep: (step) => set({ step }),
    setTutor: (tutor) => set({ tutor }),
    setAnimal: (animal) => set({ animal }),
    setMedication: (medication) => set({ medication }),
    reset: () => set({ step: 1, tutor: null, animal: null, medication: null }),
}));
