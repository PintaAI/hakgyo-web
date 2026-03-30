"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, HelpCircle, Sparkles } from "lucide-react";
import { Difficulty } from "@/lib/prisma-types";

interface SoalItem {
  id?: number | string;
  pertanyaan: string;
  difficulty?: Difficulty | null;
  opsis?: Array<{
    id?: number | string;
    opsiText: string;
    isCorrect: boolean;
  }>;
}

interface SoalItemListProps {
  items: SoalItem[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
  onQuickAdd: (pertanyaan: string) => void;
  onGenerate?: () => void;
  generating?: boolean;
  title?: string;
}

export function SoalItemList({ items, onEdit, onDelete, onAdd, onQuickAdd, onGenerate, generating, title }: SoalItemListProps) {
  const [quickPertanyaan, setQuickPertanyaan] = useState("");
  const pertanyaanRef = useRef<HTMLInputElement>(null);

  const handleQuickAdd = () => {
    if (!quickPertanyaan.trim()) return;
    onQuickAdd(quickPertanyaan.trim());
    setQuickPertanyaan("");
    pertanyaanRef.current?.focus();
  };

  const getDifficultyColor = (difficulty?: Difficulty | null) => {
    switch (difficulty) {
      case "BEGINNER":
        return "bg-primary/10 border-primary/30 text-success";
      case "INTERMEDIATE":
        return "bg-secondary/20 border-secondary/40 text-secondary-foreground";
      case "ADVANCED":
        return "bg-destructive/10 border-destructive/30 text-destructive";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Pertanyaan</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} pertanyaan dibuat
          </p>
        </div>
        <div className="flex gap-2">
          {onGenerate && (
            <Button
              type="button"
              onClick={onGenerate}
              disabled={generating || !title?.trim()}
              variant="outline"
              className="border-border hover:bg-accent shadow-sm transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? "Membuat..." : "Buat Pertanyaan"}
            </Button>
          )}
          <Button
            type="button"
            onClick={onAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pertanyaan
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          ref={pertanyaanRef}
          placeholder="Ketik pertanyaan Anda di sini..."
          value={quickPertanyaan}
          onChange={(e) => setQuickPertanyaan(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuickAdd();
            }
          }}
          className="flex-1 border-border focus:border-primary focus:ring-primary/20"
        />
        <Button 
          onClick={handleQuickAdd} 
          disabled={!quickPertanyaan.trim()}
          variant="outline"
          className="border-border hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-xl bg-muted/50">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
            <HelpCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Belum ada pertanyaan</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Buat pertanyaan pertama Anda menggunakan formulir di atas atau klik tombol Tambah Pertanyaan untuk memulai.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const totalOptions = item.opsis?.length || 0;
            
            return (
              <div
                key={item.id || index}
                className={`group relative border rounded-xl p-5 transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.01] ${getDifficultyColor(item.difficulty)}`}
                onClick={() => onEdit(index)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-card rounded-full flex items-center justify-center text-sm font-semibold shadow-sm border border-border flex-shrink-0">
                      {index + 1}
                    </div>
                    <div 
                      className="text-base leading-relaxed text-foreground font-medium flex-1 min-w-0"
                      dangerouslySetInnerHTML={{ __html: item.pertanyaan }}
                    />
                  </div>
                  
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(index);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge 
                      variant="secondary" 
                      className="text-xs font-medium bg-card/80 backdrop-blur-sm border-0"
                    >
                      {item.difficulty?.toLowerCase() || 'belum diatur'}
                    </Badge>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 bg-current rounded-full"></div>
                      {totalOptions} opsi
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Klik untuk mengedit
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
