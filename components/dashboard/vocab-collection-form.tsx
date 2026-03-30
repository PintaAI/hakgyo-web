"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saveVocabularySet } from "@/app/actions/kelas/vocabulary";
import { VocabularyType } from "@/lib/prisma-types";
import { VocabItemList } from "./vocab-item-list";
import { VocabItemForm } from "./vocab-item-form";
import { IconPicker, } from "@/components/shared/icon-picker";
import { z } from "zod";
import { generateItems, vocabularyItemsSchema } from "@/lib/dashboard/ai-generation";
import { useVocabStore } from "@/lib/dashboard/manage-vocab-state";
import { useDebouncedAutoSave } from "@/hooks/use-debounced-auto-save";
import { Loader2, Check } from "lucide-react";

type GeneratedVocabularyItem = z.infer<typeof vocabularyItemsSchema.element>;

interface VocabCollectionFormProps {
  vocabSet?: any; // For edit mode data (includes id)
  kelasId?: number;
  onCancel?: () => void;
}


export function VocabCollectionForm({ vocabSet, kelasId,  }: VocabCollectionFormProps) {
   const store = useVocabStore();
   const {
     loading,
     saving,
     formData,
     items,
     itemDialogOpen,
     editingItemIndex,
     generating,
     currentVocabSetId,
     setLoading,
     
     setFormData,
     setItems,
     
     setGenerating,
     setCurrentVocabSetId,
     initForCreate,
     initForEdit,
     handleAddItem,
     handleEditItem,
     handleDeleteItem,
     handleSaveItem,
     handleCancelItem,
     handleQuickAdd,
   } = store;

   const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

   // Auto-save function that saves form data
   const performAutoSave = async () => {
     if (saving) {
       return;
     }

     setAutoSaveStatus('saving');

     try {
       // Add a minimum delay to make the spinner visible
       const savePromise = performSave();
       const delayPromise = new Promise(resolve => setTimeout(resolve, 1000));

       // Wait for both the save operation and the minimum delay
       await Promise.all([savePromise, delayPromise]);

       setAutoSaveStatus('saved');

       // Auto-hide the saved status after 2 seconds
       setTimeout(() => {
         setAutoSaveStatus('idle');
       }, 2000);
     } catch (error) {
       console.error('Vocab auto-save failed:', error);
       setAutoSaveStatus('error');
       setTimeout(() => {
         setAutoSaveStatus('idle');
       }, 3000);
     }
   };

   // Initialize debounced auto-save
   const { debouncedSave, cancelAutoSave } = useDebouncedAutoSave({
     delay: 1500, // 1.5 second delay
     onSave: performAutoSave,
     enabled: !loading && formData.title.trim().length > 0, // Only enable if form has a title
   });

   // Auto-save effect that triggers on form data changes
   useEffect(() => {
     if (!loading && formData.title.trim()) {
       debouncedSave({ formData, items });
     }
   }, [formData, items, loading, debouncedSave]);

   // Cancel auto-save on unmount or manual save
   useEffect(() => {
     if (saving) {
       cancelAutoSave();
       setAutoSaveStatus('idle');
     }
   }, [saving, cancelAutoSave]);

  // Load existing data if editing
  useEffect(() => {
    if (vocabSet) {
      initForEdit(vocabSet);

      // Populate items with existing data
      if (vocabSet.items && vocabSet.items.length > 0) {
        const existingItems = vocabSet.items.map((item: any) => ({
          id: item.id,
          korean: item.korean || "",
          indonesian: item.indonesian || "",
          type: item.type || VocabularyType.WORD,
          pos: item.pos,
          audioUrl: item.audioUrl,
          exampleSentences: item.exampleSentences && item.exampleSentences.length > 0
            ? item.exampleSentences
            : [""],
        }));
        setItems(existingItems);
      }

      setLoading(false);
    } else {
      initForCreate();
    }
  }, [vocabSet, initForCreate, initForEdit, setLoading, setItems]);

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      return;
    }

    setGenerating(true);

    try {
      const prompt = `Based on the title '${formData.title}' and description '${formData.description || ''}', generate 5 vocabulary words in Korean with their Indonesian translations, types, and example sentences.`;

      const transformFn = (item: GeneratedVocabularyItem) => ({
        korean: item.korean,
        indonesian: item.indonesian,
        type: item.type as VocabularyType,
        exampleSentences: [item.korean_example_sentence],
      });

      const newItems = await generateItems(prompt, 'vocabulary', items, vocabularyItemsSchema, transformFn);
      setItems([...items, ...newItems]);
    } catch (error) {
      console.error('Error generating vocabulary items:', error);
      // TODO: Show error toast
    } finally {
      setGenerating(false);
    }
  };

  // Save function for auto-save (no onSuccess callback to avoid closing dialog)
  const performSave = async () => {
    // Don't set setSaving(true) here as it interferes with autoSaveStatus

    try {
      // Filter out empty items
      const validItems = items.filter(item => item.korean.trim() && item.indonesian.trim());

      // Use currentVocabSetId if available (for newly created sets), otherwise use vocabSet?.id (for editing)
      const vocabSetIdToUse = currentVocabSetId || vocabSet?.id;

      const result = await saveVocabularySet(kelasId || null, {
        title: formData.title,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        isPublic: formData.isPublic,
        isDraft: formData.isDraft,
        items: validItems,
      }, vocabSetIdToUse);

      if (!result.success) {
        console.error("Failed to save:", result.error);
        throw new Error(result.error || 'Save failed');
      }

      // Store the ID from the first save so subsequent auto-saves update the same record
      if (result.data?.id && !currentVocabSetId) {
        setCurrentVocabSetId(result.data.id);
      }
    } catch (error) {
      console.error("Error saving vocabulary set:", error);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-6">Memuat...</div>;
  }

  return (
    <div className="w-full max-w-4xl pt-0 mx-auto p-6">
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="rounded-full p-1 border border-dashed border-primary hover:border-gray-400 transition-colors">
              <IconPicker
                value={formData.icon}
                onChange={(value) => setFormData({ icon: value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-lg font-medium text-foreground flex items-center gap-2">
                Judul Set Kosakata
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
                  <div className="flex items-center gap-1 text-xs text-red-600 animate-in fade-in-0 duration-300">
                    <span>Penyimpanan gagal</span>
                  </div>
                )}
              </Label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="isPublic" className="text-sm text-muted-foreground">Publik</Label>
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ isPublic: checked })}
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
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ title: e.target.value })}
              placeholder="Masukkan judul deskriptif untuk set kosakata Anda"
              required
              className="h-11 border-0 bg-muted/30 rounded-xl focus-visible:bg-background focus-visible:border focus-visible:border-primary/20 transition-all text-base"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-lg font-medium text-foreground">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ description: e.target.value })}
              placeholder="Masukkan deskripsi (opsional)"
              rows={3}
              className="min-h-[100px] border-0 bg-muted/30 rounded-xl focus-visible:bg-background focus-visible:border focus-visible:border-primary/20 transition-all resize-none"
            />
          </div>
        </div>


        <VocabItemList
          items={items}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onAdd={handleAddItem}
          onQuickAdd={handleQuickAdd}
          onGenerate={handleGenerate}
          generating={generating}
          title={formData.title}
        />

      </div>

      <Dialog open={itemDialogOpen} onOpenChange={(open) => store.setItemDialogOpen(open)}>
        <DialogContent className="max-w-6xl w-full sm:max-w-6xl max-h-[95vh] overflow-y-auto bg-background border-border/20 shadow-2xl">
          <DialogHeader className="border-b border-border/50">
            <DialogTitle className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
              {editingItemIndex !== null ? "Edit Item Kosakata" : "Tambah Item Kosakata Baru"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {editingItemIndex !== null
                ? "Lakukan perubahan pada item kosakata yang ada"
                : "Buat item kosakata baru untuk set Anda"
              }
            </p>
          </DialogHeader>
          <div className="mt-2">
            <VocabItemForm
              item={editingItemIndex !== null ? items[editingItemIndex] : undefined}
              onSave={handleSaveItem}
              onCancel={handleCancelItem}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
