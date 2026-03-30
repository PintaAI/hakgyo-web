"use client";

import { useState, useEffect, useCallback } from "react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Users, Search, Filter, Star, Clock } from "lucide-react";
import { KelasType, Difficulty } from "@/lib/prisma-types";
import { filterKelas } from "@/app/actions/kelas/public";
import { KelasCard } from "@/components/kelas/kelas-card";
import Link from "next/link";

interface KelasItem {
  id: number;
  title: string;
  description: string | null;
  type: KelasType;
  level: Difficulty;
  thumbnail: string | null;
  isPaidClass: boolean;
  price: number | null; // Converted from Prisma Decimal to number
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    materis: number;
    members: number;
  };
}

interface KelasListPageProps {
  initialKelas: KelasItem[];
  initialStats: {
    totalClasses: number;
    totalStudents: number;
    typeStats: { type: KelasType; _count: { id: number } }[];
    levelStats: { level: Difficulty; _count: { id: number } }[];
  } | null;
  initialMeta: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

const typeLabels: Record<KelasType, string> = {
  REGULAR: "Regular",
  EVENT: "Event",
  GROUP: "Group",
  PRIVATE: "Private",
  FUN: "Fun",
};

const levelLabels: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};


export default function KelasListPage({ initialKelas, initialStats, initialMeta }: KelasListPageProps) {
  const [kelas, setKelas] = useState<KelasItem[]>(initialKelas);
  const [stats] = useState(initialStats);
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<KelasType | "ALL">("ALL");
  const [levelFilter, setLevelFilter] = useState<Difficulty | "ALL">("ALL");

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        level: levelFilter !== "ALL" ? levelFilter : undefined,
        limit: 12,
        offset: 0,
      };

      const result = await filterKelas(params);
      
      if (result.success) {
        setKelas(result.data);
        setMeta(result.meta);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, levelFilter]);

  const handleLoadMore = async () => {
    if (!meta.hasMore || loading) return;
    
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        level: levelFilter !== "ALL" ? levelFilter : undefined,
        limit: 12,
        offset: meta.offset + meta.limit,
      };

      const result = await filterKelas(params);
      
      if (result.success) {
        setKelas(prev => [...prev, ...result.data]);
        setMeta(result.meta);
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search || typeFilter !== "ALL" || levelFilter !== "ALL") {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, typeFilter, levelFilter, handleSearch]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Kelas
          </h1>
          <p className="text-muted-foreground">
            list kelas yang kamu ikuti
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Kelas"
            value={stats.totalClasses}
            description="Kelas tersedia"
            icon={<BookOpen className="h-4 w-4" />}
          />

          <StatsCard
            title="Siswa"
            value={stats.totalStudents}
            description="Belajar bersama"
            icon={<Users className="h-4 w-4" />}
          />

          <StatsCard
            title="Pemula"
            value={stats.levelStats.find(s => s.level === "BEGINNER")?._count.id || 0}
            description="Tingkat pemula"
            icon={<Star className="h-4 w-4" />}
          />

          <StatsCard
            title="Lanjutan"
            value={stats.levelStats.find(s => s.level === "ADVANCED")?._count.id || 0}
            description="Tingkat ahli"
            icon={<Clock className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as KelasType | "ALL")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Jenis Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Jenis</SelectItem>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as Difficulty | "ALL")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tingkat Kesulitan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Tingkat</SelectItem>
            {Object.entries(levelLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Class Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {kelas.map((kelasItem) => (
          <KelasCard key={kelasItem.id} data={kelasItem as any} />
        ))}
      </div>

      {/* Load More Button */}
      {meta.hasMore && (
        <div className="flex justify-center mt-8 mb-8">
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Memuat..." : "Muat Lebih Banyak"}
          </Button>
        </div>
      )}

      {/* No Results */}
      {kelas.length === 0 && !loading && (
        <div className="text-center py-12 mb-8">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tidak ada kelas ditemukan</h3>
          <p className="text-muted-foreground mb-4">
            Coba sesuaikan kriteria pencarian Anda atau periksa kembali nanti untuk kelas baru.
          </p>
          <Link
            href="/explore"
            className="inline-block px-6 py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition"
          >
            Jelajahi Kelas Lainnya
          </Link>
        </div>
      )}
    </div>
  );
}
