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

    const resolvedParams = await params;
    const kelasId = parseInt(resolvedParams.id);
    if (isNaN(kelasId)) {
      return NextResponse.json({ error: 'Invalid kelas ID' }, { status: 400 });
    }

    // Check if user is member of kelas
    const kelasMembership = await prisma.kelas.findFirst({
      where: {
        id: kelasId,
        members: {
          some: {
            id: session.user.id
          }
        }
      }
    });

    if (!kelasMembership) {
      return NextResponse.json({ error: 'Not a member of this kelas' }, { status: 403 });
    }

    // Get all materis in kelas with user progress
    const materis = await prisma.materi.findMany({
      where: {
        kelasId: kelasId,
        isDraft: false
      },
      include: {
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
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Process materis to determine access and completion status
    const processedMateris = [];
    let completedCount = 0;
    const totalCount = materis.length;

    // console.log('\n=== PROCESSING MATERIS ===');
    // console.log('Total materis:', materis.length);
    
    for (let i = 0; i < materis.length; i++) {
      const materi = materis[i];
      const completion = materi.completions[0];
      const assessment = materi.assessments[0];
      
      // console.log(`\n--- Processing Material ${materi.order} (ID: ${materi.id}) ---`);
      // console.log('Title:', materi.title);
      // console.log('Has passingScore:', !!materi.passingScore, 'Value:', materi.passingScore);
      // console.log('Completion record exists:', !!completion);
      // if (completion) {
      //   console.log('Completion details:', {
      //     isCompleted: completion.isCompleted,
      //     assessmentPassed: completion.assessmentPassed,
      //     userId: completion.userId,
      //     materiId: completion.materiId
      //   });
      // }
      
      // Determine if materi is accessible
      let isAccessible = false;
      
      if (i === 0) {
        // First materi is always accessible
        isAccessible = true;
        // console.log(`[Material ${materi.order}] First material - always accessible`);
      } else {
        // Check if previous materi is fully completed
        const previousMateri = materis[i - 1];
        const previousCompletion = previousMateri?.completions[0];
        
        // console.log(`\n  >> Checking if Material ${materi.order} should be accessible:`);
        // console.log('  >> Previous Material:', {
        //   order: previousMateri.order,
        //   id: previousMateri.id,
        //   title: previousMateri.title,
        //   hasAssessment: !!previousMateri.passingScore,
        //   passingScore: previousMateri.passingScore
        // });
        // console.log('  >> Previous Completion Record:', previousCompletion ? {
        //   exists: true,
        //   isCompleted: previousCompletion.isCompleted,
        //   assessmentPassed: previousCompletion.assessmentPassed,
        //   materiId: previousCompletion.materiId,
        //   userId: previousCompletion.userId
        // } : { exists: false });
        
        // Determine if previous material is fully completed
        let previousIsFullyCompleted = false;
        
        if (previousMateri.passingScore) {
          // Previous material has assessment - check if user passed it
          const hasPassed = previousCompletion?.assessmentPassed === true;
          previousIsFullyCompleted = hasPassed;
          // console.log(`  >> Previous HAS assessment (passingScore: ${previousMateri.passingScore})`);
          // console.log(`  >> assessmentPassed value:`, previousCompletion?.assessmentPassed, `(type: ${typeof previousCompletion?.assessmentPassed})`);
          // console.log(`  >> Previous is fully completed:`, previousIsFullyCompleted);
        } else {
          // Previous material has no assessment - check content completion
          const isContentComplete = previousCompletion?.isCompleted === true;
          previousIsFullyCompleted = isContentComplete;
          // console.log(`  >> Previous NO assessment`);
          // console.log(`  >> isCompleted value:`, previousCompletion?.isCompleted, `(type: ${typeof previousCompletion?.isCompleted})`);
          // console.log(`  >> Previous is fully completed:`, previousIsFullyCompleted);
        }
        
        if (previousIsFullyCompleted) {
          isAccessible = true;
          // console.log(`  >> ✓ Setting Material ${materi.order} accessible to TRUE`);
        } else {
          isAccessible = false;
          // console.log(`  >> ✗ Setting Material ${materi.order} accessible to FALSE - previous not fully completed`);
        }
      }
      
      // Determine completion status
      let isCompleted = false;
      let isFullyCompleted = false;
      
      if (materi.passingScore) {
        // Assessment required - check if user passed the assessment
        if (completion?.assessmentPassed) {
          isCompleted = true;
          isFullyCompleted = true;
        }
      } else {
        // No assessment required - check content completion
        if (completion?.isCompleted) {
          isCompleted = true;
          isFullyCompleted = true;
        }
      }
      
      if (isFullyCompleted) {
        completedCount++;
      }
      
      processedMateris.push({
        id: materi.id,
        title: materi.title,
        order: materi.order,
        isAccessible,
        isCompleted,
        isFullyCompleted,
        hasAssessment: !!materi.passingScore,
        assessmentPassed: completion?.assessmentPassed || false,
        score: assessment?.score || null,
        canRetake: !!materi.passingScore
      });
    }
    
    // console.log('\n=== FINAL PROCESSED MATERIS ===');
    // processedMateris.forEach(m => {
    //   console.log(`Material ${m.order}: isAccessible=${m.isAccessible}, isCompleted=${m.isCompleted}, isFullyCompleted=${m.isFullyCompleted}`);
    // });

    const overallProgress = {
      completedCount,
      totalCount,
      completionPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        materis: processedMateris,
        overallProgress
      }
    });
  } catch (error) {
    console.error('Error getting kelas progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
