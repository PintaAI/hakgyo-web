import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authorId = searchParams.get('authorId');
    const koleksiSoalId = searchParams.get('koleksiSoalId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const where: any = {};

    if (authorId) where.authorId = authorId;
    if (koleksiSoalId && koleksiSoalId !== 'undefined') {
      const parsedKoleksiSoalId = parseInt(koleksiSoalId);
      if (!isNaN(parsedKoleksiSoalId)) {
        where.koleksiSoalId = parsedKoleksiSoalId;
      }
    }

    // If searching by private collection or generic search, might need auth check
    // For now, assuming basic filters are allowed if you have access to the collection
    // But realistically, we should check if user has access to the koleksiSoal parent

    const [soals, totalCount] = await Promise.all([
      prisma.soal.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          opsis: {
            orderBy: {
              order: 'asc',
            },
          },
          attachments: true,
        },
        orderBy: { order: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.soal.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: soals,
      pagination: {
        total: totalCount,
        page: Math.floor(offset / (limit || 20)) + 1,
        limit: limit || 20,
        totalPages: Math.ceil(totalCount / (limit || 20)),
      },
    });
  } catch (error) {
    console.error('Error fetching soals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch soals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      koleksiSoalId,
      pertanyaan,
      difficulty,
      explanation,
      isActive = true,
      order = 0,
      opsi,
      opsis: opsisAlias, // Array of option objects
      attachments = [], // Array of attachment objects
    } = body;

    const opsis = opsi || opsisAlias || [];

    if (!koleksiSoalId || !pertanyaan) {
      return NextResponse.json(
        { success: false, error: 'KoleksiSoalId and Pertanyaan are required' },
        { status: 400 }
      );
    }

    // Verify ownership of the collection
    const koleksi = await prisma.koleksiSoal.findUnique({
      where: { id: parseInt(koleksiSoalId) },
    });

    if (!koleksi) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    // Only allow owner to add questions
    if (koleksi.userId !== session.user.id) {
      // NOTE: Might want to allow ADMINs later
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Create Soal with Opsis and Attachments transactional
    const soal = await prisma.soal.create({
      data: {
        koleksiSoalId: parseInt(koleksiSoalId),
        authorId: session.user.id,
        pertanyaan,
        difficulty,
        explanation,
        isActive,
        order,
        opsis: {
          create: opsis.map((o: any) => ({
            opsiText: o.opsiText,
            isCorrect: o.isCorrect,
            order: o.order,
          })),
        },
        attachments: {
          create: attachments.map((a: any) => ({
            url: a.url,
            type: a.type,
            filename: a.filename,
            size: a.size,
            mimeType: a.mimeType,
            order: a.order,
          })),
        },
      },
      include: {
        opsis: true,
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: soal,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating soal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create soal' },
      { status: 500 }
    );
  }
}
