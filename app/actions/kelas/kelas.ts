"use server";

import { prisma } from "@/lib/db";
import { assertAuthenticated } from "@/lib/auth-actions";
import { KelasType, Difficulty } from "@prisma/client";
import { z } from "zod";

// Validation schemas
const createKelasSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  jsonDescription: z.any().optional(),
  htmlDescription: z.string().optional(),
  type: z.nativeEnum(KelasType).default(KelasType.REGULAR),
  level: z.nativeEnum(Difficulty),
  thumbnail: z.string().optional(),
  icon: z.string().optional(),
  isPaidClass: z.boolean().default(false),
  price: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  promoCode: z.string().optional(),
});

const updateKelasSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  jsonDescription: z.any().optional(),
  htmlDescription: z.string().optional(),
  type: z.nativeEnum(KelasType).optional(),
  level: z.nativeEnum(Difficulty).optional(),
  thumbnail: z.string().optional(),
  icon: z.string().optional(),
  isPaidClass: z.boolean().optional(),
  price: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  promoCode: z.string().optional(),
});

// Create draft kelas
export async function createDraftKelas(data: z.infer<typeof createKelasSchema>) {
  try {
    const session = await assertAuthenticated();
    const validData = createKelasSchema.parse(data);

    const kelas = await prisma.kelas.create({
      data: {
        ...validData,
        isDraft: true,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { materis: true, members: true } },
      },
    });

    // Convert Decimal fields to numbers for client components
    const serializedKelas = {
      ...kelas,
      price: kelas.price ? Number(kelas.price) : null,
      discount: kelas.discount ? Number(kelas.discount) : null,
    };

    return { success: true, data: serializedKelas };
  } catch (error) {
    console.error("Create kelas error:", error);
    return { success: false, error: "Failed to create kelas" };
  }
}

// Update kelas
export async function updateKelas(id: number, data: z.infer<typeof updateKelasSchema>) {
  try {
    const session = await assertAuthenticated();
    const validData = updateKelasSchema.parse(data);

    // Check ownership
    const existing = await prisma.kelas.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existing || existing.authorId !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    const kelas = await prisma.kelas.update({
      where: { id },
      data: validData,
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { materis: true, members: true } },
      },
    });

    // Convert Decimal fields to numbers for client components
    const serializedKelas = {
      ...kelas,
      price: kelas.price ? Number(kelas.price) : null,
      discount: kelas.discount ? Number(kelas.discount) : null,
    };

    return { success: true, data: serializedKelas };
  } catch (error) {
    console.error("Update kelas error:", error);
    return { success: false, error: "Failed to update kelas" };
  }
}

// Delete draft kelas
export async function deleteDraftKelas(id: number) {
  try {
    const session = await assertAuthenticated();

    const kelas = await prisma.kelas.findUnique({
      where: { id },
      select: { authorId: true, isDraft: true },
    });

    if (!kelas || kelas.authorId !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    if (!kelas.isDraft) {
      return { success: false, error: "Can only delete draft kelas" };
    }

    await prisma.kelas.delete({ where: { id } });

    return { success: true, message: "Kelas deleted successfully" };
  } catch (error) {
    console.error("Delete kelas error:", error);
    return { success: false, error: "Failed to delete kelas" };
  }
}

// Get kelas by ID
export async function getKelasById(id: number) {
  try {
    const session = await assertAuthenticated();

    const kelas = await prisma.kelas.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        materis: { orderBy: { order: "asc" } },
        kelasKoleksiSoals: {
          include: {
            koleksiSoal: {
              include: {
                soals: {
                  include: {
                    opsis: { orderBy: { order: "asc" } }
                  }
                }
              }
            }
          }
        },
        kelasVocabularySets: {
          include: {
            vocabularySet: {
              include: {
                items: {
                  orderBy: { order: "asc" }
                }
              }
            }
          }
        },
        _count: { select: { materis: true, members: true } },
      },
    });

    if (!kelas) {
      return { success: false, error: "Kelas not found" };
    }

    // Check access for draft kelas
    if (kelas.isDraft && kelas.authorId !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    // Convert Decimal fields to numbers for client components
    const serializedKelas = {
      ...kelas,
      price: kelas.price ? Number(kelas.price) : null,
      discount: kelas.discount ? Number(kelas.discount) : null,
      // Flatten the koleksiSoals from the junction table
      koleksiSoals: kelas.kelasKoleksiSoals.map(junction => junction.koleksiSoal),
      // Flatten the vocabularySets from the junction table
      vocabularySets: kelas.kelasVocabularySets.map(junction => junction.vocabularySet),
    };

    return { success: true, data: serializedKelas };
  } catch (error) {
    console.error("Get kelas error:", error);
    return { success: false, error: "Failed to get kelas" };
  }
}

// Get user's kelas list
export async function getUserKelasList() {
  try {
    const session = await assertAuthenticated();

    const kelasList = await prisma.kelas.findMany({
      where: { authorId: session.user.id },
      include: {
        _count: { select: { materis: true, members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to numbers for client components
    const serializedKelasList = kelasList.map(kelas => ({
      ...kelas,
      price: kelas.price ? Number(kelas.price) : null,
      discount: kelas.discount ? Number(kelas.discount) : null,
    }));

    return { success: true, data: serializedKelasList };
  } catch (error) {
    console.error("Get kelas list error:", error);
    return { success: false, error: "Failed to get kelas list" };
  }
}

// Publish kelas
export async function publishKelas(id: number) {
  try {
    const session = await assertAuthenticated();

    // Check ownership and requirements
    const kelas = await prisma.kelas.findUnique({
      where: { id },
      include: {
        _count: { select: { materis: true } },
      },
    });

    if (!kelas || kelas.authorId !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    if (!kelas.isDraft) {
      return { success: false, error: "Already published" };
    }

    if (kelas._count.materis === 0) {
      return { success: false, error: "Need at least one materi" };
    }

    // Publish kelas and materis
    await prisma.$transaction([
      prisma.kelas.update({
        where: { id },
        data: { isDraft: false },
      }),
      prisma.materi.updateMany({
        where: { kelasId: id },
        data: { isDraft: false },
      }),
    ]);

    return { success: true, message: "Kelas published successfully" };
  } catch (error) {
    console.error("Publish kelas error:", error);
    return { success: false, error: "Failed to publish kelas" };
  }
}

// Unpublish kelas
export async function unpublishKelas(id: number) {
  try {
    const session = await assertAuthenticated();

    // Check ownership
    const kelas = await prisma.kelas.findUnique({
      where: { id },
      select: { authorId: true, isDraft: true },
    });

    if (!kelas || kelas.authorId !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    if (kelas.isDraft) {
      return { success: false, error: "Already unpublished" };
    }

    // Unpublish kelas and materis
    await prisma.$transaction([
      prisma.kelas.update({
        where: { id },
        data: { isDraft: true },
      }),
      prisma.materi.updateMany({
        where: { kelasId: id },
        data: { isDraft: true },
      }),
    ]);

    return { success: true, message: "Kelas unpublished successfully" };
  } catch (error) {
    console.error("Unpublish kelas error:", error);
    return { success: false, error: "Failed to unpublish kelas" };
  }
}
