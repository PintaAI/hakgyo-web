import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/vocabulary-sets - Get all vocabulary sets
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await request.headers
    });
    
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const kelasId = searchParams.get('kelasId')
    const isPublic = searchParams.get('isPublic')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const where: any = {}
    
    // Handle authenticated user logic
    if (session?.user) {
      // Get classes the user has joined
      const joinedClasses = await prisma.kelas.findMany({
        where: {
          members: {
            some: {
              id: session.user.id
            }
          }
        },
        select: { id: true }
      });
      
      const joinedClassIds = joinedClasses.map(c => c.id);

      // Base query condition for authenticated users:
      // 1. Sets owned by the user (can be drafts)
      // 2. Sets attached to classes the user has joined (must be published and class must be published)
      // 3. Public sets (must be published)
      const accessConditions: any[] = [
        { userId: session.user.id }, // Own sets
        {
          kelasVocabularySets: {
            some: {
              kelasId: { in: joinedClassIds },
              kelas: { isDraft: false }
            }
          },
          isDraft: false
        }
      ];

      // If explicit filters are provided, they must be respected within the allowed access
      if (userId) {
        // If filtering by specific user, ensure we only return if it matches access rights
        if (userId === session.user.id) {
          // Looking for own sets
          where.userId = userId;
        } else {
          // Looking for another user's sets - must be public or shared via class
          where.userId = userId;
          where.OR = [
            { isPublic: true, isDraft: false },
            {
              kelasVocabularySets: {
                some: {
                  kelasId: { in: joinedClassIds },
                  kelas: { isDraft: false }
                }
              },
              isDraft: false
            }
          ];
        }
      } else if (kelasId) {
        // Filtering by specific class
        const kid = parseInt(kelasId);
        where.kelasVocabularySets = {
          some: { kelasId: kid }
        };
        where.isDraft = false; // Class sets must be published unless owned (handled below)
        
        // If owned by user, can be draft
        if (where.OR) {
           where.OR.push({ userId: session.user.id });
        } else {
           where.OR = [
             { isDraft: false },
             { userId: session.user.id }
           ];
        }
      } else {
        // No specific filter, apply general access
        where.OR = accessConditions;
        
      }
      
      // If isPublic filter is explicitly set, we handle it
      if (isPublic !== null) {
        if (isPublic === 'true') {
             // User wants public sets. Add public sets to the OR condition.
             // This means: Show (My Sets) OR (Class Sets) OR (Public Sets)
             const publicCondition = { isPublic: true, isDraft: false };
             
             if (where.OR) {
                 where.OR.push(publicCondition);
             } else {
                 where.OR = [publicCondition];
             }
        } else if (isPublic === 'false') {
            // User explicitly wants non-public sets (private)
            // This intersects with the base access conditions (must own or be in class)
            where.isPublic = false;
        }
      }

    } else {
      // Unauthenticated: Only public published sets
      where.isPublic = true;
      where.isDraft = false;
      
      if (userId) where.userId = userId;
      if (kelasId) {
        where.kelasVocabularySets = {
          some: { kelasId: parseInt(kelasId) }
        };
      }
    }

    const vocabularySets = await prisma.vocabularySet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        kelasVocabularySets: {
          include: {
            kelas: {
              select: {
                id: true,
                title: true,
                type: true,
                level: true,
                isDraft: true
              }
            }
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

  

    // Process vocabulary sets to add counts
    // Note: We don't filter by kelas.isDraft here anymore because it's handled in the query
    // ensuring owners can see their sets in draft classes, but others only see published ones
    const filteredVocabularySets = await Promise.all(
      vocabularySets.map(async (set) => {
        // Get learned count for this set based on user's progress
        const learnedCount = session?.user
          ? await prisma.vocabularyItemProgress.count({
              where: {
                userId: session.user.id,
                itemId: {
                  in: (await prisma.vocabularyItem.findMany({
                    where: { collectionId: set.id },
                    select: { id: true }
                  })).map(item => item.id)
                },
                isLearned: true
              }
            })
          : 0

        return {
          ...set,
          itemCount: set._count.items,
          learnedCount
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: filteredVocabularySets,
      meta: {
        total: filteredVocabularySets.length,
        offset,
        limit
      }
    })
  } catch (error) {
    console.error('Error fetching vocabulary sets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vocabulary sets' },
      { status: 500 }
    )
  }
}

// POST /api/vocabulary-sets - Create new vocabulary set
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      icon = 'FaBook',
      isPublic = false,
      userId,
      kelasId
    } = body

    // Validate required fields
    if (!title || !userId) {
      return NextResponse.json(
        { success: false, error: 'Title and userId are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if kelas exists (if provided)
    if (kelasId) {
      const kelas = await prisma.kelas.findUnique({
        where: { id: parseInt(kelasId) }
      })

      if (!kelas) {
        return NextResponse.json(
          { success: false, error: 'Class not found' },
          { status: 404 }
        )
      }
    }

    const vocabularySet = await prisma.vocabularySet.create({
      data: {
        title,
        description,
        icon,
        isPublic,
        userId,
        ...(kelasId ? {
          kelasVocabularySets: {
            create: {
              kelasId: parseInt(kelasId),
              order: 0
            }
          }
        } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        kelasVocabularySets: {
          include: {
            kelas: {
              select: {
                id: true,
                title: true,
                type: true,
                level: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: vocabularySet
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating vocabulary set:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create vocabulary set' },
      { status: 500 }
    )
  }
}
