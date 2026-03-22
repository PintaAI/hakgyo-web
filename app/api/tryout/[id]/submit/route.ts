import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { GamificationService } from '@/lib/gamification/service';

// Simple in-memory lock for preventing race conditions
const processingLocks = new Map<string, { timestamp: number }>();
const LOCK_TIMEOUT = 30000; // 30 seconds timeout

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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

        const tryoutId = parseInt(id);
        if (isNaN(tryoutId)) {
            return NextResponse.json({ success: false, error: 'Invalid tryout id' }, { status: 400 });
        }

        const body = await request.json();
        const { answers } = body; // Array of { soalId, opsiId }

        if (!Array.isArray(answers)) {
            return NextResponse.json({ success: false, error: 'Invalid answers format' }, { status: 400 });
        }

        // 1. Fetch Tryout with time constraints and Questions
        const tryout = await prisma.tryout.findUnique({
            where: { id: tryoutId },
            select: {
                id: true,
                nama: true,
                startTime: true,
                endTime: true,
                duration: true,
                koleksiSoal: {
                    include: {
                        soals: {
                            include: {
                                opsis: true,
                            }
                        }
                    }
                }
            }
        });

        if (!tryout) {
            return NextResponse.json({ success: false, error: 'Tryout not found' }, { status: 404 });
        }

        // 2. Validate time constraints
        const currentDateTime = new Date();
        if (currentDateTime < tryout.startTime) {
            return NextResponse.json({ success: false, error: 'Tryout has not started yet' }, { status: 400 });
        }

        if (currentDateTime > tryout.endTime) {
            return NextResponse.json({ success: false, error: 'Tryout has ended' }, { status: 400 });
        }

        // Check participant started time for duration validation
        const participant = await prisma.tryoutParticipant.findUnique({
            where: {
                tryoutId_userId: {
                    tryoutId,
                    userId: session.user.id,
                }
            }
        });

        if (!participant) {
            return NextResponse.json({ success: false, error: 'Participant not found. Please join the tryout first.' }, { status: 404 });
        }

        if (participant.startedAt) {
            const timeTakenSeconds = Math.floor((currentDateTime.getTime() - participant.startedAt.getTime()) / 1000);
            const maxTimeSeconds = tryout.duration * 60;

            if (timeTakenSeconds > maxTimeSeconds) {
                return NextResponse.json({ success: false, error: 'Time limit exceeded' }, { status: 400 });
            }
        }

        // 3. Calculate Score and Prepare Answer Data
        let correctCount = 0;
        const totalQuestions = tryout.koleksiSoal.soals.length;

        // Create a map for fast lookup of correct option per question
        const correctOptionsMap = new Map<number, number>(); // soalId -> correctOpsiId

        tryout.koleksiSoal.soals.forEach(soal => {
            const correctOpsi = soal.opsis.find(o => o.isCorrect);
            if (correctOpsi) {
                correctOptionsMap.set(soal.id, correctOpsi.id);
            }
        });

        // Prepare answer records for storage
        const answerRecords = answers.map((ans: any) => {
            const correctId = correctOptionsMap.get(ans.soalId);
            const isCorrect = correctId ? ans.opsiId === correctId : false;
            if (isCorrect) {
                correctCount++;
            }
            return {
                soalId: ans.soalId,
                opsiId: ans.opsiId,
                isCorrect,
            };
        });

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const isPerfectScore = score === 100;

        // Calculate time taken
        const timeTakenSeconds = participant.startedAt
            ? Math.floor((currentDateTime.getTime() - participant.startedAt.getTime()) / 1000)
            : null;

        // 4. Update Participant Record and Store Answers
        const updatedParticipant = await prisma.tryoutParticipant.update({
            where: {
                tryoutId_userId: {
                    tryoutId,
                    userId: session.user.id,
                }
            },
            data: {
                status: 'SUBMITTED',
                score,
                submittedAt: currentDateTime,
                timeTakenSeconds,
            },
        });

        // Store individual answers
        await prisma.tryoutAnswer.createMany({
            data: answerRecords.map(record => ({
                participantId: updatedParticipant.id,
                ...record,
            })),
            skipDuplicates: true,
        });

        // 5. Trigger gamification events
        const gamificationResults: any = {};

        // Trigger COMPLETE_SOAL event for completing the quiz
        const quizResult = await GamificationService.triggerEvent(
            session.user.id,
            'COMPLETE_SOAL',
            {
                metadata: {
                    tryoutId: tryout.id,
                    tryoutTitle: tryout.nama,
                    score,
                    correctCount,
                    totalQuestions
                }
            }
        );

        if (quizResult.success) {
            gamificationResults.quiz = quizResult.data;
        }

        // Trigger PERFECT_SCORE event if user got 100%
        if (isPerfectScore) {
            const perfectScoreResult = await GamificationService.triggerEvent(
                session.user.id,
                'PERFECT_SCORE',
                {
                    metadata: {
                        tryoutId: tryout.id,
                        tryoutTitle: tryout.nama,
                        score: 100,
                        totalQuestions
                    }
                }
            );

            if (perfectScoreResult.success) {
                gamificationResults.perfectScore = perfectScoreResult.data;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                score,
                correctCount,
                totalQuestions,
                participant: updatedParticipant,
                timeTakenSeconds,
                gamification: Object.keys(gamificationResults).length > 0 ? gamificationResults : undefined,
            },
        });

    } catch (error) {
        console.error('Error submitting tryout:', error);
        // If update fails (record not found), user might not have participated yet?
        // Should we auto-create? Better to error out or handle gracefully.
        return NextResponse.json(
            { success: false, error: 'Failed to submit tryout' },
            { status: 500 }
        );
    } finally {
        // Always release the lock if session exists
        const session = await auth.api.getSession({ headers: request.headers });
        if (session?.user?.id) {
            processingLocks.delete(session.user.id);
        }
    }
}
