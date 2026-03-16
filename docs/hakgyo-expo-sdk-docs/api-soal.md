# Soares API Reference

The Soares API provides methods for managing question banks (soal) and question collections (koleksi soal) in the HakgyoExpo platform. It enables you to create, organize, and manage quiz questions for Korean language learning assessments.

## Installation

Ensure you have the SDK installed and configured:

```bash
npm install @hakgyo/expo-sdk
```

```typescript
import { soalApi } from '@hakgyo/expo-sdk';
```

---

## Overview

The [`soalApi`](packages/hakgyo-expo-sdk/src/api/soal.ts:6) object provides the following functionality:

- **Daily Soares**: Fetch daily questions for consistent practice
- **Question Collections (Koleksi Soares)**: Create, read, update, and delete question collections
- **Individual Soares**: Manage questions within collections
- **Question Activation**: Toggle question active status for assessments

---

## Available Methods

### Daily Soares

#### `getDaily(userId, take?)`

Retrieves daily questions for a specific user. This is useful for implementing daily practice features.

```typescript
const dailySoals = await soalApi.getDaily('user-123', 5);
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `userId` | `string` | - | The unique identifier of the user |
| `take` | `number` | `5` | Number of questions to retrieve |

**Returns:** `Promise<Soal[]>`

**Example Response:**

```json
[
  {
    "id": 1,
    "pertanyaan": "Apa bahasa Korea dari 'Halo'?",
    "difficulty": "BEGINNER",
    "isActive": true,
    "opsis": [
      { "id": 1, "opsiText": "안녕하세요", "isCorrect": true },
      { "id": 2, "opsiText": "감사합니다", "isCorrect": false }
    ]
  }
]
```

---

### Question Collections (Koleksi Soares)

#### `listCollections(params?)`

Retrieves a paginated list of question collections with optional filtering.

```typescript
const response = await soalApi.listCollections({
  page: 1,
  limit: 10,
  search: 'Korean',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `params` | [`KoleksiSoalQueryParams`](#koleksisoalqueryparams) | Optional query parameters for filtering, pagination, and sorting |

**Returns:** `Promise<PaginatedResponse<KoleksiSoal>>`

---

#### `getCollection(id)`

Retrieves a single question collection by its ID.

```typescript
const collection = await soalApi.getCollection(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the question collection |

**Returns:** `Promise<KoleksiSoal>`

---

#### `createCollection(data)`

Creates a new question collection.

```typescript
const newCollection = await soalApi.createCollection({
  title: 'Korean Basics Quiz',
  description: 'Essential Korean vocabulary quiz'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Partial<KoleksiSoal>` | The question collection data to create |

**Returns:** `Promise<KoleksiSoal>`

---

#### `updateCollection(id, data)`

Updates an existing question collection.

```typescript
const updated = await soalApi.updateCollection(1, {
  title: 'Korean Basics Quiz - Updated',
  description: 'Updated description'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the question collection |
| `data` | `Partial<KoleksiSoal>` | The data to update |

**Returns:** `Promise<KoleksiSoal>`

---

#### `deleteCollection(id)`

Deletes a question collection.

```typescript
await soalApi.deleteCollection(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the question collection |

**Returns:** `Promise<void>`

---

### Individual Soares (Questions)

#### `listQuestions(params?)`

Retrieves a paginated list of questions with optional filtering.

```typescript
const response = await soalApi.listQuestions({
  page: 1,
  limit: 20,
  koleksiSoalId: '1',
  sortBy: 'order',
  sortOrder: 'asc'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `params` | [`SoalQueryParams`](#soalqueryparams) | Optional query parameters for filtering, pagination, and sorting |

**Returns:** `Promise<PaginatedResponse<Soal>>`

---

#### `getQuestion(id)`

Retrieves a single question by its ID.

```typescript
const question = await soalApi.getQuestion(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the question |

**Returns:** `Promise<Soal>`

---

#### `createQuestion(data)`

Creates a new question.

```typescript
const newQuestion = await soalApi.createQuestion({
  koleksiSoalId: 1,
  pertanyaan: 'Apa bahasa Korea dari "Terima kasih"?',
  difficulty: 'BEGINNER',
  explanation: 'Terima kasih dalam bahasa Korea adalah 감사합니다 (gamsahamnida)',
  isActive: true,
  order: 1,
  opsis: [
    { opsiText: '감사합니다', isCorrect: true, order: 1 },
    { opsiText: '안녕하세요', isCorrect: false, order: 2 },
    { opsiText: '안녕히 가세요', isCorrect: false, order: 3 },
    { opsiText: '네', isCorrect: false, order: 4 }
  ]
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Partial<Soal>` | The question data to create |

**Returns:** `Promise<Soal>`

---

#### `updateQuestion(id, data)`

Updates an existing question.

```typescript
const updated = await soalApi.updateQuestion(1, {
  pertanyaan: 'Updated question text',
  explanation: 'Updated explanation'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the question |
| `data` | `Partial<Soal>` | The data to update |

**Returns:** `Promise<Soal>`

---

#### `deleteQuestion(id)`

Deletes a question.

```typescript
await soalApi.deleteQuestion(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the question |

**Returns:** `Promise<void>`

---

#### `toggleQuestionActive(id)`

Toggles the active status of a question. This is useful for enabling/disabling questions in assessments without deleting them.

```typescript
const toggled = await soalApi.toggleQuestionActive(1);
console.log('Question active:', toggled.isActive);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the question |

**Returns:** `Promise<Soal>` - The updated question with toggled active status

---

## Types

### KoleksiSoal

Represents a question collection (bank).

```typescript
interface KoleksiSoal {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Soares

Represents an individual question with multiple choice options.

```typescript
interface Soares {
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

---

### Opsi

Represents a multiple choice option for a question.

```typescript
interface Opsi {
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

---

### SoaresAttachment

Represents an attachment (image, audio, etc.) associated with a question.

```typescript
interface SoaresAttachment {
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

---

### KoleksiSoalQueryParams

Query parameters for filtering question collections.

```typescript
interface KoleksiSoalQueryParams extends QueryParams {
  userId?: string;
  kelasId?: string;
  onlyJoinedClasses?: boolean;
  isPrivate?: string;
  isDraft?: string;
}
```

---

### SoaresQueryParams

Query parameters for filtering questions.

```typescript
interface SoaresQueryParams extends QueryParams {
  authorId?: string;
  koleksiSoalId?: string;
}
```

---

### QueryParams

Base query parameters for pagination and sorting.

```typescript
interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}
```

---

### PaginatedResponse

Standard paginated response format.

```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  streakInfo?: StreakInfo;
}
```

---

## Usage Examples

### Fetching Daily Soares

```typescript
import { soalApi } from '@hakgyo/expo-sdk';

// Get 5 daily questions for practice
async function fetchDailySoals() {
  try {
    const userId = 'user-123'; // Get from auth context
    const dailySoals = await soalApi.getDaily(userId, 5);
    
    console.log('Daily Questions:');
    dailySoals.forEach((soal, index) => {
      console.log(`${index + 1}. ${soal.pertanyaan}`);
      console.log(`   Difficulty: ${soal.difficulty}`);
      console.log(`   Options: ${soal.opsis.map(o => o.opsiText).join(', ')}`);
    });
    
    return dailySoals;
  } catch (error) {
    console.error('Failed to fetch daily soals:', error);
    throw error;
  }
}
```

---

### Managing Question Collections

```typescript
import { soalApi } from '@hakgyo/expo-sdk';

// Create a new question collection
async function createQuestionCollection() {
  const collection = await soalApi.createCollection({
    title: 'Korean Vocabulary Quiz - Week 1',
    description: 'Basic Korean vocabulary for beginners'
  });
  
  console.log('Created collection:', collection.id, collection.title);
  return collection;
}

// List all collections with pagination
async function listCollections() {
  const response = await soalApi.listCollections({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  console.log(`Found ${response.pagination.total} collections`);
  return response.data;
}

// Update a collection
async function updateCollection(id: number) {
  const updated = await soalApi.updateCollection(id, {
    title: 'Updated Title',
    description: 'Updated description'
  });
  return updated;
}

// Delete a collection
async function deleteCollection(id: number) {
  await soalApi.deleteCollection(id);
  console.log('Collection deleted successfully');
}
```

---

### Working with Individual Soares

```typescript
import { soalApi } from '@hakgyo/expo-sdk';

// Create a new question with options
async function createQuestion() {
  const question = await soalApi.createQuestion({
    koleksiSoalId: 1,
    pertanyaan: 'Apa bahasa Korea dari "Halo"?',
    difficulty: 'BEGINNER',
    explanation: '안녕하세요 (annyeonghaseyo) adalah sapaan formal',
    isActive: true,
    order: 1,
    opsis: [
      { opsiText: '안녕하세요', isCorrect: true, order: 1 },
      { opsiText: '감사합니다', isCorrect: false, order: 2 },
      { opsiText: '안녕', isCorrect: false, order: 3 },
      { opsiText: '네', isCorrect: false, order: 4 }
    ]
  });
  
  console.log('Created question:', question.id);
  return question;
}

// List questions in a collection
async function listQuestionsInCollection(koleksiSoalId: number) {
  const response = await soalApi.listQuestions({
    koleksiSoalId: koleksiSoalId.toString(),
    page: 1,
    limit: 20
  });
  
  console.log(`Found ${response.pagination.total} questions`);
  return response.data;
}

// Update a question
async function updateQuestion(id: number) {
  const updated = await soalApi.updateQuestion(id, {
    pertanyaan: 'Updated question text',
    explanation: 'Updated explanation text'
  });
  return updated;
}

// Delete a question
async function deleteQuestion(id: number) {
  await soalApi.deleteQuestion(id);
  console.log('Question deleted successfully');
}
```

---

### Toggle Active Status

```typescript
import { soalApi } from '@hakgyo/expo-sdk';

// Toggle question active status for assessments
async function toggleQuestionStatus(questionId: number) {
  const result = await soalApi.toggleQuestionActive(questionId);
  
  console.log(`Question ${questionId} is now ${result.isActive ? 'active' : 'inactive'}`);
  return result;
}

// Get all active questions for an assessment
async function getActiveQuestions(koleksiSoalId: number) {
  const response = await soalApi.listQuestions({
    koleksiSoalId: koleksiSoalId.toString(),
    page: 1,
    limit: 100
  });
  
  // Filter active questions
  const activeQuestions = response.data.filter(q => q.isActive);
  console.log(`Found ${activeQuestions.length} active questions`);
  
  return activeQuestions;
}
```

---

### Complete Quiz Flow Example

```typescript
import { soalApi } from '@hakgyo/expo-sdk';

async function runQuiz(koleksiSoalId: number) {
  // 1. Get all active questions from the collection
  const questions = await getActiveQuestions(koleksiSoalId);
  
  if (questions.length === 0) {
    console.log('No questions available');
    return;
  }
  
  // 2. Display questions to user
  let correctCount = 0;
  
  for (const question of questions) {
    console.log(`\nQuestion: ${question.pertanyaan}`);
    console.log(`Difficulty: ${question.difficulty}`);
    
    // Display options
    question.opsis.forEach((option, idx) => {
      console.log(`  ${idx + 1}. ${option.opsiText}`);
    });
    
    // In a real app, you'd get user input here
    // For demo, assume first option is selected
    const userSelectedOption = question.opsis[0];
    
    if (userSelectedOption.isCorrect) {
      correctCount++;
      console.log('✓ Correct!');
    } else {
      console.log('✗ Wrong!');
      console.log(`Explanation: ${question.explanation}`);
    }
  }
  
  // 3. Show results
  const score = (correctCount / questions.length) * 100;
  console.log(`\nQuiz Complete!`);
  console.log(`Score: ${correctCount}/${questions.length} (${score.toFixed(1)}%)`);
}
```

---

## Error Handling

The Soares API uses standard error handling. Here's how to handle common errors:

```typescript
import { soalApi } from '@hakgyo/expo-sdk';

async function handleSoalErrors() {
  try {
    // Attempt to fetch a question
    const question = await soalApi.getQuestion(99999);
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error('Question not found');
    } else if (error.response?.status === 401) {
      console.error('Unauthorized - please login');
    } else if (error.response?.status === 403) {
      console.error('Forbidden - insufficient permissions');
    } else {
      console.error('Failed to fetch question:', error.message);
    }
  }
}
```

### Common Error Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| `400` | Bad Request | Check request parameters |
| `401` | Unauthorized | Ensure user is authenticated |
| `403` | Forbidden | Check user permissions |
| `404` | Not Found | Verify the resource ID exists |
| `500` | Server Error | Try again later or contact support |

---

## Best Practices

### 1. Use Pagination for Large Datasets

When listing questions or collections, always use pagination to improve performance:

```typescript
// Good: Use pagination
const response = await soalApi.listQuestions({
  koleksiSoalId: '1',
  page: 1,
  limit: 20
});

// Avoid: Loading all questions at once
// const response = await soalApi.listQuestions({ limit: 1000 });
```

### 2. Cache Frequently Accessed Data

For data that doesn't change often, implement caching:

```typescript
// Cache collection metadata
const collectionCache = new Map<number, KoleksiSoal>();

async function getCollectionCached(id: number) {
  if (collectionCache.has(id)) {
    return collectionCache.get(id);
  }
  
  const collection = await soalApi.getCollection(id);
  collectionCache.set(id, collection);
  return collection;
}
```

### 3. Handle Network Errors Gracefully

Implement retry logic for network failures:

```typescript
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// Usage
const question = await fetchWithRetry(() => soalApi.getQuestion(1));
```

### 4. Validate Question Data Before Creating

Always validate question data before sending to the API:

```typescript
function validateQuestion(data: Partial<Soal>): string[] {
  const errors: string[] = [];
  
  if (!data.pertanyaan?.trim()) {
    errors.push('Question text is required');
  }
  
  if (!data.opsis || data.opsis.length < 2) {
    errors.push('At least 2 options are required');
  }
  
  const hasCorrectOption = data.opsis?.some(o => o.isCorrect);
  if (!hasCorrectOption) {
    errors.push('At least one correct answer is required');
  }
  
  return errors;
}

// Usage
const errors = validateQuestion(questionData);
if (errors.length > 0) {
  console.error('Validation failed:', errors);
} else {
  const created = await soalApi.createQuestion(questionData);
}
```

### 5. Use Appropriate Difficulty Levels

Set appropriate difficulty levels for questions:

```typescript
const questionByDifficulty = {
  BEGINNER: 'Basic vocabulary and phrases',
  INTERMEDIATE: 'Grammar patterns and sentence construction',
  ADVANCED: 'Complex expressions and cultural context'
};

// When creating questions
await soalApi.createQuestion({
  koleksiSoalId: 1,
  pertanyaan: '...',
  difficulty: 'BEGINNER', // Choose appropriate level
  // ...
});
```

### 6. Implement Proper Question Activation Workflow

Use the toggle feature to manage question availability:

```typescript
async function manageQuestionAvailability(questionId: number, shouldBeActive: boolean) {
  const question = await soalApi.getQuestion(questionId);
  
  if (question.isActive !== shouldBeActive) {
    await soalApi.toggleQuestionActive(questionId);
    console.log(`Question ${questionId} is now ${shouldBeActive ? 'active' : 'inactive'}`);
  }
}
```

---

## Related APIs

- **[Vocabulary API](./api-vocabulary.md)** - Manage vocabulary sets and items
- **[Kelas API](./api-kelas.md)** - Class/course management
- **[Materi API](./api-materi.md)** - Learning materials

---

## API Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/soal/daily` | Get daily questions |
| `GET` | `/api/soal` | List questions |
| `GET` | `/api/soal/:id` | Get single question |
| `POST` | `/api/soal` | Create question |
| `PATCH` | `/api/soal/:id` | Update question |
| `DELETE` | `/api/soal/:id` | Delete question |
| `POST` | `/api/soal/:id/toggle-active` | Toggle question status |
| `GET` | `/api/koleksi-soal` | List collections |
| `GET` | `/api/koleksi-soal/:id` | Get single collection |
| `POST` | `/api/koleksi-soal` | Create collection |
| `PATCH` | `/api/koleksi-soal/:id` | Update collection |
| `DELETE` | `/api/koleksi-soal/:id` | Delete collection |