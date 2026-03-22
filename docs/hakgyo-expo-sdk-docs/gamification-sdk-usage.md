# Gamification SDK Usage Guide

This guide explains how to use the Hakgyo Expo SDK for gamification-related operations.

## Overview

The gamification SDK provides methods for tracking user activities, awarding experience points (XP), managing levels, tracking daily streaks, and viewing leaderboards.

## Key Concepts

### Experience Points (XP)

XP is the primary currency of the gamification system. Users earn XP by completing various activities across the platform.

**XP Calculation Formula:**
```typescript
totalXP = baseXP * streakMultiplier
```

Where:
- `baseXP`: Base XP value for the event (see [Event Types](#event-types--xp-values))
- `streakMultiplier`: Bonus multiplier based on current streak (1.0x to 1.5x)

### Levels

Levels represent a user's overall progress and experience on the platform.

**Level Calculation Formula:**
```typescript
level = Math.floor(Math.sqrt(totalXP / 100)) + 1
```

**XP Required for Level:**
```typescript
xpRequired = (level - 1)² * 100
```

**Examples:**
| Level | Total XP Required | XP to Next Level |
|-------|-------------------|------------------|
| 1     | 0                 | 100              |
| 2     | 100               | 300              |
| 3     | 400               | 500              |
| 5     | 1,600             | 900              |
| 10    | 8,100             | 1,900            |

### Daily Streaks

Daily streaks track consecutive days of user activity. Maintaining a streak provides XP multiplier bonuses.

**Streak Bonus Tiers:**
| Streak Days | Multiplier | Bonus   |
|-------------|------------|---------|
| 0-2         | 1.0x       | No bonus |
| 3-6         | 1.25x      | +25% XP |
| 7+          | 1.5x       | +50% XP |

**Streak Milestones:**
- 3 days: First milestone
- 7 days: Week streak
- 14 days: Two-week streak
- 30 days: Month streak
- 60 days: Two-month streak
- 100 days: Century streak

**Streak Rules (Calendar-Day Based):**
- Streak increments on first activity each **calendar day** (based on user's timezone)
- A user can only increment their streak **once per calendar day**
- Streak resets if user misses a day (no activity for the entire calendar day)
- **Grace Period**: Users have a grace period (default: 4 hours after midnight) where activity still counts for the previous day
- The server is the single source of truth for streak validation

**Example Streak Behavior:**
```
Day 1 (2024-01-01): User active at 3 PM → streak = 1
Day 2 (2024-01-02): User active at 10 AM → streak = 2 (consecutive day)
Day 3 (2024-01-03): User active at 2 AM (within grace period) → streak = 3 (counts as Day 2)
Day 4 (2024-01-04): User inactive → streak still = 3
Day 5 (2024-01-05): User active → streak = 1 (reset due to missed day)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/gamification/events` | POST | Process gamification events and award XP |
| `/api/gamification/events` | GET | Get user's current streak status |
| `/api/gamification/activity` | GET | Get user's activity history |
| `/api/gamification/leaderboard` | GET | Get leaderboard rankings |

## SDK Methods

### Process Gamification Events

Track user activities and award XP.

```typescript
import { gamificationApi } from '@hakgyo-expo-sdk';

// Basic event processing
const result = await gamificationApi.processEvent({
  event: 'COMPLETE_VOCABULARY',
  metadata: { itemId: 123, collectionId: 45 }
});

// With timezone support for accurate streak calculation
const result = await gamificationApi.processEvent({
  event: 'DAILY_LOGIN',
  metadata: { source: 'mobile_app' },
  userTimeZone: 'Asia/Jakarta', // User's timezone for calendar-day calculation
  gracePeriodHours: 4 // Grace period after midnight (default: 4)
});

if (result.success) {
  const { data } = result;
  
  // Show XP notification
  console.log(`+${data.totalXP} XP earned!`);
  
  // Check for level up
  if (data.levelsGained > 0) {
    console.log(`Level up! Now level ${data.newLevel}`);
  }
  
  // Check for streak milestone
  if (data.streakMilestoneReached) {
    console.log(`Streak milestone reached! ${data.currentStreak} day streak`);
  }
  
  // Access streak info
  console.log(`Last active date: ${data.streakInfo.lastActiveDate}`);
  console.log(`Hours until streak can increase: ${data.streakInfo.hoursUntilNewStreak}`);
} else {
  console.error('Error:', result.error);
}
```

### Get Streak Status

Retrieve the user's current streak information.

```typescript
import { gamificationApi } from '@hakgyo-expo-sdk';

// Get streak status with timezone support
const streakStatus = await gamificationApi.getStreakStatus('Asia/Jakarta');

if (streakStatus.success) {
  const { data } = streakStatus;
  console.log(`Current streak: ${data.currentStreak} days`);
  console.log(`Longest streak: ${data.longestStreak} days`);
  console.log(`Last active: ${data.lastActiveDate}`);
  console.log(`Hours until reset: ${data.hoursUntilReset}`);
  console.log(`Hours until new streak: ${data.hoursUntilNewStreak}`);
}
```

### Get Activity History

Retrieve user's activity history with filtering and pagination.

```typescript
import { gamificationApi } from '@hakgyo-expo-sdk';

// Get activity history
const history = await gamificationApi.getActivityHistory({
  page: 1,
  limit: 20,
  type: 'COMPLETE_VOCABULARY',
  from: '2025-01-01T00:00:00Z',
  to: '2025-01-31T23:59:59Z'
});

if (history.success) {
  console.log(`Total activities: ${history.data.pagination.total}`);
  history.data.data?.forEach(activity => {
    console.log(`${activity.type}: +${activity.xpEarned} XP`);
  });
}
```

### Get Leaderboard

Retrieve leaderboard rankings with filtering options.

```typescript
import { gamificationApi } from '@hakgyo-expo-sdk';

// Get weekly leaderboard for students
const leaderboard = await gamificationApi.getLeaderboard({
  scope: 'weekly',
  role: 'MURID',
  limit: 10
});

if (leaderboard.success) {
  const { leaderboard: topUsers, currentUser, meta } = leaderboard.data;
  
  // Display top users
  topUsers.forEach(entry => {
    console.log(`#${entry.rank} ${entry.user.name}: ${entry.stats.xp} XP`);
  });
  
  // Display current user's position
  if (currentUser) {
    console.log(`Your rank: #${currentUser.rank}`);
    console.log(`Your XP this week: ${currentUser.stats.periodXP}`);
  }
}
```

## Event Types & XP Values

All available game events and their XP rewards:

### Learning Activities
| Event Type           | XP Value | Description                          |
|----------------------|----------|--------------------------------------|
| `COMPLETE_MATERI`      | 10       | Complete a materi/lesson             |
| `COMPLETE_SOAL`        | 15       | Complete a quiz/question set         |
| `COMPLETE_VOCABULARY`  | 5        | Complete vocabulary practice         |
| `COMPLETE_ASSESSMENT`  | 25       | Complete a formal assessment         |

### Daily Engagement
| Event Type      | XP Value | Description                 |
|-----------------|----------|-----------------------------|
| `DAILY_LOGIN`     | 5        | First login of day      |

### Social Activities
| Event Type      | XP Value | Description                 |
|-----------------|----------|-----------------------------|
| `CREATE_POST`     | 10       | Create a discussion post    |
| `LIKE_POST`       | 2        | Like a post                 |
| `COMMENT_POST`    | 5        | Comment on a post           |

### Class Activities
| Event Type   | XP Value | Description              |
|--------------|----------|--------------------------|
| `JOIN_KELAS`   | 20       | Join a new class         |

### Achievement Bonuses
| Event Type        | XP Value | Description                      |
|-------------------|----------|----------------------------------|
| `PERFECT_SCORE`     | 30       | Achieve 100% on assessment       |
| `STREAK_MILESTONE`  | 50       | Reach a streak milestone         |

## Type Definitions

### GameEvent

```typescript
type GameEvent = 
  | 'COMPLETE_MATERI'
  | 'COMPLETE_SOAL'
  | 'COMPLETE_VOCABULARY'
  | 'DAILY_LOGIN'
  | 'CREATE_POST'
  | 'LIKE_POST'
  | 'COMMENT_POST'
  | 'JOIN_KELAS'
  | 'COMPLETE_ASSESSMENT'
  | 'PERFECT_SCORE'
  | 'STREAK_MILESTONE';
