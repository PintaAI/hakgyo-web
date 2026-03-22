/**
 * GamificationService
 * Centralized service for handling all gamification operations
 * 
 * REFACTORED: Now uses calendar-day-based streak logic with:
 * - Timezone support for accurate day calculation
 * - Grace period support for users who barely missed a day
 * - Migration logic for existing users
 */

import { prisma } from '@/lib/db';
import { ActivityType } from '@/lib/enums';
import { GameEvent, getEventXP } from './eventRegistry';
import { processReward, UserGameData, RewardOptions } from './reward';
import {
  StreakData,
  getHoursUntilReset,
  getHoursUntilNewStreak,
  migrateLastActiveDate,
  getEffectiveTodayYMD,
  DEFAULT_GRACE_PERIOD_HOURS
} from './streak';

export interface GamificationResult {
  success: boolean;
  data?: {
    event: GameEvent;
    baseXP: number;
    streakBonus: number;
    totalXP: number;
    previousLevel: number;
    newLevel: number;
    levelsGained: number;
    currentStreak: number;
    streakMilestoneReached: boolean;
    levelProgress: {
      currentLevel: number;
      currentXP: number;
      xpForCurrentLevel: number;
      xpForNextLevel: number;
      xpProgress: number;
      xpRemaining: number;
    };
    streakInfo: {
      hoursUntilReset: number;
      hoursUntilNewStreak: number;
      lastActive: Date | null;
      lastActiveDate: string | null;
    };
    activityId?: string;
  };
  error?: string;
}

export interface TriggerEventOptions {
  userTimeZone?: string;
  gracePeriodHours?: number;
  metadata?: Record<string, any>;
}

/**
 * GamificationService - Centralized service for all gamification operations
 */
