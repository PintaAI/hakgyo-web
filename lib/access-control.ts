import { prisma } from '@/lib/db'

/**
 * Check if user can access a kelas (class)
 * User can access if they are:
 * 1. The author of the kelas
 * 2. A member of the kelas
 * 3. An admin (optional, can be added later)
 */
export async function canAccessKelas(userId: string | null, kelasId: number): Promise<boolean> {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      select: {
        id: true,
        authorId: true,
        isDraft: true,
        members: userId ? {
          where: { id: userId },
          select: { id: true }
        } : undefined
      }
    })
    
    if (!kelas) return false
    
    // For non-logged-in users, only allow access to non-draft kelas
    if (!userId) {
      return !kelas.isDraft
    }
    
    // Don't allow access to draft kelas unless user is the author
    if (kelas.isDraft && kelas.authorId !== userId) return false
    
    // Allow access if user is author or member
    return kelas.authorId === userId || (kelas.members && kelas.members.length > 0)
  } catch (error) {
    console.error('Error checking kelas access:', error)
    return false
  }
}

/**
 * Check if user can modify a kelas (class)
 * User can modify if they are:
 * 1. The author of the kelas
 * 2. An admin (optional, can be added later)
 */
export async function canModifyKelas(userId: string, kelasId: number): Promise<boolean> {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      select: { id: true, authorId: true }
    })
    
    if (!kelas) return false
    
    return kelas.authorId === userId
  } catch (error) {
    console.error('Error checking kelas modification access:', error)
    return false
  }
}

/**
 * Check if user can access materi (material)
 * User can access if they are:
 * 1. The author of the kelas that contains the materi
 * 2. A member of the kelas that contains the materi
 * 3. The materi is marked as demo (for limited access)
 */
export async function canAccessMateri(userId: string, materiId: number): Promise<boolean> {
  try {
    const materi = await prisma.materi.findUnique({
      where: { id: materiId },
      select: {
        id: true,
        isDemo: true,
        kelas: {
          select: {
            id: true,
            authorId: true,
            members: {
              where: { id: userId },
              select: { id: true }
            }
          }
        }
      }
    })
    
    if (!materi) return false
    
    // Allow access if user is author or member of the kelas
    const isAuthor = materi.kelas.authorId === userId
    const isMember = materi.kelas.members.length > 0
    
    return isAuthor || isMember
  } catch (error) {
    console.error('Error checking materi access:', error)
    return false
  }
}

/**
 * Check if user can modify materi (material)
 * User can modify if they are:
 * 1. The author of the kelas that contains the materi
 * 2. An admin (optional, can be added later)
 */
export async function canModifyMateri(userId: string, materiId: number): Promise<boolean> {
  try {
    const materi = await prisma.materi.findUnique({
      where: { id: materiId },
      select: {
        id: true,
        kelas: {
          select: {
            id: true,
            authorId: true
          }
        }
      }
    })
    
    if (!materi) return false
    
    return materi.kelas.authorId === userId
  } catch (error) {
    console.error('Error checking materi modification access:', error)
    return false
  }
}

/**
 * Check if user can access vocabulary set
 * User can access if they are:
 * 1. The owner of the vocabulary set
 * 2. The vocabulary set is public
 * 3. A member of the kelas associated with the vocabulary set
 * 4. The author of the kelas associated with the vocabulary set
 */
