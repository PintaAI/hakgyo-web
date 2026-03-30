"use client";

import {  MessageSquare, GraduationCap, Megaphone, FileText, BookOpen, Brain, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { KelasType, Difficulty } from "@/lib/prisma-types";
import { useSession } from "@/components/session-provider";
import { useKelasEnrollment } from "@/hooks/use-kelas-enrollment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import DetailTab from "./tabs/detail-tab";
import MateriLiveTab from "./tabs/materi-live-tab";
import DiscussionTab from "./tabs/discussion-tab";
import VocabularyTab from "./tabs/vocabulary-tab";
import SoalTab from "./tabs/soal-tab";
import { useState } from "react";
import React from "react";
import { useKelasColors } from "@/hooks/use-kelas-colors";
import { ColorExtractor } from "react-color-extractor";


// Import modular components
import KelasHeader from "./components/kelas-header";
import KelasStats from "./components/kelas-stats";
import KelasAuthor from "./components/kelas-author";
import KelasPricingCard from "./components/kelas-pricing-card";


interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Materi {
  id: number;
  title: string;
  description: string;
  order: number;
  isDemo: boolean;
  createdAt: Date;
}

interface LiveSession {
  id: string;
  name: string;
  description: string | null;
  status: string;
  scheduledStart: Date;
  scheduledEnd: Date | null;
}

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

interface SoalSet {
  id: number;
  nama: string;
  deskripsi: string | null;
  isPrivate: boolean;
  isDraft: boolean;
  createdAt: Date;
  soals: Array<{
    id: number;
    pertanyaan: string;
    difficulty: string | null;
  }>;
  user: {
    id: string;
    name: string | null;
  } | null;
  kelasKoleksiSoals: Array<{
    kelas: {
      id: number;
      title: string;
      level: string;
    };
  }>;
}

interface Post {
  id: number;
  title: string;
  type: string;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Kelas {
  id: number;
  title: string;
  description: string | null;
  jsonDescription?: any;
  htmlDescription?: string | null;
  type: KelasType;
  level: Difficulty;
  thumbnail: string | null;
  icon: string | null;
  isPaidClass: boolean;
  price: any;
  discount: any;
  promoCode: string | null;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: Author;
  materis: Materi[];
  liveSessions: LiveSession[];
  vocabularySets: VocabSet[];
  soalSets: SoalSet[];
  posts: Post[];
  _count: {
    members: number;
    materis: number;
    liveSessions: number;
    kelasVocabularySets: number;
    posts: number;
    kelasKoleksiSoals: number;
  };
}

interface KelasDetailPageProps {
  kelas: Kelas;
}

export default function KelasDetailPage({ kelas }: KelasDetailPageProps) {
  const router = useRouter();
  const { user, isLoading } = useSession();
  
  const isAuthor = !isLoading && user?.id === kelas.authorId;
  
  // Get initial tab from hash, similar to guru dashboard
  const [activeTab, setActiveTab] = useState('information'); // Always start with 'information' to prevent hydration mismatch
  
  // Update tab from hash after mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      const validTabs = ['information', 'materials', 'discussion', 'vocabulary', 'questions', 'statistics'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);
  
  // Initialize color extraction from thumbnail
  const {  handleColorExtraction } = useKelasColors(kelas.thumbnail);

  // Use the enrollment hook
  const enrollment = useKelasEnrollment(kelas.id);
  
  // Prevent hydration mismatch by using the existing isClient state
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true after component mounts on client side
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen for hash changes (browser back/forward navigation)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validTabs = ['information', 'materials', 'discussion', 'vocabulary', 'questions', 'statistics'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      } else if (!hash) {
        // If no hash, default to information tab
        setActiveTab('information');
      }
    };

    // Also listen for popstate (browser back/forward button)
    const handlePopState = () => {
      handleHashChange();
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  
  // Check if current user is the author of this kelas


  const handleBack = () => {
    router.push('/kelas');
  };

  const handleNavigateToLearn = () => {
    router.push(`/kelas/${kelas.id}/learn`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto -mt-6">
      {/* Hidden Color Extractor - extracts colors from thumbnail */}
      {kelas.thumbnail && (
        <div className="hidden">
          <ColorExtractor
            src={kelas.thumbnail}
            getColors={handleColorExtraction}
            maxColors={5}
            format="hex"
          />
        </div>
      )}

      {/* Header */}
      <KelasHeader
        kelas={{
          title: kelas.title,
          description: kelas.description,
          thumbnail: kelas.thumbnail,
          level: kelas.level,
          type: kelas.type,
          isDraft: kelas.isDraft,
        }}
        onBack={handleBack}
      />

      <div className="px-6 space-y-6">
        {/* Compact stats and pricing row */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column: Stats and Author */}
          <div className="flex-1 space-y-4">
            {/* Stats */}
            <KelasStats
              stats={{
                members: kelas._count.members,
                materis: kelas._count.materis,
                kelasKoleksiSoals: kelas._count.kelasKoleksiSoals,
                vocabularySets: kelas._count.kelasVocabularySets,
              }}
            />

            {/* Author */}
            <KelasAuthor author={kelas.author} />
          </div>

          {/* Right column: Pricing */}
          <div className="relative">
            <KelasPricingCard
              kelas={{
                id: kelas.id,
                title: kelas.title,
                isPaidClass: kelas.isPaidClass,
                price: kelas.price,
                discount: kelas.discount,
                promoCode: kelas.promoCode,
              }}
              enrollment={enrollment}
              user={user}
              isClient={isClient}
              isLoading={isLoading}
              onNavigateToLearn={handleNavigateToLearn}
            />

          </div>
        </div>

        {/* Tabs Section */}
        <div>
          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); window.location.hash = value; }} className="w-full">
            <TabsList className={`grid w-full ${
              !isClient ? 'grid-cols-1' : // During SSR/initial render, always use single column
              isAuthor ? 'grid-cols-6' :
              (enrollment.isEnrolled || isAuthor) ? 'grid-cols-5' :
              'grid-cols-1'
            }`}>
              <TabsTrigger
                value="information"
                className="flex items-center gap-2 text-primary"
              >
                <FileText className="w-4 h-4 text-primary" />
                Informasi
              </TabsTrigger>
              {/* Only render conditional tabs after client mount to prevent hydration mismatch */}
              {isClient && (enrollment.isEnrolled || isAuthor) && (
                <>
                  <TabsTrigger
                    value="materials"
                    className="flex items-center gap-2 text-primary"
                  >
                    <BookOpen className="w-4 h-4 text-primary" />
                    Materi & Live
                  </TabsTrigger>
                  <TabsTrigger
                    value="discussion"
                    className="flex items-center gap-2 text-primary"
                  >
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Diskusi
                  </TabsTrigger>
                  <TabsTrigger
                    value="vocabulary"
                    className="flex items-center gap-2 text-primary"
                  >
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Kosa Kata
                  </TabsTrigger>
                  <TabsTrigger
                    value="questions"
                    className="flex items-center gap-2 text-primary"
                  >
                    <Brain className="w-4 h-4 text-primary" />
                    Pertanyaan
                  </TabsTrigger>
                </>
              )}
              {/* Only render author tab after client mount to prevent hydration mismatch */}
              {isClient && isAuthor && (
                <TabsTrigger
                  value="statistics"
                  className="flex items-center gap-2 text-primary"
                >
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Statistik
                </TabsTrigger>
              )}
            </TabsList>

            {/* Information Tab */}
            <TabsContent value="information" className="mt-6">
              <DetailTab
                htmlDescription={kelas.htmlDescription}
                jsonDescription={kelas.jsonDescription}
              />
            </TabsContent>

            {/* Materials & Live Tab */}
            <TabsContent value="materials" className="mt-6">
              <MateriLiveTab
                materis={kelas.materis}
                liveSessions={kelas.liveSessions}
                kelasId={kelas.id}
              />
            </TabsContent>


            {/* Discussion Tab */}
            <TabsContent value="discussion" className="mt-6">
              <DiscussionTab
                kelasId={kelas.id}
                kelasTitle={kelas.title}
                initialPosts={kelas.posts.map(post => ({
                  ...post,
                  htmlDescription: post.title, // Fallback since we don't have htmlDescription in the basic Post interface
                  shareCount: 0,
                  viewCount: 0,
                  _count: {
                    comments: post.commentCount,
                    likes: post.likeCount,
                  },
                }))}
                initialPostsCount={kelas._count.posts}
              />
            </TabsContent>

            {/* Vocabulary Tab */}
            <TabsContent value="vocabulary" className="mt-6">
              <VocabularyTab vocabularySets={kelas.vocabularySets} kelasId={kelas.id} />
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions" className="mt-6">
              <SoalTab soalSets={kelas.soalSets} />
            </TabsContent>
            {/* Statistics Tab */}
            {isAuthor && (
              <TabsContent value="statistics" className="mt-6">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold border-b pb-2">Statistik Kelas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-primary mb-1">150</div>
                        <p className="text-sm text-muted-foreground">Siswa Terdaftar</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-primary mb-1">85%</div>
                        <p className="text-sm text-muted-foreground">Rata-rata Tingkat Penyelesaian</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-primary mb-1">1,200</div>
                        <p className="text-sm text-muted-foreground">Tampilan Halaman</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-primary mb-1">Rp 4.5M</div>
                        <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Running Text Ads Placeholder */}
        <div className="mt-8 mb-6">
          <Card className="border-dashed border-2 bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 text-primary">
                <Megaphone className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <h3 className="font-medium text-lg mb-1">Ruang Iklan</h3>
                  <p className="text-sm text-secondary">
                    Iklan teks berjalan akan ditampilkan di sini
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-secondary">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-primary"></div>
                  <div className="w-2 h-2 rounded-full animate-pulse bg-secondary" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
