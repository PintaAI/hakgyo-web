import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GamificationService } from '@/lib/gamification/service';

// Simple in-memory lock for preventing race conditions
const processingLocks = new Map<string, { timestamp: number }>();
const LOCK_TIMEOUT = 30000; // 30 seconds timeout

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

    const resolvedParams = await params;
    const materiId = parseInt(resolvedParams.id);
    if (isNaN(materiId)) {
      return NextResponse.json({ error: 'Invalid materi ID' }, { status: 400 });
    }

    // Get materi with assessment info
    const materi = await prisma.materi.findUnique({
      where: { id: materiId },
      include: {
        kelas: {
          select: {
            id: true,
            title: true,
            type: true,
            level: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        koleksiSoal: {
          include: {
            soals: {
              include: {
                opsis: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        completions: {
          where: {
            userId: session.user.id
          }
        },
        assessments: {
          where: {
            userId: session.user.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!materi) {
      return NextResponse.json({ error: 'Materi not found' }, { status: 404 });
    }

    // Check if user can access this materi
    const canAccess = await canAccessMateri(session.user.id, materi);
    if (!canAccess) {
      return NextResponse.json({ error: 'Materi not accessible' }, { status: 403 });
    }

    // Check if materi has assessment
    if (!materi.koleksiSoalId) {
      return NextResponse.json({ error: 'No assessment for this materi' }, { status: 404 });
    }

    // Get assessment questions
    const questions = materi.koleksiSoal?.soals.map((soal: any) => ({
      id: soal.id,
      pertanyaan: soal.pertanyaan,
      opsi: soal.opsis.map((opsi: any) => ({
        id: opsi.id,
        opsiText: opsi.opsiText
      }))
    })) || [];

    const assessment = {
      id: materi.id,
      title: materi.title,
      koleksiSoalId: materi.koleksiSoalId,
      passingScore: materi.passingScore || 80,
      questions,
      userAssessment: materi.assessments?.[0] || null,
      canRetake: true // Unlimited retries
    };

    return NextResponse.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error getting assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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

    // Check for existing lock to prevent race conditions
    const existingLock = processingLocks.get(session.user.id);
    const now = Date.now();
    
    if (existingLock && (now - existingLock.timestamp) < LOCK_TIMEOUT) {
      return NextResponse.json(
        { error: 'Request already in progress' },
        { status: 429 }
      );
    }

    // Set lock
    processingLocks.set(session.user.id, { timestamp: now });

    const resolvedParams = await params;
    const materiId = parseInt(resolvedParams.id);
    if (isNaN(materiId)) {
      return NextResponse.json({ error: 'Invalid materi ID' }, { status: 400 });
    }

    const body = await request.json();
    const { answers } = body;

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    // Get materi with assessment info
    const materi = await prisma.materi.findUnique({
      where: { id: materiId },
      include: {
        koleksiSoal: {
          include: {
            soals: {
              include: {
                opsis: true
              }
            }
          }
        }
      }
    });

    if (!materi || !materi.koleksiSoalId) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check if user can access this materi
    const canAccess = await canAccessMateri(session.user.id, materi);
    if (!canAccess) {
      return NextResponse.json({ error: 'Materi not accessible' }, { status: 403 });
    }

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = materi.koleksiSoal?.soals.length || 0;

    for (const answer of answers) {
      const soal = materi.koleksiSoal?.soals.find((s: any) => s.id === answer.soalId);
      if (soal) {
        const selectedOpsi = soal.opsis.find((o: any) => o.id === answer.selectedOptionId);
        if (selectedOpsi?.isCorrect) {
          correctAnswers++;
        }
      }
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passingScore = materi.passingScore || 80;
    const isPassed = score >= passingScore;
    const isPerfectScore = score === 100;

    // Save assessment result
    const assessmentResult = await prisma.userMateriAssessment.upsert({
      where: {
        userId_materiId: {
          userId: session.user.id,
          materiId: materiId
        }
      },
      update: {
        score,
        isPassed
      },
      create: {
        userId: session.user.id,
        materiId: materiId,
        score,
        isPassed
      }
    });

    // Update materi completion if assessment passed
    if (isPassed) {
      await prisma.userMateriCompletion.upsert({
        where: {
          userId_materiId: {
            userId: session.user.id,
            materiId: materiId
          }
        },
        update: {
          assessmentPassed: true
        },
        create: {
          userId: session.user.id,
          materiId: materiId,
          isCompleted: false,
          assessmentPassed: true
        }
      });
    }

    // Check if next materi should be unlocked
    const nextMateri = await prisma.materi.findFirst({
      where: {
        kelasId: materi.kelasId,
        order: materi.order + 1
      }
    });

    let nextMateriUnlocked = false;
    if (nextMateri && isPassed) {
      // Check if current materi is fully completed
      const currentCompletion = await prisma.userMateriCompletion.findUnique({
        where: {
          userId_materiId: {
            userId: session.user.id,
            materiId: materiId
          }
        }
      });

      if (currentCompletion?.isCompleted) {
        nextMateriUnlocked = true;
      }
    }

    // Trigger gamification events
    const gamificationResults: any = {};

    // Trigger COMPLETE_ASSESSMENT event
    const assessmentGamificationResult = await GamificationService.triggerEvent(
      session.user.id,
      'COMPLETE_ASSESSMENT',
      {
        materiId: materi.id,
        materiTitle: materi.title,
        kelasId: materi.kelasId,
        score,
        isPassed
      }
    );

    if (assessmentGamificationResult.success) {
      gamificationResults.assessment = assessmentGamificationResult.data;
    }

    // Trigger PERFECT_SCORE event if user got 100%
    if (isPerfectScore) {
      const perfectScoreResult = await GamificationService.triggerEvent(
        session.user.id,
        'PERFECT_SCORE',
        {
          materiId: materi.id,
          materiTitle: materi.title,
          kelasId: materi.kelasId,
          score: 100,
          totalQuestions
        }
      );

      if (perfectScoreResult.success) {
        gamificationResults.perfectScore = perfectScoreResult.data;
      }
    }

    const result = {
      score,
      isPassed,
      correctAnswers,
      totalQuestions,
      passingScore,
      nextMateriUnlocked: nextMateriUnlocked ? nextMateri?.id : null,
      assessment: assessmentResult,
      gamification: Object.keys(gamificationResults).length > 0 ? gamificationResults : undefined
    };

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    // Always release the lock if session exists
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user?.id) {
      processingLocks.delete(session.user.id);
    }
  }
}

// Helper function to check if user can access materi
async function canAccessMateri(userId: string, materi: any): Promise<boolean> {
  // First materi is always accessible
  if (materi.order === 1) {
    return true;
  }

  // Get previous materi
  const previousMateri = await prisma.materi.findFirst({
    where: {
      kelasId: materi.kelasId,
      order: materi.order - 1
    },
    include: {
      completions: {
        where: {
          userId
        }
      }
    }
  });

  if (!previousMateri) {
    return false;
  }

  const previousCompletion = previousMateri.completions[0];
  if (!previousCompletion?.isCompleted) {
    return false;
  }

  // If previous materi has assessment, check if user passed it
  if (previousMateri.passingScore && !previousCompletion.assessmentPassed) {
    return false;
  }

  return true;
}