export async function canAccessVocabularySet(userId: string, vocabularySetId: number): Promise<boolean> {
  try {
    const vocabularySet = await prisma.vocabularySet.findUnique({
      where: { id: vocabularySetId },
      select: {
        id: true,
        isPublic: true,
        userId: true,
        kelasVocabularySets: {
          include: {
            kelas: {
              select: {
                id: true,
                authorId: true,
                members: {
                  where: { id: userId },
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    })
    
    if (!vocabularySet) return false
    
    // Allow access if:
    // 1. It's public
    // 2. User owns it
    // 3. User is member of any associated kelas
    // 4. User is author of any associated kelas
    const hasKelasAccess = vocabularySet.kelasVocabularySets.some(kvs =>
      (kvs.kelas?.members && kvs.kelas.members.length > 0) ||
      kvs.kelas?.authorId === userId
    );
    
    return vocabularySet.isPublic ||
           vocabularySet.userId === userId ||
           hasKelasAccess
  } catch (error) {
    console.error('Error checking vocabulary set access:', error)
    return false
  }
}

/**
 * Check if user can access koleksi soal (question collection)
 * User can access if they are:
 * 1. The owner of the koleksi soal
 * 2. A member of the kelas that the koleksi soal is associated with
 * 3. The koleksi soal is public
 */
export async function canAccessKoleksiSoal(userId: string | null, koleksiSoalId: number): Promise<boolean> {
  try {
    const koleksiSoal = await prisma.koleksiSoal.findUnique({
      where: { id: koleksiSoalId },
      select: {
        id: true,
        isPrivate: true,
        isDraft: true,
        userId: true,
        kelasKoleksiSoals: {
          include: {
            kelas: {
              select: {
                id: true,
                authorId: true,
                members: userId ? {
                  where: { id: userId },
                  select: { id: true }
                } : undefined
              }
            }
          }
        }
      }
    })

    if (!koleksiSoal) {
      console.log(`[DEBUG] KoleksiSoal ${koleksiSoalId} not found`)
      return false
    }

    // Allow access if:
    // 1. User owns the koleksi soal
    // 2. It's public (not private) and not draft
    // 3. User is member of associated kelas
    // 4. User is author of associated kelas
    const isOwner = userId ? koleksiSoal.userId === userId : false
    const isPublic = !koleksiSoal.isPrivate
    const isKelasMember = userId && koleksiSoal.kelasKoleksiSoals?.some(kk =>
      (kk.kelas.members && kk.kelas.members.length > 0) || kk.kelas.authorId === userId
    ) || false

    console.log(`[DEBUG] KoleksiSoal ${koleksiSoalId} access check for user ${userId}:`)
    console.log(`[DEBUG] - isOwner: ${isOwner}`)
    console.log(`[DEBUG] - isPublic: ${isPublic}`)
    console.log(`[DEBUG] - isDraft: ${koleksiSoal.isDraft}`)
    console.log(`[DEBUG] - isKelasMember: ${isKelasMember}`)
    console.log(`[DEBUG] - kelasKoleksiSoals count: ${koleksiSoal.kelasKoleksiSoals?.length || 0}`)

    // For non-logged-in users, only allow access to public, non-draft collections
    if (!userId) {
      const result = isPublic && !koleksiSoal.isDraft
      console.log(`[DEBUG] Non-logged-in user access result: ${result}`)
      return result
    }

    // Don't allow access to draft collections unless user is owner or kelas member
    if (koleksiSoal.isDraft && !isOwner && !isKelasMember) {
      console.log(`[DEBUG] Draft collection access denied for non-owner/non-member`)
      return false
    }

    // Only allow access if user is owner or kelas member (remove public access)
    const finalResult = isOwner || isKelasMember
    console.log(`[DEBUG] Final access result: ${finalResult}`)
    return finalResult
  } catch (error) {
    console.error('Error checking koleksi soal access:', error)
    return false
  }
}

/**
 * Check if user can access koleksi soal for practice
 * User can access for practice if they are enrolled in a class that uses this koleksi soal
 */
export async function canAccessKoleksiSoalForPractice(userId: string | null, koleksiSoalId: number, kelasId: number): Promise<boolean> {
  try {
    // First check if user is authenticated
    if (!userId) {
      console.log(`[DEBUG] Practice access denied: no user ID provided`)
      return false
    }

    // Check if the kelas exists and user is enrolled in it
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      select: {
        id: true,
        authorId: true,
        members: {
          where: { id: userId },
          select: { id: true }
        }
      }
    })

    if (!kelas) {
      console.log(`[DEBUG] Practice access denied: kelas ${kelasId} not found`)
      return false
    }

    // Check if user is enrolled in the kelas (member or author)
    const isEnrolled = kelas.authorId === userId || (kelas.members && kelas.members.length > 0)
    if (!isEnrolled) {
      console.log(`[DEBUG] Practice access denied: user ${userId} not enrolled in kelas ${kelasId}`)
      return false
    }

    // Check if the koleksi soal is associated with this kelas
    const kelasKoleksiSoal = await prisma.kelasKoleksiSoal.findFirst({
      where: {
        kelasId: kelasId,
        koleksiSoalId: koleksiSoalId
      }
    })

    if (!kelasKoleksiSoal) {
      console.log(`[DEBUG] Practice access denied: koleksi soal ${koleksiSoalId} not associated with kelas ${kelasId}`)
      return false
    }

    console.log(`[DEBUG] Practice access granted: user ${userId} enrolled in kelas ${kelasId} with koleksi soal ${koleksiSoalId}`)
    return true
  } catch (error) {
    console.error('Error checking koleksi soal practice access:', error)
    return false
  }
}

/**
 * Check if user can modify koleksi soal (question collection)
 * User can modify if they are:
 * 1. The owner of the koleksi soal
 * 2. The author of the kelas that the koleksi soal is associated with
 */
export async function canModifyKoleksiSoal(userId: string, koleksiSoalId: number): Promise<boolean> {
  try {
    const koleksiSoal = await prisma.koleksiSoal.findUnique({
      where: { id: koleksiSoalId },
      select: {
        id: true,
        userId: true,
        kelasKoleksiSoals: {
          include: {
            kelas: {
              select: {
                id: true,
                authorId: true
              }
            }
          }
        }
      }
    })
    
    if (!koleksiSoal) return false
    
    // Allow modification if:
    // 1. User owns the koleksi soal
    // 2. User is author of associated kelas
    const isOwner = koleksiSoal.userId === userId
    const isKelasAuthor = koleksiSoal.kelasKoleksiSoals?.some(kk =>
      kk.kelas.authorId === userId
    )
    
    return isOwner || isKelasAuthor
  } catch (error) {
    console.error('Error checking koleksi soal modification access:', error)
    return false
  }
}

/**
 * Check if user can access soal (question)
 * User can access if they are:
 * 1. The author of the soal
 * 2. The owner of the koleksi soal that contains the soal
 * 3. A member of the kelas associated with the koleksi soal
 * 4. The author of the kelas associated with the koleksi soal
 * 5. The koleksi soal is public (not private) and not draft
 */
export async function canAccessSoal(userId: string | null, soalId: number): Promise<boolean> {
  try {
    const soal = await prisma.soal.findUnique({
      where: { id: soalId },
      select: {
        id: true,
        isActive: true,
        authorId: true,
        koleksiSoal: {
          select: {
            id: true,
            isPrivate: true,
            isDraft: true,
            userId: true,
            kelasKoleksiSoals: {
              include: {
                kelas: {
                  select: {
                    id: true,
                    authorId: true,
                    members: userId ? {
                      where: { id: userId },
                      select: { id: true }
                    } : undefined
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!soal || !soal.isActive) return false

    // For non-logged-in users, only allow access to public, non-draft collections
    if (!userId) {
      return !soal.koleksiSoal.isPrivate && !soal.koleksiSoal.isDraft
    }

    // Allow access if:
    // 1. User authored the soal
    // 2. User owns the koleksi soal
    // 3. It's public (not private) and not draft
    // 4. User is member of associated kelas
    // 5. User is author of associated kelas
    const isAuthor = soal.authorId === userId
    const isKoleksiOwner = soal.koleksiSoal.userId === userId
    const isPublic = !soal.koleksiSoal.isPrivate && !soal.koleksiSoal.isDraft
    const isKelasMember = soal.koleksiSoal.kelasKoleksiSoals?.some(kk =>
      (kk.kelas.members && kk.kelas.members.length > 0) || kk.kelas.authorId === userId
    ) || false

    return isAuthor || isKoleksiOwner || isPublic || isKelasMember
  } catch (error) {
    console.error('Error checking soal access:', error)
    return false
  }
}

/**
 * Check if user can modify soal (question)
 * User can modify if they are:
 * 1. The author of the soal
 * 2. The owner of the koleksi soal that contains the soal
 * 3. The author of the kelas associated with the koleksi soal
 */
export async function canModifySoal(userId: string, soalId: number): Promise<boolean> {
  try {
    const soal = await prisma.soal.findUnique({
      where: { id: soalId },
      select: {
        id: true,
        authorId: true,
        koleksiSoal: {
          select: {
            id: true,
            userId: true,
            kelasKoleksiSoals: {
              include: {
                kelas: {
                  select: {
                    id: true,
                    authorId: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!soal) return false

    // Allow modification if:
    // 1. User authored the soal
    // 2. User owns the koleksi soal
    // 3. User is author of associated kelas
    const isAuthor = soal.authorId === userId
    const isKoleksiOwner = soal.koleksiSoal.userId === userId
    const isKelasAuthor = soal.koleksiSoal.kelasKoleksiSoals?.some(kk =>
      kk.kelas.authorId === userId
    ) || false

    return isAuthor || isKoleksiOwner || isKelasAuthor
  } catch (error) {
    console.error('Error checking soal modification access:', error)
    return false
  }
}

/**
 * Check if user can modify vocabulary set
 * User can modify if they are:
 * 1. The owner of the vocabulary set
 * 2. The author of the kelas associated with the vocabulary set
 * 3. An admin (optional, can be added later)
 */
export async function canModifyVocabularySet(userId: string, vocabularySetId: number): Promise<boolean> {
  try {
    const vocabularySet = await prisma.vocabularySet.findUnique({
      where: { id: vocabularySetId },
      select: {
        id: true,
        userId: true,
        kelasVocabularySets: {
          include: {
            kelas: {
              select: {
                id: true,
                authorId: true
              }
            }
          }
        }
      }
    })
    
    if (!vocabularySet) return false
    
    // Allow modification if:
    // 1. User owns the vocabulary set
    // 2. User is author of any associated kelas
    const isKelasAuthor = vocabularySet.kelasVocabularySets.some(kvs =>
      kvs.kelas?.authorId === userId
    );
    
    return vocabularySet.userId === userId || isKelasAuthor
  } catch (error) {
    console.error('Error checking vocabulary set modification access:', error)
    return false
  }
}

/**
 * Filter demo content for non-enrolled users
 * Returns limited information for demo materi when user is not enrolled
 */
export function filterDemoContent(materi: any, isEnrolled: boolean) {
  if (materi.isDemo && !isEnrolled) {
    // Return only demo-safe content
    return {
      id: materi.id,
      title: materi.title,
      description: materi.description,
      order: materi.order,
      isDemo: true,
      kelas: materi.kelas,
      createdAt: materi.createdAt,
      updatedAt: materi.updatedAt
      // Exclude full content (jsonDescription, htmlDescription, koleksiSoal, etc.)
    }
  }
  return materi
}