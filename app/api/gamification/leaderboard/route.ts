import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { UserRoles } from '@/app/generated/prisma/client'

// GET /api/gamification/leaderboard - Get leaderboard rankings
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const scope = searchParams.get('scope') as 'weekly' | 'monthly' | 'alltime' || 'alltime'
    const role = searchParams.get('role') as 'MURID' | 'GURU' | null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    // Validate scope parameter
    const validScopes = ['weekly', 'monthly', 'alltime']
    if (!validScopes.includes(scope)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scope parameter' },
        { status: 400 }
      )
    }

    // Validate role parameter if provided
    if (role && !Object.values(UserRoles).includes(role as UserRoles)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role parameter' },
        { status: 400 }
      )
    }

    // Calculate date range based on scope
    let dateFilter: { [key: string]: Date } | undefined
    if (scope === 'weekly') {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      dateFilter = { gte: oneWeekAgo }
    } else if (scope === 'monthly') {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      dateFilter = { gte: oneMonthAgo }
    }

    // Build the where clause for role filtering
    const whereClause: any = {}
    if (role) {
      whereClause.role = role
    }

    // Get the top N users based on the specified criteria
    const topUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        xp: true,
        level: true,
        currentStreak: true,
        lastActive: true,
        createdAt: true,
        // Include XP earned in the time period if scope is not alltime
        ...(scope !== 'alltime' && {
          activityLogs: {
            where: {
              createdAt: dateFilter,
              xpEarned: { not: null }
            },
            select: {
              xpEarned: true
            }
          }
        })
      },
      orderBy: [
        // For time-based scopes, we need to calculate the XP earned in that period
        scope === 'alltime' 
          ? { xp: 'desc' } 
          : { level: 'desc' }, // Fallback ordering
        { level: 'desc' },
        { currentStreak: 'desc' },
        { lastActive: 'desc' }
      ],
      take: limit
    })

    // Calculate time-based XP for non-alltime scopes
    let processedTopUsers = topUsers
    if (scope !== 'alltime') {
      processedTopUsers = topUsers.map(user => {
        const periodXP = user.activityLogs?.reduce((sum, log) => sum + (log.xpEarned || 0), 0) || 0
        return {
          ...user,
          periodXP
        }
      }).sort((a, b) => (b as any).periodXP - (a as any).periodXP) as any
    }

    // Get current user's data and position
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        xp: true,
        level: true,
        currentStreak: true,
        lastActive: true,
        createdAt: true,
        ...(scope !== 'alltime' && {
          activityLogs: {
            where: {
              createdAt: dateFilter,
              xpEarned: { not: null }
            },
            select: {
              xpEarned: true
            }
          }
        })
      }
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate current user's time-based XP if needed
    let currentUserPeriodXP = 0
    if (scope !== 'alltime') {
      currentUserPeriodXP = currentUser.activityLogs?.reduce((sum, log) => sum + (log.xpEarned || 0), 0) || 0
    }

    // Get current user's position in the overall ranking
    const userRankingQuery = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        xp: true,
        level: true,
        currentStreak: true,
        lastActive: true,
        ...(scope !== 'alltime' && {
          activityLogs: {
            where: {
              createdAt: dateFilter,
              xpEarned: { not: null }
            },
            select: {
              xpEarned: true
            }
          }
        })
      },
      orderBy: [
        scope === 'alltime' 
          ? { xp: 'desc' } 
          : { level: 'desc' },
        { level: 'desc' },
        { currentStreak: 'desc' },
        { lastActive: 'desc' }
      ]
    })

    // Process ranking data to find current user's position
    let userPosition = 0
    if (scope === 'alltime') {
      userPosition = userRankingQuery.findIndex(user => user.id === session.user.id) + 1
    } else {
      // For time-based scopes, calculate period XP and find position
      const usersWithPeriodXP = userRankingQuery.map(user => {
        const periodXP = user.activityLogs?.reduce((sum, log) => sum + (log.xpEarned || 0), 0) || 0
        return {
          id: user.id,
          periodXP
        }
      }).sort((a, b) => b.periodXP - a.periodXP)
      
      userPosition = usersWithPeriodXP.findIndex(user => user.id === session.user.id) + 1
    }

    // Format the response
    const leaderboardData = processedTopUsers.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role
      },
      stats: {
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        lastActive: user.lastActive,
        ...(scope !== 'alltime' && { periodXP: (user as any).periodXP })
      }
    }))

    // Format current user data
    const currentUserData = {
      rank: userPosition,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image,
        role: currentUser.role
      },
      stats: {
        xp: currentUser.xp,
        level: currentUser.level,
        currentStreak: currentUser.currentStreak,
        lastActive: currentUser.lastActive,
        ...(scope !== 'alltime' && { periodXP: currentUserPeriodXP })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: leaderboardData,
        currentUser: currentUserData,
        meta: {
          scope,
          role: role || 'all',
          totalInTop: leaderboardData.length,
          userPosition,
          isInTop: userPosition <= limit
        }
      }
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    )
  }
}
