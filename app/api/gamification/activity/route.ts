import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { ActivityType } from '@prisma/client'
import { getHoursUntilReset, getHoursUntilNewStreak } from '@/lib/gamification/streak'

// GET /api/gamification/activity - Get user's activity history
export async function GET(request: NextRequest) {
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
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const type = searchParams.get('type') as ActivityType | null
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { success: false, error: 'Page must be greater than 0' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Validate activity type if provided
    if (type && !Object.values(ActivityType).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid activity type' },
        { status: 400 }
      )
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id
    }

    if (type) {
      where.type = type
    }

    // Add date range filtering if provided
    if (from || to) {
      where.createdAt = {}
      if (from) {
        const fromDate = new Date(from)
        if (isNaN(fromDate.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid from date format' },
            { status: 400 }
          )
        }
        where.createdAt.gte = fromDate
      }
      if (to) {
        const toDate = new Date(to)
        if (isNaN(toDate.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid to date format' },
            { status: 400 }
          )
        }
        where.createdAt.lte = toDate
      }
    }

    // Get total count for pagination
    const total = await prisma.activityLog.count({
      where
    })

    // Fetch activity logs
    const activities = await prisma.activityLog.findMany({
      where,
      select: {
        id: true,
        type: true,
        description: true,
        xpEarned: true,
        streakUpdated: true,
        previousStreak: true,
        newStreak: true,
        previousLevel: true,
        newLevel: true,
        metadata: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Format activities for mobile response
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      xp: activity.xpEarned || 0,
      date: activity.createdAt.toISOString(),
      description: activity.description || '',
      streakUpdated: activity.streakUpdated,
      previousStreak: activity.previousStreak,
      newStreak: activity.newStreak,
      previousLevel: activity.previousLevel,
      newLevel: activity.newLevel,
      metadata: activity.metadata
    }))

    // Get user's last active date for streak calculations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastActive: true, currentStreak: true }
    })

    // Calculate hours until reset and new streak
    const hoursUntilReset = getHoursUntilReset(user?.lastActive || null)
    const hoursUntilNewStreak = getHoursUntilNewStreak(user?.lastActive || null)

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: formattedActivities,
      streakInfo: {
        hoursUntilReset,
        hoursUntilNewStreak,
        currentStreak: user?.currentStreak || 0,
        lastActive: user?.lastActive?.toISOString() || null
      },
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching activity history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity history' },
      { status: 500 }
    )
  }
}
