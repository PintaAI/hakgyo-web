# Tryout SDK Usage Guide

This guide explains how to use the Hakgyo Expo SDK for tryout (mock exam) operations.

## Overview

The tryout SDK provides methods for managing mock exams, participating in them, submitting answers, and viewing results. Tryouts are time-bound assessments created by teachers (guru) using question collections (koleksi soal).

## Key Concepts

### Tryout Lifecycle

A tryout follows this lifecycle:

1. **Creation**: Guru creates a tryout with a question collection, time limits, and scheduling
2. **Activation**: Guru activates the tryout (sets `isActive: true`)
3. **Participation**: Students join the tryout
4. **Submission**: Students submit their answers before the deadline
5. **Results**: Scores are calculated and gamification events are triggered

### Gamification Integration

When a user submits a tryout:
- **15 XP** is awarded for completing the quiz (via `COMPLETE_SOAL` event)
- **30 XP** bonus for perfect score (via `PERFECT_SCORE` event, only when score = 100%)
- Streak is updated based on activity
- Level progress is calculated
- Activity log is created

### Access Control

- **Guru (Teacher)**: Can create, update, activate/deactivate, and view all results
- **Murid (Student)**: Can view active tryouts, participate, submit answers, and view their own results

## API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/tryout` | GET | List tryouts with optional filters | No |
| `/api/tryout` | POST | Create a new tryout | Yes (Guru only) |
| `/api/tryout/{id}` | GET | Get a specific tryout with questions | No |
| `/api/tryout/{id}` | PUT | Update a tryout | Yes (Owner only) |
| `/api/tryout/{id}/participate` | POST | Join a tryout | Yes |
| `/api/tryout/{id}/submit` | POST | Submit tryout answers | Yes |
| `/api/tryout/{id}/results` | GET | Get tryout results | Yes |
| `/api/tryout/{id}/toggle-active` | PATCH | Toggle active status | Yes (Owner only) |

## SDK Methods

### List Tryouts

Get all tryouts with optional filtering.

```typescript
import { tryoutApi } from '@hakgyo-expo-sdk';

// List all active tryouts
const activeTryouts = await tryoutApi.listActive();

// List tryouts from user's joined kelas only (active only)
const myKelasTryouts = await tryoutApi.listMyKelas();

// List with custom filters
const filteredTryouts = await tryoutApi.list({
  guruId: 'user123',
  koleksiSoalId: 456,
  isActive: true,
  limit: 10,
  userjoinedkelas: true  // Filter by user's joined kelas
});
```

#### List Methods Reference

| Method | Description | Auth Required |
|--------|-------------|---------------|
| `list(params?)` | List tryouts with optional filters | No (unless `userjoinedkelas=true`) |
| `listActive()` | List only active tryouts | No |
| `listMyKelas()` | List active tryouts from user's joined kelas | Yes |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `guruId` | string | Filter by teacher/creator ID |
| `koleksiSoalId` | number | Filter by question collection ID |
| `kelasId` | number | Filter by class ID |
| `isActive` | boolean | Filter by active status |
| `limit` | number | Limit number of results |
| `userjoinedkelas` | boolean | Filter by user's joined kelas (requires auth) |

### Get Tryout Details

Get a specific tryout with all questions and options.

```typescript
import { tryoutApi } from '@hakgyo-expo-sdk';

// Get tryout by ID
const tryout = await tryoutApi.get(123);

if (tryout.success) {
  const { data } = tryout;
  console.log('Tryout:', data.nama);
  console.log('Start Time:', data.startTime);
  console.log('End Time:', data.endTime);
  console.log('Duration:', data.duration, 'minutes');
  console.log('Questions:', data.koleksiSoal.soals);
}
```

### Participate in Tryout

Join a tryout before submitting answers.

```typescript
import { tryoutApi } from '@hakgyo-expo-sdk';

// Participate in a tryout
const participant = await tryoutApi.participate(123);

if (participant.success) {
  const { data } = participant;
  console.log('Joined tryout at:', data.startTime);
  console.log('Participant ID:', data.id);
}
```

### Submit Tryout Answers

Submit answers for a tryout. This will calculate the score and trigger gamification events.

```typescript
import { tryoutApi } from '@hakgyo-expo-sdk';

// Submit answers
const answers = [
  { soalId: 1, opsiId: 3 },
  { soalId: 2, opsiId: 1 },
  { soalId: 3, opsiId: 2 },
  // ... more answers
];

const result = await tryoutApi.submit(123, answers);

if (result.success) {
  const { data } = result;
  console.log('Score:', data.score);
  console.log('Correct:', data.correctCount, '/', data.totalQuestions);
  
  // Check gamification rewards
  if (data.gamification) {
    console.log('XP earned:', data.gamification.quiz?.totalXP);
    if (data.gamification.perfectScore) {
      console.log('Perfect score bonus awarded!');
    }
  }
}
```

