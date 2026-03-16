/**
 * GamificationService
 * Centralized service for handling all gamification operations
 */

import { prisma } from '@/lib/db';
import { ActivityType } from '@prisma/client';
import { GameEvent, getEventXP } from './eventRegistry';
import { processReward, UserGameData } from './reward';
import { StreakData, getHoursUntilReset, getHoursUntilNewStreak } from './streak';

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
    };
    activityId?: string;
  };
  error?: string;
}

/**
 * GamificationService - Centralized service for all gamification operations
 */
export class GamificationService {
  /**
   * Main entry point for all gamification operations
   * @param userId - The user ID to trigger the event for
   * @param event - The game event to trigger
   * @param metadata - Optional metadata to store with the activity log
   * @returns GamificationResult with the operation result
   */
  static async triggerEvent(
    userId: string,
    event: GameEvent,
    metadata?: Record<string, any>
  ): Promise<GamificationResult> {
    try {
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
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
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
        longestStreak: user.longestStreak || user.currentStreak,
        streakHistory: currentStreakHistory.map((h) => h.streakDate),
      };

      const userData: UserGameData = {
        totalXP: user.xp,
        streakData,
      };

      // Process the reward
      const rewardResult = processReward(event, userData, true);

      // Calculate streak reset information
      const hoursUntilReset = getHoursUntilReset(user.lastActive);
      const hoursUntilNewStreak = getHoursUntilNewStreak(user.lastActive);

      // Get the base XP for the event
      const baseXP = getEventXP(event);

      // Update database in transaction
      const result = await this._updateUserGamification(
        userId,
        event,
        baseXP,
        rewardResult,
        user,
        currentStreakHistory,
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
            lastActive: user.lastActive
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
      const streakChanged = rewardResult.streakData.currentStreak !== user.currentStreak;
      await tx.user.update({
        where: { id: userId },
        data: {
          xp: rewardResult.levelProgress.totalXP + (rewardResult.streakMilestoneReached ? rewardResult.streakData.currentStreak * 10 : 0),
          level: rewardResult.levelProgress.currentLevel,
          currentStreak: rewardResult.streakData.currentStreak,
          longestStreak: Math.max(user.longestStreak || 0, rewardResult.streakData.currentStreak),
          lastActive: new Date(),
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
}
