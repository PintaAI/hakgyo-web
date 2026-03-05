"use client";

import { useEffect, useState } from "react";
import { getGuruVocabularySets, deleteVocabularySet } from "@/app/actions/kelas/vocabulary";
import { VocabSet, VocabSheet } from "./vocab-sheet";
import { VocabCard } from "./vocab-card";
import { ManageLayout } from "./manage-layout";



interface ManageVocabProps {
  refreshKey?: number;
}


export function ManageVocab({ refreshKey = 0 }: ManageVocabProps) {
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingVocabSet, setEditingVocabSet] = useState<VocabSet | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublic, setFilterPublic] = useState<"ALL" | "PUBLIC" | "PRIVATE">("ALL");

  const fetchVocabSets = async () => {
    try {
      const result = await getGuruVocabularySets();
      if (result.success && result.data) {
        // Transform the API response to match VocabSet interface
        const transformedVocabSets = result.data.map(set => ({
          ...set,
          kelas: set.kelasVocabularySets?.[0]?.kelas || null
        }));
        setVocabSets(transformedVocabSets);
      } else {
        setError(result.error || "Gagal memuat set kosakata");
      }
    } catch {
      setError("Gagal memuat set kosakata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabSets();
  }, [refreshKey]);

  const filteredVocabSets = vocabSets.filter(vocabSet => {
    const matchesSearch = vocabSet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (vocabSet.description && vocabSet.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPublic = filterPublic === "ALL" ||
                          (filterPublic === "PUBLIC" && vocabSet.isPublic) ||
                          (filterPublic === "PRIVATE" && !vocabSet.isPublic);
    return matchesSearch && matchesPublic;
  });



  const handleCreateVocab = () => {
    setEditingVocabSet(null);
    setSheetOpen(true);
  };

  const handleEditVocab = (vocabSet: VocabSet) => {
    setEditingVocabSet(vocabSet);
    setSheetOpen(true);
  };

  const handleFormSuccess = () => {
    setSheetOpen(false);
    setEditingVocabSet(null);
    // Refresh the vocab sets list
    fetchVocabSets();
  };

  const handleFormCancel = () => {
    setSheetOpen(false);
    setEditingVocabSet(null);
  };

  const handleDelete = async (vocabSetId: number) => {
    try {
      const result = await deleteVocabularySet(vocabSetId);
      if (result.success) {
        // Refresh the list
        await fetchVocabSets();
      } else {
        setError(result.error || "Gagal menghapus set kosakata");
      }
    } catch  {
      setError("Gagal menghapus set kosakata");
    }
  };



  return (
    <ManageLayout
      title="Kelola Kosakata"
      description="Kelola set kosakata dan kartu kilat Anda"
      placeholder="Cari set kosakata..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={[
        {
          key: "public",
          type: "select",
          label: "Visibilitas",
          value: filterPublic,
          options: [
            { value: "ALL", label: "Semua Set" },
            { value: "PUBLIC", label: "Publik" },
            { value: "PRIVATE", label: "Pribadi" },
          ],
          onChange: (value: string) => setFilterPublic(value as "ALL" | "PUBLIC" | "PRIVATE"),
        },
      ]}
      loading={loading}
      error={error}
      items={filteredVocabSets}
      renderItem={(vocabSet) => (
        <VocabCard
          key={vocabSet.id}
          vocabSet={vocabSet}
          onClick={() => handleEditVocab(vocabSet)}
          onDelete={(id) => handleDelete(id)}
        />
      )}
      createNewCard={{
        onClick: handleCreateVocab,
        title: "Buat Koleksi Baru",
        subtitle: "Tambah set kosakata baru",
      }}
      emptyTitle="Set Kosakata Anda"
      emptyMessage="Tidak ada set kosakata yang sesuai dengan filter Anda. Coba sesuaikan pencarian atau filter Anda."
    >
      <VocabSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        vocabSet={editingVocabSet}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </ManageLayout>
  );
}
