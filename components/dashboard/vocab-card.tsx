"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { IconRenderer } from "@/components/shared/icon-picker";
import { useState } from "react";

interface VocabSet {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  isPublic: boolean;
  isDraft: boolean;
  createdAt?: Date;
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

interface VocabCardProps {
  vocabSet: VocabSet;
  onClick?: () => void;
  onDelete?: (id: number) => void;
  compact?: boolean;
}

export function VocabCard({ vocabSet, onClick, onDelete, compact = false }: VocabCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  if (compact) {
    return (
      <Card className="group overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer p-4 relative bg-gradient-to-br from-card to-muted/20 rounded-lg" onClick={onClick}>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-card" />
        <CardContent className="p-0 space-y-3 pl-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-primary mb-1 break-words line-clamp-1">
                {vocabSet.title}
              </h3>
              <p className="text-sm text-muted-foreground break-words">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {vocabSet.items.length} item
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                {vocabSet.icon ? (
                  <IconRenderer icon={vocabSet.icon} className="h-4 w-4" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all bg-card cursor-pointer py-0 relative border"
      onClick={onClick}
    >
      {/* Media */}
      <div className="relative">
        <div className="relative w-full aspect-[16/9]">
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/90 to-primary/70 dark:from-primary/80 dark:to-primary/60">
            {vocabSet.icon ? (
              <IconRenderer icon={vocabSet.icon} className="h-12 w-12 text-primary-foreground" />
            ) : (
              <BookOpen className="h-12 w-12 text-primary-foreground" />
            )}
          </div>
          {/* gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent dark:from-black/50 dark:via-black/20" />

          {/* badges */}
          <div className="absolute top-2 left-2 flex gap-2">
            {vocabSet.isDraft && (
              <Badge variant="destructive" className="h-6 px-2 text-[10px]">
                Draf
              </Badge>
            )}
            {vocabSet.isPublic && !vocabSet.isDraft && (
              <Badge variant="secondary" className="h-6 px-2 text-[10px]">
                Publik
              </Badge>
            )}
          </div>

          {/* Delete button - top right, hover only */}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
              className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 hover:bg-background/90 backdrop-blur-sm text-destructive border"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {/* overlay: info at bottom */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-3 text-xs text-white/90">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {vocabSet.items.length} item
              </span>
              <span>{vocabSet.createdAt ? new Date(vocabSet.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="sm:px-4 pt-0 pb-3 sm:pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold leading-snug line-clamp-2 text-foreground">
              {vocabSet.title}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground/80 dark:text-muted-foreground line-clamp-2">
              {vocabSet.description || "Tidak ada deskripsi tersedia"}
            </p>
          </div>
        </div>
      </CardContent>
  
      {onDelete && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Set Kosakata?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus set kosakata {vocabSet.title} dan semua itemnya secara permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(vocabSet.id);
                  setDeleteDialogOpen(false);
                }}
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
