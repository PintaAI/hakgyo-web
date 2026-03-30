"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saveKoleksiSoal, getSoalsByKoleksi, saveSoal, saveOpsi, deleteSoal,  } from "@/app/actions/kelas/assessment";
import { SoalItemList } from "./soal-item-list";
import { SoalItemForm } from "./soal-item-form";
import { SoalSetFormSkeleton } from "./soal-set-form-skeleton";
import { Difficulty } from "@/lib/prisma-types";
import { z } from "zod";
import { useSoalStore } from "@/lib/dashboard/manage-soal-state";
import { generateItems, soalItemsSchema } from "@/lib/dashboard/ai-generation";
import { useDebouncedAutoSave } from "@/hooks/use-debounced-auto-save";
import { Loader2, Check } from "lucide-react";

type GeneratedSoalItem = z.infer<typeof soalItemsSchema.element>;

interface SoalItem {
  id?: number | string;
  pertanyaan: string;
  difficulty?: Difficulty | null;
  explanation?: string;
  opsis?: Array<{
    id?: number | string;
    opsiText: string;
    isCorrect: boolean;
  }>;
}

interface SoalSet {
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

interface SoalSetFormProps {
  soalSet?: SoalSet;
  kelasId?: number;
  onCancel?: () => void;
  onAutoSaveStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  onBeforeCloseRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

export function SoalSetForm({ soalSet, kelasId, onAutoSaveStatusChange, onBeforeCloseRef }: SoalSetFormProps) {
   const store = useSoalStore();
    const {
       loading,
       saving,
       formData,
       soals,
       originalSoals,
       deletedSoalIds,
       soalDialogOpen,
       editingSoalIndex,
       generating,
       currentSoalSetId,
       setLoading,
       setFormData,
       setOriginalFormData,
       setSoals,
       setOriginalSoals,
       setDeletedSoalIds,
       setGenerating,
       setCurrentSoalSetId,
       initForCreate,
       initForEdit,
       handleAddSoal,
       handleEditSoal,
       handleDeleteSoal,
       handleSaveSoal,
       handleCancelSoal,
       handleQuickAddSoal,
       hasDataChanged,
     } = store;

   const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
   const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
   const manualSavingRef = useRef(false);
   const saveVersionRef = useRef(0);
   const lastSavedDataRef = useRef<{ formData: typeof formData, soals: typeof soals } | null>(null);

   // Notify parent of auto-save status changes
   useEffect(() => {
    onAutoSaveStatusChange?.(autoSaveStatus);
  }, [autoSaveStatus, onAutoSaveStatusChange]);


     const performAutoSave = useCallback(async () => {
     if (saving || manualSavingRef.current) {
       return;
     }

     const currentVersion = ++saveVersionRef.current;
     setAutoSaveStatus('saving');

     const dataToSave = {
       formData: JSON.parse(JSON.stringify(formData)),
       soals: JSON.parse(JSON.stringify(soals))
     };

     try {
       // Add a minimum delay to make the spinner visible
       const savePromise = performSave(currentVersion);
       const delayPromise = new Promise(resolve => setTimeout(resolve, 1000));

       // Wait for both the save operation and the minimum delay
       await Promise.all([savePromise, delayPromise]);

       if (currentVersion !== saveVersionRef.current) {
         return; // A newer save took precedence
       }

       setAutoSaveStatus('saved');
       setLastSavedAt(new Date());
       lastSavedDataRef.current = dataToSave;

       // Auto-hide the saved status after 2 seconds
       setTimeout(() => {
         if (currentVersion === saveVersionRef.current) {
           setAutoSaveStatus('idle');
         }
       }, 2000);
     } catch (error) {
       if (currentVersion !== saveVersionRef.current) return;
       console.error('Auto-save failed:', error);
       setAutoSaveStatus('error');
       
       if (lastSavedDataRef.current) {
         setFormData(lastSavedDataRef.current.formData);
         setSoals(lastSavedDataRef.current.soals);
       }
     }
   }, [saving, formData, soals, autoSaveStatus]); // eslint-disable-line react-hooks/exhaustive-deps

   // Initialize debounced auto-save with longer delay to see spinner
   const { debouncedSave, cancelAutoSave } = useDebouncedAutoSave({
     delay: 1500, // 1.5 second delay
     onSave: performAutoSave,
     enabled: !loading && formData.nama.trim().length > 0, // Only enable if form has a name
   });

   // Function to check if there are unsaved changes
    const hasUnsavedChanges = useCallback((): boolean => {
      // For new soal sets (no soalSet prop): Check if there's meaningful content beyond initial state
      if (!soalSet) {
        const hasMeaningfulName = formData.nama.trim().length > 0;
        const hasMeaningfulSoals = soals.some(soal =>
          soal.pertanyaan.trim().length > 0 ||
          (soal.opsis && soal.opsis.some(opsi => opsi.opsiText.trim().length > 0))
        );
        return hasMeaningfulName || hasMeaningfulSoals;
      }
      
      // For existing soal sets: Use the store's hasDataChanged function which compares
      // current data with original data from the store
      return hasDataChanged();
   }, [soalSet, formData, soals, hasDataChanged]);

   // Function to save before closing - returns a promise that resolves when save completes
   const saveBeforeClose = useCallback(async (): Promise<boolean> => {
     if (!hasUnsavedChanges()) {
       return true; // No unsaved changes, can close immediately
     }

     // Cancel any pending debounced save
     cancelAutoSave();

     // Trigger immediate save
     try {
       await performAutoSave();
       // Wait a bit to ensure the status is updated
       await new Promise(resolve => setTimeout(resolve, 100));
       return autoSaveStatus === 'saved' || autoSaveStatus === 'idle';
     } catch (error) {
       console.error('Save before close failed:', error);
       return false;
     }
   }, [hasUnsavedChanges, cancelAutoSave, performAutoSave, autoSaveStatus]);

   // Expose saveBeforeClose to parent via onBeforeCloseRef
   useEffect(() => {
     if (onBeforeCloseRef) {
       onBeforeCloseRef.current = saveBeforeClose;
     }
   }, [onBeforeCloseRef, saveBeforeClose]);

   // Auto-save effect that triggers on form data changes
   useEffect(() => {
     if (!loading && formData.nama.trim() && !saving && !manualSavingRef.current) {
       debouncedSave({ formData, soals });
     }
   }, [formData, soals, loading, debouncedSave, saving]);

   // Cancel auto-save on unmount or manual save
   useEffect(() => {
     manualSavingRef.current = saving;
     if (saving) {
       cancelAutoSave();
       setAutoSaveStatus('idle');
       saveVersionRef.current++; // Invalidate any pending auto-saves
     }
   }, [saving, cancelAutoSave]);

  // Load existing data if editing
  useEffect(() => {
    if (soalSet) {
      initForEdit(soalSet);

      // Fetch existing soals for this collection
      const fetchSoals = async () => {
        try {
          const result = await getSoalsByKoleksi(soalSet.id);
          if (result.success && result.data) {
            // Transform database data to component format
            const transformedSoals: SoalItem[] = result.data.map((soal: any) => ({
              id: soal.id,
              pertanyaan: soal.pertanyaan,
              difficulty: soal.difficulty,
              explanation: soal.explanation,
              opsis: soal.opsis.map((opsi: any) => ({
              id: opsi.id,
              opsiText: opsi.opsiText,
              isCorrect: opsi.isCorrect,
              })),
            }));
            setSoals(transformedSoals);
            setOriginalSoals(JSON.parse(JSON.stringify(transformedSoals))); // Deep copy for comparison
          }
        } catch (error) {
          console.error("Failed to fetch soals:", error);
        }
        setLoading(false);
      };

      fetchSoals();
    } else {
      initForCreate();
    }
  }, [soalSet, initForCreate, initForEdit, setLoading, setSoals, setOriginalSoals, setOriginalFormData]);

  const handleGenerate = async () => {
    if (!formData.nama.trim()) {
      return;
    }

    setGenerating(true);

    try {
      const prompt = `Based on the question set title '${formData.nama}' and description '${formData.deskripsi || ''}', generate 1 multiple choice question with 4 options. The question (pertanyaan) and all answer options (opsis) should be written in Korean language. The explanation should be written in Indonesian language. Make sure the question has exactly one correct answer and appropriate difficulty level.`;

      const transformFn = (item: GeneratedSoalItem) => ({
        pertanyaan: item.pertanyaan,
        difficulty: item.difficulty as Difficulty,
        explanation: item.explanation,
        opsis: item.opsis?.map((opsi) => ({
          opsiText: opsi.opsiText,
          isCorrect: opsi.isCorrect,
        })) || [
          { opsiText: "", isCorrect: false },
          { opsiText: "", isCorrect: false },
          { opsiText: "", isCorrect: false },
          { opsiText: "", isCorrect: false },
        ],
      });

      const newSoals = await generateItems(prompt, 'soal', soals, soalItemsSchema, transformFn);
      setSoals([...soals, ...newSoals]);
    } catch (error) {
      console.error('Error generating questions:', error);
      // TODO: Show error toast
    } finally {
      setGenerating(false);
    }
  };


  // Save function for auto-save (no onSuccess callback to avoid closing dialog)
  const performSave = async (version?: number) => {
    // Check if a newer version started before we begin
    if (version !== undefined && version !== saveVersionRef.current) return;
    if (manualSavingRef.current && version !== undefined) return;

    // Don't set setSaving(true) here as it interferes with autoSaveStatus
    // setSaving(true);

    const checkVersion = () => {
        return version === undefined || version === saveVersionRef.current;
    };

    try {
      // First, handle deletions
      for (const deletedSoalId of deletedSoalIds) {
        if (!checkVersion() || (manualSavingRef.current && version !== undefined)) return;
        await deleteSoal(deletedSoalId);
      }

      if (!checkVersion() || (manualSavingRef.current && version !== undefined)) return;

      // Save the collection metadata (only if it changed)
      // Use currentSoalSetId if available (for newly created sets), otherwise use soalSet?.id (for editing)
      const soalSetIdToUse = currentSoalSetId || soalSet?.id;
      const koleksiResult = await saveKoleksiSoal(kelasId || null, {
        nama: formData.nama,
        deskripsi: formData.deskripsi || undefined,
        isPrivate: formData.isPrivate,
        isDraft: formData.isDraft,
      }, soalSetIdToUse);

      if (!checkVersion() || (manualSavingRef.current && version !== undefined)) return;

      if (koleksiResult.success && koleksiResult.data) {
        const koleksiSoalId = koleksiResult.data.id;

        // Store the ID from the first save so subsequent auto-saves update the same record
        if (koleksiSoalId && !currentSoalSetId) {
          setCurrentSoalSetId(koleksiSoalId);
        }

        // Only save soals that have changed or are new
        for (let i = 0; i < soals.length; i++) {
          const soalItem = soals[i];
          const originalSoal = originalSoals[i];

          // Skip if soal hasn't changed
          if (originalSoal && JSON.stringify(soalItem) === JSON.stringify(originalSoal)) {
            continue;
          }

          if (soalItem.pertanyaan.trim()) {
            const soalResult = await saveSoal(koleksiSoalId, {
              pertanyaan: soalItem.pertanyaan,
              difficulty: soalItem.difficulty || undefined,
              explanation: soalItem.explanation,
              isActive: true,
            }, typeof soalItem.id === 'number' ? soalItem.id : undefined);

            if (!checkVersion() || (manualSavingRef.current && version !== undefined)) return;

            if (soalResult.success && soalResult.data && soalItem.opsis) {
              const soalId = soalResult.data.id;

              // Save options that have changed or are new
              for (let j = 0; j < soalItem.opsis.length; j++) {
                const opsi = soalItem.opsis[j];
                const originalOpsi = originalSoal?.opsis?.[j];

                // Skip if option hasn't changed
                if (originalOpsi && JSON.stringify(opsi) === JSON.stringify(originalOpsi)) {
                  continue;
                }

                if (opsi.opsiText.trim()) {
                  await saveOpsi(soalId, {
                    opsiText: opsi.opsiText,
                    isCorrect: opsi.isCorrect,
                    order: j,
                  }, typeof opsi.id === 'number' ? opsi.id : undefined);
                }
              }
            }
          }
        }

        // Clear deletion tracking after successful save
        setDeletedSoalIds([]);
        // Update original data for next comparison
        setOriginalSoals(JSON.parse(JSON.stringify(soals)));
        setOriginalFormData(JSON.parse(JSON.stringify(formData)));
        
        // Don't call onSuccess to avoid auto-closing the dialog
        // Users can manually close via the sheet's close button
      } else {
        console.error("Failed to save collection:", koleksiResult.error);
        throw new Error(koleksiResult.error || "Failed to save collection");
      }
    } catch (error) {
      console.error("Error saving soal set:", error);
      throw error;
    } finally {
      // Don't set setSaving(false) here as it interferes with autoSaveStatus
      // setSaving(false);
    }
  };

  if (loading) {
    return <SoalSetFormSkeleton />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="nama" className="text-lg font-medium text-foreground flex items-center gap-2">
                Nama Set Soal
                <span className="text-destructive">*</span>
                {/* Enhanced auto-save status indicator */}
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in-0 duration-300">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in-0 duration-300">
                    <Check className="h-3 w-3" />
                    <span>Tersimpan!</span>
                  </div>
                )}
                {autoSaveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-xs text-red-600 animate-in fade-in-0 duration-300">
                    <span>Gagal Menyimpan</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        performAutoSave();
                      }}
                      className="underline hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Coba Simpan Lagi
                    </button>
                  </div>
                )}
                {lastSavedAt && autoSaveStatus !== 'saving' && autoSaveStatus !== 'error' && (
                  <div className="text-xs text-muted-foreground font-normal ml-2">
                    Terakhir disimpan: {lastSavedAt.toLocaleTimeString()}
                  </div>
                )}
              </Label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="isPrivate" className="text-sm text-muted-foreground">Pribadi</Label>
                  <Switch
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onCheckedChange={(checked) => setFormData({ isPrivate: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="isDraft" className="text-sm text-muted-foreground">Draf</Label>
                  <Switch
                    id="isDraft"
                    checked={formData.isDraft}
                    onCheckedChange={(checked) => setFormData({ isDraft: checked })}
                  />
                </div>
              </div>
            </div>
            <Input
              id="nama"
              value={formData.nama}
              onChange={(e) => setFormData({ nama: e.target.value })}
              placeholder="Masukkan nama deskriptif untuk set pertanyaan Anda"
              required
              className="h-11 border-0 bg-muted/30 rounded-xl focus-visible:bg-background focus-visible:border focus-visible:border-primary/20 transition-all text-base"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="deskripsi" className="text-lg font-medium text-foreground">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={formData.deskripsi || ""}
              onChange={(e) => setFormData({ deskripsi: e.target.value })}
              placeholder="Masukkan deskripsi (opsional)"
              rows={3}
              className="min-h-[100px] border-0 bg-muted/30 rounded-xl focus-visible:bg-background focus-visible:border focus-visible:border-primary/20 transition-all resize-none"
            />
          </div>
        </div>

          {/* Soal Items */} 
          <SoalItemList
            items={soals}
            onEdit={handleEditSoal}
            onDelete={handleDeleteSoal}
            onAdd={handleAddSoal}
            onQuickAdd={handleQuickAddSoal}
            onGenerate={handleGenerate}
            generating={generating}
            title={formData.nama}
          />
       

      </div>

      <Dialog open={soalDialogOpen} onOpenChange={(open) => store.setSoalDialogOpen(open)}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-6xl max-h-[95vh] overflow-y-auto bg-background border-border/20 shadow-2xl">
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
              {editingSoalIndex !== null ? "Edit Pertanyaan" : "Tambah Pertanyaan Baru"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {editingSoalIndex !== null
                ? "Buat perubahan pada pertanyaan yang sudah ada"
                : "Buat pertanyaan baru untuk set Anda"
              }
            </p>
          </DialogHeader>
          <div className="mt-6">
            <SoalItemForm
              item={editingSoalIndex !== null ? soals[editingSoalIndex] : undefined}
              onSave={handleSaveSoal}
              onCancel={handleCancelSoal}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
