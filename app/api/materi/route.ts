import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/materi - Get all materials
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const kelasId = searchParams.get('kelasId')
    const isDemo = searchParams.get('isDemo')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const where: any = {}
    if (kelasId) where.kelasId = parseInt(kelasId)
    if (isDemo !== null) where.isDemo = isDemo === 'true'

    const [materis, totalCount] = await Promise.all([
      prisma.materi.findMany({
        where,
        include: {
          kelas: {
            select: {
              id: true,
              title: true,
              type: true,
              level: true,
              isDraft: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          },
          _count: {
            select: {
              completions: true
            }
          }
        },
        orderBy: [
          { kelasId: 'asc' },
          { order: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.materi.count({ where })
    ])

    // Filter out materis from draft kelas
    const filteredMateris = materis.filter(materi => !materi.kelas.isDraft)

    return NextResponse.json({
      success: true,
      data: filteredMateris,
      pagination: {
        total: totalCount,
        page: Math.floor(offset / (limit || 10)) + 1,
        limit: limit || 10,
        totalPages: Math.ceil(totalCount / (limit || 10))
      }
    })
  } catch (error) {
    console.error('Error fetching materis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

// POST /api/materi - Create new material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      jsonDescription,
      htmlDescription,
      order,
      isDemo = false,
      kelasId
    } = body

    // Validate required fields
    if (!title || !description || !jsonDescription || !htmlDescription || !kelasId) {
      return NextResponse.json(
        { success: false, error: 'Title, description, jsonDescription, htmlDescription, and kelasId are required' },
        { status: 400 }
      )
    }

    // Check if class exists
    const kelas = await prisma.kelas.findUnique({
      where: { id: parseInt(kelasId) }
    })

    if (!kelas) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    // If order is not provided, get the next order number
    let materiOrder = order
    if (!materiOrder) {
      const lastMateri = await prisma.materi.findFirst({
        where: { kelasId: parseInt(kelasId) },
        orderBy: { order: 'desc' }
      })
      materiOrder = lastMateri ? lastMateri.order + 1 : 1
    }

    const materi = await prisma.materi.create({
      data: {
        title,
        description,
        jsonDescription,
        htmlDescription,
        order: materiOrder,
        isDemo,
        kelasId: parseInt(kelasId)
      },
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
    })

    return NextResponse.json({
      success: true,
      data: materi
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating materi:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create material' },
      { status: 500 }
    )
  }
}
