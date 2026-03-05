import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        // Filters
        const searchParams = request.nextUrl.searchParams;
        const guruId = searchParams.get('guruId');
        const koleksiSoalId = searchParams.get('koleksiSoalId');
        const kelasId = searchParams.get('kelasId');
        const isActive = searchParams.get('isActive');
        const userjoinedkelas = searchParams.get('userjoinedkelas') === 'true';
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

        const where: any = {};
        if (guruId) where.guruId = guruId;
        if (koleksiSoalId) where.koleksiSoalId = parseInt(koleksiSoalId);
        if (kelasId) where.kelasId = parseInt(kelasId);
        if (isActive !== null) where.isActive = isActive === 'true';

        // Filter by user's joined kelas when userjoinedkelas=true
        if (userjoinedkelas) {
            if (!session?.user?.id) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }

            // Get user's joined kelas
            const userKelas = await prisma.kelas.findMany({
                where: {
                    members: {
                        some: { id: session.user.id }
                    }
                },
                select: { id: true }
            });

            // Filter tryouts by user's kelas
            where.kelasId = {
                in: userKelas.map(k => k.id)
            };
            // Ensure only active tryouts are returned
            where.isActive = true;
        }

        // List tryouts
        const tryouts = await prisma.tryout.findMany({
            where,
            include: {
                guru: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                kelas: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                koleksiSoal: {
                    select: {
                        id: true,
                        nama: true,
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            data: tryouts,
        });
    } catch (error) {
        console.error('Error fetching tryouts:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tryouts' },
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
            nama,
            description,
            startTime,
            endTime,
            duration,
            maxAttempts,
            shuffleQuestions,
            passingScore,
            koleksiSoalId,
            kelasId,
            isActive = false,
        } = body;

        if (!nama || !startTime || !endTime || !koleksiSoalId) {
            return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
        }

        // Verify User Role (Must be GURU or ADMIN usually, but sticking to basic check)
        // Assuming any auth user can create for now, OR check if user is author of koleksiSoal
        // Let's enforce that the user creating the tryout must own the koleksiSoal OR be a teacher.
        // For simplicity, checking if user owns koleksiSoal.

        const koleksi = await prisma.koleksiSoal.findUnique({
            where: { id: parseInt(koleksiSoalId) }
        });

        if (!koleksi) {
            return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
        }

        // Strict: You can only create a tryout using your own questions
        if (koleksi.userId !== session.user.id) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // If kelasId is provided, verify user is the author of the kelas
        if (kelasId) {
            const kelas = await prisma.kelas.findUnique({
                where: { id: parseInt(kelasId) }
            });

            if (!kelas) {
                return NextResponse.json({ success: false, error: 'Kelas not found' }, { status: 404 });
            }

            if (kelas.authorId !== session.user.id) {
                return NextResponse.json({
                    success: false,
                    error: 'You must be the author of this kelas to link it'
                }, { status: 403 });
            }
        }

        const tryout = await prisma.tryout.create({
            data: {
                nama,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration: duration ? parseInt(duration) : 30,
                maxAttempts: maxAttempts ? parseInt(maxAttempts) : 1,
                shuffleQuestions: shuffleQuestions ?? false,
                passingScore: passingScore ? parseInt(passingScore) : 60,
                koleksiSoalId: parseInt(koleksiSoalId),
                isActive,
                guruId: session.user.id,
                kelasId: kelasId ? parseInt(kelasId) : null,
            },
        });

        return NextResponse.json({
            success: true,
            data: tryout,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating tryout:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create tryout' },
            { status: 500 }
        );
    }
}