### Get Tryout Results

Get results for a tryout. Teachers see all results, students see only their own.

```typescript
import { tryoutApi } from '@hakgyo-expo-sdk';

// Get results for a tryout
const results = await tryoutApi.getResults(123);

if (results.success) {
  const { data } = results;
  
  // For teachers: array of all participants
  if (Array.isArray(data)) {
    data.forEach((participant, index) => {
      console.log(`#${index + 1} ${participant.user.name}: ${participant.score}`);
    });
  }
  // For students: single result object
  else {
    console.log('Your score:', data.score);
    console.log('Correct:', data.correctCount, '/', data.tryout.koleksiSoal._count.soals);
  }
}
```

## Type Definitions

### Tryout

```typescript
interface Tryout {
  id: number;
  nama: string;
  description?: string;      // Additional context/instructions
  startTime: string;        // ISO 8601 datetime
  endTime: string;          // ISO 8601 datetime
  duration: number;         // Duration in minutes
  maxAttempts: number;      // Maximum retry attempts (default: 1)
  shuffleQuestions: boolean; // Randomize question order (default: false)
  passingScore: number;     // Minimum score to pass (0-100, default: 60)
  koleksiSoalId: number;
  isActive: boolean;
  guruId: string;
  createdAt: string;
  updatedAt: string;
  
  // Optional relations
  guru?: {
    id: string;
    name: string;
    image?: string;
  };
  koleksiSoal?: {
    id: number;
    nama: string;
    soals: Soal[];
  };
}
```

### TryoutParticipant

```typescript
interface TryoutParticipant {
  id: number;
  tryoutId: number;
  userId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'CANCELLED';
  score: number;           // Final score (0-100)
  startedAt?: string;      // ISO 8601 datetime - when student started
  submittedAt?: string;     // ISO 8601 datetime - when submitted
  timeTakenSeconds?: number; // Actual time taken in seconds
  attemptCount: number;     // Current attempt number
  createdAt: string;
  updatedAt: string;
  
  // Optional relations
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  tryout?: Tryout;
  answers?: TryoutAnswer[]; // Individual answer records
}
```

### TryoutAnswer

```typescript
interface TryoutAnswer {
  id: number;
  participantId: number;
  soalId: number;
  opsiId?: number;        // Selected option (null if not answered)
  isCorrect: boolean;      // Whether the answer was correct
  createdAt: string;
  updatedAt: string;
}
```

### TryoutResult

```typescript
interface TryoutResult {
  id: number;
  score: number;             // Final score (0-100)
  correctCount: number;       // Number of correct answers
  totalCount: number;        // Total number of questions
  timeTakenSeconds?: number; // Time taken in seconds
  passed?: boolean;          // Whether score meets passing threshold
  details?: any;             // Additional result details
}
```

### Soal (Question)

```typescript
interface Soal {
  id: number;
  koleksiSoalId: number;
  authorId: string;
  pertanyaan: string;        // Question text
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  explanation?: string;      // Explanation for the answer
  isActive: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
  opsis: Opsi[];             // Answer options
  attachments: SoalAttachment[];
}
```

### Opsi (Answer Option)

```typescript
interface Opsi {
  id: number;
  soalId: number;
  opsiText: string;          // Option text
  isCorrect: boolean;        // Whether this is the correct answer
  order: number;
  createdAt: string;
  updatedAt: string;
  attachments: OpsiAttachment[];
}
```

## Complete Example

Here's a complete example of a tryout flow:

```typescript
import { tryoutApi } from '@hakgyo-expo-sdk';

