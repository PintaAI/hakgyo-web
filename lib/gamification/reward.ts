/**
 * Reward System for Gamification
 * Main handler for XP calculations and streak bonuses
 */

import { GameEvent, getEventXP } from './eventRegistry';
import { StreakData, updateStreak, applyStreakBonus, hasReachedMilestone } from './streak';
import { LevelProgress, getLevelProgress, getLevelsGained } from './level';

export interface RewardResult {
  event: GameEvent;
  baseXP: number;
  streakBonus: number;
  totalXP: number;
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  levelProgress: LevelProgress;
  streakData: StreakData;
  streakMilestoneReached: boolean;
}

export interface UserGameData {
  totalXP: number;
  streakData: StreakData;
}

/**
 * Process a game event and calculate rewards
 * @param event The game event that occurred
 * @param userData The current user game data
 * @param activeToday Whether the user was active today (for streak calculation)
 * @returns Complete reward result
 */
export function processReward(
  event: GameEvent,
  userData: UserGameData,
  activeToday: boolean = true
): RewardResult {
  // Get base XP for the event
  const baseXP = getEventXP(event);

  // Update streak data
  const previousStreak = userData.streakData.currentStreak;
  const updatedStreakData = updateStreak(userData.streakData, activeToday);
  
  // Check if streak milestone was reached
  const streakMilestoneReached = hasReachedMilestone(
    updatedStreakData.currentStreak,
    previousStreak
  );
  
  // Apply streak bonus to XP
  const streakBonusXP = applyStreakBonus(baseXP, updatedStreakData.currentStreak);
  const totalXP = userData.totalXP + streakBonusXP;
  
  // Calculate level progress
  const previousLevel = getLevelProgress(userData.totalXP).currentLevel;
  const newLevelProgress = getLevelProgress(totalXP);
  const levelsGained = getLevelsGained(userData.totalXP, totalXP);
  
  const result = {
    event,
    baseXP,
    streakBonus: streakBonusXP - baseXP,
    totalXP: streakBonusXP,
    previousLevel,
    newLevel: newLevelProgress.currentLevel,
    levelsGained,
    levelProgress: newLevelProgress,
    streakData: updatedStreakData,
    streakMilestoneReached,
  };
  
  return result;
}

/**
 * Process multiple events at once
 * @param events Array of events that occurred
 * @param userData The current user game data
 * @param activeToday Whether the user was active today
 * @returns Array of reward results
 */
export function processMultipleRewards(
  events: GameEvent[],
  userData: UserGameData,
  activeToday: boolean = true
): RewardResult[] {
  const results: RewardResult[] = [];
  const currentUserData = { ...userData };
  
  for (const event of events) {
    const result = processReward(event, currentUserData, activeToday);
    results.push(result);
    
    // Update user data for next iteration
    currentUserData.totalXP += result.totalXP;
    currentUserData.streakData = result.streakData;
  }
  
  return results;
}

/**
 * Calculate daily login reward
 * @param userData The current user game data
 * @returns Reward result for daily login
 */
export function processDailyLoginReward(userData: UserGameData): RewardResult {
  return processReward('DAILY_LOGIN', userData, true);
}

/**
 * Calculate streak milestone reward
 * @param userData The current user game data
 * @param milestone The milestone reached
 * @returns Reward result for streak milestone
 */
export function processStreakMilestoneReward(
  userData: UserGameData,
  milestone: number
): RewardResult {
  const milestoneXP = milestone * 10; // 10 XP per streak day as milestone bonus
  const enhancedUserData = {
    ...userData,
    totalXP: userData.totalXP + milestoneXP,
  };
  
  return processReward('STREAK_MILESTONE', enhancedUserData, true);
}

/**
 * Calculate perfect score bonus
 * @param baseEvent The base event (e.g., COMPLETE_ASSESSMENT)
 * @param userData The current user game data
 * @returns Reward result with perfect score bonus
 */
export function processPerfectScoreReward(
  baseEvent: GameEvent,
  userData: UserGameData
): RewardResult {
  // First process the base event
  const baseResult = processReward(baseEvent, userData, true);
  
  // Then add the perfect score bonus
  const enhancedUserData = {
    ...userData,
    totalXP: userData.totalXP + baseResult.totalXP,
  };
  
  const perfectScoreResult = processReward('PERFECT_SCORE', enhancedUserData, true);
  
  // Combine the results
  return {
    ...perfectScoreResult,
    baseXP: baseResult.baseXP + perfectScoreResult.baseXP,
    totalXP: baseResult.totalXP + perfectScoreResult.totalXP,
    streakBonus: baseResult.streakBonus + perfectScoreResult.streakBonus,
  };
}

/**
 * Get reward summary for display
 * @param result The reward result
 * @returns Formatted reward summary
 */
export function formatRewardSummary(result: RewardResult): string {
  let summary = `+${result.totalXP} XP for ${result.event}`;
  
  if (result.streakBonus > 0) {
    summary += ` (including +${result.streakBonus} streak bonus)`;
  }
  
  if (result.levelsGained > 0) {
    summary += ` - Level up! Now level ${result.newLevel}`;
  }
  
  if (result.streakMilestoneReached) {
    summary += ` - Streak milestone reached! ${result.streakData.currentStreak} day streak`;
  }
  
  return summary;
}

/**
 * Check if user is eligible for any special rewards
 * @param userData The current user game data
 * @returns Array of eligible special rewards
 */
export function getEligibleSpecialRewards(userData: UserGameData): GameEvent[] {
  const eligibleRewards: GameEvent[] = [];
  
  // Check if user hasn't logged in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = userData.streakData.lastActiveDate;
  if (lastActive) {
    const lastActiveDay = new Date(lastActive);
    lastActiveDay.setHours(0, 0, 0, 0);
    
    if (lastActiveDay.getTime() < today.getTime()) {
      eligibleRewards.push('DAILY_LOGIN');
    }
  }
  
  return eligibleRewards;
}