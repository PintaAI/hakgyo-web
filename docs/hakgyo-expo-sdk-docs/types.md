# HakgyoExpo SDK - Types Reference

The HakgyoExpo SDK provides a comprehensive set of TypeScript types for building Korean learning applications. All types are exported from the main SDK package and can be imported directly.

## Overview

The SDK types are organized into several categories:

- **Authentication Types** - User, Session, and auth-related types
- **API Types** - Response wrappers, pagination, and query parameters
- **Model Types** - Domain models for Kelas, Materi, Vocabulary, etc.
- **Error Types** - Error codes and error handling types

All types are available from the main export:

```typescript
import {
  User,
  Session,
  ApiResponse,
  PaginatedResponse,
  Kelas,
  VocabularySet,
  // ... and more
} from 'hakgyo-expo-sdk';
```

---

## Authentication Types

Located in [`types/auth.ts`](../../packages/hakgyo-expo-sdk/src/types/auth.ts)

### UserRole

```typescript
export type UserRole = 'MURID' | 'GURU' | 'ADMIN';
```

User roles in the system:
- `MURID` - Student (default role)
- `GURU` - Teacher
- `ADMIN` - Administrator

### UserTier

```typescript
export type UserTier = 'FREE' | 'PREMIUM' | 'CUSTOM';
```

User subscription tiers:
- `FREE` - Free tier users
- `PREMIUM` - Premium subscribers
- `CUSTOM` - Custom tier (institutional accounts)

### User

```typescript
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
  image?: string;
  bio?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
  // Computed/derived fields (not from API)
  accessTier?: UserTier;
}
```

The main user object containing profile information and gamification stats.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique user identifier |
| `email` | `string` | User's email address |
| `name` | `string?` | Display name |
| `role` | `UserRole` | User's role (MURID, GURU, ADMIN) |
| `currentStreak` | `number` | Current daily login streak |
| `longestStreak` | `number` | Longest streak ever achieved |
| `xp` | `number` | Total experience points |
| `level` | `number` | Current user level |
| `image` | `string?` | Profile picture URL |
| `bio` | `string?` | User biography |
| `emailVerified` | `boolean` | Whether email is verified |
| `createdAt` | `string` | Account creation timestamp (ISO) |
| `updatedAt` | `string` | Last update timestamp (ISO) |
| `lastActive` | `string?` | Last activity timestamp (ISO) |
| `accessTier` | `UserTier?` | Computed access tier |

### Session

```typescript
export interface Session {
  user: User;
  token: string;
  expiresAt: string;
  createdAt: string;
}
```

Authentication session object.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `user` | `User` | The authenticated user |
| `token` | `string` | JWT authentication token |
| `expiresAt` | `string` | Session expiration timestamp (ISO) |
| `createdAt` | `string` | Session creation timestamp (ISO) |

### Auth Response Types

#### SignInResponse

```typescript
export interface SignInResponse {
  success: boolean;
  session?: Session;
  error?: string;
}
```

Response from sign-in operations.

#### SignUpResponse

```typescript
export interface SignUpResponse {
  success: boolean;
  session?: Session;
  error?: string;
}
```

Response from sign-up operations.

#### SignOutResponse

```typescript
export interface SignOutResponse {
  success: boolean;
  error?: string;
}
```

Response from sign-out operations.

### Social Authentication Types

#### SocialProvider

```typescript
export type SocialProvider = 'google' | 'github' | 'discord' | 'apple' | 'facebook';
```

Supported social login providers.

#### SocialSignInParams

```typescript
export interface SocialSignInParams {
  provider: SocialProvider;
  callbackURL?: string;
  callbackOptions?: {
    redirectTo?: string;
    force?: boolean;
  };
}
```

Parameters for social sign-in flow.

#### SocialSignInResponse

```typescript
export interface SocialSignInResponse extends SignInResponse {
  redirectURL?: string;
}
```

Response from social sign-in (includes OAuth redirect URL if needed).

