"use client";


import { GraduationCap } from "lucide-react";
import { VocabCard } from "@/components/dashboard/vocab-card";
import { useRouter } from "next/navigation";
import { navigateWithHashPreservation } from "@/lib/navigation-helpers";

interface VocabSet {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  isPublic: boolean;
  isDraft: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
  } | null;
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
  items: Array<{
    id: number;
    korean: string;
    indonesian: string;
    type: string;
  }>;
}

interface VocabularyTabProps {
  vocabularySets: VocabSet[];
  kelasId: number;
}

export default function VocabularyTab({ vocabularySets, kelasId }: VocabularyTabProps) {
  const router = useRouter();

  const handleVocabClick = (vocabSetId: number) => {
    navigateWithHashPreservation(
      router,
      `/kelas/${kelasId}`,
      `/kelas/${kelasId}/vocab/${vocabSetId}`,
      'vocabulary'
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Kumpulan Kosa Kata ({vocabularySets.length})</h3>
      </div>
      {vocabularySets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vocabularySets.map((vocabSet) => (
            <VocabCard
              key={vocabSet.id}
              vocabSet={vocabSet}
              compact={false}
              onClick={() => handleVocabClick(vocabSet.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
          <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Tidak ada kumpulan kosa kata yang tersedia untuk kelas ini.</p>
        </div>
      )}
    </div>
  );
}
