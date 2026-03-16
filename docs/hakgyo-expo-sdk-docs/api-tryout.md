# Tryout API

The Tryout API provides comprehensive functionality for managing tests, quizzes, and exams in the Hakgyo platform. It enables teachers to create and manage tryouts while allowing students to participate, submit answers, and view their results.

## Overview

The Tryout API is part of the HakgyoExpo SDK and handles all tryout-related operations including:

- **Management**: Create, update, delete, and list tryouts
- **Participation**: Start/join tryouts and submit answers
- **Results**: Retrieve tryout results and performance data

## Installation

Ensure you have the SDK installed and configured:

```typescript
import { tryoutApi } from '@hakgyo/hakgyo-expo-sdk';
```

For setup instructions, see the [Configuration Guide](./config.md).

---

## Available Methods

### Get Tryout by ID

Retrieves detailed information about a specific tryout.

```typescript
const response = await tryoutApi.get(1);
```

**Parameters:**
- `id` (number): The unique identifier of the tryout

**Returns:** `Promise<ApiResponse<Tryout>>`

---

### List Tryouts

Retrieves a list of tryouts with optional filtering.

```typescript
const response = await tryoutApi.list(params?: ListTryoutsParams);
```

**Parameters:**
- `params` (optional): Filter options

**Returns:** `Promise<ApiResponse<Tryout[]>>`

---

### Create Tryout

Creates a new tryout (teacher only operation).

```typescript
const response = await tryoutApi.create(data: CreateTryoutDto);
```

**Parameters:**
- `data` (CreateTryoutDto): Tryout creation data

**Returns:** `Promise<ApiResponse<Tryout>>`

---

### Update Tryout

Updates an existing tryout (owner only).

```typescript
const response = await tryoutApi.update(id: number, data: UpdateTryoutDto);
```

**Parameters:**
- `id` (number): The tryout ID to update
- `data` (UpdateTryoutDto): Fields to update

**Returns:** `Promise<ApiResponse<Tryout>>`

---

### Delete Tryout

Deletes a tryout (owner only).

```typescript
const response = await tryoutApi.delete(id: number);
```

**Parameters:**
- `id` (number): The tryout ID to delete

**Returns:** `Promise<ApiResponse<void>>`

---

### Toggle Active Status

Toggles the active status of a tryout (owner only).

```typescript
const response = await tryoutApi.toggleActive(id: number);
```

**Parameters:**
- `id` (number): The tryout ID

**Returns:** `Promise<ApiResponse<Tryout>>`

---

### Participate in Tryout

Starts participation in a tryout. This creates a new attempt for the user.

```typescript
const response = await tryoutApi.participate(id: number);
```

**Parameters:**
- `id` (number): The tryout ID to participate in

**Returns:** `Promise<ApiResponse<TryoutParticipant>>`

---

### Submit Tryout Answers

Submits answers for a tryout attempt.

```typescript
const response = await tryoutApi.submit(tryoutId: number, answers: SubmitTryoutDto['answers']);
```

**Parameters:**
- `tryoutId` (number): The tryout ID
- `answers` (Array): Array of answer objects

**Returns:** `Promise<ApiResponse<TryoutResult>>`

---

### Get Tryout Results

Retrieves results for a tryout.

```typescript
const response = await tryoutApi.getResults(tryoutId: number);
```

**Parameters:**
- `tryoutId` (number): The tryout ID

**Returns:** `Promise<ApiResponse<TryoutResult | TryoutParticipant[]>>`

---

## Types

### Tryout

Represents a tryout/test entity.

```typescript
interface Tryout {
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
  // Optional relations
  guru?: {
    id: string;
    name: string;
    image?: string;
  };
  koleksiSoal?: {
    id: number;
    nama: string;
    soals: any[];
  };
}
```

---

### TryoutStatus

Status of a tryout participation.

```typescript
type TryoutStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'CANCELLED';
```

---

### TryoutParticipant

Represents a user's participation in a tryout.

```typescript
interface TryoutParticipant {
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
  // Optional relations
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  tryout?: Tryout;
  answers?: TryoutAnswer[];
}
```

---

### TryoutResult

Represents the result of a tryout attempt.

```typescript
interface TryoutResult {
  id: number;
  score: number;
  correctCount: number;
  totalCount: number;
  timeTakenSeconds?: number;
  passed?: boolean;
  details?: any;
}
```

---

### TryoutAnswer

Represents an individual answer in a tryout.