#### GoogleSignInData

```typescript
export interface RawGoogleSignInData {
  idToken: string | null;
  serverAuthCode?: string | null;
  scopes?: string[];
  user: {
    id: string;
    email: string;
    name: string | null;
    photo: string | null;
    givenName: string | null;
    familyName: string | null;
  };
}

export interface LegacyGoogleSignInData {
  idToken: string;
  serverAuthCode?: string;
  scopes?: string[];
  user?: {
    email: string;
    name: string;
    photo?: string;
    givenName?: string;
    familyName?: string;
    id: string;
  };
}

export type GoogleSignInData = RawGoogleSignInData | LegacyGoogleSignInData;
```

Google Sign-In data types. Supports both raw data from `@react-native-google-signin/google-signin` and legacy format for backward compatibility.

---

## API Types

Located in [`types/api.ts`](../../packages/hakgyo-expo-sdk/src/types/api.ts)

### ApiResponse<T>

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

Generic API response wrapper used by all API endpoints.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `success` | `boolean` | Whether the request succeeded |
| `data` | `T?` | Response data (generic) |
| `error` | `string?` | Error message if failed |
| `message` | `string?` | Optional success message |

### PaginatedResponse<T>

```typescript
export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginatedMeta;
  streakInfo?: StreakInfo;
}
```

Paginated response for list endpoints.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `pagination.page` | `number` | Current page number |
| `pagination.limit` | `number` | Items per page |
| `pagination.total` | `number` | Total items available |
| `pagination.totalPages` | `number` | Total number of pages |
| `streakInfo` | `StreakInfo?` | Daily streak information |

### QueryParams

```typescript
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}
```

Standard query parameters for list endpoints.

### KoleksiSoalQueryParams

```typescript
export interface KoleksiSoalQueryParams extends QueryParams {
  userId?: string;
  kelasId?: string;
  onlyJoinedClasses?: boolean;
  isPrivate?: string;
  isDraft?: string;
}
```

Query parameters for question collection endpoints.

### SoaresQueryParams

```typescript
export interface SoaresQueryParams extends QueryParams {
  authorId?: string;
  koleksiSoalId?: string;
}
```

Query parameters for question (soal) endpoints.

---

## Gamification Types

Located in [`types/api.ts`](../../packages/hakgyo-expo-sdk/src/types/api.ts)

### GameEvent

```typescript
export type GameEvent =
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

Events that trigger XP rewards.

### LevelProgress

```typescript
export interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  xpRemaining: number;
}
```

User's level progress information.

### GamificationResult

```typescript
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
    levelProgress: LevelProgress;
    streakInfo: {
      hoursUntilReset: number;
      hoursUntilNewStreak: number;
      lastActive: string | null;
    };
    activityId?: string;
  };
  error?: string;
}
```

Result from processing a gamification event.

### StreakInfo

```typescript
export interface StreakInfo {
  hoursUntilReset: number;
  hoursUntilNewStreak: number;
  currentStreak: number;
  lastActive: string | null;
}
```

Daily streak information.

### Leaderboard Types

```typescript
export type LeaderboardScope = 'weekly' | 'monthly' | 'alltime';

export interface LeaderboardUserStats {
  xp: number;
  level: number;
  currentStreak: number;
  lastActive: string;
  periodXP?: number;
}

export interface LeaderboardUser {
  rank: number;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
  };
  stats: LeaderboardUserStats;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
  currentUser?: {
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
    scope: LeaderboardScope;
    role?: string;
    totalInTop: number;
    userPosition?: number;
    isInTop: boolean;
  };
}

