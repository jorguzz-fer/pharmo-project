import { create } from 'zustand';

interface PrescricaoItem {
  principio_ativo_id: string;
  principio_ativo_nome: string;
  concentracao_id?: string;
  dose_mg_kg: number;
  frequencia_horas: number;
  duracao_dias: number;
  forma_farmaceutica: string;
  observacoes?: string;
}

interface PrescricaoState {
  step: number;
  tutor_id: string | null;
  animal_id: string | null;
  protocolo_id: string | null;
  diagnostico: string;
  observacoes: string;
  itens: PrescricaoItem[];
  modo: 'protocolo' | 'manual';

  setStep: (step: number) => void;
  setTutor: (id: string) => void;
  setAnimal: (id: string) => void;
  setProtocolo: (id: string | null) => void;
  setDiagnostico: (val: string) => void;
  setObservacoes: (val: string) => void;
  setModo: (modo: 'protocolo' | 'manual') => void;
  addItem: (item: PrescricaoItem) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, item: PrescricaoItem) => void;
  setItens: (itens: PrescricaoItem[]) => void;
  reset: () => void;
}

const initialState = {
  step: 0,
  tutor_id: null,
  animal_id: null,
  protocolo_id: null,
  diagnostico: '',
  observacoes: '',
  itens: [],
  modo: 'manual' as const,
};

export const usePrescricaoStore = create<PrescricaoState>()((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setTutor: (id) => set({ tutor_id: id }),
  setAnimal: (id) => set({ animal_id: id }),
  setProtocolo: (id) => set({ protocolo_id: id }),
  setDiagnostico: (val) => set({ diagnostico: val }),
  setObservacoes: (val) => set({ observacoes: val }),
  setModo: (modo) => set({ modo }),
  addItem: (item) => set((s) => ({ itens: [...s.itens, item] })),
  removeItem: (index) => set((s) => ({ itens: s.itens.filter((_, i) => i !== index) })),
  updateItem: (index, item) =>
    set((s) => ({ itens: s.itens.map((it, i) => (i === index ? item : it)) })),
  setItens: (itens) => set({ itens }),
  reset: () => set(initialState),
}));