```typescript
interface TryoutAnswer {
  id: number;
  participantId: number;
  soalId: number;
  opsiId?: number;
  isCorrect: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

### CreateTryoutDto

Data transfer object for creating a tryout.

```typescript
interface CreateTryoutDto {
  nama: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  passingScore?: number;
  koleksiSoalId: number;
  isActive?: boolean;
}
```

---

### UpdateTryoutDto

Data transfer object for updating a tryout.

```typescript
interface UpdateTryoutDto {
  nama?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  passingScore?: number;
  isActive?: boolean;
}
```

---

### SubmitTryoutDto

Data transfer object for submitting tryout answers.

```typescript
interface SubmitTryoutDto {
  answers: Array<{
    soalId: number;
    opsiId: number;
  }>;
}
```

---

### ListTryoutsParams

Parameters for listing tryouts.

```typescript
interface ListTryoutsParams {
  guruId?: string;
  koleksiSoalId?: number;
  kelasId?: number;
  isActive?: boolean;
  limit?: number;
  userjoinedkelas?: boolean;
}
```

---

## Usage Examples

### Listing Available Tryouts

```typescript
import { tryoutApi } from '@hakgyo/hakgyo-expo-sdk';

async function getAvailableTryouts() {
  try {
    // Get all active tryouts from user's classes
    const tryouts = await tryoutApi.listMyKelas();
    
    console.log('Available Tryouts:');
    tryouts.forEach(tryout => {
      console.log(`- ${tryout.nama}`);
      console.log(`  Duration: ${tryout.duration} minutes`);
      console.log(`  Passing Score: ${tryout.passingScore}%`);
      console.log(`  Active: ${tryout.isActive ? 'Yes' : 'No'}`);
    });
    
    return tryouts;
  } catch (error) {
    console.error('Failed to fetch tryouts:', error);
    throw error;
  }
}
```

---

### Starting a Tryout

```typescript
import { tryoutApi } from '@hakgyo/hakgyo-expo-sdk';

async function startTryout(tryoutId: number) {
  try {
    // First, get tryout details
    const tryout = await tryoutApi.get(tryoutId);
    
    console.log(`Starting: ${tryout.nama}`);
    console.log(`Duration: ${tryout.duration} minutes`);
    console.log(`Questions: ${tryout.koleksiSoal?.soals?.length || 'N/A'}`);
    
    // Check if tryout is within valid time window
    const now = new Date();
    const startTime = new Date(tryout.startTime);
    const endTime = new Date(tryout.endTime);
    
    if (now < startTime) {
      throw new Error('Tryout has not started yet');
    }
    
    if (now > endTime) {
      throw new Error('Tryout has ended');
    }
    
    // Participate in tryout
    const participation = await tryoutApi.participate(tryoutId);
    
    console.log(`Attempt #${participation.attemptCount}`);
    console.log(`Status: ${participation.status}`);
    
    return {
      tryout,
      participation
    };
  } catch (error) {
    console.error('Failed to start tryout:', error);
    throw error;
  }
}
```

---

### Submitting Answers

```typescript
import { tryoutApi } from '@hakgyo/hakgyo-expo-sdk';

interface Answer {
  soalId: number;
  opsiId: number;
}

async function submitTryout(tryoutId: number, answers: Answer[]) {
  try {
    console.log(`Submitting ${answers.length} answers...`);
    
    // Validate answers
    if (answers.length === 0) {
      throw new Error('No answers to submit');
    }
    
    // Submit answers
    const result = await tryoutApi.submit(tryoutId, answers);
    
    console.log('=== Results ===');
    console.log(`Score: ${result.score}%`);
    console.log(`Correct: ${result.correctCount}/${result.totalCount}`);
    console.log(`Time Taken: ${result.timeTakenSeconds} seconds`);
    console.log(`Passed: ${result.passed ? 'Yes ✓' : 'No ✗'}`);
    
    return result;
  } catch (error) {
    console.error('Failed to submit tryout:', error);
    throw error;
  }
}

// Example usage with a timer
async function takeTryoutWithTimer(tryoutId: number, questions: any[]) {
  const startTime = Date.now();
  const answers: Answer[] = [];
  
  // Simulate answering questions
  for (const question of questions) {
    // In a real app, you'd collect user input here
    const userAnswer = await collectUserAnswer(question);
    answers.push({
      soalId: question.id,
      opsiId: userAnswer
    });
  }
  
  // Submit and get results
  const result = await submitTryout(tryoutId, answers);
  return result;
}
```

---

### Getting Results

```typescript
import { tryoutApi } from '@hakgyo/hakgyo-expo-sdk';

