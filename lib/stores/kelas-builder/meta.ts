import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { KelasBuilderState, KelasMetaData } from './types';
import { updateKelas } from '@/app/actions/kelas';
import { KelasType, Difficulty } from '@/app/generated/prisma/client';

export const initialMeta: KelasMetaData = {
  title: '',
  description: '',
  type: KelasType.REGULAR,
  level: Difficulty.BEGINNER,
  thumbnail: '',
  icon: '',
  isPaidClass: false,
};

export interface Meta {
  meta: KelasMetaData;
  updateMeta: (meta: Partial<KelasMetaData>) => void;
  saveMeta: () => Promise<void>;
}

export const createMeta: StateCreator<
  KelasBuilderState,
  [["zustand/immer", never]],
  [],
  Meta
> = (set, get) => ({
  meta: initialMeta,
  updateMeta: (meta: Partial<KelasMetaData>) => {
    set((state) => {
      Object.assign(state.meta, meta);
      state.stepDirtyFlags.meta = true;
    });
  },
  saveMeta: async () => {
    const { draftId, meta } = get();
    if (!draftId) return;

    set({ error: null });

    try {
      // Serialize JSON data to ensure it's safe for server actions
      const serializedMeta = {
        ...meta,
        jsonDescription: meta.jsonDescription
          ? JSON.parse(JSON.stringify(meta.jsonDescription))
          : undefined
      };
      
      const result = await updateKelas(draftId, serializedMeta);
      if (result.success) {
        set((state) => {
          state.stepDirtyFlags.meta = false;
        });
        toast.success('Meta information updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update meta');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update meta';
      set({ error: errorMessage });
      toast.error('Failed to update meta information');
    }
  },
});