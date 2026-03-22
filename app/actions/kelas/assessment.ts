"use server";

import { prisma } from "@/lib/db";
import { assertAuthenticated } from "@/lib/auth-actions";
import { Difficulty } from "@/lib/enums";
import { z } from "zod";

// Assessment collection schemas
const koleksiSoalSchema = z.object({
  nama: z.string().min(1).max(255),
  deskripsi: z.string().optional(),
  isPrivate: z.boolean().default(false),
  isDraft: z.boolean().default(true),
});

const soalSchema = z.object({
  pertanyaan: z.string().min(1),
  difficulty: z.nativeEnum(Difficulty).optional().nullable().transform(val => val ?? undefined),
  explanation: z.string().optional(),
  isActive: z.boolean().default(true),
});

const opsiSchema = z.object({
  opsiText: z.string().min(1),
  isCorrect: z.boolean().default(false),
  order: z.number().min(0),
});

// Assessment collection actions
export async function saveKoleksiSoal(kelasId: number | null, koleksiData: z.infer<typeof koleksiSoalSchema>, koleksiId?: number) {
  try {
    const session = await assertAuthenticated();

    const validData = koleksiSoalSchema.parse(koleksiData);

    let koleksiSoal;
    if (koleksiId) {
      // Update existing
      koleksiSoal = await prisma.koleksiSoal.update({
        where: { id: koleksiId },
        data: {
          nama: validData.nama,
          deskripsi: validData.deskripsi,
          isPrivate: validData.isPrivate,
          isDraft: validData.isDraft,
        },
        include: { soals: true },
      });
    } else {
      // Create new
      koleksiSoal = await prisma.koleksiSoal.create({
        data: {
          nama: validData.nama,
          deskripsi: validData.deskripsi,
          isPrivate: validData.isPrivate,
          isDraft: validData.isDraft,
          userId: session.user.id,
        },
        include: { soals: true },
      });
    }

        // If kelasId is provided, create the many-to-many relationship (need required title field)
        if (kelasId && !koleksiId) {
          // Determine next order position
          const existingCount = await prisma.kelasKoleksiSoal.count({
            where: { kelasId },
          });
    
          await prisma.kelasKoleksiSoal.create({
            data: {
              kelasId: kelasId,
              koleksiSoalId: koleksiSoal.id,
              title: koleksiSoal.nama,            // Use collection name as link title
              description: koleksiSoal.deskripsi, // Optional
              order: existingCount,               // Append at end
            },
          });
        }

    return { success: true, data: koleksiSoal };
  } catch (error) {
    console.error("Save koleksi soal error:", error);
    return { success: false, error: "Failed to save question collection" };
  }
}

