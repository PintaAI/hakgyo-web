/**
 * Reward System for Gamification
 * Main handler for XP calculations and streak bonuses
 * 
 * REFACTORED: Now uses calendar-day-based streak logic with timezone support
 */

import { GameEvent, getEventXP } from './eventRegistry';
import {
  StreakData,
  updateStreak,
  applyStreakBonus,
  hasReachedMilestone,
  getEffectiveTodayYMD,
  DEFAULT_GRACE_PERIOD_HOURS
} from './streak';
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

export interface RewardOptions {
  userTimeZone?: string;
  gracePeriodHours?: number;
}

/**
 * Process a game event and calculate rewards
 * @param event The game event that occurred
 * @param userData The current user game data
 * @param options Optional configuration (timezone, grace period)
 * @returns Complete reward result
 */
export function processReward(
  event: GameEvent,
  userData: UserGameData,
  options?: RewardOptions
): RewardResult {
  console.log('💰 [REWARD] ========== processReward called ==========');
  console.log('💰 [REWARD] Event:', event);
  console.log('💰 [REWARD] User data:', {
    totalXP: userData.totalXP,
    currentStreak: userData.streakData.currentStreak,
    lastActiveDateString: userData.streakData.lastActiveDateString
  });
  console.log('💰 [REWARD] Options:', options);
  
  // Get base XP for the event
  const baseXP = getEventXP(event);
  console.log('💰 [REWARD] Base XP for event:', baseXP);

  // Update streak data using calendar-day logic
  const previousStreak = userData.streakData.currentStreak;
  console.log('💰 [REWARD] Previous streak:', previousStreak);
  console.log('💰 [REWARD] Calling updateStreak...');
  
  const updatedStreakData = updateStreak(
    userData.streakData,
    options?.userTimeZone,
    options?.gracePeriodHours ?? DEFAULT_GRACE_PERIOD_HOURS
  );
  
  console.log('💰 [REWARD] Updated streak:', updatedStreakData.currentStreak);
  
  // Check if streak milestone was reached
  const streakMilestoneReached = hasReachedMilestone(
    updatedStreakData.currentStreak,
    previousStreak
  );
  console.log('💰 [REWARD] Streak milestone reached:', streakMilestoneReached);
  
  // Apply streak bonus to XP
  const streakBonusXP = applyStreakBonus(baseXP, updatedStreakData.currentStreak);
  console.log('💰 [REWARD] XP with streak bonus:', streakBonusXP, '(streak multiplier applied)');
  
  const totalXP = userData.totalXP + streakBonusXP;
  console.log('💰 [REWARD] New total XP:', totalXP);
  
  // Calculate level progress
  const previousLevel = getLevelProgress(userData.totalXP).currentLevel;
  const newLevelProgress = getLevelProgress(totalXP);
  const levelsGained = getLevelsGained(userData.totalXP, totalXP);
  
  console.log('💰 [REWARD] Level:', previousLevel, '->', newLevelProgress.currentLevel, '(gained:', levelsGained, ')');
  
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
  
  console.log('💰 [REWARD] ========== processReward result ==========');
  console.log('💰 [REWARD] Final result:', {
    event: result.event,
    baseXP: result.baseXP,
    streakBonus: result.streakBonus,
    totalXP: result.totalXP,
    currentStreak: result.streakData.currentStreak
  });
  
  return result;
}

/**
 * Process multiple events at once
 * @param events Array of events that occurred
 * @param userData The current user game data
 * @param options Optional configuration (timezone, grace period)
 * @returns Array of reward results
 */
export function processMultipleRewards(
  events: GameEvent[],
  userData: UserGameData,
  options?: RewardOptions
): RewardResult[] {
  const results: RewardResult[] = [];
  const currentUserData = { ...userData };
  
  for (const event of events) {
    const result = processReward(event, currentUserData, options);
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
 * @param options Optional configuration (timezone, grace period)
 * @returns Reward result for daily login
 */
export function processDailyLoginReward(
  userData: UserGameData,
  options?: RewardOptions
): RewardResult {
  return processReward('DAILY_LOGIN', userData, options);
}

/**
 * Calculate streak milestone reward
 * @param userData The current user game data
 * @param milestone The milestone reached
 * @param options Optional configuration (timezone, grace period)
 * @returns Reward result for streak milestone
 */
export function processStreakMilestoneReward(
  userData: UserGameData,
  milestone: number,
  options?: RewardOptions
): RewardResult {
  const milestoneXP = milestone * 10; // 10 XP per streak day as milestone bonus
  const enhancedUserData = {
    ...userData,
    totalXP: userData.totalXP + milestoneXP,
  };
  
  return processReward('STREAK_MILESTONE', enhancedUserData, options);
}

/**
 * Calculate perfect score bonus
 * @param baseEvent The base event (e.g., COMPLETE_ASSESSMENT)
 * @param userData The current user game data
 * @param options Optional configuration (timezone, grace period)
 * @returns Reward result with perfect score bonus
 */
export function processPerfectScoreReward(
  baseEvent: GameEvent,
  userData: UserGameData,
  options?: RewardOptions
): RewardResult {
  // First process the base event
  const baseResult = processReward(baseEvent, userData, options);
  
  // Then add the perfect score bonus
  const enhancedUserData = {
    ...userData,
    totalXP: userData.totalXP + baseResult.totalXP,
  };
  
  const perfectScoreResult = processReward('PERFECT_SCORE', enhancedUserData, options);
  
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
 * Uses calendar-day-based comparison
 * @param userData The current user game data
 * @param options Optional configuration (timezone, grace period)
 * @returns Array of eligible special rewards
 */
export function getEligibleSpecialRewards(
  userData: UserGameData,
  options?: RewardOptions
): GameEvent[] {
  const eligibleRewards: GameEvent[] = [];
  
  const effectiveToday = getEffectiveTodayYMD(
    options?.userTimeZone,
    options?.gracePeriodHours ?? DEFAULT_GRACE_PERIOD_HOURS
  );
  
  const lastActiveDateString = userData.streakData.lastActiveDateString;
  
  // Check if user hasn't logged in today (based on calendar day)
  if (!lastActiveDateString || lastActiveDateString !== effectiveToday) {
    eligibleRewards.push('DAILY_LOGIN');
  }
  
  return eligibleRewards;
}

/**
 * Legacy compatibility: Process a game event with boolean activeToday parameter
 * @deprecated Use processReward with options instead
 * @param event The game event that occurred
 * @param userData The current user game data
 * @param activeToday Whether the user was active today (ignored in new implementation)
 * @returns Complete reward result
 */
export function processRewardLegacy(
  event: GameEvent,
  userData: UserGameData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _activeToday: boolean = true
): RewardResult {
  return processReward(event, userData);
}