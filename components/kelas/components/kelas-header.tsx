"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { motion} from "framer-motion";
import Image from "next/image";
import React from "react";
import { KelasType, Difficulty } from "@/lib/prisma-types";

interface KelasHeaderProps {
  kelas: {
    title: string;
    description: string | null;
    thumbnail: string | null;
    level: Difficulty;
    type: KelasType;
    isDraft: boolean;
  };
  onBack: () => void;
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

const getDifficultyColor = (level: Difficulty) => {
  switch (level) {
    case "BEGINNER":
      return "bg-success/10 text-success border-success/20";
    case "INTERMEDIATE":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20";
    case "ADVANCED":
      return "bg-fail/10 text-fail border-fail/20";
    default:
      return "bg-muted/50 text-muted-foreground border-border";
  }
};

export default function KelasHeader({ kelas, onBack }: KelasHeaderProps) {
  return (
    <motion.div
      className="relative h-80 rounded-b-2xl overflow-hidden mb-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background thumbnail */}
      <div className="absolute inset-0">
        {kelas.thumbnail ? (
          <>
            <Image
              src={kelas.thumbnail}
              alt={kelas.title}
              width={800}
              height={320}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/80 to-secondary/60">
            <BookOpen className="w-24 h-24 text-white/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}
      </div>

      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-4 left-4 text-white hover:bg-white/20 backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      {/* Header content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant="secondary"
            className={`${getDifficultyColor(kelas.level)} bg-primary/20 text-primary border-primary/30`}
          >
            {levelLabels[kelas.level]}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-secondary/30 text-secondary border-secondary/40"
          >
            {typeLabels[kelas.type]}
          </Badge>
          {kelas.isDraft && (
            <Badge variant="outline" className="border-white/50 text-white">
              Draft
            </Badge>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">{kelas.title}</h1>
        {kelas.description && (
          <p className="text-white/90 text-sm md:text-base max-w-2xl">{kelas.description}</p>
        )}
      </div>
    </motion.div>
  );
}
