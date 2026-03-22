/**
 * Utility Functions for Gamification System
 * Common helper functions used across the gamification modules
 */

import { GameEvent } from './eventRegistry';
import { StreakData } from './streak';
import { LevelProgress } from './level';

/**
 * Format a number with thousand separators
 * @param num The number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format XP amount for display
 * @param xp The XP amount
 * @returns Formatted XP string
 */
export function formatXP(xp: number): string {
  return `${formatNumber(xp)} XP`;
}

/**
 * Format a date for streak tracking
 * @param date The date to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateForStreak(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the start of the day (midnight) for a given date
 * @param date The date
 * @returns Date object set to midnight of the given day
 */
export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the day (23:59:59.999) for a given date
 * @param date The date
 * @returns Date object set to the end of the given day
 */
export function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Check if two dates are the same day
 * @param date1 First date
 * @param date2 Second date
 * @returns True if both dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = getStartOfDay(date1);
  const d2 = getStartOfDay(date2);
  return d1.getTime() === d2.getTime();
}

/**
 * Check if a date is today
 * @param date The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is yesterday
 * @param date The date to check
 * @returns True if the date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

/**
 * Get the number of days between two dates
 * @param startDate The start date
 * @param endDate The end date
 * @returns Number of days between the dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = getStartOfDay(startDate);
  const end = getStartOfDay(endDate);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay);
}

/**
 * Get a human-readable description of a streak
 * @param streakData The streak data
 * @returns Human-readable streak description
 */
export function getStreakDescription(streakData: StreakData): string {
  const { currentStreak, longestStreak } = streakData;
  
  if (currentStreak === 0) {
    return 'No active streak';
  }
  
  let description = `${currentStreak} day${currentStreak !== 1 ? 's' : ''} streak`;
  
  if (longestStreak > currentStreak) {
    description += ` (longest: ${longestStreak} days)`;
  }
  
  return description;
}

/**
 * Get a human-readable description of level progress
 * @param levelProgress The level progress data
 * @returns Human-readable level description
 */
export function getLevelDescription(levelProgress: LevelProgress): string {
  const { currentLevel, xpProgress } = levelProgress;
  return `Level ${currentLevel} (${Math.floor(xpProgress)}% complete)`;
}

/**
 * Get a badge color based on level
 * @param level The level
 * @returns Badge color class
 */
export function getLevelBadgeColor(level: number): string {
  if (level >= 50) return 'bg-purple-500';
  if (level >= 40) return 'bg-red-500';
  if (level >= 30) return 'bg-orange-500';
  if (level >= 20) return 'bg-yellow-500';
  if (level >= 10) return 'bg-green-500';
  return 'bg-blue-500';
}

/**
 * Get a badge color based on streak
 * @param streak The current streak
 * @returns Badge color class
 */
export function getStreakBadgeColor(streak: number): string {
  if (streak >= 30) return 'bg-purple-500';
  if (streak >= 14) return 'bg-red-500';
  if (streak >= 7) return 'bg-orange-500';
  if (streak >= 3) return 'bg-yellow-500';
  return 'bg-gray-500';
}

/**
 * Get a descriptive name for a game event
 * @param event The game event
 * @returns Human-readable event name
 */
export function getEventDisplayName(event: GameEvent): string {
  const eventNames: Record<GameEvent, string> = {
    COMPLETE_MATERI: 'Completed Material',
    COMPLETE_SOAL: 'Completed Exercise',
    COMPLETE_VOCABULARY: 'Completed Vocabulary',
    DAILY_LOGIN: 'Daily Login',
    CREATE_POST: 'Created Post',
    LIKE_POST: 'Liked Post',
    COMMENT_POST: 'Commented on Post',
    JOIN_KELAS: 'Joined Class',
    COMPLETE_ASSESSMENT: 'Completed Assessment',
    PERFECT_SCORE: 'Perfect Score',
    STREAK_MILESTONE: 'Streak Milestone',
  };
  
  return eventNames[event] || event;
}

/**
 * Get an icon name for a game event
 * @param event The game event
 * @returns Icon name for the event
 */
export function getEventIcon(event: GameEvent): string {
  const eventIcons: Record<GameEvent, string> = {
    COMPLETE_MATERI: 'book-open',
    COMPLETE_SOAL: 'check-circle',
    COMPLETE_VOCABULARY: 'message-square',
    DAILY_LOGIN: 'calendar',
    CREATE_POST: 'plus-circle',
    LIKE_POST: 'heart',
    COMMENT_POST: 'message-circle',
    JOIN_KELAS: 'users',
    COMPLETE_ASSESSMENT: 'award',
    PERFECT_SCORE: 'star',
    STREAK_MILESTONE: 'flame',
  };
  
  return eventIcons[event] || 'circle';
}

/**
 * Calculate the time until streak reset
 * @param lastActiveDate The last active date
 * @returns Time until streak reset in hours
 */
export function getTimeUntilStreakReset(lastActiveDate: Date | null): number {
  if (!lastActiveDate) return 0;
  
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const hoursSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  return Math.max(0, 24 - hoursSinceLastActive);
}

/**
 * Format time until streak reset
 * @param lastActiveDate The last active date
 * @returns Formatted time string
 */
export function formatTimeUntilStreakReset(lastActiveDate: Date | null): string {
  const hoursRemaining = getTimeUntilStreakReset(lastActiveDate);
  
  if (hoursRemaining <= 0) {
    return 'Streak expired';
  }
  
  const hours = Math.floor(hoursRemaining);
  const minutes = Math.floor((hoursRemaining - hours) * 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

/**
 * Validate game event data
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateGameEvent(event: string): event is GameEvent {
  const validEvents: GameEvent[] = [
    'COMPLETE_MATERI',
    'COMPLETE_SOAL',
    'COMPLETE_VOCABULARY',
    'DAILY_LOGIN',
    'CREATE_POST',
    'LIKE_POST',
    'COMMENT_POST',
    'JOIN_KELAS',
    'COMPLETE_ASSESSMENT',
    'PERFECT_SCORE',
    'STREAK_MILESTONE',
  ];
  
  return validEvents.includes(event as GameEvent);
}

/**
 * Create a default streak data object
 * @returns Default streak data
 */
export function createDefaultStreakData(): StreakData {
  return {
    currentStreak: 0,
    lastActiveDate: null,
    lastActiveDateString: null,
    longestStreak: 0,
    streakHistory: [],
  };
}

/**
 * Clamp a number between min and max values
 * @param value The value to clamp
 * @param min The minimum value
 * @param max The maximum value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage with safe division
 * @param value The value
 * @param total The total
 * @returns Percentage (0-100)
 */
export function safePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return clamp((value / total) * 100, 0, 100);
}