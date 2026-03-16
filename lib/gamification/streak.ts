/**
 * Streak Management for Gamification System
 * Handles daily activity streaks and bonus calculations
 */

export interface StreakData {
  currentStreak: number;
  lastActiveDate: Date | null;
  longestStreak: number;
  streakHistory: Date[];
}

export interface StreakBonus {
  multiplier: number;
  threshold: number;
  description: string;
}

/**
 * Default streak bonus configuration
 */
export const DEFAULT_STREAK_BONUSES: StreakBonus[] = [
  { multiplier: 1.0, threshold: 0, description: 'No bonus' },
  { multiplier: 1.25, threshold: 3, description: '3+ days streak: +25% XP bonus' },
  { multiplier: 1.5, threshold: 7, description: '7+ days streak: +50% XP bonus' },
];

/**
 * Check if a user has maintained their streak for today
 * @param lastActiveDate The last date the user was active
 * @returns True if the user is still within their streak window
 */
export function isStreakActive(lastActiveDate: Date | null): boolean {
  if (!lastActiveDate) return false;
  
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const hoursSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  // Streak is active if the user was active in the last 24 hours
  return hoursSinceLastActive < 24;
}

/**
 * Check if a user has lost their streak
 * @param lastActiveDate The last date the user was active
 * @returns True if the user has lost their streak
 */
export function hasLostStreak(lastActiveDate: Date | null): boolean {
  if (!lastActiveDate) return false;
  
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const hoursSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  // Streak is lost if the user hasn't been active in 24+ hours
  return hoursSinceLastActive >= 24;
}

/**
 * Update a user's streak based on their activity
 * @param currentStreakData The current streak data
 * @param activeToday Whether the user was active today
 * @param userTimeZone Optional user timezone (e.g., 'Asia/Jakarta')
 * @returns Updated streak data
 */