```

### LevelProgress

```typescript
interface LevelProgress {
  currentLevel: number;      // Current level
  currentXP: number;        // XP earned in current level
  xpForCurrentLevel: number; // XP required for current level
  xpForNextLevel: number;    // XP required for next level
  xpProgress: number;        // Progress percentage (0-100)
  xpRemaining: number;       // XP remaining to next level
}
```

### GamificationResult

```typescript
interface GamificationResult {
  success: boolean;
  data?: {
    event: GameEvent;              // The event that was processed
    baseXP: number;               // Base XP value for the event
    streakBonus: number;          // Additional XP from streak multiplier
    totalXP: number;              // Total XP awarded (baseXP + streakBonus)
    previousLevel: number;         // User's level before this event
    newLevel: number;             // User's level after this event
    levelsGained: number;         // Number of levels gained (0 if no level up)
    currentStreak: number;        // Current daily streak count
    streakMilestoneReached: boolean; // Whether a streak milestone was reached
    levelProgress: LevelProgress;  // Detailed progress information
    streakInfo: {
      hoursUntilReset: number;     // Hours until streak resets
      hoursUntilNewStreak: number; // Hours until user can add to streak
      lastActive: string | null;   // ISO timestamp of last activity
      lastActiveDate: string | null; // YYYY-MM-DD in user's timezone
    };
    activityId?: string;          // ID of the created activity log entry
  };
  error?: string;
}
```

### ProcessEventRequest

```typescript
interface ProcessEventRequest {
  event: GameEvent;
  metadata?: Record<string, any>;
  userTimeZone?: string;      // User's timezone (e.g., 'Asia/Jakarta')
  gracePeriodHours?: number;  // Grace period after midnight (default: 4)
}
```

### StreakStatusResponse

```typescript
interface StreakStatusResponse {
  success: boolean;
  data?: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null; // YYYY-MM-DD format
    hoursUntilReset: number;
    hoursUntilNewStreak: number;
  };
  error?: string;
}
```

### ActivityLog

```typescript
interface ActivityLog {
  id: string;
  type: string;              // Activity type
  description?: string;       // Human-readable description
  xpEarned?: number;        // XP earned from this activity
  streakUpdated: boolean;    // Whether streak was updated
  previousStreak?: number;   // Streak before this activity
  newStreak?: number;        // Streak after this activity
  previousLevel?: number;   // Level before this activity
  newLevel?: number;        // Level after this activity
  metadata?: Record<string, any>; // Additional event-specific data
  createdAt: string;         // ISO timestamp
}
```

### LeaderboardResponse

```typescript
interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];  // Array of top users
  currentUser?: {                 // Current user's ranking
    rank: number;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: string;
    };
    stats: LeaderboardUserStats;
  };
  meta: {
    scope: LeaderboardScope;     // Time scope used
    role?: string;               // Role filter applied
    totalInTop: number;          // Number of users in top list
    userPosition?: number;        // Current user's position
    isInTop: boolean;            // Whether current user is in top list
  };
}
```

### LeaderboardUser

```typescript
interface LeaderboardUser {
  rank: number;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
  };
  stats: {
    xp: number;              // Total XP
    level: number;            // Current level
    currentStreak: number;     // Current streak
    lastActive: string;       // ISO timestamp of last activity
    periodXP?: number;        // XP earned in specified time period
  };
}
```

## Common Use Cases

### 1. Tracking Learning Activities

```typescript
import { gamificationApi } from '@hakgyo-expo-sdk';

