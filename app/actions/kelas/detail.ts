"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/session";

// Helper function to check if user has enrollment access to a kelas
async function checkEnrollmentAccess(kelasId: number, userId?: string) {
  if (!userId) {
    return {
      hasAccess: false,
      isAuthor: false,
      isMember: false,
      error: "Authentication required"
    };
  }

  const enrollmentCheck = await prisma.kelas.findFirst({
    where: { id: kelasId },
    include: {
      members: {
        where: { id: userId },
        select: { id: true }
      }
    }
  });

  if (!enrollmentCheck) {
    return {
      hasAccess: false,
      isAuthor: false,
      isMember: false,
      error: "Class not found"
    };
  }

  const isAuthor = enrollmentCheck.authorId === userId;
  const isMember = enrollmentCheck.members.length > 0;
  const hasAccess = isAuthor || isMember;

  return {
    hasAccess,
    isAuthor,
    isMember,
    error: hasAccess ? null : "Access denied. You must be enrolled in this class to access this content."
  };
}

export async function getKelasDetail(id: string) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.id;
    const kelasId = parseInt(id);
    
    if (isNaN(kelasId)) {
      return {
        success: false,
        error: "Invalid kelas ID",
        data: null,
      };
    }

    // Check if user has enrollment access
    const accessCheck = await checkEnrollmentAccess(kelasId, userId);
    const hasAccess = accessCheck.hasAccess;

    // Always fetch basic kelas info and statistics
    const kelas = await prisma.kelas.findFirst({
      where: {
        id: kelasId,
        isDraft: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        jsonDescription: true,
        htmlDescription: true,
        type: true,
        level: true,
        thumbnail: true,
        icon: true,
        isPaidClass: true,
        price: true,
        discount: true,
        promoCode: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
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
            liveSessions: true,
            kelasVocabularySets: true,
            posts: true,
            kelasKoleksiSoals: true,
          },
        },
      },
    });

    if (!kelas) {
      return {
        success: false,
        error: "Class not found",
        data: null,
      };
    }

    // Initialize empty arrays for restricted content
    let materis: any[] = [];
    let liveSessions: any[] = [];
    let vocabularySets: any[] = [];
    let kelasKoleksiSoals: any[] = [];
    let posts: any[] = [];

    // Only fetch sensitive data if user has access
    if (hasAccess) {
      // Fetch materis
      const materiData = await prisma.materi.findMany({
        where: {
          kelasId: kelasId,
          isDraft: false,
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          htmlDescription: true,
          order: true,
          isDemo: true,
          createdAt: true,
        },
      });
      materis = materiData;

      // Fetch live sessions
      const liveSessionData = await prisma.liveSession.findMany({
        where: {
          kelasId: kelasId,
          status: {
            in: ["SCHEDULED", "LIVE"],
          },
        },
        orderBy: {
          scheduledStart: "asc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          scheduledStart: true,
          scheduledEnd: true,
        },
      });
      liveSessions = liveSessionData;

      // Fetch vocabulary sets
      const vocabData = await prisma.kelasVocabularySet.findMany({
        where: {
          kelasId: kelasId,
        },
        include: {
          vocabularySet: {
            select: {
              id: true,
              title: true,
              description: true,
              icon: true,
              isPublic: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              items: {
                select: {
                  id: true,
                  korean: true,
                  indonesian: true,
                  type: true,
                },
              },
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });
      vocabularySets = vocabData.map(kvs => ({
        ...kvs.vocabularySet,
        kelasVocabularySets: [{
          kelas: {
            id: kelas.id,
            title: kelas.title,
            level: kelas.level,
          },
        }],
      }));

      // Fetch soal sets
      const soalData = await prisma.kelasKoleksiSoal.findMany({
        where: {
          kelasId: kelasId,
        },
        include: {
          koleksiSoal: {
            select: {
              id: true,
              nama: true,
              deskripsi: true,
              isPrivate: true,
              isDraft: true,
              createdAt: true,
              soals: {
                select: {
                  id: true,
                  pertanyaan: true,
                  difficulty: true,
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });
      kelasKoleksiSoals = soalData;

      // Fetch posts
      const postData = await prisma.post.findMany({
        where: {
          kelasId: kelasId,
          isPublished: true,
        },
        orderBy: [
          { isPinned: "desc" },
          { createdAt: "desc" },
        ],
        take: 5,
        select: {
          id: true,
          title: true,
          htmlDescription: true,
          jsonDescription: true,
          type: true,
          isPinned: true,
          likeCount: true,
          commentCount: true,
          shareCount: true,
          viewCount: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });
      posts = postData;
    }

    // Add userLiked field to posts if user is authenticated and has access
    let postsWithLikeStatus = [];
    if (hasAccess && posts.length > 0) {
      if (userId) {
        const postIds = posts.map(post => post.id);
        const userLikes = await prisma.postLike.findMany({
          where: {
            userId,
            postId: { in: postIds },
          },
          select: {
            postId: true,
          },
        });

        const likedPostIds = new Set(userLikes.map(like => like.postId));

        postsWithLikeStatus = posts.map(post => ({
          ...post,
          userLiked: likedPostIds.has(post.id),
        }));
      } else {
        postsWithLikeStatus = posts.map(post => ({
          ...post,
          userLiked: false,
        }));
      }
    }

    // Transform soal sets data structure for client
    const soalSets = kelasKoleksiSoals.map(kks => ({
      ...kks.koleksiSoal,
      kelasKoleksiSoals: [{
        kelas: {
          id: kelas.id,
          title: kelas.title,
          level: kelas.level,
        },
      }],
    }));

    // Convert Decimal fields to numbers for client components
    const serializedKelas = {
      ...kelas,
      posts: postsWithLikeStatus,
      soalSets,
      materis,
      liveSessions,
      vocabularySets,
      price: kelas.price ? Number(kelas.price) : null,
      discount: kelas.discount ? Number(kelas.discount) : null,
    };

    return {
      success: true,
      data: serializedKelas,
    };
  } catch (error) {
    console.error("Get kelas detail error:", error);
    return {
      success: false,
      error: "Failed to fetch class details",
      data: null,
    };
  }
}

export async function checkKelasAccess(kelasId: string, userId?: string) {
  try {
    const kelasIdNum = parseInt(kelasId);
    
    if (isNaN(kelasIdNum)) {
      return {
        success: false,
        hasAccess: false,
        error: "Invalid kelas ID",
      };
    }

    const kelas = await prisma.kelas.findFirst({
      where: {
        id: kelasIdNum,
        isDraft: false,
      },
      include: {
        members: userId ? {
          where: {
            id: userId,
          },
        } : false,
      },
    });

    if (!kelas) {
      return {
        success: false,
        hasAccess: false,
        error: "Class not found",
      };
    }

    // If it's a free class, everyone has access
    if (!kelas.isPaidClass) {
      return {
        success: true,
        hasAccess: true,
        isPaid: false,
      };
    }

    // If it's a paid class and user is not logged in
    if (!userId) {
      return {
        success: true,
        hasAccess: false,
        isPaid: true,
        price: kelas.price ? Number(kelas.price) : null,
      };
    }

    // Check if user is a member or the author
    const isMember = kelas.members && kelas.members.length > 0;
    const isAuthor = kelas.authorId === userId;

    return {
      success: true,
      hasAccess: isMember || isAuthor,
      isPaid: true,
      price: kelas.price ? Number(kelas.price) : null,
      isMember,
      isAuthor,
    };
  } catch (error) {
    console.error("Check kelas access error:", error);
    return {
      success: false,
      hasAccess: false,
      error: "Failed to check access",
    };
  }
}

export async function getMateriDetail(materiId: string, kelasId: string) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.id;
    const materiIdNum = parseInt(materiId);
    const kelasIdNum = parseInt(kelasId);

    if (isNaN(materiIdNum) || isNaN(kelasIdNum)) {
      return {
        success: false,
        error: "Invalid materi or kelas ID",
        data: null,
      };
    }

    // Check enrollment access
    const accessCheck = await checkEnrollmentAccess(kelasIdNum, userId);
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        error: accessCheck.error || "Access denied",
        data: null,
      };
    }

    const materi = await prisma.materi.findFirst({
      where: {
        id: materiIdNum,
        kelasId: kelasIdNum,
        isDraft: false, // Only show published materis
      },
      select: {
        id: true,
        title: true,
        description: true,
        jsonDescription: true,
        htmlDescription: true,
        order: true,
        isDemo: true,
        createdAt: true,
        kelas: {
          select: {
            id: true,
            title: true,
            authorId: true,
            thumbnail: true,
          },
        },
      },
    });

    if (!materi) {
      return {
        success: false,
        error: "Materi not found",
        data: null,
      };
    }

    return {
      success: true,
      data: materi,
    };
  } catch (error) {
    console.error("Get materi detail error:", error);
    return {
      success: false,
      error: "Failed to fetch materi details",
      data: null,
    };
  }
}

export async function getVocabDetail(vocabId: string, kelasId: string) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.id;
    const vocabIdNum = parseInt(vocabId);
    const kelasIdNum = parseInt(kelasId);

    if (isNaN(vocabIdNum) || isNaN(kelasIdNum)) {
      return {
        success: false,
        error: "Invalid vocabulary set or kelas ID",
        data: null,
      };
    }

    // Check enrollment access
    const accessCheck = await checkEnrollmentAccess(kelasIdNum, userId);
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        error: accessCheck.error || "Access denied",
        data: null,
      };
    }

    const vocabSet = await prisma.vocabularySet.findFirst({
      where: {
        id: vocabIdNum,
        kelasVocabularySets: {
          some: {
            kelasId: kelasIdNum
          }
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        isPublic: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        kelasVocabularySets: {
          include: {
            kelas: {
              select: {
                id: true,
                title: true,
                level: true,
                thumbnail: true,
              },
            }
          }
        },
        items: {
          select: {
            id: true,
            korean: true,
            indonesian: true,
            type: true,
          },
        },
      },
    });

    if (!vocabSet) {
      return {
        success: false,
        error: "Vocabulary set not found",
        data: null,
      };
    }

    return {
      success: true,
      data: vocabSet,
    };
  } catch (error) {
    console.error("Get vocabulary detail error:", error);
    return {
      success: false,
      error: "Failed to fetch vocabulary details",
      data: null,
    };
  }
}