export function updateStreak(
  currentStreakData: StreakData,
  activeToday: boolean = true,
  userTimeZone?: string
): StreakData {
  const now = new Date();
  
  // Use user timezone if provided, otherwise use server time
  const userNow = userTimeZone
    ? new Date(now.toLocaleString("en-US", { timeZone: userTimeZone }))
    : now;
  
  const today = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate());
  const lastActiveDate = currentStreakData.lastActiveDate
    ? new Date(currentStreakData.lastActiveDate)
    : null;
  
  // Convert last active date to user timezone if provided
  const userLastActive = userTimeZone && lastActiveDate
    ? new Date(lastActiveDate.toLocaleString("en-US", { timeZone: userTimeZone }))
    : lastActiveDate;
  
  if (!activeToday) {
    // User wasn't active today, check if streak is lost
    if (hasLostStreak(userLastActive)) {
      return {
        currentStreak: 0,
        lastActiveDate: null,
        longestStreak: currentStreakData.longestStreak,
        streakHistory: [...currentStreakData.streakHistory],
      };
    }
    return currentStreakData;
  }

  // User was active today
  if (!userLastActive) {
    // First time activity
    return {
      currentStreak: 1,
      lastActiveDate: today,
      longestStreak: 1,
      streakHistory: [today],
    };
  }

  // Check if streak is lost based on 24-hour window
  if (hasLostStreak(userLastActive)) {
    // Streak lost, start new streak
    return {
      currentStreak: 1,
      lastActiveDate: today,
      longestStreak: currentStreakData.longestStreak,
      streakHistory: [...currentStreakData.streakHistory, today],
    };
  }

  const lastActiveDay = userTimeZone && userLastActive
    ? new Date(
        userLastActive.getFullYear(),
        userLastActive.getMonth(),
        userLastActive.getDate()
      )
    : new Date(
        userLastActive.getFullYear(),
        userLastActive.getMonth(),
        userLastActive.getDate()
      );

  if (lastActiveDay.getTime() === today.getTime()) {
    // Already active today
    // Special case: if currentStreak is 0, this is the first activity of the day
    // and streak should be initialized to 1
    if (currentStreakData.currentStreak === 0) {
      return {
        currentStreak: 1,
        lastActiveDate: today,
        longestStreak: Math.max(1, currentStreakData.longestStreak),
        streakHistory: [...currentStreakData.streakHistory, today],
      };
    }
    // Otherwise, no change needed - already counted for today
    return currentStreakData;
  }

  const daysDiff = Math.floor(
    (today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStreak = currentStreakData.currentStreak;
  const newHistory = [...currentStreakData.streakHistory, today];

  if (daysDiff === 1) {
    // Consecutive day, increment streak
    newStreak += 1;
  } else if (daysDiff > 1) {
    // Missed days, reset streak
    newStreak = 1;
  }

  const newLongestStreak = Math.max(newStreak, currentStreakData.longestStreak);

  const result = {
    currentStreak: newStreak,
    lastActiveDate: today,
    longestStreak: newLongestStreak,
    streakHistory: newHistory,
  };
  
  return result;
}

/**
 * Get the current streak bonus multiplier
 * @param currentStreak The current streak count
 * @param bonuses Optional custom bonus configuration
 * @returns The applicable bonus multiplier
 */
export function getStreakBonus(
  currentStreak: number,
  bonuses: StreakBonus[] = DEFAULT_STREAK_BONUSES
): StreakBonus {
  // Find the highest bonus threshold that the user qualifies for
  let applicableBonus = bonuses[0]; // Default to no bonus
  
  for (const bonus of bonuses) {
    if (currentStreak >= bonus.threshold) {
      applicableBonus = bonus;
    }
  }
  
  return applicableBonus;
}

/**
 * Apply streak bonus to XP
 * @param baseXP The base XP amount
 * @param currentStreak The current streak count
 * @param bonuses Optional custom bonus configuration
 * @returns XP with streak bonus applied
 */
export function applyStreakBonus(
  baseXP: number,
  currentStreak: number,
  bonuses: StreakBonus[] = DEFAULT_STREAK_BONUSES
): number {
  const bonus = getStreakBonus(currentStreak, bonuses);
  return Math.floor(baseXP * bonus.multiplier);
}

/**
 * Check if user is eligible for a streak milestone bonus
 * @param currentStreak The current streak count
 * @param previousStreak The previous streak count (before update)
 * @param milestones Optional custom milestone thresholds
 * @returns True if user reached a new milestone
 */
export function hasReachedMilestone(
  currentStreak: number,
  previousStreak: number,
  milestones: number[] = [3, 7, 14, 30, 60, 100]
): boolean {
  return milestones.some(milestone =>
    currentStreak >= milestone && previousStreak < milestone
  );
}

/**
 * Calculate hours until streak reset
 * @param lastActiveDate The last date the user was active
 * @returns Hours until streak resets (0 if already lost or no activity)
 */
export function getHoursUntilReset(lastActiveDate: Date | null): number {
  if (!lastActiveDate) return 0;
  
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const hoursSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  // If already lost streak, return 0
  if (hoursSinceLastActive >= 24) return 0;
  
  // Return remaining hours until 24-hour mark
  return Math.max(0, 24 - hoursSinceLastActive);
}

/**
 * Calculate hours until user can add new streak
 * @param lastActiveDate The last date the user was active
 * @param userTimeZone Optional user timezone (e.g., 'Asia/Jakarta')
 * @returns Hours until user can add new streak (0 if already available)
 */
export function getHoursUntilNewStreak(
  lastActiveDate: Date | null,
  userTimeZone?: string
): number {
  if (!lastActiveDate) return 0;
  
  const now = new Date();
  
  // Use user timezone if provided, otherwise use server time
  const userNow = userTimeZone
    ? new Date(now.toLocaleString("en-US", { timeZone: userTimeZone }))
    : now;
  
  const today = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate());
  const lastActive = new Date(lastActiveDate);
  
  // Convert last active date to user timezone if provided
  const userLastActive = userTimeZone
    ? new Date(lastActive.toLocaleString("en-US", { timeZone: userTimeZone }))
    : lastActive;
  
  const lastActiveDay = new Date(
    userLastActive.getFullYear(),
    userLastActive.getMonth(),
    userLastActive.getDate()
  );
  
  // Check if already lost streak (24+ hours)
  const hoursSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastActive >= 24) return 0;
  
  // Check if already active today - user can only add to streak once per day
  if (lastActiveDay.getTime() === today.getTime()) {
    // Calculate hours until midnight (next day)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const hoursUntilTomorrow = (tomorrow.getTime() - userNow.getTime()) / (1000 * 60 * 60);
    return Math.max(0, hoursUntilTomorrow);
  }
  
  // User can add to streak now (on a new consecutive day)
  return 0;
}