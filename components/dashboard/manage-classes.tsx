"use client";

import { useState } from "react";
import { KelasType, Difficulty } from "@/lib/prisma-types";
import { deleteDraftKelas, publishKelas, unpublishKelas } from "@/app/actions/kelas";
import { KelasCard, GuruKelas } from "@/components/kelas/kelas-card";
import { toast } from "sonner";
import { ManageLayout } from "./manage-layout";

// Types
interface KelasItem extends GuruKelas {
  createdAt: Date;
  updatedAt: Date;
  price: any;
  icon: string | null;
  discount: number | null;
  promoCode: string | null;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface ManageClassesProps {
  classes: any[];
  user?: User;
}

// Constants
const TYPE_LABELS: Record<KelasType, string> = {
  REGULAR: "Regular",
  EVENT: "Event",
  GROUP: "Group",
  PRIVATE: "Private",
  FUN: "Fun",
};

const LEVEL_LABELS: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};


// Filter options
const FILTER_TYPES = [
  { value: "ALL", label: "Semua Jenis" },
  ...Object.entries(TYPE_LABELS).map(([key, label]) => ({ value: key, label })),
];

const FILTER_LEVELS = [
  { value: "ALL", label: "Semua Tingkat" },
  ...Object.entries(LEVEL_LABELS).map(([key, label]) => ({ value: key, label })),
];

// Custom hook for class management
const useClassManagement = (initialClasses: any[]) => {
  const [classes, setClasses] = useState(() =>
    initialClasses.map(cls => ({
      ...cls,
      author: {
        id: '',
        name: 'You',
        image: null
      }
    }))
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<KelasType | "ALL">("ALL");
  const [filterLevel, setFilterLevel] = useState<Difficulty | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState<number | null>(null);
  const [isUnpublishing, setIsUnpublishing] = useState<number | null>(null);

  // Filter functions
  const filteredClasses = () => {
    return classes.filter(cls => {
      const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cls.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "ALL" || cls.type === filterType;
      const matchesLevel = filterLevel === "ALL" || cls.level === filterLevel;
      const matchesStatus = filterStatus === "ALL" ||
                           (filterStatus === "PUBLISHED" && !cls.isDraft) ||
                           (filterStatus === "DRAFT" && cls.isDraft);

      return matchesSearch && matchesType && matchesLevel && matchesStatus;
    });
  };

  // Action handlers
  const handleDeleteClass = async (id: number) => {
    setIsDeleting(id);
    try {
      const result = await deleteDraftKelas(id);
      if (result.success) {
        setClasses(prev => prev.filter(cls => cls.id !== id));
        toast.success("Kelas berhasil dihapus");
      } else {
        toast.error(result.error || "Gagal menghapus kelas");
      }
    } catch {
      toast.error("Terjadi kesalahan tak terduga");
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePublishClass = async (id: number) => {
    setIsPublishing(id);
    try {
      const result = await publishKelas(id);
      if (result.success) {
        setClasses(prev => prev.map(cls =>
          cls.id === id ? { ...cls, isDraft: false } : cls
        ));
        toast.success("Kelas berhasil dipublikasikan");
      } else {
        toast.error(result.error || "Gagal mempublikasikan kelas");
      }
    } catch {
      toast.error("Terjadi kesalahan tak terduga");
    } finally {
      setIsPublishing(null);
    }
  };

  const handleUnpublishClass = async (id: number) => {
    setIsUnpublishing(id);
    try {
      const result = await unpublishKelas(id);
      if (result.success) {
        setClasses(prev => prev.map(cls =>
          cls.id === id ? { ...cls, isDraft: true } : cls
        ));
        toast.success("Kelas berhasil dibatalkan publikasinya");
      } else {
        toast.error(result.error || "Gagal membatalkan publikasi kelas");
      }
    } catch {
      toast.error("Terjadi kesalahan tak terduga");
    } finally {
      setIsUnpublishing(null);
    }
  };

  return {
    classes,
    setClasses,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterLevel,
    setFilterLevel,
    filterStatus,
    setFilterStatus,
    isDeleting,
    isPublishing,
    isUnpublishing,
    filteredClasses,
    handleDeleteClass,
    handlePublishClass,
    handleUnpublishClass,
  };
};

// Components
const ClassCard = ({ cls, actions }: { cls: KelasItem; actions: any }) => (
  <KelasCard
    data={cls}
    isGuruMode={true}
    onView={actions.onView}
    onEdit={actions.onEdit}
    onDelete={actions.onDelete}
    onPublish={actions.onPublish}
    onUnpublish={actions.onUnpublish}
  />
);




export function ManageClasses({ classes: initialClasses }: Omit<ManageClassesProps, 'user'>) {
  const management = useClassManagement(initialClasses);

  const handleCreateClass = () => {
    window.location.href = "/dashboard/guru/kelas-builder";
  };

  return (
    <ManageLayout
      title="Kelola Kelas"
      description="Kelola kelas draf dan yang dipublikasikan"
      placeholder="Cari kelas..."
      searchValue={management.searchTerm}
      onSearchChange={management.setSearchTerm}
      filters={[
        {
          key: "type",
          type: "select",
          label: "Jenis Kelas",
          value: management.filterType,
          options: FILTER_TYPES,
          onChange: (value: string) => management.setFilterType(value as KelasType | "ALL"),
        },
        {
          key: "level",
          type: "select",
          label: "Tingkat Kesulitan",
          value: management.filterLevel,
          options: FILTER_LEVELS,
          onChange: (value: string) => management.setFilterLevel(value as Difficulty | "ALL"),
        },
        {
          key: "status",
          type: "select",
          label: "Status",
          value: management.filterStatus,
          options: [
            { value: "ALL", label: "Semua Kelas" },
            { value: "PUBLISHED", label: "Dipublikasikan" },
            { value: "DRAFT", label: "Draf" },
          ],
          onChange: (value: string) => management.setFilterStatus(value as "ALL" | "PUBLISHED" | "DRAFT"),
        },
      ]}
      loading={false}
      error={null}
      items={management.filteredClasses()}
      renderItem={(cls) => {
        const actions = {
          onView: (id: number) => (window.location.href = `/kelas/${id}`),
          onEdit: (id: number) => (window.location.href = `/dashboard/guru/kelas-builder?edit=${id}`),
          onDelete: (id: number) => management.handleDeleteClass(id),
          onPublish: (id: number) => management.handlePublishClass(id),
          onUnpublish: (id: number) => management.handleUnpublishClass(id),
        };
        return (
          <ClassCard
            key={cls.id}
            cls={cls}
            actions={actions}
          />
        );
      }}
      createNewCard={{
        onClick: handleCreateClass,
        title: "Buat Kelas Baru",
        subtitle: "Mulai membuat kelas baru",
      }}
      emptyTitle="Kelas Anda"
      emptyMessage="Tidak ada kelas yang sesuai dengan filter Anda. Coba sesuaikan pencarian atau filter Anda."
      singleFilter={true}
    />
  );
}
