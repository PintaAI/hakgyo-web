"use client";

import { useEffect, useState } from "react";
import { getGuruSoalSets, deleteSoalSet } from "@/app/actions/kelas/soal-set";
import { SoalCard } from "./soal-card";
import { SoalSet, SoalSheet } from "./soal-sheet";
import { ManageLayout } from "./manage-layout";



interface ManageSoalsProps {
  refreshKey?: number;
}


export function ManageSoals({ refreshKey = 0 }: ManageSoalsProps) {
  const [soalSets, setSoalSets] = useState<SoalSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "DRAFT" | "PUBLISHED">("ALL");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSoalSet, setEditingSoalSet] = useState<SoalSet | null>(null);

  useEffect(() => {
    const fetchSoalSets = async () => {
      try {
        const result = await getGuruSoalSets();
        if (result.success && result.data) {
          setSoalSets(result.data);
        } else {
          setError(result.error || "Failed to load soal sets");
        }
      } catch {
        setError("Failed to load soal sets");
      } finally {
        setLoading(false);
      }
    };

    fetchSoalSets();
  }, [refreshKey]);

  const filteredSoalSets = soalSets.filter(soalSet => {
    const matchesSearch = soalSet.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (soalSet.deskripsi && soalSet.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "ALL" ||
                          (filterStatus === "PUBLISHED" && !soalSet.isDraft) ||
                          (filterStatus === "DRAFT" && soalSet.isDraft);
    return matchesSearch && matchesStatus;
  });

 

  const handleCreateSoal = () => {
    setEditingSoalSet(null);
    setSheetOpen(true);
  };

  const handleEditSoal = (soalSet: SoalSet) => {
    setEditingSoalSet(soalSet);
    setSheetOpen(true);
  };

  const handleFormSuccess = () => {
    setSheetOpen(false);
    setEditingSoalSet(null);
    // Refresh the soal sets list
    const fetchSoalSets = async () => {
      try {
        const result = await getGuruSoalSets();
        if (result.success && result.data) {
          setSoalSets(result.data);
        }
      } catch (err) {
        console.error("Failed to refresh soal sets:", err);
      }
    };
    fetchSoalSets();
  };

  const handleFormCancel = () => {
    setSheetOpen(false);
    setEditingSoalSet(null);
  };

  const handleDelete = async (soalSetId: number) => {
    try {
      const result = await deleteSoalSet(soalSetId);
      if (result.success) {
        // Refresh the list
        const fetchSoalSets = async () => {
          try {
            const result = await getGuruSoalSets();
            if (result.success && result.data) {
              setSoalSets(result.data);
            }
          } catch (err) {
            console.error("Failed to refresh soal sets:", err);
          }
        };
        fetchSoalSets();
      } else {
        setError(result.error || "Failed to delete soal set");
      }
    } catch  {
      setError("Failed to delete soal set");
    }
  };



  return (
    <ManageLayout
      title="Kelola Soal"
      description="Kelola set soal dan pertanyaan Anda"
      placeholder="Cari set soal..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={[
        {
          key: "status",
          type: "select",
          label: "Status",
          value: filterStatus,
          options: [
            { value: "ALL", label: "Semua Set" },
            { value: "PUBLISHED", label: "Diterbitkan" },
            { value: "DRAFT", label: "Draf" },
          ],
          onChange: (value: string) => setFilterStatus(value as "ALL" | "DRAFT" | "PUBLISHED"),
        },
      ]}
      loading={loading}
      error={error}
      items={filteredSoalSets}
      renderItem={(soalSet) => (
        <SoalCard
          key={soalSet.id}
          soalSet={soalSet}
          onClick={() => handleEditSoal(soalSet)}
          onDelete={(id) => handleDelete(id)}
        />
      )}
      createNewCard={{
        onClick: handleCreateSoal,
        title: "Buat Set Baru",
        subtitle: "Tambahkan set soal baru",
      }}
      emptyTitle="Set Soal Anda"
      emptyMessage="Tidak ada set soal yang ditemukan sesuai dengan filter Anda. Coba sesuaikan pencarian atau filter Anda."
    >
      <SoalSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        soalSet={editingSoalSet}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </ManageLayout>
  );
}