// When user completes a materi
const result = await gamificationApi.processEvent({
  event: 'COMPLETE_MATERI',
  metadata: { materiId: 123, kelasId: 45 }
});

// When user completes vocabulary practice
const result = await gamificationApi.processEvent({
  event: 'COMPLETE_VOCABULARY',
  metadata: { itemId: 789, collectionId: 12 }
});
```

### 2. Displaying User Progress

```typescript
import React, { useEffect, useState } from 'react';
import { gamificationApi } from '@hakgyo-expo-sdk';

export function UserProgress() {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  async function loadRecentActivity() {
    const response = await gamificationApi.getActivityHistory({
      page: 1,
      limit: 10
    });
    if (response.success) {
      setHistory(response.data);
    }
  }

  if (!history) return null;

  return (
    <View>
      <Text>Recent Activity</Text>
      {history.data.map(activity => (
        <Text key={activity.id}>
          {activity.type}: +{activity.xpEarned} XP
        </Text>
      ))}
    </View>
  );
}
```

### 3. Showing Leaderboard

```typescript
import React, { useEffect, useState } from 'react';
import { gamificationApi } from '@hakgyo-expo-sdk';

export function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState(null);
  const [scope, setScope] = useState('weekly');

  useEffect(() => {
    loadLeaderboard();
  }, [scope]);

  async function loadLeaderboard() {
    const response = await gamificationApi.getLeaderboard({ scope, limit: 10 });
    if (response.success) {
      setLeaderboard(response.data);
    }
  }

  if (!leaderboard) return null;

  return (
    <View>
      <Text>Leaderboard ({scope})</Text>
      {leaderboard.leaderboard.map(entry => (
        <Text key={entry.user.id}>
          #{entry.rank} {entry.user.name}: {entry.stats.xp} XP
        </Text>
      ))}
    </View>
  );
}
```

### 4. Handling Level Up Notifications

```typescript
import { gamificationApi } from '@hakgyo-expo-sdk';

