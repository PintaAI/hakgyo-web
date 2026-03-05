"use client";

import { useEffect, useState } from "react";
import { getGuruTryouts, deleteTryout, toggleTryoutActive, getGuruKelas } from "@/app/actions/kelas/tryout";
import { Tryout, TryoutCard } from "./tryout-card";
import { TryoutSheet } from "./tryout-sheet";
import { ManageLayout } from "./manage-layout";
import { toast } from "sonner";

interface ManageTryoutProps {
  refreshKey?: number;
}

export function ManageTryout({ refreshKey = 0 }: ManageTryoutProps) {
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTryout, setEditingTryout] = useState<Tryout | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "UPCOMING" | "EXPIRED">("ALL");
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [kelasList, setKelasList] = useState<{ id: number; title: string }[]>([]);

  const fetchTryouts = async () => {
    try {
      const result = await getGuruTryouts();
      if (result.success && result.data) {
        setTryouts(result.data);
      } else {
        setError(result.error || "Gagal memuat tryout");
      }
    } catch {
      setError("Gagal memuat tryout");
    } finally {
      setLoading(false);
    }
  };

  const fetchKelas = async () => {
    try {
      const result = await getGuruKelas();
      if (result.success && result.data) {
        setKelasList(result.data.map((k) => ({ id: k.id, title: k.title })));
      }
    } catch (error) {
      console.error("Failed to fetch kelas:", error);
    }
  };

  useEffect(() => {
    fetchTryouts();
    fetchKelas();
  }, [refreshKey]);

  const filteredTryouts = tryouts.filter(tryout => {
    const matchesSearch = tryout.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (tryout.description && tryout.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const now = new Date();
    const isExpired = now > new Date(tryout.endTime);
    const isUpcoming = now < new Date(tryout.startTime);
    
    let matchesStatus = true;
    switch (filterStatus) {
      case "ACTIVE":
        matchesStatus = tryout.isActive && !isExpired;
        break;
      case "INACTIVE":
        matchesStatus = !tryout.isActive;
        break;
      case "UPCOMING":
        matchesStatus = isUpcoming;
        break;
      case "EXPIRED":
        matchesStatus = isExpired;
        break;
      default:
        matchesStatus = true;
    }
    
    const matchesKelas = selectedKelas === null || tryout.kelasId === selectedKelas;
    
    return matchesSearch && matchesStatus && matchesKelas;
  });

  const handleCreateTryout = () => {
    setEditingTryout(null);
    setSheetOpen(true);
  };

  const handleEditTryout = (tryout: Tryout) => {
    setEditingTryout(tryout);
    setSheetOpen(true);
  };

  const handleFormSuccess = () => {
    setSheetOpen(false);
    setEditingTryout(null);
    fetchTryouts();
  };

  const handleFormCancel = () => {
    setSheetOpen(false);
    setEditingTryout(null);
  };

  const handleDelete = async (tryoutId: number) => {
    try {
      const result = await deleteTryout(tryoutId);
      if (result.success) {
        toast.success("Tryout berhasil dihapus");
        fetchTryouts();
      } else {
        toast.error(result.error || "Gagal menghapus tryout");
      }
    } catch {
      toast.error("Gagal menghapus tryout");
    }
  };

  const handleToggleActive = async (tryoutId: number) => {
    try {
      const result = await toggleTryoutActive(tryoutId);
      if (result.success) {
        toast.success(result.data?.isActive ? "Tryout berhasil diaktifkan" : "Tryout berhasil dinonaktifkan");
        fetchTryouts();
      } else {
        toast.error(result.error || "Gagal mengubah status tryout");
      }
    } catch {
      toast.error("Gagal mengubah status tryout");
    }
  };

  return (
    <ManageLayout
      title="Kelola Tryout"
      description="Kelola tryout dan ujian Anda"
      placeholder="Cari tryout..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={[
        {
          key: "status",
          type: "select",
          label: "Status",
          value: filterStatus,
          options: [
            { value: "ALL", label: "Semua Tryout" },
            { value: "ACTIVE", label: "Aktif" },
            { value: "INACTIVE", label: "Tidak Aktif" },
            { value: "UPCOMING", label: "Akan Datang" },
            { value: "EXPIRED", label: "Selesai" },
          ],
          onChange: (value: string) => setFilterStatus(value as "ALL" | "ACTIVE" | "INACTIVE" | "UPCOMING" | "EXPIRED"),
        },
        {
          key: "kelas",
          type: "select",
          label: "Kelas",
          value: selectedKelas?.toString() || "ALL",
          options: [
            { value: "ALL", label: "Semua Kelas" },
            ...kelasList.map((k) => ({ value: k.id.toString(), label: k.title })),
          ],
          onChange: (value: string) => setSelectedKelas(value === "ALL" ? null : parseInt(value)),
        },
      ]}
      loading={loading}
      error={error}
      items={filteredTryouts}
      renderItem={(tryout) => (
        <TryoutCard
          key={tryout.id}
          tryout={tryout}
          onClick={() => handleEditTryout(tryout)}
          onDelete={(id) => handleDelete(id)}
          onToggleActive={(id) => handleToggleActive(id)}
        />
      )}
      createNewCard={{
        onClick: handleCreateTryout,
        title: "Buat Tryout Baru",
        subtitle: "Tambah tryout baru",
      }}
      emptyTitle="Tryout Anda"
      emptyMessage="Tidak ada tryout yang sesuai dengan filter Anda. Coba sesuaikan pencarian atau filter Anda."
    >
      <TryoutSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        tryout={editingTryout}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </ManageLayout>
  );
}
