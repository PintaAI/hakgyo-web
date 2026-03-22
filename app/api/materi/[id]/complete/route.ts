import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GamificationService } from '@/lib/gamification/service';

// Simple in-memory lock for preventing race conditions
const processingLocks = new Map<string, { timestamp: number }>();
const LOCK_TIMEOUT = 30000; // 30 seconds timeout

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

    // Get materi details
    const materi = await prisma.materi.findUnique({
      where: { id: materiId },
      select: {
        id: true,
        title: true,
        order: true,
        kelasId: true,
        passingScore: true,
        isDemo: true
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

    // Materials with assessments should not be manually marked complete
    if (materi.passingScore !== null && materi.passingScore !== undefined) {
      return NextResponse.json({ 
        error: 'This material requires completing an assessment. Please take the assessment to mark it complete.' 
      }, { status: 400 });
    }

    // Mark material as complete
    const completion = await prisma.userMateriCompletion.upsert({
      where: {
        userId_materiId: {
          userId: session.user.id,
          materiId: materiId
        }
      },
      update: {
        isCompleted: true
      },
      create: {
        userId: session.user.id,
        materiId: materiId,
        isCompleted: true,
        assessmentPassed: false
      }
    });

    // Trigger gamification event for completing materi
    const gamificationResult = await GamificationService.triggerEvent(
      session.user.id,
      'COMPLETE_MATERI',
      {
        metadata: {
          materiId: materi.id,
          materiTitle: materi.title,
          kelasId: materi.kelasId
        }
      }
    );

    // Check if next materi should be unlocked
    const nextMateri = await prisma.materi.findFirst({
      where: {
        kelasId: materi.kelasId,
        order: materi.order + 1,
        isDraft: false
      },
      select: {
        id: true,
        title: true,
        order: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        completion,
        materiId: materi.id,
        materiTitle: materi.title,
        nextMateri: nextMateri ? {
          id: nextMateri.id,
          title: nextMateri.title,
          order: nextMateri.order
        } : null,
        gamification: gamificationResult.success ? gamificationResult.data : undefined
      }
    });
  } catch (error) {
    console.error('Error marking materi as complete:', error);
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
  // Demo materials are always accessible
  if (materi.isDemo) {
    return true;
  }

  // Check if user is a member of the kelas
  const membership = await prisma.kelas.findFirst({
    where: {
      id: materi.kelasId,
      members: {
        some: {
          id: userId
        }
      }
    }
  });

  if (!membership) {
    return false;
  }

  // First materi is always accessible
  if (materi.order === 1) {
    return true;
  }

  // Get previous materi
  const previousMateri = await prisma.materi.findFirst({
    where: {
      kelasId: materi.kelasId,
      order: materi.order - 1,
      isDraft: false
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
  
  // Check if previous material is fully completed
  if (previousMateri.passingScore !== null && previousMateri.passingScore !== undefined) {
    // Previous material has assessment - check if user passed it
    return previousCompletion?.assessmentPassed === true;
  } else {
    // Previous material has no assessment - check content completion
    return previousCompletion?.isCompleted === true;
  }
}
