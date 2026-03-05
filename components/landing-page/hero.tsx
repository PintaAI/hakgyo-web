"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Star, TrendingUp } from "lucide-react";

import { Button } from "../ui/button";

const highlights = [
  "Materi EPS-TOPIK lengkap dari dasar sampai tryout",
  "Jadwal live class rutin bersama mentor berpengalaman",
  "Biaya terjangkau, cocok untuk persiapan kerja ke Korea",
];

const metrics = [
  { label: "Siswa Aktif", value: "10K+" },
  { label: "Materi Belajar", value: "500+" },
  { label: "Tingkat Kelulusan", value: "95%" },
];

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "url('/bakcground.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "260px 260px",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/30 to-primary/40" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,hsl(var(--background)/0.2),transparent_45%)]" aria-hidden />

      <div className="container relative mx-auto px-4 py-16 sm:px-6 md:py-24 lg:px-8 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 backdrop-blur-md">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">Terpercaya oleh 10.000+ siswa Indonesia</span>
            </div>

            <div className="rounded-3xl border border-primary-foreground/15 bg-background/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Hakgyo, Platform Belajar Bahasa Korea & Persiapan EPS-TOPIK Indonesia
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/90 md:text-lg lg:mx-0">
                Pilihan tepat untuk kamu yang mencari LPK Korea berkualitas, harga terjangkau, dan fokus hasil.
                Belajar terstruktur, latihan intensif, dan siap kerja ke Korea dengan percaya diri.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-lg bg-primary-foreground/10 p-3 text-left">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-300" />
                    <span className="text-sm font-medium text-primary-foreground/95">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="w-full px-8 font-semibold shadow-lg sm:w-auto">
                    Mulai Belajar Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/kelas">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-primary-foreground/40 bg-primary-foreground/5 px-8 font-semibold text-primary-foreground hover:bg-primary-foreground/15 sm:w-auto"
                  >
                    Lihat Program
                  </Button>
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-primary-foreground/20 pt-6 text-center lg:text-left">
                {metrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="text-2xl font-extrabold md:text-3xl">{metric.value}</div>
                    <div className="text-xs text-primary-foreground/80 md:text-sm">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
            <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-background/20 blur-3xl" />
            <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-background/20 blur-3xl" />

            <div className="relative rounded-3xl border border-primary-foreground/20 bg-background/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <div className="mb-5 flex items-center justify-between rounded-xl bg-primary-foreground/10 px-4 py-3">
                <div>
                  <p className="text-xs text-primary-foreground/80">Progress Belajar</p>
                  <p className="text-sm font-semibold">EPS-TOPIK Intensive</p>
                </div>
                <div className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">+24% minggu ini</div>
              </div>

              <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-6">
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl bg-primary-foreground/15 md:h-52 md:w-52">
                  <Image
                    priority
                    src="/logo/hakgyo-light.png"
                    alt="Hakgyo - LPK Korea dan persiapan EPS-TOPIK Indonesia"
                    width={148}
                    height={148}
                    className="dark:hidden"
                  />
                  <Image
                    priority
                    src="/logo/hakgyo-dark.png"
                    alt="Hakgyo - LPK Korea dan persiapan EPS-TOPIK Indonesia"
                    width={148}
                    height={148}
                    className="hidden dark:block"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-primary-foreground/10 px-4 py-3">
                  <span className="text-sm">Tryout Completion</span>
                  <span className="text-sm font-semibold">87%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-primary-foreground/10 px-4 py-3">
                  <span className="text-sm">Rata-rata Nilai</span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold">
                    86/100 <TrendingUp className="h-4 w-4 text-green-300" />
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 max-w-[240px] rounded-xl bg-background/95 p-4 text-foreground shadow-xl backdrop-blur">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold">Ahmad R.</p>
                  <p className="text-xs text-muted-foreground">Lulus EPS-TOPIK</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                “Materi Hakgyo jelas, latihan lengkap, dan mentor responsif. Saya lulus lebih cepat dari target.”
              </p>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/75 to-transparent" aria-hidden />
    </section>
  );
};