export async function saveSoal(koleksiSoalId: number, soalData: z.infer<typeof soalSchema>, soalId?: number) {
  try {
    const session = await assertAuthenticated();

    // Check ownership via koleksiSoal
    const koleksiSoal = await prisma.koleksiSoal.findUnique({
      where: { id: koleksiSoalId },
      include: { user: { select: { id: true } } },
    });

    if (!koleksiSoal || !koleksiSoal.user || koleksiSoal.user.id !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    const validData = soalSchema.parse(soalData);

    let soal;
    if (soalId) {
      // Update existing
      soal = await prisma.soal.update({
        where: { id: soalId },
        data: validData,
        include: { opsis: true },
      });
    } else {
      // Create new
      soal = await prisma.soal.create({
        data: {
          ...validData,
          koleksiSoalId,
          authorId: session.user.id,
        },
        include: { opsis: true },
      });
    }

    return { success: true, data: soal };
  } catch (error) {
    console.error("Save soal error:", error);
    return { success: false, error: "Failed to save question" };
  }
}

export async function saveOpsi(soalId: number, opsiData: z.infer<typeof opsiSchema>, opsiId?: number) {
  try {
    const session = await assertAuthenticated();

    // Check ownership via soal -> koleksiSoal -> user
    const soal = await prisma.soal.findUnique({
      where: { id: soalId },
      include: {
        koleksiSoal: {
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (!soal || !soal.koleksiSoal || !soal.koleksiSoal.user || soal.koleksiSoal.user.id !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    const validData = opsiSchema.parse(opsiData);

    let opsi;
    if (opsiId) {
      // Update existing
      opsi = await prisma.opsi.update({
        where: { id: opsiId },
        data: validData,
      });
    } else {
      // Create new
      opsi = await prisma.opsi.create({
        data: {
          ...validData,
          soalId,
        },
      });
    }

    return { success: true, data: opsi };
  } catch (error) {
    console.error("Save opsi error:", error);
    return { success: false, error: "Failed to save option" };
  }
}

export async function deleteKoleksiSoal(koleksiSoalId: number) {
  try {
    const session = await assertAuthenticated();

    // Check ownership
    const koleksiSoal = await prisma.koleksiSoal.findUnique({
      where: { id: koleksiSoalId },
      include: { user: { select: { id: true } } },
    });

    if (!koleksiSoal || !koleksiSoal.user || koleksiSoal.user.id !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    await prisma.koleksiSoal.delete({ where: { id: koleksiSoalId } });

    return { success: true, message: "Question collection deleted successfully" };
  } catch (error) {
    console.error("Delete koleksi soal error:", error);
    return { success: false, error: "Failed to delete question collection" };
  }
}

export async function deleteSoal(soalId: number) {
  try {
    const session = await assertAuthenticated();

    // Check ownership
    const soal = await prisma.soal.findUnique({
      where: { id: soalId },
      include: {
        koleksiSoal: {
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (!soal || !soal.koleksiSoal || !soal.koleksiSoal.user || soal.koleksiSoal.user.id !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    await prisma.soal.delete({ where: { id: soalId } });

    return { success: true, message: "Question deleted successfully" };
  } catch (error) {
    console.error("Delete soal error:", error);
    return { success: false, error: "Failed to delete question" };
  }
}

export async function reorderSoals(koleksiSoalId: number, soalOrders: { id: number; order: number }[]) {
  try {
    const session = await assertAuthenticated();

    // Check ownership via koleksiSoal
    const koleksiSoal = await prisma.koleksiSoal.findUnique({
      where: { id: koleksiSoalId },
      include: { user: { select: { id: true } } },
    });

    if (!koleksiSoal || !koleksiSoal.user || koleksiSoal.user.id !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    // Update orders
    await Promise.all(
      soalOrders.map(({ id, order }) =>
        prisma.soal.update({
          where: { id },
          data: { order },
        })
      )
    );

    return { success: true, message: "Questions reordered successfully" };
  } catch (error) {
    console.error("Reorder soals error:", error);
    return { success: false, error: "Failed to reorder questions" };
  }
}

export async function deleteOpsi(opsiId: number) {
  try {
    const session = await assertAuthenticated();

    // Check ownership
    const opsi = await prisma.opsi.findUnique({
      where: { id: opsiId },
      include: {
        soal: {
          include: {
            koleksiSoal: {
              include: { user: { select: { id: true } } },
            },
          },
        },
      },
    });

    if (!opsi || !opsi.soal || !opsi.soal.koleksiSoal || !opsi.soal.koleksiSoal.user || opsi.soal.koleksiSoal.user.id !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    await prisma.opsi.delete({ where: { id: opsiId } });

    return { success: true, message: "Option deleted successfully" };
  } catch (error) {
    console.error("Delete opsi error:", error);
    return { success: false, error: "Failed to delete option" };
  }
}

export async function getSoalsByKoleksi(koleksiSoalId: number) {
  try {
    const session = await assertAuthenticated();

    // Check ownership
    const koleksiSoal = await prisma.koleksiSoal.findUnique({
      where: { id: koleksiSoalId },
      include: { user: { select: { id: true } } },
    });

    if (!koleksiSoal || koleksiSoal.user.id !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    const soals = await prisma.soal.findMany({
      where: { koleksiSoalId },
      include: {
        opsis: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return { success: true, data: soals };
  } catch (error) {
    console.error("Get soals by koleksi error:", error);
    return { success: false, error: "Failed to get questions" };
  }
}