async function completeTryoutFlow() {
  // 1. List active tryouts
  const activeTryouts = await tryoutApi.listActive();
  if (!activeTryouts.success) {
    console.error('Failed to fetch tryouts');
    return;
  }

  const tryout = activeTryouts.data[0];
  console.log('Selected tryout:', tryout.nama);

  // 2. Get tryout details with questions
  const details = await tryoutApi.get(tryout.id);
  if (!details.success) return;

  const questions = details.data.koleksiSoal.soals;
  console.log('Total questions:', questions.length);

  // 3. Participate in the tryout
  const participant = await tryoutApi.participate(tryout.id);
  if (!participant.success) return;

  console.log('Joined tryout at:', participant.data.startTime);

  // 4. User answers questions (simulated)
  const answers = questions.map((question, index) => ({
    soalId: question.id,
    opsiId: question.opsis[index % question.opsis.length].id // Simulated answer
  }));

  // 5. Submit answers
  const result = await tryoutApi.submit(tryout.id, answers);
  if (!result.success) return;

  console.log('Final score:', result.data.score);
  console.log('Correct:', result.data.correctCount, '/', result.data.totalQuestions);

  // 6. Check gamification rewards
  if (result.data.gamification) {
    const quizXP = result.data.gamification.quiz?.totalXP || 0;
    console.log('XP earned:', quizXP);
    
    if (result.data.gamification.perfectScore) {
      console.log('Perfect score bonus: +30 XP');
    }
  }

  // 7. Get results
  const results = await tryoutApi.getResults(tryout.id);
  if (results.success) {
    console.log('Results retrieved successfully');
  }
}
```

## Error Handling

The SDK uses a consistent response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

Always check the `success` property before accessing `data`:

```typescript
const result = await tryoutApi.get(123);

if (result.success) {
  // Access result.data safely
  const tryout = result.data;
} else {
  // Handle error
  console.error('Error:', result.error);
}
```

## Common Use Cases

### Create a Tryout (Teacher Only)

```typescript
// Note: This requires direct API client usage as it's not exposed in tryoutApi
import { apiClient } from '@hakgyo-expo-sdk';

const newTryout = await apiClient.post('/api/tryout', {
  nama: 'Korean Level 1 Mock Exam',
  description: 'This is a comprehensive test covering basic Korean grammar and vocabulary.',
  startTime: '2025-03-01T10:00:00Z',
  endTime: '2025-03-01T12:00:00Z',
  duration: 120,        // minutes
  maxAttempts: 2,      // Allow 2 attempts
  shuffleQuestions: true, // Randomize question order
  passingScore: 70,     // Need 70% to pass
  koleksiSoalId: 45,
  isActive: false
});
```

### Toggle Tryout Active Status (Teacher Only)

```typescript
// Note: This requires direct API client usage
import { apiClient } from '@hakgyo-expo-sdk';

const updated = await apiClient.patch(`/api/tryout/${id}/toggle-active`);
```

### Check if User Can Participate

Before participating, check if the tryout is active and within the time window:

```typescript
function canParticipate(tryout: Tryout): boolean {
  if (!tryout.isActive) return false;
  
  const now = new Date();
  const start = new Date(tryout.startTime);
  const end = new Date(tryout.endTime);
  
  return now >= start && now <= end;
}
```

### Calculate Time Remaining

```typescript
function getTimeRemaining(tryout: Tryout, participant?: TryoutParticipant): {
  endTime: number;      // Time until tryout closes (minutes)
  duration: number;     // Time until duration expires (minutes)
} {
  const now = new Date();
  const end = new Date(tryout.endTime);
  
  // Time until tryout closes
  const endTimeRemaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000 / 60));
  
  // Time until duration expires (if participant has started)
  let durationRemaining = endTimeRemaining;
  if (participant?.startedAt) {
    const started = new Date(participant.startedAt);
    const durationEnd = new Date(started.getTime() + tryout.duration * 60 * 1000);
    durationRemaining = Math.max(0, Math.floor((durationEnd.getTime() - now.getTime()) / 1000 / 60));
  }
  
  return {
    endTime: endTimeRemaining,
    duration: durationRemaining,
  };
}
```

### Check if Score Passed

```typescript
function didPass(tryout: Tryout, score: number): boolean {
  return score >= tryout.passingScore;
}
```

### Get Detailed Answers

```typescript
// Get detailed answer breakdown for a participant
const results = await tryoutApi.getResults(tryoutId);

if (results.success && !Array.isArray(results.data)) {
  const participant = results.data;
  
  if (participant.answers) {
    participant.answers.forEach(answer => {
      console.log(`Question ${answer.soalId}: ${answer.isCorrect ? 'Correct' : 'Incorrect'}`);
      console.log(`  Selected option: ${answer.opsiId}`);
    });
  }
  
  // Check if passed
  const passed = didPass(participant.tryout, participant.score);
  console.log(`Result: ${passed ? 'PASSED' : 'FAILED'} (${participant.score}/${participant.tryout.passingScore})`);
}
```

## Related Documentation

- [Gamification SDK Usage](./gamification-sdk-usage.md) - Learn about XP, levels, and streaks
- [Soal SDK Usage](./soal-sdk-usage.md) - Learn about question collections
- [API Endpoints](./sdk-overview.md) - Complete API reference
