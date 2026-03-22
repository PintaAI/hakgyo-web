import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { VocabularyType, PartOfSpeech } from '@/lib/enums'

// GET /api/vocabulary-items/[id] - Get specific vocabulary item
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const itemId = parseInt(params.id)
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vocabulary item ID' },
        { status: 400 }
      )
    }

    const vocabularyItem = await prisma.vocabularyItem.findUnique({
      where: { id: itemId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        collection: {
          select: {
            id: true,
            title: true,
            description: true,
            icon: true,
            isPublic: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            kelasVocabularySets: {
              select: {
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
        }
      }
    })

    if (!vocabularyItem) {
      return NextResponse.json(
        { success: false, error: 'Vocabulary item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vocabularyItem
    })
  } catch (error) {
    console.error('Error fetching vocabulary item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vocabulary item' },
      { status: 500 }
    )
  }
}

// PUT /api/vocabulary-items/[id] - Update specific vocabulary item
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const itemId = parseInt(params.id)
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vocabulary item ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      korean,
      indonesian,
      type,
      pos,
      audioUrl,
      exampleSentences
    } = body

    // Check if vocabulary item exists
    const existingItem = await prisma.vocabularyItem.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Vocabulary item not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (korean !== undefined) updateData.korean = korean
    if (indonesian !== undefined) updateData.indonesian = indonesian
    if (type !== undefined) updateData.type = type as VocabularyType
    if (pos !== undefined) updateData.pos = pos as PartOfSpeech
    if (audioUrl !== undefined) updateData.audioUrl = audioUrl
    if (exampleSentences !== undefined) updateData.exampleSentences = exampleSentences

    const vocabularyItem = await prisma.vocabularyItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        collection: {
          select: {
            id: true,
            title: true,
            description: true,
            icon: true,
            isPublic: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: vocabularyItem
    })
  } catch (error) {
    console.error('Error updating vocabulary item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update vocabulary item' },
      { status: 500 }
    )
  }
}

// DELETE /api/vocabulary-items/[id] - Delete specific vocabulary item
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const itemId = parseInt(params.id)
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vocabulary item ID' },
        { status: 400 }
      )
    }

    // Check if vocabulary item exists
    const existingItem = await prisma.vocabularyItem.findUnique({
      where: { id: itemId }
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Vocabulary item not found' },
        { status: 404 }
      )
    }

    await prisma.vocabularyItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({
      success: true,
      message: 'Vocabulary item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting vocabulary item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete vocabulary item' },
      { status: 500 }
    )
  }
}
