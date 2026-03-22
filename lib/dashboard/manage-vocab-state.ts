import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { VocabularyType } from "@/app/generated/prisma/client";

interface VocabItem {
  id?: number | string;
  korean: string;
  indonesian: string;
  type: VocabularyType;
  pos?: any; // PartOfSpeech
  audioUrl?: string;
  exampleSentences: string[];
}

interface FormData {
  title: string;
  description: string;
  icon: string;
  isPublic: boolean;
  isDraft: boolean;
}

interface VocabState {
  loading: boolean;
  saving: boolean;
  formData: FormData;
  items: VocabItem[];
  itemDialogOpen: boolean;
  editingItemIndex: number | null;
  generating: boolean;
  currentVocabSetId: number | null; // Track created vocab set ID
}

interface VocabActions {
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setFormData: (formData: Partial<FormData>) => void;
  setItems: (items: VocabItem[]) => void;
  setItemDialogOpen: (open: boolean) => void;
  setEditingItemIndex: (index: number | null) => void;
  setGenerating: (generating: boolean) => void;
  setCurrentVocabSetId: (id: number | null) => void;

  // Actions
  initForCreate: () => void;
  initForEdit: (vocabSet: any) => void; // TODO: proper type
  handleAddItem: () => void;
  handleEditItem: (index: number) => void;
  handleDeleteItem: (index: number) => void;
  handleSaveItem: (itemData: VocabItem) => void;
  handleCancelItem: () => void;
  handleQuickAdd: (korean: string, indonesian: string) => void;
  reset: () => void;
}

const initialState: VocabState = {
  loading: false,
  saving: false,
  formData: {
    title: "",
    description: "",
    icon: "FaBookOpen",
    isPublic: false,
    isDraft: true,
  },
  items: [
    {
      korean: "",
      indonesian: "",
      type: VocabularyType.WORD,
      exampleSentences: [""],
    },
  ],
  itemDialogOpen: false,
  editingItemIndex: null,
  generating: false,
  currentVocabSetId: null,
};

export const useVocabStore = create<VocabState & VocabActions>()(
  immer((set,) => ({
    ...initialState,

    setLoading: (loading) => set({ loading }),
    setSaving: (saving) => set({ saving }),
    setFormData: (updates) => set((state) => {
      state.formData = { ...state.formData, ...updates };
    }),
    setItems: (items) => set({ items }),
    setItemDialogOpen: (itemDialogOpen) => set({ itemDialogOpen }),
    setEditingItemIndex: (editingItemIndex) => set({ editingItemIndex }),
    setGenerating: (generating) => set({ generating }),
    setCurrentVocabSetId: (id) => set({ currentVocabSetId: id }),

    initForCreate: () => set((state) => {
      state.loading = false;
      state.saving = false;
      state.formData = {
        title: "",
        description: "",
        icon: "FaBookOpen",
        isPublic: false,
        isDraft: true,
      };
      state.items = [];
      state.itemDialogOpen = false;
      state.editingItemIndex = null;
      state.generating = false;
      state.currentVocabSetId = null; // Reset ID for new creation
    }),

    initForEdit: (vocabSet) => set((state) => {
      state.loading = true;
      state.formData = {
        title: vocabSet.title || "",
        description: vocabSet.description || "",
        icon: vocabSet.icon || "FaBookOpen",
        isPublic: vocabSet.isPublic || false,
        isDraft: vocabSet.isDraft ?? true,
      };
      state.currentVocabSetId = vocabSet.id || null; // Set ID for editing
      // items will be set after population
    }),

    handleAddItem: () => set((state) => {
      state.editingItemIndex = null;
      state.itemDialogOpen = true;
    }),

    handleEditItem: (index) => set((state) => {
      state.editingItemIndex = index;
      state.itemDialogOpen = true;
    }),

    handleDeleteItem: (index) => set((state) => {
      state.items.splice(index, 1);
    }),

    handleSaveItem: (itemData) => set((state) => {
      if (state.editingItemIndex !== null) {
        state.items[state.editingItemIndex] = itemData;
      } else {
        state.items.push(itemData);
      }
      state.itemDialogOpen = false;
      state.editingItemIndex = null;
    }),

    handleCancelItem: () => set((state) => {
      state.itemDialogOpen = false;
      state.editingItemIndex = null;
    }),

    handleQuickAdd: (korean, indonesian) => set((state) => {
      if (!korean.trim() || !indonesian.trim()) return;
      const newItem: VocabItem = {
        korean: korean.trim(),
        indonesian: indonesian.trim(),
        type: VocabularyType.WORD,
        exampleSentences: [""],
      };
      state.items.push(newItem);
    }),

    reset: () => set(initialState),
  }))
);