import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

interface DailySoalQueryParams {
  userId: string;
  take: number;
}

interface SoalWhereClause {
  isActive: boolean;
  OR: Array<{
    koleksiSoal?: {
      kelasKoleksiSoals?: {
        some: {
          kelas: {
            members: {
              some: {
                id: string;
              };
            };
          };
        };
      };
      userId?: string;
    };
    authorId?: string;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TAKE = 5;
const MAX_TAKE = 10;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse and validate query parameters from the request
 */
function parseQueryParams(request: NextRequest): DailySoalQueryParams {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const takeParam = searchParams.get('take');

  if (!userId) {
    throw new Error('User ID is required');
  }

  const take = takeParam ? Math.min(parseInt(takeParam, 10), MAX_TAKE) : DEFAULT_TAKE;

  return { userId, take };
}

/**
 * Build the Prisma where clause for fetching soal from:
 * 1. User's joined classes
 * 2. User's own koleksi soal
 * 3. Soal created directly by user
 */
function buildWhereClause(userId: string): SoalWhereClause {
  return {
    isActive: true,
    OR: [
      // Condition 1: Soal from user's joined classes (via KelasKoleksiSoal)
      {
        koleksiSoal: {
          kelasKoleksiSoals: {
            some: {
              kelas: {
                members: {
                  some: {
                    id: userId,
                  },
                },
              },
            },
          },
        },
      },
      // Condition 2: Soal from user's own koleksi soal
      {
        koleksiSoal: {
          userId,
        },
      },
      // Condition 3: Soal created directly by user
      {
        authorId: userId,
      },
    ],
  };
}

/**
 * Calculate a random offset for pagination
 */
function calculateRandomOffset(totalCount: number, take: number): number {
  if (totalCount === 0) return 0;
  const maxOffset = Math.max(0, totalCount - take);
  return Math.floor(Math.random() * (maxOffset + 1));
}

/**
 * Get the fields to select when fetching soal
 */
function getSoalSelectFields() {
  return {
    id: true,
    pertanyaan: true,
    difficulty: true,
    explanation: true,
    koleksiSoal: {
      select: {
        nama: true,
        deskripsi: true,
      },
    },
    opsis: {
      select: {
        id: true,
        opsiText: true,
        isCorrect: true,
        order: true,
      },
    },
  };
}

// ============================================================================
// Main Route Handler
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { userId, take } = parseQueryParams(request);

    // Build where clause
    const where = buildWhereClause(userId);

    // Get total count of matching soal
    const totalCount = await prisma.soal.count({ where });

    // Return empty array if no soal found
    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Calculate random offset for variety
    const randomOffset = calculateRandomOffset(totalCount, take);

    // Fetch soal with random offset
    const items = await prisma.soal.findMany({
      where,
      orderBy: { id: 'asc' }, // Consistent ordering for offset calculation
      skip: randomOffset,
      take,
      select: getSoalSelectFields(),
    });

    return NextResponse.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching daily soal:', error);

    // Handle specific errors
    if (error instanceof Error && error.message === 'User ID is required') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch soal' }, { status: 500 });
  }
}
