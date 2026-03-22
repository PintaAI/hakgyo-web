import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Difficulty } from "@/lib/enums";

interface OpsiItem {
  id?: number | string;
  opsiText: string;
  isCorrect: boolean;
}

interface SoalItem {
  id?: number | string;
  pertanyaan: string;
  difficulty?: Difficulty | null;
  explanation?: string;
  opsis?: OpsiItem[];
}

interface FormData {
  nama: string;
  deskripsi: string;
  isPrivate: boolean;
  isDraft: boolean;
}

interface SoalState {
  loading: boolean;
  saving: boolean;
  formData: FormData;
  originalFormData: FormData;
  soals: SoalItem[];
  originalSoals: SoalItem[];
  deletedSoalIds: number[];
  soalDialogOpen: boolean;
  editingSoalIndex: number | null;
  generating: boolean;
  currentSoalSetId: number | null;
}

interface SoalActions {
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setFormData: (formData: Partial<FormData>) => void;
  setOriginalFormData: (formData: FormData) => void;
  setSoals: (soals: SoalItem[]) => void;
  setOriginalSoals: (soals: SoalItem[]) => void;
  setDeletedSoalIds: (ids: number[]) => void;
  setSoalDialogOpen: (open: boolean) => void;
  setEditingSoalIndex: (index: number | null) => void;
  setGenerating: (generating: boolean) => void;
  setCurrentSoalSetId: (id: number | null) => void;

  // Actions
  initForCreate: () => void;
  initForEdit: (soalSet: any) => void; // TODO: proper type
  handleAddSoal: () => void;
  handleEditSoal: (index: number) => void;
  handleDeleteSoal: (index: number) => void;
  handleSaveSoal: (soalData: SoalItem) => void;
  handleCancelSoal: () => void;
  handleQuickAddSoal: (pertanyaan: string) => void;
  hasDataChanged: () => boolean;
  reset: () => void;
}

const initialState: SoalState = {
  loading: false,
  saving: false,
  formData: {
    nama: "",
    deskripsi: "",
    isPrivate: false,
    isDraft: true,
  },
  originalFormData: {
    nama: "",
    deskripsi: "",
    isPrivate: false,
    isDraft: true,
  },
  soals: [],
  originalSoals: [],
  deletedSoalIds: [],
  soalDialogOpen: false,
  editingSoalIndex: null,
  generating: false,
  currentSoalSetId: null,
};

export const useSoalStore = create<SoalState & SoalActions>()(
  immer((set, get) => ({
    ...initialState,

    setLoading: (loading) => set({ loading }),
    setSaving: (saving) => set({ saving }),
    setFormData: (updates) => set((state) => {
      state.formData = { ...state.formData, ...updates };
    }),
    setOriginalFormData: (originalFormData) => set({ originalFormData }),
    setSoals: (soals) => set({ soals }),
    setOriginalSoals: (originalSoals) => set({ originalSoals }),
    setDeletedSoalIds: (deletedSoalIds) => set({ deletedSoalIds }),
    setSoalDialogOpen: (soalDialogOpen) => set({ soalDialogOpen }),
    setEditingSoalIndex: (editingSoalIndex) => set({ editingSoalIndex }),
    setGenerating: (generating) => set({ generating }),
    setCurrentSoalSetId: (currentSoalSetId) => set({ currentSoalSetId }),

    initForCreate: () => set(initialState),

    initForEdit: (soalSet) => set((state) => {
      state.loading = true;
      const formData = {
        nama: soalSet.nama || "",
        deskripsi: soalSet.deskripsi || "",
        isPrivate: soalSet.isPrivate || false,
        isDraft: soalSet.isDraft ?? true,
      };
      state.formData = formData;
      state.originalFormData = { ...formData };
      // soals will be set after fetch
    }),

    handleAddSoal: () => set((state) => {
      state.editingSoalIndex = null;
      state.soalDialogOpen = true;
    }),

    handleEditSoal: (index) => set((state) => {
      state.editingSoalIndex = index;
      state.soalDialogOpen = true;
    }),

    handleDeleteSoal: (index) => set((state) => {
      if (state.soals.length > 1) {
        const soalToDelete = state.soals[index];
        if (soalToDelete.id && typeof soalToDelete.id === 'number') {
          state.deletedSoalIds.push(soalToDelete.id);
        }
        state.soals.splice(index, 1);
      }
    }),

    handleSaveSoal: (soalData) => set((state) => {
      if (state.editingSoalIndex !== null) {
        state.soals[state.editingSoalIndex] = soalData;
      } else {
        state.soals.push(soalData);
      }
      state.soalDialogOpen = false;
      state.editingSoalIndex = null;
    }),

    handleCancelSoal: () => set((state) => {
      state.soalDialogOpen = false;
      state.editingSoalIndex = null;
    }),

    handleQuickAddSoal: (pertanyaan) => set((state) => {
      if (!pertanyaan.trim()) return;
      const newSoal: SoalItem = {
        pertanyaan: pertanyaan.trim(),
        difficulty: Difficulty.BEGINNER,
        opsis: [
          { opsiText: "", isCorrect: false },
          { opsiText: "", isCorrect: false },
          { opsiText: "", isCorrect: false },
          { opsiText: "", isCorrect: false },
        ],
      };
      state.soals.push(newSoal);
    }),

    hasDataChanged: () => {
      const state = get();
      const hasFormDataChanged = JSON.stringify(state.formData) !== JSON.stringify(state.originalFormData);
      const hasSoalsChanged = JSON.stringify(state.soals) !== JSON.stringify(state.originalSoals);
      const hasDeletedSoals = state.deletedSoalIds.length > 0;
      return hasFormDataChanged || hasSoalsChanged || hasDeletedSoals;
    },

    reset: () => set(initialState),
  }))
);