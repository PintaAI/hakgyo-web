"use server";

import { prisma } from "@/lib/db";

// Helper function to get random items from an array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Types for the transformed data
export interface TransformedKelas {
  id: number;
  title: string;
  description: string;
  type: "REGULAR" | "EVENT" | "GROUP" | "PRIVATE" | "FUN";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  thumbnail: string | null;
  isPaidClass: boolean;
  price: number | null;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
  _count: {
    materis: number;
    members: number;
  };
}

export interface TransformedVocab {
  id: number;
  korean: string;
  indonesian: string;
  type: "WORD" | "SENTENCE" | "IDIOM";
  pos: "KATA_KERJA" | "KATA_BENDA" | "KATA_SIFAT" | "KATA_KETERANGAN" | null;
  exampleSentences: string[];
  audioUrl: string | null;
  author: {
    id: string;
    name: string;
    image: string;
  };
  collection: {
    id: number;
    title: string;
  } | null;
  connectedKelas?: {
    id: number;
    title: string;
  };
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  rating: number;
  totalLearners: number;
}

export interface TransformedUser {
  id: string;
  name: string;
  email: string;
  image: string;
  role: "GURU" | "MURID" | "ADMIN";
  level: number;
  xp: number;
  currentStreak: number;
  joinedKelasCount: number;
  soalsCount: number;
  vocabularyItemsCount: number;
  totalActivities: number;
  bio: string;
}

export interface TransformedSoal {
  id: number;
  pertanyaan: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  explanation: string;
  options: string[];
  correctOptionIndex: number;
  author: {
    id: string;
    name: string;
    image: string;
  };
  isActive: boolean;
  collectionName: string;
  connectedClasses?: Array<{
    id: number;
    title: string;
    level: string;
  }>;
}

export type ExploreContentItem =
  | { type: 'kelas'; data: TransformedKelas; id: string }
  | { type: 'vocab'; data: TransformedVocab; id: string }
  | { type: 'user'; data: TransformedUser; id: string }
  | { type: 'soal'; data: TransformedSoal; id: string };

export async function getExploreData() {
  try {
    // Fetch random Kelas (classes) - only published ones
    const kelasData = await prisma.kelas.findMany({
      where: {
        isDraft: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            materis: true,
            members: true,
          },
        },
      },
    });

    // Fetch random VocabularyItems with connected kelas information
    const vocabData = await prisma.vocabularyItem.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        collection: {
          select: {
            id: true,
            title: true,
            kelasVocabularySets: {
              select: {
                kelas: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Fetch random Users
    const userData = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        level: true,
        xp: true,
        currentStreak: true,
        joinedKelas: {
          select: {
            id: true,
          },
        },
        soals: {
          select: {
            id: true,
          },
        },
        vocabularyItems: {
          select: {
            id: true,
          },
        },
        activityLogs: {
          select: {
            id: true,
          },
        },
      },
    });

    // Fetch random Soals - only active ones from non-draft collections with connected classes
    const soalData = await prisma.soal.findMany({
      where: {
        isActive: true,
        koleksiSoal: {
          isDraft: false,
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        opsis: {
          select: {
            id: true,
            opsiText: true,
            isCorrect: true,
          },
        },
        koleksiSoal: {
          select: {
            nama: true,
            kelasKoleksiSoals: {
              select: {
                kelas: {
                  select: {
                    id: true,
                    title: true,
                    level: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get random samples from each category
    const randomKelas = getRandomItems(kelasData, 4);
    const randomVocab = getRandomItems(vocabData, 10);
    const randomUsers = getRandomItems(userData, 7);
    const randomSoals = getRandomItems(soalData, 6);

    // Transform data to match frontend expectations
    const transformedKelas: TransformedKelas[] = randomKelas.map(kelas => ({
      id: kelas.id,
      title: kelas.title,
      description: kelas.description || '',
      type: kelas.type,
      level: kelas.level,
      thumbnail: kelas.thumbnail,
      isPaidClass: kelas.isPaidClass,
      price: kelas.price?.toNumber() || null,
      author: {
        id: kelas.author.id,
        name: kelas.author.name || '',
        image: kelas.author.image,
      },
      _count: kelas._count,
    }));

    const transformedVocab: TransformedVocab[] = randomVocab.map(vocab => ({
      id: vocab.id,
      korean: vocab.korean,
      indonesian: vocab.indonesian,
      type: vocab.type,
      pos: vocab.pos,
      exampleSentences: vocab.exampleSentences,
      audioUrl: vocab.audioUrl,
      author: {
        id: vocab.creator.id,
        name: vocab.creator.name || '',
        image: vocab.creator.image || ''
      },
      collection: vocab.collection ? {
        id: vocab.collection.id,
        title: vocab.collection.title,
      } : null,
      connectedKelas: vocab.collection?.kelasVocabularySets?.[0]?.kelas ? {
        id: vocab.collection.kelasVocabularySets[0].kelas.id,
        title: vocab.collection.kelasVocabularySets[0].kelas.title,
      } : undefined,
      difficulty: 'BEGINNER' as const,
      rating: 4.5,
      totalLearners: Math.floor(Math.random() * 1000) + 100,
    }));

    const transformedUsers: TransformedUser[] = randomUsers.map(user => ({
      id: user.id,
      name: user.name || '',
      email: user.email,
      image: user.image || '',
      role: user.role,
      level: user.level,
      xp: user.xp,
      currentStreak: user.currentStreak,
      joinedKelasCount: user.joinedKelas.length,
      soalsCount: user.soals.length,
      vocabularyItemsCount: user.vocabularyItems.length,
      totalActivities: user.activityLogs.length,
      bio: `Experienced ${user.role.toLowerCase()} in Korean learning.`,
    }));

    const transformedSoals: TransformedSoal[] = randomSoals.map(soal => {
      // Extract connected classes from the nested relationship
      const connectedClasses = soal.koleksiSoal.kelasKoleksiSoals.map(kks => ({
        id: kks.kelas.id,
        title: kks.kelas.title,
        level: kks.kelas.level,
      }));

      return {
        id: soal.id,
        pertanyaan: soal.pertanyaan,
        difficulty: soal.difficulty || 'BEGINNER',
        explanation: soal.explanation || '',
        options: soal.opsis.map(o => o.opsiText),
        correctOptionIndex: soal.opsis.findIndex(o => o.isCorrect),
        author: {
          id: soal.author.id,
          name: soal.author.name || '',
          image: soal.author.image || ''
        },
        isActive: soal.isActive,
        collectionName: soal.koleksiSoal.nama,
        connectedClasses: connectedClasses.length > 0 ? connectedClasses : undefined,
      };
    });

    // Combine all content types
    const allContent: ExploreContentItem[] = [
      ...transformedKelas.map(item => ({ type: 'kelas' as const, data: item, id: `kelas-${item.id}` })),
      ...transformedVocab.map(item => ({ type: 'vocab' as const, data: item, id: `vocab-${item.id}` })),
      ...transformedUsers.map(item => ({ type: 'user' as const, data: item, id: `user-${item.id}` })),
      ...transformedSoals.map(item => ({ type: 'soal' as const, data: item, id: `soal-${item.id}` })),
    ];

    // Shuffle the combined array
    const shuffledContent = [...allContent].sort(() => Math.random() - 0.5);

    return {
      success: true,
      data: shuffledContent,
    };
  } catch (error) {
    console.error('Error fetching explore data:', error);
    return {
      success: false,
      error: 'Failed to fetch explore data',
      data: [],
    };
  }
}
