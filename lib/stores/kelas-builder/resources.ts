import type { StateCreator } from 'zustand';
import type { KelasBuilderState, ResourcesData, VocabularySet, SoalSet } from './types';
import { linkVocabularyToKelas, unlinkVocabularyFromKelas, getKelasResources, linkSoalToKelas, unlinkSoalFromKelas } from '@/app/actions/kelas/resources';

export interface Resources {
  resources: ResourcesData;
  updateResources: (resources: Partial<ResourcesData>) => void;
  addVocabConnection: (vocabSetId: number, vocabSetData: any) => void;
  removeVocabConnection: (vocabSetId: number) => void;
  addSoalConnection: (soalSetId: number, soalSetData: any) => void;
  removeSoalConnection: (soalSetId: number) => void;
  saveResources: () => Promise<void>;
  loadResources: () => Promise<void>;
}

export const initialResources: ResourcesData = {
  connectedVocabSets: [],
  connectedSoalSets: [],
};

export const createResources: StateCreator<
  KelasBuilderState,
  [["zustand/immer", never]],
  [],
  Resources
> = (set, get) => ({
  resources: initialResources,
  
  updateResources: (newResources: Partial<ResourcesData>) => {
    set((state) => {
      Object.assign(state.resources, newResources);
      state.stepDirtyFlags.resources = true;
    });
  },

  addVocabConnection: (vocabSetId: number, vocabSetData: any) => {
    set((state) => {
      const exists = state.resources.connectedVocabSets.some(v => v.id === vocabSetId);
      if (!exists) {
        state.resources.connectedVocabSets.push(vocabSetData);
        state.stepDirtyFlags.resources = true;
      }
    });
  },

  removeVocabConnection: (vocabSetId: number) => {
    set((state) => {
      state.resources.connectedVocabSets = state.resources.connectedVocabSets.filter(
        v => v.id !== vocabSetId
      );
      state.stepDirtyFlags.resources = true;
    });
  },

  addSoalConnection: (soalSetId: number, soalSetData: any) => {
    set((state) => {
      const exists = state.resources.connectedSoalSets.some(s => s.id === soalSetId);
      if (!exists) {
        state.resources.connectedSoalSets.push(soalSetData);
        state.stepDirtyFlags.resources = true;
      }
    });
  },

  removeSoalConnection: (soalSetId: number) => {
    set((state) => {
      state.resources.connectedSoalSets = state.resources.connectedSoalSets.filter(
        s => s.id !== soalSetId
      );
      state.stepDirtyFlags.resources = true;
    });
  },

  saveResources: async () => {
    const { draftId, resources } = get();
    if (!draftId) return;

    set({ isLoading: true, error: null });

    try {
      // Get current connections from database to compare
      const currentResourcesResult = await getKelasResources(draftId);
      const currentVocabIds = currentResourcesResult.success && currentResourcesResult.data
        ? currentResourcesResult.data.vocabularySets.map((vs: any) => vs.id)
        : [];

      // Handle vocabulary connections
      const newVocabIds = resources.connectedVocabSets.map(v => v.id);
      
      // Link new vocab sets
      if (newVocabIds.length > 0) {
        const vocabResult = await linkVocabularyToKelas(draftId, newVocabIds);
        if (!vocabResult.success) {
          throw new Error(vocabResult.error);
        }
      }

      // Unlink removed vocab sets
      const removedVocabIds = currentVocabIds.filter((id: number) => !newVocabIds.includes(id));
      if (removedVocabIds.length > 0) {
        const unlinkResult = await unlinkVocabularyFromKelas(draftId, removedVocabIds);
        if (!unlinkResult.success) {
          throw new Error(unlinkResult.error);
        }
      }

      // Handle soal set connections
      const currentSoalIds = currentResourcesResult.success && currentResourcesResult.data
        ? currentResourcesResult.data.soalSets.map((ss: any) => ss.koleksiSoalId)
        : [];
        
      const newSoalIds = resources.connectedSoalSets.map(s => s.id);
      
      // Link new soal sets
      if (newSoalIds.length > 0) {
        const soalResult = await linkSoalToKelas(draftId, newSoalIds);
        if (!soalResult.success) {
          throw new Error(soalResult.error);
        }
      }

      // Unlink removed soal sets
      const removedSoalIds = currentSoalIds.filter((id: number) => !newSoalIds.includes(id));
      if (removedSoalIds.length > 0) {
        const unlinkSoalResult = await unlinkSoalFromKelas(draftId, removedSoalIds);
        if (!unlinkSoalResult.success) {
          throw new Error(unlinkSoalResult.error);
        }
      }


      set((state) => {
        state.stepDirtyFlags.resources = false;
        state.isLoading = false;
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save resources';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  loadResources: async () => {
    const { draftId } = get();
    if (!draftId) return;

    try {
      const result = await getKelasResources(draftId);
      if (result.success && result.data) {
        set((state) => {
          state.resources.connectedVocabSets = (result.data.vocabularySets as any[]).map(vs => ({
            ...vs,
            kelasVocabularySets: vs.kelasVocabularySets || [],
            user: vs.user || null,
          })) as VocabularySet[];

          // Load soal set connections
          state.resources.connectedSoalSets = (result.data.soalSets as any[]).map(ss => ({
            ...ss.koleksiSoal,
            kelasKoleksiSoals: ss.koleksiSoal?.kelasKoleksiSoals || [],
          })) as SoalSet[];
        });
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  },
});