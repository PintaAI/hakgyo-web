import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { isValidEvent } from '@/lib/gamification/eventRegistry'
import { GamificationService, TriggerEventOptions } from '@/lib/gamification/service'
import { DEFAULT_GRACE_PERIOD_HOURS } from '@/lib/gamification/streak'

// Simple in-memory lock for preventing race conditions
const processingLocks = new Map<string, { timestamp: number }>();

const LOCK_TIMEOUT = 30000; // 30 seconds timeout

/**
 * POST /api/gamification/events - Process gamified user actions
 * 
 * Request body:
 * - event: The game event to trigger (e.g., 'DAILY_LOGIN', 'COMPLETE_MATERI')
 * - metadata: Optional metadata to store with the activity log
 * - userTimeZone: Optional user timezone for calendar-day streak calculation (e.g., 'Asia/Jakarta')
 * - gracePeriodHours: Optional grace period in hours after midnight (default: 4)
 * 
 * Response:
 * - success: boolean
 * - data: GamificationResult with XP, streak, and level information
 * - error: string if failed
 */
export async function POST(request: NextRequest) {
  let session: any;
  
  try {
    // Get authenticated session
    session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check for existing lock to prevent race conditions
    const existingLock = processingLocks.get(session.user.id);
    const now = Date.now();
    
    if (existingLock && (now - existingLock.timestamp) < LOCK_TIMEOUT) {
      return NextResponse.json(
        { success: false, error: 'Request already in progress' },
        { status: 429 }
      )
    }

    // Set lock
    processingLocks.set(session.user.id, { timestamp: now });

    // Parse request body
    const body = await request.json()
    const { 
      event, 
      metadata,
      userTimeZone,
      gracePeriodHours 
    } = body

    // Validate event type
    if (!event || !isValidEvent(event)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing event type' },
        { status: 400 }
      )
    }

    // Prepare options
    const options: TriggerEventOptions = {
      metadata,
      userTimeZone,
      gracePeriodHours: gracePeriodHours ?? DEFAULT_GRACE_PERIOD_HOURS,
    };

    // Use GamificationService to process the event
    const result = await GamificationService.triggerEvent(
      session.user.id,
      event,
      options
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to process gamification event' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing gamification event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process gamification event' },
      { status: 500 }
    )
  } finally {
    // Always release the lock if userId exists
    if (session?.user?.id) {
      processingLocks.delete(session.user.id);
    }
  }
}

/**
 * GET /api/gamification/events - Get user's current streak status
 * 
 * Query parameters:
 * - userTimeZone: Optional user timezone for calendar-day streak calculation
 * 
 * Response:
 * - success: boolean
 * - data: Streak status information
 */
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

    // Get timezone from query params
    const { searchParams } = new URL(request.url)
    const userTimeZone = searchParams.get('userTimeZone') || undefined

    // Get streak status
    const streakStatus = await GamificationService.getStreakStatus(
      session.user.id,
      userTimeZone
    )

    if (!streakStatus) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: streakStatus
    })
  } catch (error) {
    console.error('Error getting streak status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get streak status' },
      { status: 500 }
    )
  }
}