export interface LeaderboardParams {
  scope?: LeaderboardScope;
  role?: string;
  limit?: number;
}
```

Leaderboard-related types for ranking and competition features.

---

## Model Types

Located in [`types/models.ts`](../../packages/hakgyo-expo-sdk/src/types/models.ts)

### Kelas (Class/Course)

```typescript
export interface Kelas {
  id: number;
  title: string;
  description?: string;
  jsonDescription?: any;
  htmlDescription?: string;
  type: 'REGULAR' | 'EVENT' | 'GROUP' | 'PRIVATE' | 'FUN';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  thumbnail?: string;
  icon?: string;
  isPaidClass: boolean;
  price?: string;
  discount?: string;
  promoCode?: string;
  isDraft: boolean;
  authorId: string;
  author?: User;
  createdAt: string;
  updatedAt: string;
  isEnrolled?: boolean;
}
```

Represents a class/course in the platform.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Unique class identifier |
| `title` | `string` | Class title |
| `description` | `string?` | Plain text description |
| `jsonDescription` | `any?` | Rich content in JSON format |
| `htmlDescription` | `string?` | HTML formatted description |
| `type` | `KelasType` | Class type |
| `level` | `KelasLevel` | Difficulty level |
| `thumbnail` | `string?` | Class thumbnail URL |
| `icon` | `string?` | Class icon |
| `isPaidClass` | `boolean` | Whether it's a paid class |
| `price` | `string?` | Class price |
| `discount` | `string?` | Discount price |
| `promoCode` | `string?` | Promotion code |
| `isDraft` | `boolean` | Draft status |
| `authorId` | `string` | Creator's user ID |
| `author` | `User?` | Author details (optional relation) |
| `createdAt` | `string` | Creation timestamp |
| `updatedAt` | `string` | Last update timestamp |

### Materi (Material)

```typescript
export interface Materi {
  id: number;
  title: string;
  description: string;
  jsonDescription: any;
  htmlDescription: string;
  order: number;
  isDemo: boolean;
  isDraft: boolean;
  koleksiSoalId?: number;
  passingScore?: number;
  kelasId: number;
  kelas?: Kelas;
  createdAt: string;
  updatedAt: string;
}
```

Represents learning material within a class.

### VocabularySet

```typescript
export interface VocabularySet {
  id: number;
  title: string;
  description?: string;
  icon?: string;
  isPublic: boolean;
  isDraft: boolean;
  userId?: string;
  kelasId?: number;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  learnedCount?: number;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  kelas?: {
    id: number;
    title: string;
    type: 'REGULAR' | 'EVENT' | 'GROUP' | 'PRIVATE' | 'FUN';
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    thumbnail?: string;
    isDraft?: boolean;
    author?: {
      id: string;
      name: string;
      image?: string;
    };
  };
}
```

A collection of vocabulary items.

### VocabularyItem

```typescript
export interface VocabularyItem {
  id: number;
  korean: string;
  indonesian: string;
  type: 'WORD' | 'SENTENCE' | 'IDIOM';
  pos?: 'KATA_KERJA' | 'KATA_BENDA' | 'KATA_SIFAT' | 'KATA_KETERANGAN';
  audioUrl?: string;
  exampleSentences: string[];
  order: number;
  creatorId: string;
  collectionId?: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  collection?: {
    id: number;
    title: string;
    description?: string;
    icon?: string;
    isPublic: boolean;
    kelasVocabularySets?: Array<{
      id: number;
      kelasId: string;
      vocabularySetId: number;
      kelas?: {
        id: string;
        title: string;
      };
    }>;
  };
}
```

A single vocabulary item with Korean-Indonesian translations.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Unique item identifier |
| `korean` | `string` | Korean word/phrase |
| `indonesian` | `string` | Indonesian translation |
| `type` | `VocabType` | Item type (WORD, SENTENCE, IDIOM) |
| `pos` | `PartOfSpeech?` | Part of speech |
| `audioUrl` | `string?` | Audio pronunciation URL |
| `exampleSentences` | `string[]` | Example sentences |
| `order` | `number` | Display order |
| `creatorId` | `string` | Creator's user ID |
| `collection` | `object?` | Collection details with optional `kelasVocabularySets` for class associations |

### VocabularyItemProgress

```typescript
export interface VocabularyItemProgress {
  id: number;
  itemId: number;
  userId: string;
  isLearned: boolean;
  learnedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  item?: VocabularyItem;
}
```

User's learning progress for a vocabulary item.

### Question Types (Soal)

#### Soares

```typescript
export interface Soares {
  id: number;
  koleksiSoalId: number;
  authorId: string;
  pertanyaan: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  explanation?: string;
  isActive: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
  opsis: Opsi[];
  attachments: SoaresAttachment[];
  koleksiSoal?: {
    nama: string;
    deskripsi?: string;
  };
}
```

A question in a question collection.

#### Opsi (Option)

```typescript
export interface Opsi {
  id: number;
  soalId: number;
  opsiText: string;
  isCorrect: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  attachments?: OpsiAttachment[];
}
```

An answer option for a question.

#### SoaresAttachment

```typescript
export interface SoaresAttachment {
  id: number;
  soalId: number;
  url: string;
  type: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

Attachment for a question (image, audio, etc.).

#### KoleksiSoal (Question Collection)

```typescript
export interface KoleksiSoal {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

A collection of questions (quiz/exam).

### Tryout Types

#### TryoutStatus

```typescript
export type TryoutStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'CANCELLED';
```

Status of a tryout attempt.

#### Tryout

```typescript
export interface Tryout {
  id: number;
  nama: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  passingScore: number;
  koleksiSoalId: number;
  isActive: boolean;
  guruId: string;
  createdAt: string;
  updatedAt: string;
  guru?: {
    id: string;
    name: string;
    image?: string;
  };
  koleksiSoal?: {
    id: number;
    nama: string;
    soals: Soares[];
  };
}
```

A timed test/exam.

#### TryoutResult

```typescript
export interface TryoutResult {
  id: number;
  score: number;
  correctCount: number;
  totalCount: number;
  timeTakenSeconds?: number;
  passed?: boolean;
  details?: any;
}
```

Result of a tryout attempt.

#### TryoutParticipant

```typescript
export interface TryoutParticipant {
  id: number;
  tryoutId: number;
  userId: string;
  status: TryoutStatus;
  score: number;
  startedAt?: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  tryout?: Tryout;
  answers?: TryoutAnswer[];
}
```

A participant in a tryout.

#### TryoutAnswer

```typescript
export interface TryoutAnswer {
  id: number;
  participantId: number;
  soalId: number;
  opsiId?: number;
  isCorrect: boolean;
  createdAt: string;
  updatedAt: string;
}
```

An answer submitted for a tryout question.

### Post Types

#### Post

```typescript
export interface Post {
  id: number;
  title: string;
  description?: string;
  jsonDescription?: any;
  htmlDescription: string;
  type: 'DISCUSSION' | 'ANNOUNCEMENT' | 'QUESTION' | 'SHARE' | 'TUTORIAL';
  isPublished: boolean;
  isPinned: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: User;
  kelasId?: number;
  userLiked?: boolean;
}
```

A post in the community feed.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Unique post identifier |
| `title` | `string` | Post title |
| `description` | `string?` | Plain text description |
| `jsonDescription` | `any?` | Rich content in JSON |
| `htmlDescription` | `string?` | HTML formatted content |
| `type` | `PostType` | Post category |
| `isPublished` | `boolean` | Publication status |
| `isPinned` | `boolean` | Pinned status |
| `viewCount` | `number` | View count |
| `likeCount` | `number` | Like count |
| `commentCount` | `number` | Comment count |
| `shareCount` | `number` | Share count |
| `tags` | `string[]` | Post tags |
| `authorId` | `string` | Author's user ID |
| `author` | `User?` | Author details |
| `kelasId` | `number?` | Associated class ID |

#### Comment

```typescript
export interface Comment {
  id: number;
  content: string;
}
```

A comment on a post.

### Live Session Types

#### LiveSession

```typescript
export interface LiveSession {
  id: string;
  name: string;
  description?: string;
  streamCallId?: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  scheduledStart: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  kelasId: number;
}
```

A live streaming session.

---

## Error Types

Located in [`types/errors.ts`](../../packages/hakgyo-expo-sdk/src/types/errors.ts)

### ErrorCodes

```typescript
export const ErrorCodes = {
  // Auth Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  
  // API Errors
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  OFFLINE: 'OFFLINE',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

Standardized error codes for the SDK.

---

## Usage Examples

### Working with API Responses

```typescript
import { ApiResponse, PaginatedResponse, Kelas } from 'hakgyo-expo-sdk';

// Handle standard API response
function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error || 'Unknown error');
  }
  return response.data as T;
}

// Handle paginated response
function handlePaginatedKelas(response: PaginatedResponse<Kelas>): void {
  console.log(`Page ${response.pagination.page} of ${response.pagination.totalPages}`);
  console.log(`Total items: ${response.pagination.total}`);
  
  response.data.forEach(kelas => {
    console.log(kelas.title);
  });
  
  // Streak info is included
  if (response.streakInfo) {
    console.log(`Current streak: ${response.streakInfo.currentStreak}`);
  }
}
```

### Type-Safe API Calls

```typescript
import { ApiResponse, PaginatedResponse, VocabularyItem, QueryParams } from 'hakgyo-expo-sdk';

// Using the SDK's typed API methods
const params: QueryParams = {
  page: 1,
  limit: 20,
  search: 'korean',
  sortBy: 'title',
  sortOrder: 'asc'
};

const response = await vocabularyApi.listItems(params);
if (response.success && response.data) {
  const items: VocabularyItem[] = response.data;
  items.forEach(item => {
    console.log(`${item.korean} - ${item.indonesian}`);
  });
}
```

### User Authentication Flow

```typescript
import { 
  User, 
  Session, 
  SignInResponse, 
  UserRole,
  UserTier 
} from 'hakgyo-expo-sdk';

// Type guard for checking user role
function isTeacher(user: User): boolean {
  return user.role === 'GURU';
}

function isAdmin(user: User): boolean {
  return user.role === 'ADMIN';
}

function checkAccessTier(user: User): UserTier {
  return user.accessTier || 'FREE';
}

// Handle session
function handleSession(session: Session): void {
  const { user, token, expiresAt } = session;
  
  // Check if session is about to expire
  const expiresAtDate = new Date(expiresAt);
  const now = new Date();
  const hoursUntilExpiry = (expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilExpiry < 24) {
    console.warn('Session expiring soon');
  }
  
  // Access user gamification data
  console.log(`Level ${user.level} - ${user.xp} XP`);
  console.log(`Streak: ${user.currentStreak} days`);
}
```

### Working with Tryouts

```typescript
import { 
  Tryout, 
  TryoutParticipant, 
  TryoutStatus,
  TryoutResult 
} from 'hakgyo-expo-sdk';

function checkTryoutStatus(participant: TryoutParticipant): string {
  switch (participant.status) {
    case 'IN_PROGRESS':
      return 'Tryout in progress';
    case 'SUBMITTED':
      return `Submitted - Score: ${participant.score}`;
    case 'EXPIRED':
      return 'Tryout expired';
    case 'CANCELLED':
      return 'Tryout cancelled';
    default:
      return 'Unknown status';
  }
}

function calculatePass(tryout: Tryout, result: TryoutResult): boolean {
  return result.score >= tryout.passingScore;
}
```

### Gamification Integration

```typescript
import { 
  GameEvent, 
  GamificationResult, 
  LevelProgress,
  LeaderboardResponse,
  LeaderboardScope 
} from 'hakgyo-expo-sdk';

const events: GameEvent[] = [
  'COMPLETE_MATERI',
  'COMPLETE_SOAL',
  'DAILY_LOGIN',
  'JOIN_KELAS'
];

function processGameEvent(result: GamificationResult): void {
  if (!result.success || !result.data) {
    console.error(result.error);
    return;
  }
  
  const { event, totalXP, newLevel, levelsGained, streakInfo } = result.data;
  
  console.log(`Event: ${event}`);
  console.log(`XP earned: ${totalXP}`);
  
  if (levelsGained > 0) {
    console.log(`🎉 Level up! Now level ${newLevel}`);
  }
  
  if (streakInfo) {
    console.log(`🔥 ${streakInfo.currentStreak} day streak`);
  }
}

async function fetchLeaderboard(scope: LeaderboardScope): Promise<void> {
  const response = await gamificationApi.getLeaderboard({ scope });
  
  if (response.success && response.data) {
    const { leaderboard, currentUser, meta } = response.data;
    
    console.log(`Leaderboard (${meta.scope}):`);
    leaderboard.forEach((entry, index) => {
      console.log(`${entry.rank}. ${entry.user.name} - ${entry.stats.xp} XP`);
    });
    
    if (currentUser) {
      console.log(`Your rank: ${currentUser.rank}`);
    }
  }
}
```

---

## Type Guards

The SDK provides several utility functions for runtime type checking. These are available in the auth and session management modules.

### Session Expiration Check

Located in [`auth/session.ts`](../../packages/hakgyo-expo-sdk/src/auth/session.ts):

```typescript
// Internal method - used by SessionManager
private isExpired(session: Session): boolean {
  return new Date(session.expiresAt).getTime() < Date.now();
}
```

You can create your own type guard for session validation:

```typescript
import { Session } from 'hakgyo-expo-sdk';

function isValidSession(session: Session | null): session is Session {
  if (!session) return false;
  
  // Check if session has required properties
  if (!session.token || !session.user) return false;
  
  // Check expiration
  return new Date(session.expiresAt).getTime() > Date.now();
}

// Usage
const session = await sessionManager.getSession();
if (isValidSession(session)) {
  console.log(`Welcome, ${session.user.name}!`);
} else {
  console.log('Please sign in');
}
```

### Google Sign-In Data Type Guard

Located in [`auth/client.ts`](../../packages/hakgyo-expo-sdk/src/auth/client.ts):

```typescript
// Internal check for raw vs legacy Google data
const isRawData = rawData.user &&
  rawData.user.name !== undefined &&
  // ... additional checks
```

For custom type guards, you can use the following patterns:

```typescript
import { User, UserRole, Post, VocabularyItem } from 'hakgyo-expo-sdk';

// Role checking
function hasRole(user: User, role: UserRole): boolean {
  return user.role === role;
}

// Vocabulary type checking
function isWord(item: VocabularyItem): boolean {
  return item.type === 'WORD';
}

function isSentence(item: VocabularyItem): boolean {
  return item.type === 'SENTENCE';
}

// Post type checking
function isAnnouncement(post: Post): boolean {
  return post.type === 'ANNOUNCEMENT';
}

function isPinnedPost(post: Post): boolean {
  return post.isPinned;
}
```

---

## Importing Types

All types can be imported from the main SDK package:

```typescript
// Import everything
import * as HakgyoTypes from 'hakgyo-expo-sdk';

// Import specific types
import {
  // Auth
  User,
  Session,
  UserRole,
  UserTier,
  SignInResponse,
  SignUpResponse,
  
  // API
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  GameEvent,
  GamificationResult,
  LeaderboardResponse,
  
  // Models
  Kelas,
  Materi,
  VocabularySet,
  VocabularyItem,
  Soares,
  KoleksiSoal,
  Tryout,
  TryoutResult,
  Post,
  Comment,
  LiveSession,
  
  // Errors
  ErrorCodes,
  ErrorCode
} from 'hakgyo-expo-sdk';
```

---

## Related Documentation

- [API Client](api-client.md) - Using the API client with typed responses
- [Authentication Guide](expo-sdk-auth-guide.md) - Complete authentication flow
- [Config](config.md) - SDK configuration