export class GamificationService {
  /**
   * Main entry point for all gamification operations
   * @param userId - The user ID to trigger the event for
   * @param event - The game event to trigger
   * @param options - Optional configuration (timezone, grace period, metadata)
   * @returns GamificationResult with the operation result
   */
  static async triggerEvent(
    userId: string,
    event: GameEvent,
    options?: TriggerEventOptions
  ): Promise<GamificationResult> {
    try {
      const userTimeZone = options?.userTimeZone;
      const gracePeriodHours = options?.gracePeriodHours ?? DEFAULT_GRACE_PERIOD_HOURS;
      const metadata = options?.metadata;

      console.log('🎮 [GAMIFICATION] ========== triggerEvent called ==========');
      console.log('🎮 [GAMIFICATION] Event:', event);
      console.log('🎮 [GAMIFICATION] User ID:', userId);
      console.log('🎮 [GAMIFICATION] Options:', { userTimeZone, gracePeriodHours, metadata });

      // Get current user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          lastActive: true,
          lastActiveDate: true,
        },
      });

      if (!user) {
        console.log('❌ [GAMIFICATION] User not found');
        return {
          success: false,
          error: 'User not found',
        };
      }

      console.log('👤 [GAMIFICATION] User data from DB:', {
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActive: user.lastActive,
        lastActiveDate: user.lastActiveDate
      });

      // Migration: Initialize lastActiveDate from lastActive if missing
      let lastActiveDateString = user.lastActiveDate;
      if (!lastActiveDateString && user.lastActive) {
        console.log('🔄 [GAMIFICATION] Migrating lastActive to lastActiveDate...');
        lastActiveDateString = migrateLastActiveDate(user.lastActive, userTimeZone);
        console.log('🔄 [GAMIFICATION] Migrated lastActiveDate:', lastActiveDateString);
        
        // Update the user record with the migrated date (non-blocking)
        if (lastActiveDateString) {
          await prisma.user.update({
            where: { id: userId },
            data: { lastActiveDate: lastActiveDateString },
          });
        }
      }

      // Get current streak history
      const currentStreakHistory = await prisma.streakHistory.findMany({
        where: { userId },
        orderBy: { streakDate: 'desc' },
        take: 1,
      });

      // Prepare user game data for reward processing
      const streakData: StreakData = {
        currentStreak: user.currentStreak,
        lastActiveDate: user.lastActive,
        lastActiveDateString: lastActiveDateString,
        longestStreak: user.longestStreak || user.currentStreak,
        streakHistory: currentStreakHistory.map((h) => h.streakDate),
      };

      console.log('📊 [GAMIFICATION] Prepared streakData:', {
        currentStreak: streakData.currentStreak,
        lastActiveDateString: streakData.lastActiveDateString,
        longestStreak: streakData.longestStreak
      });

      const userData: UserGameData = {
        totalXP: user.xp,
        streakData,
      };

      // Prepare reward options
      const rewardOptions: RewardOptions = {
        userTimeZone,
        gracePeriodHours,
      };

      console.log('🎁 [GAMIFICATION] Calling processReward...');
      // Process the reward
      const rewardResult = processReward(event, userData, rewardOptions);
      console.log('🎁 [GAMIFICATION] Reward result:', {
        event: rewardResult.event,
        baseXP: rewardResult.baseXP,
        streakBonus: rewardResult.streakBonus,
        totalXP: rewardResult.totalXP,
        currentStreak: rewardResult.streakData.currentStreak,
        streakMilestoneReached: rewardResult.streakMilestoneReached
      });

      // Calculate streak reset information
      const hoursUntilReset = getHoursUntilReset(
        lastActiveDateString,
        userTimeZone,
        gracePeriodHours
      );
      const hoursUntilNewStreak = getHoursUntilNewStreak(
        lastActiveDateString,
        userTimeZone,
        gracePeriodHours
      );

      // Get the base XP for the event
      const baseXP = getEventXP(event);

      // Get the effective today date for the new lastActiveDate
      const effectiveToday = getEffectiveTodayYMD(userTimeZone, gracePeriodHours);

      // Update database in transaction
      const result = await this._updateUserGamification(
        userId,
        event,
        baseXP,
        rewardResult,
        user,
        currentStreakHistory,
        effectiveToday,
        metadata
      );

      return {
        success: true,
        data: {
          event,
          baseXP,
          streakBonus: rewardResult.streakBonus,
          totalXP: rewardResult.totalXP,
          previousLevel: rewardResult.previousLevel,
          newLevel: rewardResult.newLevel,
          levelsGained: rewardResult.levelsGained,
          currentStreak: rewardResult.streakData.currentStreak,
          streakMilestoneReached: rewardResult.streakMilestoneReached,
          streakInfo: {
            hoursUntilReset,
            hoursUntilNewStreak,
            lastActive: user.lastActive,
            lastActiveDate: lastActiveDateString,
          },
          levelProgress: {
            currentLevel: rewardResult.levelProgress.currentLevel,
            currentXP: rewardResult.levelProgress.currentXP,
            xpForCurrentLevel: rewardResult.levelProgress.xpForCurrentLevel,
            xpForNextLevel: rewardResult.levelProgress.xpForNextLevel,
            xpProgress: rewardResult.levelProgress.xpProgress,
            xpRemaining: rewardResult.levelProgress.xpRemaining,
          },
          activityId: result.activityLogId,
        },
      };
    } catch (error) {
      console.error('Error in GamificationService.triggerEvent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process gamification event',
      };
    }
  }

  /**
   * Private method to handle all database updates in a transaction
   */
  private static async _updateUserGamification(
    userId: string,
    event: GameEvent,
    baseXP: number,
    rewardResult: any,
    user: any,
    currentStreakHistory: any[],
    effectiveToday: string,
    metadata?: Record<string, any>
  ): Promise<{ activityLogId: string }> {
    return await prisma.$transaction(async (tx) => {
      // Check for streak milestone and award bonus if reached
      if (rewardResult.streakMilestoneReached) {
        const milestoneXP = rewardResult.streakData.currentStreak * 10; // 10 XP per streak day

        await tx.activityLog.create({
          data: {
            userId,
            type: ActivityType.OTHER,
            description: `Streak milestone: ${rewardResult.streakData.currentStreak} days`,
            xpEarned: milestoneXP,
            metadata: {
              type: 'STREAK_MILESTONE',
              streak: rewardResult.streakData.currentStreak,
            },
          },
        });
      }

      // Update user's XP, level, and streak
      await tx.user.update({
        where: { id: userId },
        data: {
          xp: rewardResult.levelProgress.totalXP + (rewardResult.streakMilestoneReached ? rewardResult.streakData.currentStreak * 10 : 0),
          level: rewardResult.levelProgress.currentLevel,
          currentStreak: rewardResult.streakData.currentStreak,
          longestStreak: Math.max(user.longestStreak || 0, rewardResult.streakData.currentStreak),
          lastActive: new Date(),
          lastActiveDate: effectiveToday,
        },
      });

      // Update streak history if streak changed
      if (rewardResult.streakData.currentStreak !== user.currentStreak) {
        // Mark previous current streak as not current
        if (currentStreakHistory.length > 0) {
          await tx.streakHistory.updateMany({
            where: {
              userId,
              isCurrent: true,
            },
            data: { isCurrent: false },
          });
        }

        // Create new streak history entry
        await tx.streakHistory.create({
          data: {
            userId,
            streakDate: new Date(),
            streakLength: rewardResult.streakData.currentStreak,
            isCurrent: true,
          },
        });
      }

      // Create activity log entry
      const activityLog = await tx.activityLog.create({
        data: {
          userId,
          type: this._mapGameEventToActivityType(event),
          description: `Completed ${event.replace(/_/g, ' ').toLowerCase()}`,
          xpEarned: rewardResult.totalXP,
          streakUpdated: rewardResult.streakData.currentStreak !== user.currentStreak,
          previousStreak: user.currentStreak,
          newStreak: rewardResult.streakData.currentStreak,
          previousLevel: user.level,
          newLevel: rewardResult.levelProgress.currentLevel,
          metadata: metadata || {},
        },
      });

      return { activityLogId: activityLog.id };
    });
  }

  /**
   * Private method to map GameEvent to ActivityType
   */
  private static _mapGameEventToActivityType(gameEvent: GameEvent): ActivityType {
    const eventMap: Record<GameEvent, ActivityType> = {
      COMPLETE_MATERI: ActivityType.COMPLETE_MATERI,
      COMPLETE_SOAL: ActivityType.COMPLETE_QUIZ,
      COMPLETE_VOCABULARY: ActivityType.VOCABULARY_PRACTICE,
      DAILY_LOGIN: ActivityType.LOGIN,
      CREATE_POST: ActivityType.CREATE_POST,
      LIKE_POST: ActivityType.LIKE_POST,
      COMMENT_POST: ActivityType.COMMENT_POST,
      JOIN_KELAS: ActivityType.OTHER, // No direct equivalent in ActivityType
      COMPLETE_ASSESSMENT: ActivityType.COMPLETE_QUIZ, // Using COMPLETE_QUIZ as closest equivalent
      PERFECT_SCORE: ActivityType.OTHER, // No direct equivalent in ActivityType
      STREAK_MILESTONE: ActivityType.OTHER, // No direct equivalent in ActivityType
    };

    return eventMap[gameEvent] || ActivityType.OTHER;
  }

  /**
   * Get user's current streak status
   * @param userId - The user ID
   * @param userTimeZone - Optional user timezone
   * @returns Current streak information
   */
  static async getStreakStatus(
    userId: string,
    userTimeZone?: string
  ): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    hoursUntilReset: number;
    hoursUntilNewStreak: number;
  } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          currentStreak: true,
          longestStreak: true,
          lastActive: true,
          lastActiveDate: true,
        },
      });

      if (!user) return null;

      const lastActiveDateString = user.lastActiveDate || 
        (user.lastActive ? migrateLastActiveDate(user.lastActive, userTimeZone) : null);

      const hoursUntilReset = getHoursUntilReset(lastActiveDateString, userTimeZone);
      const hoursUntilNewStreak = getHoursUntilNewStreak(lastActiveDateString, userTimeZone);

      return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak || user.currentStreak,
        lastActiveDate: lastActiveDateString,
        hoursUntilReset,
        hoursUntilNewStreak,
      };
    } catch (error) {
      console.error('Error in GamificationService.getStreakStatus:', error);
      return null;
    }
  }
}
