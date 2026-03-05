"use client";

import { useRouter } from "next/navigation";
import { useKelasBuilderStore } from "@/lib/stores/kelas-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  FileText,
  Eye
} from "lucide-react";
import KelasDetailPage from "@/components/kelas/kelas-detail-page";
import { useSession } from "@/components/session-provider";

export function StepReview() {
  const router = useRouter();

  const {
    meta,
    materis,
  } = useKelasBuilderStore();

  const { session } = useSession();

  const hasTitle = meta.title && meta.title.trim() !== '';
  const hasDescription = meta.description && meta.description.trim() !== '';
  const hasContent = materis.length > 0;
  const hasValidPricing = !meta.isPaidClass || (meta.price && meta.price > 0);

  const isReadyToPublish = hasTitle && hasDescription && hasContent && hasValidPricing;

 
  const mockKelasData = {
    id: 999,
    title: meta.title || "Your Course Title",
    description: meta.description || "Your course description will appear here",
    jsonDescription: meta.jsonDescription || null,
    htmlDescription: meta.htmlDescription || null,
    type: meta.type as any,
    level: meta.level as any,
    thumbnail: meta.thumbnail || null,
    icon: meta.icon || null,
    isPaidClass: meta.isPaidClass,
    price: meta.price || 0,
    discount: meta.discount || 0,
    promoCode: meta.promoCode || null,
    isDraft: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: session?.user?.id || "preview-author",
    author: {
      id: session?.user?.id || "preview-author",
      name: session?.user?.name || "Course Creator",
      image: session?.user?.image || null,
    },
    materis: materis.map((materi, index) => ({
      id: materi.id || index,
      title: materi.title,
      description: materi.description,
      order: index + 1,
      isDemo: materi.isDemo,
      createdAt: new Date(),
    })),
    liveSessions: [],
    vocabularySets: [],
    soalSets: [],
    posts: [],
    _count: {
      members: 0,
      materis: materis.length,
      liveSessions: 0,
      kelasVocabularySets: 0,
      posts: 0,
      kelasKoleksiSoals: 0, // TODO: Add question sets tracking to store
    },
  };




  return (
    <div className="space-y-4">
      {/* Content Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ringkasan Konten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{materis.length}</div>
              <div className="text-sm text-muted-foreground">Pelajaran</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {materis.filter(m => m.isDemo).length}
              </div>
              <div className="text-sm text-muted-foreground">Pelajaran Demo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Pratinjau Kelas
            <Badge variant="secondary" className="ml-auto">Tampilan</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="border rounded-lg overflow-hidden max-h-[700px] overflow-y-auto">
            <div className="scale-75 mt-6 origin-top-left" style={{ width: '133.33%' }}>
              <KelasDetailPage kelas={mockKelasData} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Status */}
      {isReadyToPublish ? (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Kelas Siap Dipublikasikan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Kelas Anda memenuhi semua persyaratan dan siap dipublikasikan. Gunakan tombol Publikasikan di sidebar untuk membuatnya tayang.
              </AlertDescription>
            </Alert>

            {/* Checklist */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Judul Kelas</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Deskripsi Kelas</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Konten Kelas</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Konfigurasi Harga</span>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                Simpan sebagai Draf & Kembali Nanti
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Kelas Belum Siap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Harap lengkapi persyaratan berikut sebelum mempublikasikan:
              </AlertDescription>
            </Alert>

            {/* Checklist */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-3">
                {hasTitle ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={hasTitle ? 'text-green-600' : 'text-red-600'}>
                  Judul Kelas
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hasDescription ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={hasDescription ? 'text-green-600' : 'text-red-600'}>
                  Deskripsi Kelas
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hasContent ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={hasContent ? 'text-green-600' : 'text-red-600'}>
                  Konten Kelas
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hasValidPricing ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={hasValidPricing ? 'text-green-600' : 'text-red-600'}>
                  Konfigurasi Harga
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