async function getTryoutResults(tryoutId: number) {
  try {
    const result = await tryoutApi.getResults(tryoutId);
    
    if (Array.isArray(result)) {
      // Teacher view - show all participants
      console.log(`Total Participants: ${result.length}`);
      
      const passedCount = result.filter(p => p.score >= 70).length;
      const avgScore = result.reduce((sum, p) => sum + p.score, 0) / result.length;
      
      console.log(`Passed: ${passedCount}/${result.length}`);
      console.log(`Average Score: ${avgScore.toFixed(1)}%`);
      
      return result;
    } else {
      // Student view - show own result
      console.log('=== Your Result ===');
      console.log(`Score: ${result.score}%`);
      console.log(`Correct Answers: ${result.correctCount}/${result.totalCount}`);
      console.log(`Time: ${result.timeTakenSeconds} seconds`);
      console.log(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
      
      return result;
    }
  } catch (error) {
    console.error('Failed to get results:', error);
    throw error;
  }
}
```

---

### Teacher: Creating a Tryout

```typescript
import { tryoutApi } from '@hakgyo/hakgyo-expo-sdk';

async function createTryout() {
  try {
    const newTryout = await tryoutApi.create({
      nama: "Korean Vocabulary Quiz - Week 1",
      description: "Test your vocabulary knowledge from Week 1 lessons",
      startTime: new Date().toISOString(), // Start now
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
      duration: 30, // 30 minutes
      maxAttempts: 3,
      shuffleQuestions: true,
      passingScore: 60,
      koleksiSoalId: 10, // ID of question collection
      isActive: true
    });
    
    console.log('Tryout created successfully!');
    console.log(`ID: ${newTryout.id}`);
    console.log(`Name: ${newTryout.nama}`);
    
    return newTryout;
  } catch (error) {
    console.error('Failed to create tryout:', error);
    throw error;
  }
}
```

---

## Error Handling

The Tryout API may throw the following errors:

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `404` | Tryout not found | Verify the tryout ID is correct |
| `403` | Unauthorized | Check user permissions |
| `400` | Invalid request | Validate input data |
| `409` | Tryout already started | Cannot modify after start |
| `429` | Too many attempts | User exceeded maxAttempts |

### Error Handling Example

```typescript
import { tryoutApi } from '@hakgyo/hakgyo-expo-sdk';

async function safeTryoutOperation(tryoutId: number) {
  try {
    const result = await tryoutApi.get(tryoutId);
    return result;
  } catch (error: any) {
    switch (error.status) {
      case 404:
        console.error('Tryout not found');
        break;
      case 403:
        console.error('You do not have permission to access this tryout');
        break;
      case 400:
        console.error('Invalid request:', error.message);
        break;
      default:
        console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

### Validation Errors

When creating or updating tryouts, ensure:

- `startTime` is before `endTime`
- `duration` is a positive number
- `maxAttempts` is at least 1
- `passingScore` is between 0 and 100
- `koleksiSoalId` references an existing question collection

---

## Best Practices

### 1. Check Tryout Availability Before Starting

```typescript
async function canParticipate(tryoutId: number): Promise<boolean> {
  const tryout = await tryoutApi.get(tryoutId);
  const now = new Date();
  
  return tryout.isActive && 
         now >= new Date(tryout.startTime) && 
         now <= new Date(tryout.endTime);
}
```

### 2. Implement Auto-Save for Long Tryouts

```typescript
async function autoSaveProgress(tryoutId: number, answers: any[]) {
  // Save to local storage periodically
  localStorage.setItem(`tryout_${tryoutId}`, JSON.stringify(answers));
}
```

### 3. Handle Network Errors Gracefully

```typescript
async function submitWithRetry(tryoutId: number, answers: any[], maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await tryoutApi.submit(tryoutId, answers);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### 4. Track Time Accurately

```typescript
function startTimer(): () => number {
  const start = Date.now();
  return () => Math.floor((Date.now() - start) / 1000);
}

const getElapsed = startTimer();
// ... during tryout ...
console.log(`Time elapsed: ${getElapsed()} seconds`);
```

### 5. Cache Tryout Data

```typescript
const tryoutCache = new Map<number, { data: Tryout; timestamp: number }>();

async function getCachedTryout(id: number): Promise<Tryout> {
  const cached = tryoutCache.get(id);
  const now = Date.now();
  
  // Use cache if less than 5 minutes old
  if (cached && now - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }
  
  const tryout = await tryoutApi.get(id);
  tryoutCache.set(id, { data: tryout, timestamp: now });
  return tryout;
}
```

---

## Related APIs

- [Soal API](./api-soal.md) - Question management
- [Kelas API](./api-kelas.md) - Class management
- [Client API](./api-client.md) - SDK configuration

---

## Changelog

| Version | Changes |
|---------|---------|
| 1.0.0 | Initial release |
| 1.1.0 | Added `listMyKelas()` method |
| 1.2.0 | Added `toggleActive()` method |