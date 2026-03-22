import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    // Debug: Check for duplicate session tokens in cookie header
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const tokenMatches = cookieHeader.match(/better-auth\.session_token=[^;]*/g);
      if (tokenMatches && tokenMatches.length > 1) {
        console.log('[Daily Vocab] ⚠️ DUPLICATE TOKENS DETECTED:', tokenMatches.length, tokenMatches);
      }
    }
    
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const takeParam = searchParams.get('take');

    const take = takeParam ? Math.min(parseInt(takeParam), 10) : 5; // Default 5, max 10

    const where = {
      OR: [
        // Vocabulary from user's joined classes
        {
          collection: {
            kelasVocabularySets: {
              some: {
                kelas: {
                  members: {
                    some: {
                      id: userId
                    }
                  }
                }
              }
            }
          }
        },
        // Vocabulary from user's own vocabulary sets
        {
          collection: {
            userId: userId
          }
        },
        // Vocabulary created directly by user
        {
          creatorId: userId
        }
      ]
    };

    const totalCount = await prisma.vocabularyItem.count({ where });
    if (totalCount === 0) return NextResponse.json(getMockVocabulary());

    // pastikan nggak out-of-range
    const maxOffset = Math.max(0, totalCount - take);
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

    const items = await prisma.vocabularyItem.findMany({
      where,
      orderBy: { id: 'asc' }, // penting buat konsistensi skip
      skip: randomOffset,
      take,
      select: {
        id: true,
        korean: true,
        indonesian: true,
        type: true,
        pos: true,
        exampleSentences: true,
        collection: {
          select: {
            title: true,
            kelasVocabularySets: {
              select: {
                kelas: {
                  select: { title: true }
                }
              },
              take: 1
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching daily vocabulary:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vocabulary' }, { status: 500 });
  }
}

// Mock data for fallback
function getMockVocabulary() {
  const mockVocabularies = [
    {
      id: 1,
      korean: "안녕하세요",
      indonesian: "Halo (formal)",
      type: "WORD",
      pos: "KATA_BENDA",
      exampleSentences: ["안녕하세요, 만나서 반갑습니다.", "선생님 안녕하세요!"],
      audioUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      korean: "감사합니다",
      indonesian: "Terima kasih",
      type: "WORD",
      pos: "KATA_BENDA",
      exampleSentences: ["정말 감사합니다.", "도움을 주셔서 감사합니다."],
      audioUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      korean: "좋은 아침입니다",
      indonesian: "Selamat pagi",
      type: "SENTENCE",
      pos: null,
      exampleSentences: ["좋은 아침입니다, 선생님!", "오늘 아침은 날씨가 좋네요."],
      audioUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 4,
      korean: "배고파요",
      indonesian: "Lapar",
      type: "WORD",
      pos: "KATA_SIFAT",
      exampleSentences: ["배고파요, 밥 먹을 시간이에요.", "점심이 너무 늦어서 배고파요."],
      audioUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 5,
      korean: "어제는 비가 왔어요",
      indonesian: "Hari kemarin hujan",
      type: "SENTENCE",
      pos: null,
      exampleSentences: ["어제는 비가 와서 외출하기 어려웠어요.", "날씨가 너무 덥지 않아서 좋았어요."],
      audioUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  return mockVocabularies[Math.floor(Math.random() * mockVocabularies.length)];
}