async function handleActivityComplete(eventType: string, metadata: any) {
  const result = await gamificationApi.processEvent({
    event: eventType,
    metadata
  });

  if (result.success && result.data) {
    // Show XP earned
    showToast(`+${result.data.totalXP} XP`);
    
    // Show level up notification
    if (result.data.levelsGained > 0) {
      showLevelUpModal({
        newLevel: result.data.newLevel,
        previousLevel: result.data.previousLevel
      });
    }
    
    // Show streak milestone notification
    if (result.data.streakMilestoneReached) {
      showStreakMilestoneModal(result.data.currentStreak);
    }
  }
}
```

### 5. Displaying Streak Information

```typescript
import React, { useEffect, useState } from 'react';
import { gamificationApi } from '@hakgyo-expo-sdk';

export function StreakDisplay() {
  const [streakStatus, setStreakStatus] = useState(null);

  useEffect(() => {
    loadStreakStatus();
  }, []);

  async function loadStreakStatus() {
    // Pass user's timezone for accurate display
    const response = await gamificationApi.getStreakStatus('Asia/Jakarta');
    if (response.success) {
      setStreakStatus(response.data);
    }
  }

  if (!streakStatus) return null;

  return (
    <View>
      <Text>🔥 {streakStatus.currentStreak} day streak</Text>
      <Text>Longest: {streakStatus.longestStreak} days</Text>
      {streakStatus.hoursUntilReset > 0 && (
        <Text>Resets in {Math.ceil(streakStatus.hoursUntilReset)} hours</Text>
      )}
    </View>
  );
}
```

## Error Handling

All SDK methods return an `ApiResponse` object:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

Example:

```typescript
const response = await gamificationApi.processEvent({
  event: 'COMPLETE_VOCABULARY',
  metadata: { itemId: 123 }
});

if (response.success) {
  console.log('Event processed:', response.data);
} else {
  console.error('Error:', response.error);
  // Handle specific errors
  if (response.error === 'User not found') {
    // Redirect to login
  } else if (response.error === 'Invalid or missing event type') {
    // Show error to user
  }
}
```

## Authentication

All gamification endpoints **require authentication**. Make sure the user is logged in before calling gamification methods.

```typescript
import { getSession } from '@hakgyo-expo-sdk/auth';

// Check if user is authenticated
const session = await getSession();

if (session) {
  // User is authenticated, can call gamification methods
  const result = await gamificationApi.processEvent({
    event: 'COMPLETE_MATERI',
    metadata: { materiId: 123 }
  });
} else {
  // User is not authenticated, redirect to login
  router.push('/login');
}
```

## Timezone Best Practices

For accurate streak calculation, always pass the user's timezone when processing events:

```typescript
import { gamificationApi } from '@hakgyo-expo-sdk';

// Get user's timezone (e.g., from device settings or user profile)
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Process event with timezone
const result = await gamificationApi.processEvent({
  event: 'DAILY_LOGIN',
  userTimeZone,
  gracePeriodHours: 4 // Optional: customize grace period
});
```

## Related Documentation

- [SDK Overview](./README.md) - General SDK information
- [API Routes](./api-routes.md) - Backend API documentation
- [Vocabulary SDK Usage](./api-vocabulary.md) - Vocabulary-specific operations
