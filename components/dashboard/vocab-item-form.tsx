"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VocabularyType, PartOfSpeech } from "@/lib/prisma-types";
import { Plus, Trash2 } from "lucide-react";
import { useMediaUpload } from "@/hooks/use-media-upload";

interface VocabItem {
  id?: number | string;
  korean: string;
  indonesian: string;
  type: VocabularyType;
  pos?: PartOfSpeech;
  audioUrl?: string;
  exampleSentences: string[];
}

interface VocabItemFormProps {
  item?: VocabItem;
  onSave: (item: VocabItem) => void;
  onCancel: () => void;
}

export function VocabItemForm({ item, onSave, onCancel }: VocabItemFormProps) {
  const [formData, setFormData] = useState<VocabItem>({
    id: item?.id,
    korean: item?.korean || "",
    indonesian: item?.indonesian || "",
    type: item?.type || VocabularyType.WORD,
    pos: item?.pos,
    audioUrl: item?.audioUrl || "",
    exampleSentences: item?.exampleSentences && item.exampleSentences.length > 0
      ? item.exampleSentences
      : [""],
  });

  const [generating, setGenerating] = useState(false);

  const { uploadFiles } = useMediaUpload({
    allowedTypes: ['audio'],
    onError: (error) => {
      console.error('Upload error:', error);
    },
  });

  const updateExampleSentence = (index: number, value: string) => {
    const updatedSentences = [...formData.exampleSentences];
    updatedSentences[index] = value;
    setFormData({ ...formData, exampleSentences: updatedSentences });
  };

  const addExampleSentence = () => {
    setFormData({
      ...formData,
      exampleSentences: [...formData.exampleSentences, ""],
    });
  };

  const removeExampleSentence = (index: number) => {
    if (formData.exampleSentences.length > 1) {
      const updatedSentences = formData.exampleSentences.filter((_, i) => i !== index);
      setFormData({ ...formData, exampleSentences: updatedSentences });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty example sentences
    const filteredSentences = formData.exampleSentences.filter(s => s.trim());
    const finalItem = {
      ...formData,
      exampleSentences: filteredSentences.length > 0 ? filteredSentences : [""],
    };
    onSave(finalItem);
  };

  const handleGenerateAudio = async () => {
    if (!formData.korean.trim()) {
      console.warn('Korean text is required for audio generation');
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: formData.korean }),
      });

      if (!response.ok) {
        throw new Error(`TTS generation failed: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioFile = new File([audioBlob], `${formData.korean}-audio.mp3`, {
        type: audioBlob.type || 'audio/mpeg',
      });

      const uploadedFiles = await uploadFiles([audioFile]);

      if (uploadedFiles && uploadedFiles.length > 0) {
        setFormData((prev) => ({ ...prev, audioUrl: uploadedFiles[0].url }));
      } else {
        throw new Error('No file uploaded');
      }
    } catch (error) {
      console.error('Audio generation or upload failed:', error);
      // Could add user notification here
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="korean">Korea *</Label>
          <Input
            id="korean"
            value={formData.korean}
            onChange={(e) => setFormData({ ...formData, korean: e.target.value })}
            placeholder="Kata Korea"
            required
          />
        </div>
        <div>
          <Label htmlFor="indonesian">Indonesia *</Label>
          <Input
            id="indonesian"
            value={formData.indonesian}
            onChange={(e) => setFormData({ ...formData, indonesian: e.target.value })}
            placeholder="Terjemahan Indonesia"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipe</Label>
          <select
            id="type"
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as VocabularyType })}
          >
            <option value={VocabularyType.WORD}>Kata</option>
            <option value={VocabularyType.SENTENCE}>Kalimat</option>
            <option value={VocabularyType.IDIOM}>Idiom</option>
          </select>
        </div>
        <div>
          <Label htmlFor="pos">Kelas Kata</Label>
          <select
            id="pos"
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            value={formData.pos || ""}
            onChange={(e) => setFormData({
              ...formData,
              pos: e.target.value as PartOfSpeech || undefined
            })}
          >
            <option value="">Pilih Kelas Kata</option>
            <option value={PartOfSpeech.KATA_KERJA}>Kata Kerja</option>
            <option value={PartOfSpeech.KATA_BENDA}>Kata Benda</option>
            <option value={PartOfSpeech.KATA_SIFAT}>Kata Sifat</option>
            <option value={PartOfSpeech.KATA_KETERANGAN}>Kata Keterangan</option>
          </select>
        </div>
      </div>

      <div>
        <Label>Audio</Label>
        {!formData.audioUrl && (
          <Button
            type="button"
            onClick={handleGenerateAudio}
            disabled={!formData.korean.trim() || generating}
            className="w-full"
          >
            {generating ? "Membuat Audio..." : "Buat Audio"}
          </Button>
        )}
        {formData.audioUrl && (
          <div className="mt-2">
            <audio
              controls
              src={formData.audioUrl}
              className="w-full"
            />
          </div>
        )}
      </div>

      <div>
        <Label>Contoh Kalimat</Label>
        {formData.exampleSentences.map((sentence, index) => (
          <div key={index} className="flex gap-2 mt-2">
            <Input
              value={sentence}
              onChange={(e) => updateExampleSentence(index, e.target.value)}
              placeholder="Contoh kalimat"
            />
            {formData.exampleSentences.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeExampleSentence(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addExampleSentence}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Contoh
        </Button>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          {item ? "Perbarui" : "Tambah"} Item
        </Button>
      </div>
    </form>
  );
}
