"use server";

import { prisma } from "@/lib/db";
import { assertAuthenticated } from "@/lib/auth-actions";
import { VocabularyType, PartOfSpeech } from "@/lib/enums";

// Helper function to sync vocabulary items
// Note: caller (saveVocabularySet) is responsible for authentication
async function syncVocabularyItems(vocabSetId: number, newItemsData: any[], creatorId: string) {
  const existingItems = await prisma.vocabularyItem.findMany({
    where: { collectionId: vocabSetId },
  });

  const existingItemIds = new Set(existingItems.map(item => item.id));
  const newItemIds = new Set(
    newItemsData
      .map(item => item.id)
      .filter((id): id is number => typeof id === 'number')
  );

  const dbOperations = [];

  // 1. Delete items that are no longer present
  for (const existingItemId of existingItemIds) {
    if (!newItemIds.has(existingItemId)) {
      dbOperations.push(prisma.vocabularyItem.delete({ where: { id: existingItemId } }));
    }
  }

  // 2. Update existing items and create new ones
  for (const [index, itemData] of newItemsData.entries()) {
    const dataPayload = {
      korean: itemData.korean,
      indonesian: itemData.indonesian,
      type: itemData.type,
      pos: itemData.pos,
      audioUrl: itemData.audioUrl,
      exampleSentences: itemData.exampleSentences,
      order: index, // Always update order based on the new array position
    };

    if (typeof itemData.id === 'number' && existingItemIds.has(itemData.id)) {
      // Update existing item
      dbOperations.push(prisma.vocabularyItem.update({
        where: { id: itemData.id },
        data: dataPayload,
      }));
    } else {
      // Create new item
      dbOperations.push(prisma.vocabularyItem.create({
        data: {
          ...dataPayload,
          creatorId: creatorId,
          collectionId: vocabSetId,
        },
      }));
    }
  }

  // Execute all operations in a transaction
  await prisma.$transaction(dbOperations);
}


// Vocabulary management actions
export async function saveVocabularySet(kelasId: number | null, vocabSetData: {
  title: string;
  description?: string;
  icon?: string;
  isPublic: boolean;
  isDraft: boolean;
  items: Array<{
    id?: number | string; // Can be tempId
    korean: string;
    indonesian: string;
    type: VocabularyType;
    pos?: PartOfSpeech;
    audioUrl?: string;
    exampleSentences: string[];
  }>;
}, vocabSetId?: number) {
  try {
    const session = await assertAuthenticated();

    let vocabSet;
    if (typeof vocabSetId === 'number') {
      // Update existing vocabulary set
      vocabSet = await prisma.vocabularySet.update({
        where: { id: vocabSetId },
        data: {
          title: vocabSetData.title,
          description: vocabSetData.description,
          icon: vocabSetData.icon,
          isPublic: vocabSetData.isPublic,
          isDraft: vocabSetData.isDraft,
        },
      });
      
      // Sync vocabulary items (pass creatorId to avoid a second assertAuthenticated call)
      await syncVocabularyItems(vocabSetId, vocabSetData.items, session.user.id);
      
    } else {
      // Create new vocabulary set with items
      vocabSet = await prisma.vocabularySet.create({
        data: {
          title: vocabSetData.title,
          description: vocabSetData.description,
          icon: vocabSetData.icon,
          isPublic: vocabSetData.isPublic,
          userId: session.user.id,
          ...(kelasId ? {
            kelasVocabularySets: {
              create: {
                kelasId: kelasId,
                order: 0
              }
            }
          } : {}),
          items: {
            create: vocabSetData.items.map((item, index) => ({
              korean: item.korean,
              indonesian: item.indonesian,
              type: item.type,
              pos: item.pos,
              audioUrl: item.audioUrl,
              exampleSentences: item.exampleSentences,
              order: index,
              creatorId: session.user.id,
            })),
          },
        },
      });
    }

    // After sync/create, fetch the set with its updated items to return to the client
    const finalVocabSet = await prisma.vocabularySet.findUnique({
      where: { id: vocabSet.id },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    return { success: true, data: finalVocabSet };
  } catch (error) {
    console.error("Save vocabulary set error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save vocabulary set" };
  }
}

export async function updateVocabularyItem(vocabItemId: number, itemData: {
  korean?: string;
  indonesian?: string;
  type?: VocabularyType;
  pos?: PartOfSpeech;
  audioUrl?: string;
  exampleSentences?: string[];
}) {
  try {
    await assertAuthenticated();

    const updatedItem = await prisma.vocabularyItem.update({
      where: { id: vocabItemId },
      data: itemData,
    });

    return { success: true, data: updatedItem };
  } catch (error) {
    console.error("Update vocabulary item error:", error);
    return { success: false, error: "Failed to update vocabulary item" };
  }
}

export async function deleteVocabularySet(vocabSetId: number) {
  try {
    await assertAuthenticated();
    await prisma.vocabularySet.delete({ where: { id: vocabSetId } });
    return { success: true, message: "Vocabulary set deleted successfully" };
  } catch (error) {
    console.error("Delete vocabulary set error:", error);
    return { success: false, error: "Failed to delete vocabulary set" };
  }
}

export async function deleteVocabularyItem(vocabItemId: number) {
  try {
    await assertAuthenticated();
    await prisma.vocabularyItem.delete({ where: { id: vocabItemId } });
    return { success: true, message: "Vocabulary item deleted successfully" };
  } catch (error) {
    console.error("Delete vocabulary item error:", error);
    return { success: false, error: "Failed to delete vocabulary item" };
  }
}

export async function reorderVocabularyItems(vocabSetId: number, itemOrders: { id: number; order: number }[]) {
  try {
    await assertAuthenticated();

    const updatePromises = itemOrders.map(({ id, order }) =>
      prisma.vocabularyItem.update({
        where: { id },
        data: { order },
      })
    );

    await prisma.$transaction(updatePromises);

    return { success: true, message: "Vocabulary items reordered successfully" };
  } catch (error) {
    console.error("Reorder vocabulary items error:", error);
    return { success: false, error: "Failed to reorder vocabulary items" };
  }
}

export async function getGuruVocabularySets() {
  try {
    const session = await assertAuthenticated();

    if (session.user.role !== "GURU") {
      return { success: false, error: "Not authorized" };
    }

    const userId = session.user.id;

    // Get kelas IDs that the user has joined
    const joinedKelas = await prisma.kelas.findMany({
      where: {
        members: {
          some: { id: userId }
        }
      },
      select: { id: true }
    });

    const joinedKelasIds = joinedKelas.map(k => k.id);

    const vocabSets = await prisma.vocabularySet.findMany({
      where: {
        OR: [
          { userId: userId },
          {
            kelasVocabularySets: {
              some: {
                kelasId: { in: joinedKelasIds }
              }
            }
          }
        ]
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        kelasVocabularySets: {
          include: {
            kelas: {
              select: {
                id: true,
                title: true,
                level: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: vocabSets };
  } catch (error) {
    console.error("Get guru vocabulary sets error:", error);
    return { success: false, error: "Failed to get vocabulary sets" };
  }
}
