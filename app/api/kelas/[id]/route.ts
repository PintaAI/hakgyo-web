import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { canModifyKelas } from '@/lib/access-control'
import { KelasType, Difficulty } from '@prisma/client'

// GET /api/kelas/[id] - Get specific class
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    const kelasId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const userId = session?.user?.id || searchParams.get('userId')
    
    if (isNaN(kelasId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid class ID' },
        { status: 400 }
      )
    }
    
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
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
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        materis: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            isDemo: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { order: 'asc' }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            materis: true,
            members: true,
            completions: true,
            kelasVocabularySets: true,
            kelasKoleksiSoals: {
              where: {
                koleksiSoal: {
                  isDraft: false
                }
              }
            }
          }
        }
      }
    })

    if (!kelas) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled (for logged-in users)
    let isEnrolled = false
    if (userId) {
      isEnrolled = kelas.members.some(member => member.id === userId)
    }

    // Add isEnrolled field to the response
    const kelasWithEnrollmentStatus = {
      ...kelas,
      isEnrolled
    }

    return NextResponse.json({
      success: true,
      data: kelasWithEnrollmentStatus
    })
  } catch (error) {
    console.error('Error fetching kelas:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch class' },
      { status: 500 }
    )
  }
}

// PUT /api/kelas/[id] - Update specific class
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const kelasId = parseInt(params.id)
    
    if (isNaN(kelasId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid class ID' },
        { status: 400 }
      )
    }
    
    // Check if user can modify this kelas
    const canModify = await canModifyKelas(session.user.id, kelasId)
    if (!canModify) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      jsonDescription,
      htmlDescription,
      type,
      level,
      thumbnail,
      icon,
      isPaidClass,
      price,
      discount,
      promoCode
    } = body

    // Check if class exists
    const existingKelas = await prisma.kelas.findUnique({
      where: { id: kelasId }
    })

    if (!existingKelas) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (jsonDescription !== undefined) updateData.jsonDescription = jsonDescription
    if (htmlDescription !== undefined) updateData.htmlDescription = htmlDescription
    if (type !== undefined) updateData.type = type as KelasType
    if (level !== undefined) updateData.level = level as Difficulty
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (icon !== undefined) updateData.icon = icon
    if (isPaidClass !== undefined) updateData.isPaidClass = isPaidClass
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null
    if (discount !== undefined) updateData.discount = discount ? parseFloat(discount) : null
    if (promoCode !== undefined) updateData.promoCode = promoCode

    const kelas = await prisma.kelas.update({
      where: { id: kelasId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: kelas
    })
  } catch (error) {
    console.error('Error updating kelas:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update class' },
      { status: 500 }
    )
  }
}

// DELETE /api/kelas/[id] - Delete specific class
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const kelasId = parseInt(params.id)
    
    if (isNaN(kelasId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid class ID' },
        { status: 400 }
      )
    }
    
    // Check if user can modify this kelas
    const canModify = await canModifyKelas(session.user.id, kelasId)
    if (!canModify) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if class exists
    const existingKelas = await prisma.kelas.findUnique({
      where: { id: kelasId }
    })

    if (!existingKelas) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    await prisma.kelas.delete({
      where: { id: kelasId }
    })

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting kelas:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete class' },
      { status: 500 }
    )
  }
}
