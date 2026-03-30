"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users,  MoreVertical, Eye, Edit3, FileText, Trash2,  EyeOff } from "lucide-react";
import { Difficulty, KelasType } from "@/lib/prisma-types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type MinimalKelas = {
  id: number;
  title: string;
  description: string | null;
  type: KelasType;
  level: Difficulty;
  thumbnail: string | null;
  isPaidClass: boolean;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    materis: number;
    members: number;
  };
};

// Extended type for guru dashboard with additional fields
export type GuruKelas = MinimalKelas & {
  isDraft?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

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

const levelColors: Record<Difficulty, string> = {
  BEGINNER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  INTERMEDIATE:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  ADVANCED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export interface KelasCardProps {
  data: MinimalKelas | GuruKelas;
  isGuruMode?: boolean;
  className?: string;
  href?: string;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onPublish?: (id: number) => void;
  onUnpublish?: (id: number) => void;
}

export function KelasCard({
  data,
  isGuruMode = false,
  className = "",
  href = `/kelas/${data.id}`,
  onView,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish
}: KelasCardProps) {
  const isDraft = (data as GuruKelas).isDraft || false;


  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGuruMode && onEdit) {
      // In guru mode, clicking the card goes to edit mode
      console.log('Guru mode - navigating to edit:', data.id);
      onEdit(data.id);
    } else if (onView) {
      console.log('View mode - navigating to view:', data.id);
      onView(data.id);
    } else {
      console.log('Default navigation:', href);
      window.location.href = href;
    }
  };

  return (
    <Card
      className={`group overflow-hidden hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-card to-muted/70 transition-all cursor-pointer py-0  ${className}`}
      onClick={handleView}
    >
      {/* Media */}
      <div className="relative">
        <div className="relative w-full aspect-[16/9] bg-muted/40">
          {data.thumbnail ? (
            <Image
              src={data.thumbnail}
              alt={data.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-secondary">
              <BookOpen className="h-12 w-12 text-primary-foreground" />
            </div>
          )}
          {/* gradient overlay (flip upwards to support footer overlay) */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

          {/* badges */}
          <div className="absolute top-2 left-2 flex gap-2">
            <Badge variant="secondary" className="h-6 px-2 text-[10px]">
              {typeLabels[data.type]}
            </Badge>
            {isDraft && (
              <Badge variant="secondary" className="h-6 px-2 text-[10px]">
                Draft
              </Badge>
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge className={`${levelColors[data.level]} h-6 px-2 text-[10px] ring-1 ring-black/5 dark:ring-white/10`}>
              {levelLabels[data.level]}
            </Badge>
            {/* Guru action button */}
            {isGuruMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-black/20 hover:bg-black/30 text-white border-white/20">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    if (onView) {
                      onView(data.id);
                    } else {
                      window.location.href = `/kelas/${data.id}`;
                    }
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Kelas
                  </DropdownMenuItem>
                  {onEdit && (
                    <>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        console.log('Edit clicked:', data.id);
                        onEdit(data.id);
                      }}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {isDraft ? (
                    <>
                      {onPublish && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Publish clicked:', data.id);
                            onPublish(data.id);
                          }}
                          disabled={data._count.materis === 0}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Publikasikan
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Delete clicked:', data.id);
                            onDelete(data.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      )}
                    </>
                  ) : (
                    <>
                      {onUnpublish && (
                        <>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-orange-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <EyeOff className="h-4 w-4 mr-2" />
                                Batalkan Publikasi
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Unpublish Class</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to unpublish {data.title}? This will move the class back to drafts and students will no longer be able to access it.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onUnpublish(data.id)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  Batalkan Publikasi
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* overlay: counts and author (always shown) */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-3">
              {/* Author */}
              <div className="flex min-w-0 items-center gap-2">
                <Avatar
                  className="h-7 w-7"
                  userId={data.author.id}
                  clickable={true}
                >
                  <AvatarImage src={data.author.image || ""} />
                  <AvatarFallback className="text-xs">
                    {data.author.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs text-white drop-shadow">
                  {data.author.name || "Tidak Diketahui"}
                </span>
              </div>

              {/* Divider dot */}
              <span className="text-white/80">•</span>

              {/* Counts */}
              <div className="flex items-center gap-3 text-xs text-white/90">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {data._count.materis}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {data._count.members}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className=" sm:px-4 pt-0 pb-3 sm:pb-4">
        <h3 className="text-sm sm:text-base font-semibold leading-snug line-clamp-2">
          {data.title}
        </h3>
        <p
          className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2"
          dangerouslySetInnerHTML={{
            __html: data.description || "Tidak ada deskripsi tersedia"
          }}
        />

      </CardContent>
    </Card>
  );
}
