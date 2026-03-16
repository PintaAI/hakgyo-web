import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const userId = session?.user?.id || null

    const searchParams = request.nextUrl.searchParams
    const userIdParam = searchParams.get('userId')
    const kelasId = searchParams.get('kelasId')
    const onlyJoinedClasses = searchParams.get('onlyJoinedClasses') === 'true'
    const isPrivate = searchParams.get('isPrivate')
    const isDraft = searchParams.get('isDraft')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const where: any = {}

    if (userIdParam) where.userId = userIdParam
    
    if (onlyJoinedClasses) {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Authentication required for onlyJoinedClasses' },
          { status: 401 }
        )
      }
      
      // Get user's joined classes
      const joinedKelas = await prisma.kelas.findMany({
        where: {
          members: {
            some: {
              id: userId
            }
          }
        },
        select: { id: true }
      })
      
      const joinedKelasIds = joinedKelas.map(k => k.id)
      
      // Filter collections by joined classes
      where.kelasKoleksiSoals = {
        some: {
          kelasId: { in: joinedKelasIds }
        }
      }
    } else if (kelasId) {
      where.kelasKoleksiSoals = {
        some: {
          kelasId: parseInt(kelasId)
        }
      }
    }
    
    if (isPrivate !== null) where.isPrivate = isPrivate === 'true'
    if (isDraft !== null) where.isDraft = isDraft === 'true'

    // If no userId specified and user is not logged in, only return public, non-draft collections
    if (!userIdParam && !userId) {
      where.isPrivate = false
      where.isDraft = false
    }
    // If no userId specified but user is logged in, return user's own collections (including drafts) or public non-draft ones
    else if (!userIdParam && userId) {
      where.OR = [
        {
          userId: userId,
          // User can see their own collections regardless of draft/private status
        },
        {
          isPrivate: false,
          isDraft: false
        }
      ]
    }

    const [koleksiSoals, totalCount] = await Promise.all([
      prisma.koleksiSoal.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              soals: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.koleksiSoal.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: koleksiSoals,
      pagination: {
        total: totalCount,
        page: Math.floor(offset / (limit || 10)) + 1,
        limit: limit || 10,
        totalPages: Math.ceil(totalCount / (limit || 10)),
      },
    })
  } catch (error) {
    console.error('Error fetching soal collections:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch soal collections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nama,
      deskripsi,
      isPrivate = false,
      isDraft = true,
    } = body

    // Validate required fields
    if (!nama) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const koleksiSoal = await prisma.koleksiSoal.create({
      data: {
        nama,
        deskripsi,
        isPrivate,
        isDraft,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        kelasKoleksiSoals: {
          include: {
            kelas: {
              select: {
                id: true,
                title: true,
                level: true,
              },
            },
          },
        },
        _count: {
          select: {
            soals: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: koleksiSoal,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating soal collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create soal collection' },
      { status: 500 }
    )
  }
}
