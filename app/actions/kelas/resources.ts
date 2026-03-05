"use server";

import { prisma } from "@/lib/db";
import { assertAuthenticated } from "@/lib/auth-actions";


export async function linkVocabularyToKelas(kelasId: number, vocabSetIds: number[]) {
  try {
    const session = await assertAuthenticated();
    
    // Verify kelas ownership
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      select: { authorId: true }
    });
    
    if (!kelas || kelas.authorId !== session.user.id) {
      return { success: false, error: 'Not authorized' };
    }

    // Create KelasVocabularySet links for each vocabulary set
    const linkPromises = vocabSetIds.map(async (vocabSetId, index) => {
      // Check if link already exists
      const existingLink = await prisma.kelasVocabularySet.findFirst({
        where: {
          kelasId: kelasId,
          vocabularySetId: vocabSetId
        }
      });

      if (!existingLink) {
        return prisma.kelasVocabularySet.create({
          data: {
            kelasId: kelasId,
            vocabularySetId: vocabSetId,
            order: index
          }
        });
      }
      return existingLink;
    });

    await Promise.all(linkPromises);

    return { success: true, message: 'Vocabulary sets linked successfully' };
  } catch (error) {
    console.error("Link vocabulary to kelas error:", error);
    return { success: false, error: "Failed to link vocabulary sets" };
  }
}

export async function unlinkVocabularyFromKelas(kelasId: number, vocabSetIds: number[]) {
  try {
    const session = await assertAuthenticated();
    
    // Verify kelas ownership
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      select: { authorId: true }
    });
    
    if (!kelas || kelas.authorId !== session.user.id) {
      return { success: false, error: 'Not authorized' };
    }

    // Delete KelasVocabularySet links
    await prisma.kelasVocabularySet.deleteMany({
      where: {
        kelasId: kelasId,
        vocabularySetId: { in: vocabSetIds }
      }
    });

    return { success: true, message: 'Vocabulary sets unlinked successfully' };
  } catch (error) {
    console.error("Unlink vocabulary from kelas error:", error);
    return { success: false, error: "Failed to unlink vocabulary sets" };
  }
}

export async function linkSoalToKelas(kelasId: number, koleksiSoalIds: number[]) {
  try {
    const session = await assertAuthenticated();
    
    // Verify kelas ownership
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      select: { authorId: true }
    });
    
    if (!kelas || kelas.authorId !== session.user.id) {
      return { success: false, error: 'Not authorized' };
    }

    // Create KelasKoleksiSoal links for each soal set
    const linkPromises = koleksiSoalIds.map(async (koleksiSoalId, index) => {
      // Check if link already exists
      const existingLink = await prisma.kelasKoleksiSoal.findFirst({
        where: {
          kelasId: kelasId,
          koleksiSoalId: koleksiSoalId
        }
      });

      if (!existingLink) {
        return prisma.kelasKoleksiSoal.create({
          data: {
            kelasId: kelasId,
            koleksiSoalId: koleksiSoalId,
            order: index,
            title: '', // Will be filled from the actual soal set
            description: ''
          }
        });
      }
      return existingLink;
    });

    await Promise.all(linkPromises);

    return { success: true, message: 'Question sets linked successfully' };
  } catch (error) {
    console.error("Link soal to kelas error:", error);
    return { success: false, error: "Failed to link question sets" };
  }
}

export async function unlinkSoalFromKelas(kelasId: number, koleksiSoalIds: number[]) {
  try {
    const session = await assertAuthenticated();
    
    // Verify kelas ownership
    const kelas = await prisma.kelas.findUnique({ 
      where: { id: kelasId }, 
      select: { authorId: true } 
    });
    
    if (!kelas || kelas.authorId !== session.user.id) {
      return { success: false, error: 'Not authorized' };
    }

    // Delete KelasKoleksiSoal links
    await prisma.kelasKoleksiSoal.deleteMany({
      where: { 
        kelasId: kelasId,
        koleksiSoalId: { in: koleksiSoalIds }
      }
    });

    return { success: true, message: 'Question sets unlinked successfully' };
  } catch (error) {
    console.error("Unlink soal from kelas error:", error);
    return { success: false, error: "Failed to unlink question sets" };
  }
}

export async function getKelasResources(kelasId: number) {
  try {
    const session = await assertAuthenticated();
    
    // Get kelas with vocabulary sets and soal links
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      include: {
        kelasVocabularySets: {
          include: {
            vocabularySet: {
              include: {
                items: {
                  orderBy: { order: 'asc' }
                },
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        kelasKoleksiSoals: {
          include: {
            koleksiSoal: {
              include: {
                soals: {
                  select: { id: true, pertanyaan: true, difficulty: true }
                },
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!kelas) {
      return { success: false, error: 'Kelas not found' };
    }

    // Check if user has access (author or member)
    if (kelas.authorId !== session.user.id) {
      const isMember = await prisma.kelas.findFirst({
        where: {
          id: kelasId,
          members: {
            some: { id: session.user.id }
          }
        }
      });
      
      if (!isMember) {
        return { success: false, error: 'Not authorized' };
      }
    }

    return {
      success: true,
      data: {
        vocabularySets: kelas.kelasVocabularySets.map(kvs => kvs.vocabularySet),
        soalSets: kelas.kelasKoleksiSoals
      }
    };
  } catch (error) {
    console.error("Get kelas resources error:", error);
    return { success: false, error: "Failed to get kelas resources" };
  }
}
