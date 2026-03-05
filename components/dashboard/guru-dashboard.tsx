"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  FileText,
  PlusCircle,
  Calendar,
  Wrench,
  FileQuestion,
  ClipboardList,
  Bell
} from "lucide-react";
import Link from "next/link";

import { Difficulty } from "@prisma/client";
import { SearchComponent } from "@/components/ui/search";
import { ManageClasses } from "@/components/dashboard/manage-classes";
import { ManageVocab } from "@/components/dashboard/manage-vocab";
import { ManageSoals } from "@/components/dashboard/manage-soals";
import { ManageTryout } from "@/components/dashboard/manage-tryout";
import { VocabSheet } from "@/components/dashboard/vocab-sheet";
import { SoalSheet } from "@/components/dashboard/soal-sheet";
import { TryoutSheet } from "@/components/dashboard/tryout-sheet";
import { NotificationSheet } from "@/components/dashboard/notification-sheet";
import { useState } from "react";

type UserRoles = "GURU" | "MURID" | "ADMIN";

interface DashboardUser {
  id: string;
  email: string;
  name?: string;
  role: UserRoles;
}

interface GuruStats {
  totalClasses: number;
  publishedClasses: number;
  draftClasses: number;
  totalStudents: number;
  totalMateris: number;
}

interface RecentClass {
  id: number;
  title: string;
  level: Difficulty;
  students: number;
  materis: number;
  thumbnail: string | null;
  createdAt: Date;
}



interface GuruDashboardProps {
  stats: GuruStats;
  recentClasses: RecentClass[];
  classes: any[];
  user: DashboardUser;
}




