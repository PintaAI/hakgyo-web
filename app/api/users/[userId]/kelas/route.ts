import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getJoinedKelasList } from '@/app/actions/kelas/public'

// GET /api/users/[userId]/kelas - Get classes joined by a user
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params;
  try {
    // Get authenticated session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as any
    const level = searchParams.get('level') as any
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const userId = params.userId

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Users can only view their own joined classes unless they're admin/guru
    const currentUserId = session.user.id
    const currentUserRole = session.user.role

    if (userId !== currentUserId && currentUserRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Use the existing server action
    const result = await getJoinedKelasList(userId, {
      type,
      level,
      limit,
      offset
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.meta.total,
          page: Math.floor(result.meta.offset / (result.meta.limit || 12)) + 1,
          limit: result.meta.limit || 12,
          totalPages: Math.ceil(result.meta.total / (result.meta.limit || 12))
        }
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get joined kelas error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch joined classes' },
      { status: 500 }
    )
  }
}
