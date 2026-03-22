import type { KelasType, Difficulty,} from '@/app/generated/prisma/client';

// Base data structures from the database, used for form data
export interface KelasMetaData {
  title: string;
  description?: string;
  jsonDescription?: any;
  htmlDescription?: string;
  type: KelasType;
  level: Difficulty;
  thumbnail?: string;
  icon?: string;
  isPaidClass: boolean;
  price?: number;
  discount?: number;
  promoCode?: string;
}

export interface MateriData {
  id?: number;
  title: string;
  description: string;
  jsonDescription: any;
  htmlDescription: string;
  order: number;
  isDemo: boolean;
  isDraft: boolean;
  tempId?: string; // For optimistic UI updates
  // NEW: Assessment fields
  koleksiSoalId?: number | null;
  passingScore?: number | null;
}

// The steps in the builder UI
export type BuilderStep = 'meta' | 'content' | 'resources' | 'members' | 'review';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Vocabulary set structure
export interface VocabularySet {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  isPublic: boolean;
  isDraft: boolean;
  userId: string | null;
  items: Array<{
    id: number;
    korean: string;
    indonesian: string;
    type: string;
  }>;
  kelasVocabularySets: Array<{
    id: number;
    kelasId: number;
    order: number;
    kelas: {
      id: number;
      title: string;
      level: string;
    };
  }>;
  user: {
    id: string;
    name: string | null;
  } | null;
}

// Soal set structure
export interface SoalSet {
  id: number;
  nama: string;
  deskripsi: string | null;
  isPrivate: boolean;
  isDraft: boolean;
  createdAt: Date;
  soals: Array<{
    id: number;
    pertanyaan: string;
    difficulty: string | null;
  }>;
  user: {
    id: string;
    name: string | null;
  } | null;
  kelasKoleksiSoals: Array<{
    kelas: {
      id: number;
      title: string;
      level: string;
    };
  }>;
}

// Resources data structures
export interface ResourcesData {
  connectedVocabSets: VocabularySet[];
  connectedSoalSets: SoalSet[];
}

// The complete state of the Zustand store, combining all slices
export interface KelasBuilderState {
  // Core state
  draftId: number | null;
  kelasIsDraft: boolean;
  isLoading: boolean;
  error: string | null;
  optimisticUpdates: Record<string, unknown>;

  // Deletion tracking
  deletedMateris: number[];
  dirtyMateris: Set<number>;

  // Slices
  meta: KelasMetaData;
  materis: MateriData[];
  resources: ResourcesData;
  currentStep: BuilderStep;
  stepDirtyFlags: Record<BuilderStep, boolean>;


  calculateStepProgress: (step: BuilderStep) => number;
  calculateOverallProgress: () => number;

  // Navigation
  setCurrentStep: (step: BuilderStep) => void;
  nextStep: () => Promise<void>;
  prevStep: () => void;
  ensureDraftExists: () => Promise<void>;

  // Meta
  updateMeta: (meta: Partial<KelasMetaData>) => void;
  saveMeta: () => Promise<void>;

  // Content
  addMateri: (materi: Omit<MateriData, 'order'>) => void;
  updateMateri: (id: number | string, materi: Partial<MateriData>) => void;
  removeMateri: (id: number | string) => void;
  reorderMateris: (fromId: number | string, toId: number | string) => void;
  toggleMateriDraft: (id: number | string) => Promise<void>;
  saveMateris: () => Promise<void>;

  // Resources
  updateResources: (resources: Partial<ResourcesData>) => void;
  addVocabConnection: (vocabSetId: number, vocabSetData: any) => void;
  removeVocabConnection: (vocabSetId: number) => void;
  addSoalConnection: (soalSetId: number, soalSetData: any) => void;
  removeSoalConnection: (soalSetId: number) => void;
  saveResources: () => Promise<void>;
  loadResources: () => Promise<void>;
 
  // Global Actions
  createDraft: (initialMeta: KelasMetaData) => Promise<void>;
  loadDraft: (kelasId: number) => Promise<void>;
  publishDraft: () => Promise<void>;
  // Unpublish a previously published kelas (sets it back to draft state)
  unpublishDraft: () => Promise<void>;
  deleteDraft: () => Promise<void>;
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}