export function GuruDashboard({ stats, user, classes }: GuruDashboardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [soalSheetOpen, setSoalSheetOpen] = useState(false);
  const [tryoutSheetOpen, setTryoutSheetOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [vocabRefreshKey, setVocabRefreshKey] = useState(0);
  const [soalRefreshKey, setSoalRefreshKey] = useState(0);
  const [tryoutRefreshKey, setTryoutRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      const validTabs = ['tools', 'classes', 'vocabulary', 'soals', 'tryout'];
      return validTabs.includes(hash) ? hash : 'tools';
    }
    return 'tools';
  });

  const handleVocabSuccess = () => {
    setSheetOpen(false);
    setVocabRefreshKey(k => k + 1);
  };

  const handleSoalSuccess = () => {
    setSoalSheetOpen(false);
    setSoalRefreshKey(k => k + 1);
  };

  const handleTryoutSuccess = () => {
    setTryoutSheetOpen(false);
    setTryoutRefreshKey(k => k + 1);
  };

  const handleNotificationSuccess = () => {
    setNotificationSheetOpen(false);
  };

  const teachingTools = [
    {
      href: "/dashboard/guru/kelas-builder",
      isLink: true,
      icon: <PlusCircle className="h-10 w-10 text-white" />,
      badge: { text: "Tersedia", variant: "default", className: "bg-white/20 text-white hover:bg-white/30 border-0" },
      title: "Pembuat Kelas",
      description: "Buat kelas bahasa Korea yang komprehensif dengan panduan langkah demi langkah",
      footerLeft: "Buat Kelas",
      footerRight: "Langkah-demi-Langkah",
      gradient: "from-emerald-700/60 to-emerald-900/60",
    },
    {
      href: "/dashboard/guru/teach/white-board",
      isLink: true,
      icon: <BookOpen className="h-10 w-10 text-white" />,
      badge: { text: "Baru", variant: "outline", className: "text-white border-white/40" },
      title: "Papan Tulis",
      description: "Buka papan tulis kolaboratif (Excalidraw)",
      footerLeft: "Alat Interaktif",
      footerRight: "Excalidraw",
      gradient: "from-blue-700/60 to-blue-900/60",
    },
    {
      href: "/dashboard/guru/teach/live-session",
      isLink: true,
      icon: <Calendar className="h-10 w-10 text-white" />,
      badge: { text: "Segera Hadir", variant: "outline", className: "text-white border-white/40" },
      title: "Sesi Kelas Real-time",
      description: "Mulai atau bergabung dengan sesi kelas real-time",
      footerLeft: "Real-time",
      footerRight: "Segera",
      gradient: "from-purple-700/60 to-purple-900/60",
    },
    {
      onClick: () => setSheetOpen(true),
      isLink: false,
      icon: <PlusCircle className="h-10 w-10 text-white" />,
      badge: { text: "Tersedia", variant: "default", className: "bg-white/20 text-white hover:bg-white/30 border-0" },
      title: "Buat Set Kosakata",
      description: "Bangun dan kelola set kosakata khusus untuk kelas Anda",
      footerLeft: "Kosakata",
      footerRight: "Pembuat Set",
      gradient: "from-teal-700/60 to-teal-900/60",
    },
    {
      onClick: () => setSoalSheetOpen(true),
      isLink: false,
      icon: <PlusCircle className="h-10 w-10 text-white" />,
      badge: { text: "Tersedia", variant: "default", className: "bg-white/20 text-white hover:bg-white/30 border-0" },
      title: "Buat Set Soal",
      description: "Buat set soal untuk asesmen latihan atau tryout",
      footerLeft: "Asesmen",
      footerRight: "Pembuat Soal",
      gradient: "from-rose-700/60 to-rose-900/60",
    },
    {
      onClick: () => setNotificationSheetOpen(true),
      isLink: false,
      icon: <Bell className="h-10 w-10 text-white" />,
      badge: { text: "Tersedia", variant: "default", className: "bg-white/20 text-white hover:bg-white/30 border-0" },
      title: "Notifikasi",
      description: "Kirim push notifikasi ke siswa tentang kelas, materi, atau pengumuman",
      footerLeft: "Notifikasi",
      footerRight: "Kirim",
      gradient: "from-amber-700/60 to-amber-900/60",
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Guru</h1>
          <p className="text-muted-foreground">
            Selamat datang kembali, {user.name || user.email}! Di sini tempat untuk mengelola kelas, jadwal live, materi, dan kosakata
          </p>
        </div>
        <div className="flex gap-2 w-90">
          <SearchComponent />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Kelas"
          value={stats.totalClasses}
          description={`${stats.publishedClasses} dipublikasi, ${stats.draftClasses} draf`}
          icon={<BookOpen className="h-4 w-4" />}
        />

        <StatsCard
          title="Total Siswa"
          value={stats.totalStudents}
          description="Di semua kelas"
          icon={<Users className="h-4 w-4" />}
        />

        <StatsCard
          title="Kelas Dipublikasi"
          value={stats.publishedClasses}
          description="Tersedia untuk siswa"
          icon={<FileText className="h-4 w-4" />}
        />

        <StatsCard
          title="Total Materi"
          value={stats.totalMateris}
          description="Materi pembelajaran"
          icon={<BookOpen className="h-4 w-4" />}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); window.location.hash = value; }} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tools">
            <Wrench className="w-4 h-4 mr-2" />
            Alat
          </TabsTrigger>
          <TabsTrigger value="classes">
            <BookOpen className="w-4 h-4 mr-2" />
            Kelola Kelas
          </TabsTrigger>
          <TabsTrigger value="vocabulary">
            <FileText className="w-4 h-4 mr-2" />
            Kelola Kosakata
          </TabsTrigger>
          <TabsTrigger value="soals">
            <FileQuestion className="w-4 h-4 mr-2" />
            Kelola Soal
          </TabsTrigger>
          <TabsTrigger value="tryout">
            <ClipboardList className="w-4 h-4 mr-2" />
            Kelola Tryout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          {/* Teaching Tools */}
          <Card className="bg-gradient-to-br from-card to-muted/20 mt-4">
            <CardHeader>
              <CardTitle className="text-xl">Alat untuk Mengajar</CardTitle>
              <CardDescription>
                Kelola kelas dan konten Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {teachingTools.map((tool) => {
                  const CardContentBody = (
                    <Card className="group overflow-hidden hover:shadow-lg hover:-translate-y-1 bg-card transition-all cursor-pointer py-0 gap-0 h-full border-0 shadow-sm ring-1 ring-border/50 flex flex-col">
                      {/* Visual Header - Reduced height */}
                      <div className={`relative w-full h-24 bg-gradient-to-br ${tool.gradient} flex items-center justify-center shrink-0`}>
                        {/* Pattern overlay */}
                        <div className="absolute inset-0 bg-[url('/file.svg')] opacity-10 bg-repeat space-x-2" style={{ backgroundSize: '20px' }} />
                        <div className="absolute inset-0 bg-black/10" />

                        <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                          {tool.icon}
                        </div>

                        {/* Badge top right */}
                        {tool.badge && (
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant={tool.badge.variant as any}
                              className={`text-[10px] h-5 px-1.5 backdrop-blur-sm ${tool.badge.className}`}
                            >
                              {tool.badge.text}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 flex flex-col flex-1">
                        <div className="space-y-1.5 mb-2">
                          <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary transition-colors">
                            {tool.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                            {tool.description}
                          </CardDescription>
                        </div>

                        <div className="mt-auto pt-3 border-t flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70 truncate mr-2">{tool.footerLeft}</span>
                          <span className="bg-secondary/50 px-1.5 py-0.5 rounded text-secondary-foreground shrink-0 whitespace-nowrap">
                            {tool.footerRight === "stats.totalClasses"
                              ? stats.totalClasses
                              : tool.footerRight}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  return tool.isLink ? (
                    <Link href={tool.href!} key={tool.title} className="block h-full">
                      {CardContentBody}
                    </Link>
                  ) : (
                    <div onClick={tool.onClick} key={tool.title} className="h-full">
                      {CardContentBody}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <ManageClasses classes={classes} />
        </TabsContent>

        <TabsContent value="vocabulary">
          <ManageVocab refreshKey={vocabRefreshKey} />
        </TabsContent>

        <TabsContent value="soals">
          <ManageSoals refreshKey={soalRefreshKey} />
        </TabsContent>

        <TabsContent value="tryout">
          <ManageTryout refreshKey={tryoutRefreshKey} />
        </TabsContent>
      </Tabs>

      <VocabSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        vocabSet={null}
        onSuccess={handleVocabSuccess}
        onCancel={() => setSheetOpen(false)}
      />

      <SoalSheet
        isOpen={soalSheetOpen}
        onOpenChange={setSoalSheetOpen}
        soalSet={null}
        onSuccess={handleSoalSuccess}
        onCancel={() => setSoalSheetOpen(false)}
      />

      <TryoutSheet
        isOpen={tryoutSheetOpen}
        onOpenChange={setTryoutSheetOpen}
        tryout={null}
        onSuccess={handleTryoutSuccess}
        onCancel={() => setTryoutSheetOpen(false)}
      />

      <NotificationSheet
        isOpen={notificationSheetOpen}
        onOpenChange={setNotificationSheetOpen}
        onSuccess={handleNotificationSuccess}
        onCancel={() => setNotificationSheetOpen(false)}
      />
    </div>
  );
}
