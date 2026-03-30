/**
 * Streak Management for Gamification System
 * Handles daily activity streaks and bonus calculations
 * 
 * REFACTORED: Now uses calendar-day-based logic instead of rolling 24-hour window
 * - Each day is defined by the user's timezone (YYYY-MM-DD format)
 * - A user can only increment streak once per calendar day
 * - Grace period support for users who barely missed a day
 */

export interface StreakData {
  currentStreak: number;
  lastActiveDate: Date | null;
  lastActiveDateString: string | null; // YYYY-MM-DD format in user's timezone
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
 * Default grace period in hours after midnight
 * Users can still maintain their streak within this window
 */
export const DEFAULT_GRACE_PERIOD_HOURS = 4;

/**
 * Streak protection end hour (24-hour format)
 * Streak is protected until this hour on the day AFTER the last activity
 * Default: 23 (11 PM) - users have until 11 PM the next day to maintain their streak
 */
export const STREAK_PROTECTION_END_HOUR = 23;

/**
 * Convert a date to YYYY-MM-DD string in the given timezone
 * @param date The date to convert
 * @param timeZone Optional user timezone (e.g., 'Asia/Jakarta')
 * @returns YYYY-MM-DD string
 */
export function formatDateToYMD(date: Date, timeZone?: string): string {
  const dateInTz = timeZone
    ? new Date(date.toLocaleString("en-US", { timeZone }))
    : date;
  
  const year = dateInTz.getFullYear();
  const month = String(dateInTz.getMonth() + 1).padStart(2, '0');
  const day = String(dateInTz.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object
 * @param ymdString The YYYY-MM-DD string
 * @returns Date object at midnight UTC
 */
export function parseYMDToDate(ymdString: string): Date {
  const [year, month, day] = ymdString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 * @param timeZone Optional user timezone
 * @returns Yesterday's date as YYYY-MM-DD
 */
export function getYesterdayYMD(timeZone?: string): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateToYMD(yesterday, timeZone);
}

/**
 * Get today's date as YYYY-MM-DD string
 * @param timeZone Optional user timezone
 * @returns Today's date as YYYY-MM-DD
 */
export function getTodayYMD(timeZone?: string): string {
  return formatDateToYMD(new Date(), timeZone);
}

/**
 * Calculate the difference in days between two YYYY-MM-DD strings
 * @param date1 First date (YYYY-MM-DD)
 * @param date2 Second date (YYYY-MM-DD)
 * @returns Number of days difference (positive if date2 is after date1)
 */
export function daysDifferenceYMD(date1: string, date2: string): number {
  const d1 = parseYMDToDate(date1);
  const d2 = parseYMDToDate(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if current time is within the grace period after midnight
 * Grace period allows users to maintain streak if they missed midnight by a few hours
 * @param timeZone Optional user timezone
 * @param gracePeriodHours Grace period in hours (default: 4)
 * @returns True if within grace period
 */
export function isWithinGracePeriod(
  timeZone?: string,
  gracePeriodHours: number = DEFAULT_GRACE_PERIOD_HOURS
): boolean {
  const now = new Date();
  const nowInTz = timeZone
    ? new Date(now.toLocaleString("en-US", { timeZone }))
    : now;
  
  const currentHour = nowInTz.getHours();
  return currentHour < gracePeriodHours;
}

/**
 * Get the effective "today" date considering grace period
 * If within grace period, treat it as the previous day for streak purposes
 * @param timeZone Optional user timezone
 * @param gracePeriodHours Grace period in hours (default: 4)
 * @returns Effective today as YYYY-MM-DD
 */
export function getEffectiveTodayYMD(
  timeZone?: string,
  gracePeriodHours: number = DEFAULT_GRACE_PERIOD_HOURS
): string {
  const now = new Date();
  const nowInTz = timeZone
    ? new Date(now.toLocaleString("en-US", { timeZone }))
    : now;
  
  console.log('📅 [STREAK] getEffectiveTodayYMD called');
  console.log('📅 [STREAK] Timezone:', timeZone || 'server time');
  console.log('📅 [STREAK] Current time in TZ:', nowInTz.toISOString());
  console.log('📅 [STREAK] Hour in TZ:', nowInTz.getHours());
  console.log('📅 [STREAK] Grace period hours:', gracePeriodHours);
  
  // If within grace period, treat as previous day
  if (nowInTz.getHours() < gracePeriodHours) {
    console.log('🌅 [STREAK] Within grace period! Treating as previous day');
    const yesterday = new Date(nowInTz);
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatDateToYMD(yesterday, timeZone);
    console.log('📅 [STREAK] Effective today (grace period):', result);
    return result;
  }
  
  const result = formatDateToYMD(nowInTz, timeZone);
  console.log('📅 [STREAK] Effective today (normal):', result);
  return result;
}

/**
 * Check if the streak is still within the protection window
 * The streak is protected until STREAK_PROTECTION_END_HOUR (default 11 PM)
 * on the day AFTER the last activity
 *
 * @param lastActiveDateString The last active date (YYYY-MM-DD)
 * @param timeZone Optional user timezone
 * @param protectionEndHour Hour until which streak is protected (default: 23 = 11 PM)
 * @returns True if the streak is still protected
 */
export function isStreakProtected(
  lastActiveDateString: string | null,
  timeZone?: string,
  protectionEndHour: number = STREAK_PROTECTION_END_HOUR
): boolean {
  if (!lastActiveDateString) return false;
  
  const now = new Date();
  const nowInTz = timeZone
    ? new Date(now.toLocaleString("en-US", { timeZone }))
    : now;
  
  const todayYMD = formatDateToYMD(nowInTz, timeZone);
  const currentHour = nowInTz.getHours();
  const yesterdayYMD = getYesterdayYMD(timeZone);
  
  // Case 1: User was active today - streak is always protected
  if (lastActiveDateString === todayYMD) {
    console.log('🛡️ [STREAK] Active today - protected');
    return true;
  }
  
  // Case 2: User was active yesterday - protected until protectionEndHour today
  if (lastActiveDateString === yesterdayYMD) {
    const isProtected = currentHour < protectionEndHour;
    console.log(`🛡️ [STREAK] Active yesterday - protected until ${protectionEndHour}:00 (current: ${currentHour}:00) → ${isProtected}`);
    return isProtected;
  }
  
  // Case 3: Last activity was before yesterday - streak is not protected
  console.log(`🛡️ [STREAK] Last active ${lastActiveDateString} (before yesterday) - NOT protected`);
  return false;
}

/**
 * Check if a user has maintained their streak for today
 * Uses the new lenient protection window (until 11 PM the next day)
 * @param lastActiveDateString The last active date (YYYY-MM-DD)
 * @param timeZone Optional user timezone
 * @param gracePeriodHours Grace period in hours (deprecated, kept for compatibility)
 * @returns True if the user's streak is still active
 */
export function isStreakActive(
  lastActiveDateString: string | null,
  timeZone?: string,
  gracePeriodHours: number = DEFAULT_GRACE_PERIOD_HOURS
): boolean {
  if (!lastActiveDateString) return false;
  
  // Use the new protection window logic
  return isStreakProtected(lastActiveDateString, timeZone, STREAK_PROTECTION_END_HOUR);
}

/**
 * Check if a user has lost their streak
 * Uses the new lenient protection window (until 11 PM the next day)
 * @param lastActiveDateString The last active date (YYYY-MM-DD)
 * @param timeZone Optional user timezone
 * @param gracePeriodHours Grace period in hours (deprecated, kept for compatibility)
 * @returns True if the user has lost their streak
 */
export function hasLostStreak(
  lastActiveDateString: string | null,
  timeZone?: string,
  gracePeriodHours: number = DEFAULT_GRACE_PERIOD_HOURS
): boolean {
  if (!lastActiveDateString) return false;
  
  // Streak is lost if it's no longer protected
  return !isStreakProtected(lastActiveDateString, timeZone, STREAK_PROTECTION_END_HOUR);
}

/**
 * Update a user's streak based on their activity using the lenient protection window
 * Streak is protected until 11 PM the day after last activity
 *
 * @param currentStreakData The current streak data
 * @param userTimeZone Optional user timezone (e.g., 'Asia/Jakarta')
 * @param gracePeriodHours Grace period in hours (deprecated, kept for compatibility)
 * @returns Updated streak data
 */
export function updateStreak(
  currentStreakData: StreakData,
  userTimeZone?: string,
  gracePeriodHours: number = DEFAULT_GRACE_PERIOD_HOURS
): StreakData {
  const now = new Date();
  const todayYMD = getTodayYMD(userTimeZone);
  const lastActiveDateString = currentStreakData.lastActiveDateString;
  
  console.log('🔄 [STREAK] updateStreak:', {
    streak: currentStreakData.currentStreak,
    lastActive: lastActiveDateString,
    today: todayYMD
  });
  
  // If no previous activity, start a new streak
  if (!lastActiveDateString) {
    console.log('🆕 [STREAK] Starting new streak at 1');
    return {
      currentStreak: 1,
      lastActiveDate: now,
      lastActiveDateString: todayYMD,
      longestStreak: Math.max(1, currentStreakData.longestStreak),
      streakHistory: [...currentStreakData.streakHistory, now],
    };
  }
  
  // Already counted for today - idempotent
  if (lastActiveDateString === todayYMD) {
    // Special case: if currentStreak is 0, initialize to 1
    if (currentStreakData.currentStreak === 0) {
      console.log('⚠️ [STREAK] currentStreak is 0, initializing to 1');
      return {
        currentStreak: 1,
        lastActiveDate: now,
        lastActiveDateString: todayYMD,
        longestStreak: Math.max(1, currentStreakData.longestStreak),
        streakHistory: [...currentStreakData.streakHistory, now],
      };
    }
    console.log('✅ [STREAK] Already counted for today - no change');
    return currentStreakData;
  }
  
  // Check if streak is still protected (within 11 PM the day after last activity)
  const isProtected = isStreakProtected(lastActiveDateString, userTimeZone, STREAK_PROTECTION_END_HOUR);
  
  let newStreak: number;
  const newHistory = [...currentStreakData.streakHistory, now];
  
  if (isProtected) {
    // Streak is protected - user was active yesterday and it's before 11 PM today
    // This counts as a consecutive day
    newStreak = currentStreakData.currentStreak + 1;
    console.log(`🔥 [STREAK] Protected! Incrementing: ${currentStreakData.currentStreak} → ${newStreak}`);
  } else {
    // Streak protection expired - reset to 1
    newStreak = 1;
    const daysDiff = daysDifferenceYMD(lastActiveDateString, todayYMD);
    console.log(`💔 [STREAK] Protection expired (${daysDiff} days missed) - resetting to 1`);
  }
  
  const newLongestStreak = Math.max(newStreak, currentStreakData.longestStreak);
  console.log(`🔄 [STREAK] Result: streak=${newStreak}, longest=${newLongestStreak}`);
  
  return {
    currentStreak: newStreak,
    lastActiveDate: now,
    lastActiveDateString: todayYMD,
    longestStreak: newLongestStreak,
    streakHistory: newHistory,
  };
}

/**
 * Migrate legacy streak data to the new format
 * Converts lastActiveDate (timestamp) to lastActiveDateString (YYYY-MM-DD)
 * @param lastActiveDate The legacy lastActiveDate timestamp
 * @param userTimeZone Optional user timezone
 * @returns YYYY-MM-DD string or null
 */
export function migrateLastActiveDate(
  lastActiveDate: Date | null,
  userTimeZone?: string
): string | null {
  if (!lastActiveDate) return null;
  return formatDateToYMD(new Date(lastActiveDate), userTimeZone);
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
 * Calculate hours until streak reset (midnight in user's timezone)
 * @param lastActiveDateString The last active date (YYYY-MM-DD)
 * @param timeZone Optional user timezone
 * @param gracePeriodHours Grace period in hours
 * @returns Hours until streak resets
 */
export function getHoursUntilReset(
  lastActiveDateString: string | null,
  timeZone?: string,
  gracePeriodHours: number = DEFAULT_GRACE_PERIOD_HOURS
): number {
  if (!lastActiveDateString) return 0;
  
  const now = new Date();
  const nowInTz = timeZone
    ? new Date(now.toLocaleString("en-US", { timeZone }))
    : now;
  
  const effectiveToday = getEffectiveTodayYMD(timeZone, gracePeriodHours);
  
  // If already lost streak, return 0
  if (lastActiveDateString !== effectiveToday && 
      lastActiveDateString !== getYesterdayYMD(timeZone)) {
    return 0;
  }
  
  // Calculate hours until midnight + grace period
  const tomorrow = new Date(nowInTz);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(gracePeriodHours, 0, 0, 0);
  
  const hoursUntilReset = (tomorrow.getTime() - nowInTz.getTime()) / (1000 * 60 * 60);
  return Math.max(0, hoursUntilReset);
}

/**
 * Calculate hours until user can add new streak (next calendar day)
 * @param lastActiveDateString The last active date (YYYY-MM-DD)
 * @param timeZone Optional user timezone
 * @param gracePeriodHours Grace period in hours
 * @returns Hours until user can add new streak (0 if already available)
 */
export function getHoursUntilNewStreak(
  lastActiveDateString: string | null,
  timeZone?: string,
  gracePeriodHours: number = DEFAULT_GRACE_PERIOD_HOURS
): number {
  if (!lastActiveDateString) return 0;
  
  const now = new Date();
  const nowInTz = timeZone
    ? new Date(now.toLocaleString("en-US", { timeZone }))
    : now;
  
  const effectiveToday = getEffectiveTodayYMD(timeZone, gracePeriodHours);
  
  // If already active today, calculate hours until tomorrow
  if (lastActiveDateString === effectiveToday) {
    const tomorrow = new Date(nowInTz);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(gracePeriodHours, 0, 0, 0);
    
    const hoursUntilTomorrow = (tomorrow.getTime() - nowInTz.getTime()) / (1000 * 60 * 60);
    return Math.max(0, hoursUntilTomorrow);
  }
  
  // User can add to streak now (on a new day)
  return 0;
}

/**
 * Legacy compatibility: Check if a user has maintained their streak (Date-based)
 * @deprecated Use the string-based isStreakActive instead
 * @param lastActiveDate The last date the user was active
 * @returns True if the user is still within their streak window
 */
export function isStreakActiveLegacy(lastActiveDate: Date | null): boolean {
  if (!lastActiveDate) return false;
  
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const hoursSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  // Streak is active if the user was active in the last 24 hours
  return hoursSinceLastActive < 24;
}

/**
 * Legacy compatibility: Check if a user has lost their streak (Date-based)
 * @deprecated Use the string-based hasLostStreak instead
 * @param lastActiveDate The last date the user was active
 * @returns True if the user has lost their streak
 */
export function hasLostStreakLegacy(lastActiveDate: Date | null): boolean {
  if (!lastActiveDate) return false;
  
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const hoursSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  // Streak is lost if the user hasn't been active in 24+ hours
  return hoursSinceLastActive >= 24;
}