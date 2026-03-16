# User API Reference

The User API provides methods for managing user profiles, retrieving user data, and handling user-related content such as enrolled classes and tryout results.

## Installation

Ensure you have the SDK installed and configured:

```bash
npm install @hakgyo/expo-sdk
```

```typescript
import { userApi } from '@hakgyo/expo-sdk';
```

---

## Overview

The [`userApi`](packages/hakgyo-expo-sdk/src/api/user.ts:6) object provides the following functionality:

- **Profile Management**: Get and update the current user's profile
- **User Data Retrieval**: Fetch user information by ID
- **Class Management**: Retrieve classes a user is enrolled in
- **Tryout Results**: Fetch tryout results for any user
- **Push Notifications**: Register push tokens for notifications

---

## Available Methods

### `getProfile()`

Retrieves the current authenticated user's profile.

```typescript
const response = await userApi.getProfile();
```

**Parameters:** None

**Returns:** `Promise<ApiResponse<User>>`

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "MURID",
    "currentStreak": 5,
    "longestStreak": 15,
    "xp": 1250,
    "level": 12,
    "image": "https://example.com/avatar.jpg",
    "bio": "Korean language enthusiast",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-03-10T14:30:00Z",
    "lastActive": "2024-03-14T09:00:00Z"
  }
}
```

---

### `updateProfile(data)`

Updates the current user's profile with the provided data.

```typescript
const response = await userApi.updateProfile({
  name: 'John Smith',
  bio: 'Updated bio'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Partial<User>` | Partial user object containing fields to update |

**Returns:** `Promise<ApiResponse<User>>` - The updated user object

---

### `getClasses(userId)`

Retrieves all classes a user is enrolled in.

```typescript
const response = await userApi.getClasses('user-123');
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | The ID of the user whose classes to retrieve |

**Returns:** `Promise<ApiResponse<Kelas[], PaginatedMeta>>`

---

### `getTryoutResults(userId)`

Retrieves all tryout results for a specific user.

```typescript
const response = await userApi.getTryoutResults('user-123');
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | The ID of the user whose tryout results to retrieve |

**Returns:** `Promise<ApiResponse<TryoutResult[]>>`

---

### `registerPushToken(token, options?)`

Registers a push notification token for the current user to receive notifications.

```typescript
const response = await userApi.registerPushToken('ExponentPushToken[xxxxxxxxxxxx]', {
  deviceId: 'unique-device-id',
  deviceType: 'ios'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | `string` | The push token from Expo/React Native |
| `options` | `object` | Optional device ID and type ('ios' or 'android') |

**Returns:** `Promise<ApiResponse<any>>`

---

## Types

### `User`

The main user object representing a user in the system.

```typescript
import { User } from '@hakgyo/expo-sdk';
```

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the user |
| `email` | `string` | User's email address |
| `name` | `string?` | User's display name |
| `role` | [`UserRole`](#userrole) | The user's role in the system |
| `currentStreak` | `number` | Current consecutive days of activity |
| `longestStreak` | `number` | Longest consecutive days of activity |
| `xp` | `number` | Total experience points |
| `level` | `number` | User's current level |
| `image` | `string?` | URL to user's avatar image |
| `bio` | `string?` | User's biography |
| `emailVerified` | `boolean` | Whether the email has been verified |
| `createdAt` | `string` | ISO timestamp of account creation |
| `updatedAt` | `string` | ISO timestamp of last profile update |
| `lastActive` | `string?` | ISO timestamp of last activity |
| `accessTier` | [`UserTier`](#usertier)? | User's subscription tier |

---

### `UserRole`

The role of a user in the system.

```typescript
import { UserRole } from '@hakgyo/expo-sdk';
```

| Value | Description |
|-------|-------------|
| `'MURID'` | Student - default role for learners |
| `'GURU'` | Teacher - can create classes and content |
| `'ADMIN'` | Administrator - full system access |

---

### `UserTier`

The subscription tier of a user.

```typescript
import { UserTier } from '@hakgyo/expo-sdk';
```

| Value | Description |
|-------|-------------|
| `'FREE'` | Free tier with limited features |
| `'PREMIUM'` | Premium subscription with full access |
| `'CUSTOM'` | Custom tier for enterprise or special arrangements |

---

### `TryoutResult`

The result of a user's attempt at a tryout.

```typescript
import { TryoutResult } from '@hakgyo/expo-sdk';
```

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Unique identifier for the result |
| `tryoutId` | `number` | ID of the tryout |
| `userId` | `string` | ID of the user who took the tryout |
| `score` | `number` | Score achieved (percentage) |
| `totalQuestions` | `number` | Total number of questions |
| `correctAnswers` | `number` | Number of correct answers |
| `timeSpent` | `number` | Time spent in seconds |
| `submittedAt` | `string` | ISO timestamp of submission |
| `rank` | `number` | User's rank among all participants |
| `tryout` | `Tryout` | The tryout object with details |

---

## Usage Examples

### Fetching User Profile

```typescript
import { userApi } from '@hakgyo/expo-sdk';

async function fetchCurrentUser() {
  try {
    const user = await userApi.getProfile();
    console.log('User:', user.name);
    console.log('Level:', user.level);
    console.log('XP:', user.xp);
    console.log('Streak:', user.currentStreak);
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
}
```

### Updating Profile

```typescript
import { userApi } from '@hakgyo/expo-sdk';

async function updateUserProfile() {
  try {
    const updatedUser = await userApi.updateProfile({
      name: 'John Smith',
      bio: 'Learning Korean for 2 years',
      image: 'https://example.com/new-avatar.jpg'
    });
    
    console.log('Profile updated successfully!');
    console.log('New name:', updatedUser.name);
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
}
```

### Getting User Statistics

```typescript
import { userApi } from '@hakgyo/expo-sdk';

async function getUserStats(userId: string) {
  try {
    // Get user profile for stats
    const user = await userApi.getProfile();
    
    // Get enrolled classes
    const classes = await userApi.getClasses(userId);
    
    // Get tryout results
    const tryoutResults = await userApi.getTryoutResults(userId);
    
    // Calculate statistics
    const stats = {
      totalClasses: classes.length,
      totalTryouts: tryoutResults.length,
      averageScore: tryoutResults.length > 0
        ? tryoutResults.reduce((sum, r) => sum + r.score, 0) / tryoutResults.length
        : 0,
      level: user.level,
      xp: user.xp,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak
    };
    
    console.log('User Statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Failed to get user stats:', error);
  }
}
```

### Getting User's Enrolled Classes

```typescript
import { userApi } from '@hakgyo/expo-sdk';

async function getEnrolledClasses(userId: string) {
  try {
    const classes = await userApi.getClasses(userId);
    
    console.log(`Enrolled in ${classes.length} classes:`);
    classes.forEach((kelas, index) => {
      console.log(`${index + 1}. ${kelas.title} (${kelas.level})`);
    });
    
    return classes;
  } catch (error) {
    console.error('Failed to get classes:', error);
  }
}
```

### Setting Up Push Notifications

```typescript
import * as Notifications from 'expo-notifications';
import { userApi } from '@hakgyo/expo-sdk';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function setupPushNotifications() {
  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for notifications');
    return;
  }
  
  // Get push token
  const { data: pushToken } = await Notifications.getExpoPushTokenAsync();
  
  // Register with API
  try {
    await userApi.registerPushToken(pushToken);
    console.log('Push token registered successfully');
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}
```

---

## Error Handling

The User API may throw the following errors:

### Common Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `401 Unauthorized` | User is not authenticated | Ensure user is logged in before calling API |
| `403 Forbidden` | User doesn't have permission | Check user role permissions |
| `404 Not Found` | User or resource not found | Verify the user ID is correct |
| `500 Internal Server Error` | Server error | Try again later or contact support |

### Example Error Handling

```typescript
import { userApi } from '@hakgyo/expo-sdk';

async function safeGetProfile() {
  try {
    const user = await userApi.getProfile();
    return user;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.log('Please log in to continue');
    } else if (error.response?.status === 404) {
      console.log('User not found');
    } else {
      console.error('An error occurred:', error.message);
    }
    throw error;
  }
}
```

---

## Best Practices

### 1. Cache User Profile

Since user profile doesn't change frequently, cache it locally:

```typescript
// Simple in-memory cache
let cachedUser: User | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getUserProfile() {
  const now = Date.now();
  
  if (cachedUser && (now - cacheTime) < CACHE_DURATION) {
    return cachedUser;
  }
  
  cachedUser = await userApi.getProfile();
  cacheTime = now;
  
  return cachedUser;
}
```

### 2. Handle Missing Optional Fields

Always handle optional fields gracefully:

```typescript
function displayUserInfo(user: User) {
  const displayName = user.name || 'Anonymous';
  const avatarUrl = user.image || '/default-avatar.png';
  const bio = user.bio || 'No bio yet';
  
  console.log(`${displayName}: ${bio}`);
}
```

### 3. Validate User ID Before API Calls

Always validate user IDs before making requests:

```typescript
async function getUserData(userId: string) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }
  
  if (userId.length < 1) {
    throw new Error('User ID cannot be empty');
  }
  
  return userApi.getClasses(userId);
}
```

### 4. Use TypeScript for Better Type Safety

Leverage TypeScript types for autocompletion and type checking:

```typescript
import { userApi, User, UserRole } from '@hakgyo/expo-sdk';

function isTeacher(user: User): boolean {
  return user.role === 'GURU';
}

function isAdmin(user: User): boolean {
  return user.role === 'ADMIN';
}

// Usage
const user = await userApi.getProfile();
if (isTeacher(user)) {
  console.log('Teacher dashboard available');
}
```

### 5. Handle Network Errors Gracefully

Implement retry logic for network failures:

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError!;
}

// Usage
const user = await fetchWithRetry(() => userApi.getProfile());
```

---

## Related APIs

- [Kelas API](api-kelas.md) - Class management
- [Tryout API](api-tryout.md) - Tryout management
- [Client API](api-client.md) - API client configuration
- [Auth Guide](../expo-sdk-auth-guide.md) - Authentication setup