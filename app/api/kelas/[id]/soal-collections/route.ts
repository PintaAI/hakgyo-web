import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const kelasId = parseInt(id);
    if (isNaN(kelasId)) {
      return NextResponse.json({ error: 'Invalid kelas ID' }, { status: 400 });
    }

    // console.log('Getting soal collections for kelasId:', kelasId, 'userId:', session.user.id);

    // Check if user is author or admin
    if (session.user.role !== 'GURU' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get kelas-related soal collections
    // Only return collections explicitly linked to this kelas via KelasKoleksiSoal
    // Filter out draft collections unless user is the owner
    const soalCollections = await prisma.koleksiSoal.findMany({
      where: {
        kelasKoleksiSoals: {
          some: {
            kelasId: kelasId
          }
        },
        OR: [
          // User can see their own draft collections
          {
            userId: session.user.id,
            isDraft: true
          },
          // All users can see non-draft collections
          {
            isDraft: false
          }
        ]
      },
      select: {
        id: true,
        nama: true,
        deskripsi: true,
        isPrivate: true,
        userId: true,
        _count: {
          select: {
            soals: true
          }
        }
      },
      orderBy: {
        nama: 'asc'
      }
    });

    // console.log('Found soal collections:', soalCollections.length, 'collections');

    return NextResponse.json({
      success: true,
      data: soalCollections
    });
  } catch (error) {
    console.error('Error getting soal collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
