# Vocabulary API Reference

The Vocabulary API provides methods for managing vocabulary sets and vocabulary items in the HakgyoExpo platform. It enables you to create, organize, and track vocabulary learning progress for Korean language learning.

## Installation

Ensure you have the SDK installed and configured:

```bash
npm install @hakgyo/expo-sdk
```

```typescript
import { vocabularyApi } from '@hakgyo/expo-sdk';
```

---

## Overview

The [`vocabularyApi`](packages/hakgyo-expo-sdk/src/api/vocabulary.ts:6) object provides the following functionality:

- **Vocabulary Sets Management**: Create, read, update, and delete vocabulary sets (collections)
- **Vocabulary Items Management**: Add, modify, and remove vocabulary items within sets
- **Daily Vocabulary**: Fetch daily vocabulary for consistent learning
- **Progress Tracking**: Mark items as learned/unlearned to track learning progress

---

## Available Methods

### Vocabulary Sets

#### `listSets(params?)`

Retrieves a paginated list of vocabulary sets with optional filtering.

```typescript
const response = await vocabularyApi.listSets({
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
| `params` | [`QueryParams`](#queryparams) | Optional query parameters for filtering, pagination, and sorting |

**Returns:** `Promise<ApiResponse<VocabularySet[], PaginatedMeta>>`

---

#### `getSet(id)`

Retrieves a single vocabulary set by its ID. **Session-aware**: Returns `isLearned` status on each item for authenticated users.

```typescript
const response = await vocabularyApi.getSet(1);

if (response.success && response.data) {
  const set = response.data;
  console.log(`Set: ${set.title}`);
  console.log(`Total items: ${set.itemCount}`);
  console.log(`Learned items: ${set.learnedCount}`);
  
  // Each item includes isLearned status (session-aware)
  set.items?.forEach(item => {
    console.log(`${item.korean}: ${item.isLearned ? '✓ Learned' : '○ Not learned'}`);
  });
}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the vocabulary set |

**Returns:** `Promise<ApiResponse<VocabularySet>>`

**Session-Aware Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `items[].isLearned` | `boolean` | Whether the current user has learned this item (always `false` for unauthenticated users) |
| `learnedCount` | `number` | Count of items the current user has learned |
| `itemCount` | `number` | Total number of items in the set |

---

#### `createSet(data)`

Creates a new vocabulary set.

```typescript
const response = await vocabularyApi.createSet({
  title: 'Korean Basics - Numbers',
  description: 'Essential Korean numbers 1-100',
  icon: '🔢',
  isPublic: true,
  isDraft: false
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Partial<VocabularySet>` | The vocabulary set data to create |

**Returns:** `Promise<ApiResponse<VocabularySet>>`

---

#### `updateSet(id, data)`

Updates an existing vocabulary set.

```typescript
const response = await vocabularyApi.updateSet(1, {
  title: 'Korean Basics - Numbers (Updated)',
  description: 'Essential Korean numbers 1-100 with audio'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the vocabulary set |
| `data` | `Partial<VocabularySet>` | The updated vocabulary set data |

**Returns:** `Promise<ApiResponse<VocabularySet>>`

---

#### `deleteSet(id)`

Deletes a vocabulary set.

```typescript
const response = await vocabularyApi.deleteSet(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the vocabulary set |

**Returns:** `Promise<ApiResponse<void>>`

---

### Vocabulary Items

#### `listItems(params?)`

Retrieves a paginated list of vocabulary items with optional filtering.

```typescript
const response = await vocabularyApi.listItems({
  page: 1,
  limit: 20,
  collectionId: '1',
  type: 'WORD',
  pos: 'KATA_KERJA',
  isLearned: false,
  search: '안녕하세요'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `params` | `QueryParams & { creatorId?: string; collectionId?: string; type?: string; pos?: string; isLearned?: boolean; search?: string }` | Optional query parameters including filtering by collection, type, part of speech, learned status, and search term |

**Returns:** `Promise<ApiResponse<VocabularyItem[], PaginatedMeta>>`

---

#### `getItem(id)`

Retrieves a single vocabulary item by its ID.

```typescript
const response = await vocabularyApi.getItem(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the vocabulary item |

**Returns:** `Promise<ApiResponse<VocabularyItem>>`

---

#### `addItem(setId, data)`

Adds a new vocabulary item to a set.

```typescript
const response = await vocabularyApi.addItem(1, {
  korean: '안녕하세요',
  indonesian: 'Halo / Selamat datang',
  type: 'WORD',
  pos: 'KATA_KETERANGAN',
  audioUrl: 'https://example.com/audio/annyeonghaseyo.mp3',
  exampleSentences: ['안녕하세요, 만나서 반갑습니다.'],
  order: 1
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `setId` | `number` | The ID of the vocabulary set to add the item to |
| `data` | `Partial<VocabularyItem>` | The vocabulary item data to create |

**Returns:** `Promise<ApiResponse<VocabularyItem>>`

---

#### `updateItem(id, data)`

Updates an existing vocabulary item.

```typescript
const response = await vocabularyApi.updateItem(1, {
  indonesian: 'Halo (sapaan formal)',
  exampleSentences: [
    '안녕하세요, 만나서 반갑습니다.',
    '안녕하세요, 오늘天气很好.'
  ]
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the vocabulary item |
| `data` | `Partial<VocabularyItem>` | The updated vocabulary item data |

**Returns:** `Promise<ApiResponse<VocabularyItem>>`

---

#### `deleteItem(id)`

Deletes a vocabulary item.

```typescript
const response = await vocabularyApi.deleteItem(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the vocabulary item |

**Returns:** `Promise<ApiResponse<void>>`

---

### Progress Tracking

#### `markLearned(itemId)`

Marks a vocabulary item as learned.

```typescript
const response = await vocabularyApi.markLearned(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemId` | `number` | The unique identifier of the vocabulary item |

**Returns:** `Promise<ApiResponse<VocabularyItemProgress>>`

---

#### `markUnlearned(itemId)`

Marks a vocabulary item as not learned (resets progress).

```typescript
const response = await vocabularyApi.markUnlearned(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemId` | `number` | The unique identifier of the vocabulary item |

**Returns:** `Promise<ApiResponse<VocabularyItemProgress>>`

---

#### `setLearnedStatus(itemId, isLearned)`

Sets the learned status of a vocabulary item.

```typescript
const response = await vocabularyApi.setLearnedStatus(1, true);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemId` | `number` | The unique identifier of the vocabulary item |
| `isLearned` | `boolean` | Whether the item should be marked as learned |

**Returns:** `Promise<ApiResponse<VocabularyItemProgress>>`

---

### Daily Vocabulary

#### `getDaily(params)`

Retrieves daily vocabulary for consistent learning.

```typescript
const response = await vocabularyApi.getDaily({
  userId: 'user-123',
  take: 10
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `params` | `{ userId: string; take?: number }` | User ID and optional number of items to retrieve |

**Returns:** `Promise<ApiResponse<VocabularyItem[]>>`

---

## Types

### VocabularySet

Represents a vocabulary set (collection) in the system.

```typescript
interface VocabularySet {
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
  // Optional: included when fetching single set with relations
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

---

### VocabularyItem

Represents a single vocabulary item within a set.

```typescript
interface VocabularyItem {
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
  // Optional: included when fetching single item with relations
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
    // Optional: class associations for this vocabulary collection
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

---

### VocabularyItemProgress

Represents the learning progress for a vocabulary item.

```typescript
interface VocabularyItemProgress {
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

---

### Input Types

#### CreateVocabularySetInput

```typescript
type CreateVocabularySetInput = Partial<VocabularySet>;
```

#### CreateVocabularyItemInput

```typescript
type CreateVocabularyItemInput = Partial<VocabularyItem>;
```

---

### QueryParams

Standard pagination and filtering parameters used across API methods.

```typescript
interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

---

## Usage Examples

### Fetching Daily Vocabulary

```typescript
import { vocabularyApi } from '@hakgyo/expo-sdk';

// Get daily vocabulary for the current user
async function fetchDailyVocabulary(userId: string) {
  try {
    const dailyWords = await vocabularyApi.getDaily({
      userId,
      take: 10
    });
    
    console.log('Daily Vocabulary:');
    dailyWords.forEach((word, index) => {
      console.log(`${index + 1}. ${word.korean} - ${word.indonesian}`);
    });
    
    return dailyWords;
  } catch (error) {
    console.error('Failed to fetch daily vocabulary:', error);
    throw error;
  }
}

// Usage
fetchDailyVocabulary('user-123');
```

---

### Managing Vocabulary Sets

```typescript
import { vocabularyApi } from '@hakgyo/expo-sdk';

// Create a new vocabulary set
async function createVocabSet() {
  const newSet = await vocabularyApi.createSet({
    title: 'Korean Greetings',
    description: 'Common Korean greetings and expressions',
    icon: '👋',
    isPublic: true,
    isDraft: false
  });
  
  console.log('Created set:', newSet.id, newSet.title);
  return newSet;
}

// List all vocabulary sets with pagination
async function listVocabSets() {
  const response = await vocabularyApi.listSets({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  console.log(`Found ${response.pagination.total} vocabulary sets`);
  return response.data;
}

// Update a vocabulary set
async function updateVocabSet(setId: number) {
  const updated = await vocabularyApi.updateSet(setId, {
    title: 'Korean Greetings (Expanded)',
    description: 'Common Korean greetings, expressions, and honorifics'
  });
  
  console.log('Updated set:', updated.title);
  return updated;
}

// Delete a vocabulary set
async function deleteVocabSet(setId: number) {
  await vocabularyApi.deleteSet(setId);
  console.log('Deleted set:', setId);
}
```

---

### Working with Vocabulary Items

```typescript
import { vocabularyApi } from '@hakgyo/expo-sdk';

// Add vocabulary items to a set
async function addVocabItems(setId: number) {
  const items = [
    {
      korean: '안녕하세요',
      indonesian: 'Halo (sapaan formal)',
      type: 'WORD' as const,
      pos: 'KATA_KETERANGAN',
      exampleSentences: ['안녕하세요, 만나서 반갑습니다.'],
      order: 1
    },
    {
      korean: '감사합니다',
      indonesian: 'Terima kasih (formal)',
      type: 'WORD' as const,
      pos: 'KATA_KETERANGAN',
      exampleSentences: ['도와주셔서 감사합니다.'],
      order: 2
    },
    {
      korean: '네 / 아니요',
      indonesian: 'Ya / Tidak',
      type: 'WORD' as const,
      pos: 'KATA_KETERANGAN',
      exampleSentences: ['네, 이해했습니다.'],
      order: 3
    }
  ];
  
  const createdItems = await Promise.all(
    items.map(item => vocabularyApi.addItem(setId, item))
  );
  
  console.log(`Added ${createdItems.length} items to set ${setId}`);
  return createdItems;
}

// List items in a set with filtering
async function listVocabItems(setId: number) {
  const response = await vocabularyApi.listItems({
    collectionId: String(setId),
    page: 1,
    limit: 50,
    sortBy: 'order',
    sortOrder: 'asc'
  });
  
  console.log(`Found ${response.pagination.total} items`);
  return response.data;
}

// Search vocabulary items
async function searchVocabItems(query: string) {
  const response = await vocabularyApi.listItems({
    search: query,
    page: 1,
    limit: 20
  });
  
  return response.data;
}

// Update a vocabulary item
async function updateVocabItem(itemId: number) {
  const updated = await vocabularyApi.updateItem(itemId, {
    indonesian: 'Halo (sapaan formal, lebih sopan)',
    audioUrl: 'https://example.com/audio/annyeonghaseyo_formal.mp3'
  });
  
  console.log('Updated item:', updated.korean);
  return updated;
}

// Delete a vocabulary item
async function deleteVocabItem(itemId: number) {
  await vocabularyApi.deleteItem(itemId);
  console.log('Deleted item:', itemId);
}
```

---

### Progress Tracking

```typescript
import { vocabularyApi } from '@hakgyo/expo-sdk';

// Mark an item as learned
async function markAsLearned(itemId: number) {
  const progress = await vocabularyApi.markLearned(itemId);
  
  console.log(`Item ${itemId} marked as learned at ${progress.learnedAt}`);
  return progress;
}

// Mark an item as not learned
async function markAsUnlearned(itemId: number) {
  const progress = await vocabularyApi.markUnlearned(itemId);
  
  console.log(`Item ${itemId} marked as not learned`);
  return progress;
}

// Toggle learned status
async function toggleLearnedStatus(itemId: number, currentlyLearned: boolean) {
  const progress = await vocabularyApi.setLearnedStatus(itemId, !currentlyLearned);
  
  console.log(`Item ${itemId} learned status: ${progress.isLearned}`);
  return progress;
}

// Get all unlearned items from a set
async function getUnlearnedItems(setId: number) {
  const response = await vocabularyApi.listItems({
    collectionId: String(setId),
    isLearned: false,
    page: 1,
    limit: 100
  });
  
  return response.data;
}

// Calculate learning progress for a set
async function getSetProgress(setId: number) {
  const allItems = await vocabularyApi.listItems({
    collectionId: String(setId),
    page: 1,
    limit: 1000
  });
  
  const learnedItems = allItems.data.filter(item => item.isLearned);
  const totalItems = allItems.pagination.total;
  const learnedCount = learnedItems.length;
  const progressPercentage = totalItems > 0
    ? Math.round((learnedCount / totalItems) * 100)
    : 0;
  
  console.log(`Progress: ${learnedCount}/${totalItems} (${progressPercentage}%)`);
  
  return {
    total: totalItems,
    learned: learnedCount,
    percentage: progressPercentage
  };
}
```

---

### Complete Workflow Example

```typescript
import { vocabularyApi } from '@hakgyo/expo-sdk';

// Complete vocabulary learning workflow
async function vocabularyLearningWorkflow(userId: string) {
  // 1. Create a new vocabulary set
  const newSet = await vocabularyApi.createSet({
    title: 'Korean Particles',
    description: 'Essential Korean particles for sentence structure',
    icon: '📝',
    isPublic: true,
    isDraft: false
  });
  
  console.log('Created vocabulary set:', newSet.id);
  
  // 2. Add vocabulary items to the set
  const items = [
    {
      korean: '은/는',
      indonesian: 'Partikel topik (menandai subjek)',
      type: 'WORD' as const,
      pos: 'KATA_KETERANGAN',
      exampleSentences: [
        '저는 학생입니다.',
        '그 사람은 선생님입니다.'
      ],
      order: 1
    },
    {
      korean: '을/를',
      indonesian: 'Partikel objek (menandai objek)',
      type: 'WORD' as const,
      pos: 'KATA_KETERANGAN',
      exampleSentences: [
        '책을 읽습니다.',
        '음식을 먹습니다.'
      ],
      order: 2
    },
    {
      korean: '에',
      indonesian: 'Partikel arah/tempat',
      type: 'WORD' as const,
      pos: 'KATA_KETERANGAN',
      exampleSentences: [
        '학교에 갑니다.',
        '집에 있습니다.'
      ],
      order: 3
    }
  ];
  
  for (const item of items) {
    await vocabularyApi.addItem(newSet.id, item);
  }
  
  console.log(`Added ${items.length} items to set`);
  
  // 3. Get daily vocabulary
  const dailyWords = await vocabularyApi.getDaily({
    userId,
    take: 5
  });
  
  console.log('Daily vocabulary fetched:', dailyWords.length, 'words');
  
  // 4. Mark items as learned
  const allItems = await vocabularyApi.listItems({
    collectionId: String(newSet.id),
    page: 1,
    limit: 10
  });
  
  for (const item of allItems.data.slice(0, 2)) {
    await vocabularyApi.markLearned(item.id);
  }
  
  // 5. Check progress
  const progress = await getSetProgress(newSet.id);
  console.log('Learning progress:', progress);
  
  return {
    set: newSet,
    dailyWords,
    progress
  };
}
```

---

## Error Handling

The Vocabulary API uses standard HTTP error codes. Here's how to handle common errors:

```typescript
import { vocabularyApi } from '@hakgyo/expo-sdk';

async function safeVocabOperation() {
  try {
    // Attempt to fetch vocabulary set
    const vocabSet = await vocabularyApi.getSet(999);
    return vocabSet;
  } catch (error: any) {
    if (error.status === 404) {
      console.error('Vocabulary set not found');
    } else if (error.status === 401) {
      console.error('Unauthorized - please log in');
    } else if (error.status === 403) {
      console.error('Forbidden - insufficient permissions');
    } else if (error.status === 500) {
      console.error('Server error - please try again later');
    } else {
      console.error('Unknown error:', error.message);
    }
    throw error;
  }
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid parameters or missing required fields |
| `401` | Unauthorized - User is not authenticated |
| `403` | Forbidden - User doesn't have permission |
| `404` | Not Found - Vocabulary set or item doesn't exist |
| `500` | Internal Server Error - Server-side error |

---

## Best Practices

### 1. Use Pagination for Large Datasets

```typescript
// Good: Use pagination
const response = await vocabularyApi.listItems({
  collectionId: '1',
  page: 1,
  limit: 20
});

// Better: Implement pagination loop for large datasets
async function getAllItems(setId: number) {
  const allItems = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await vocabularyApi.listItems({
      collectionId: String(setId),
      page,
      limit: 50
    });
    
    allItems.push(...response.data);
    hasMore = page < response.pagination.totalPages;
    page++;
  }
  
  return allItems;
}
```

### 2. Cache Daily Vocabulary

```typescript
// Cache daily vocabulary to avoid repeated API calls
let cachedDailyVocab: VocabularyItem[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

async function getCachedDailyVocab(userId: string) {
  const now = Date.now();
  
  if (cachedDailyVocab && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedDailyVocab;
  }
  
  cachedDailyVocab = await vocabularyApi.getDaily({ userId, take: 10 });
  cacheTimestamp = now;
  
  return cachedDailyVocab;
}
```

### 3. Optimize Item Updates

```typescript
// Good: Batch updates when possible
async function updateMultipleItems(updates: Array<{ id: number; data: Partial<VocabularyItem> }>) {
  const results = await Promise.allSettled(
    updates.map(update => vocabularyApi.updateItem(update.id, update.data))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  console.log(`Updated ${successful.length} items, ${failed.length} failed`);
  return { successful, failed };
}
```

### 4. Use Type-Safe Enums

```typescript
// Use proper type definitions for vocabulary types
const VOCABULARY_TYPES = {
  WORD: 'WORD',
  SENTENCE: 'SENTENCE',
  IDIOM: 'IDIOM'
} as const;

const PARTS_OF_SPEECH = {
  KATA_KERJA: 'KATA_KERJA',    // Verb
  KATA_BENDA: 'KATA_BENDA',    // Noun
  KATA_SIFAT: 'KATA_SIFAT',    // Adjective
  KATA_KETERANGAN: 'KATA_KETERANGAN' // Adverb
} as const;

// When creating items, use the type-safe values
await vocabularyApi.addItem(setId, {
  korean: '빠르다',
  indonesian: 'Cepat',
  type: VOCABULARY_TYPES.WORD,
  pos: PARTS_OF_SPEECH.KATA_SIFAT,
  exampleSentences: ['기차가 빠릅니다.'],
  order: 1
});
```

### 5. Implement Offline Support

```typescript
// Store vocabulary locally for offline access
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOCAB_CACHE_KEY = 'vocabulary_cache';

async function cacheVocabularyItems(items: VocabularyItem[]) {
  await AsyncStorage.setItem(VOCAB_CACHE_KEY, JSON.stringify(items));
}

async function getCachedVocabulary(): Promise<VocabularyItem[] | null> {
  const cached = await AsyncStorage.getItem(VOCAB_CACHE_KEY);
  return cached ? JSON.parse(cached) : null;
}

async function getVocabularyWithFallback(setId: number) {
  try {
    const response = await vocabularyApi.listItems({
      collectionId: String(setId),
      page: 1,
      limit: 100
    });
    
    // Cache for offline use
    await cacheVocabularyItems(response.data);
    
    return response.data;
  } catch (error) {
    // Fallback to cached data
    console.log('Network error, using cached data');
    return getCachedVocabulary();
  }
}
```

---

## Related Types

For complete type definitions, see:

- [`models.ts`](packages/hakgyo-expo-sdk/src/types/models.ts) - Core data models
- [`api.ts`](../types/api.md) - API response types and pagination

---

## API Endpoints

The Vocabulary API interacts with the following backend endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vocabulary-sets` | List all vocabulary sets |
| `GET` | `/api/vocabulary-sets/:id` | Get a single vocabulary set |
| `POST` | `/api/vocabulary-sets` | Create a new vocabulary set |
| `PUT` | `/api/vocabulary-sets/:id` | Update a vocabulary set |
| `DELETE` | `/api/vocabulary-sets/:id` | Delete a vocabulary set |
| `GET` | `/api/vocabulary-items` | List vocabulary items |
| `GET` | `/api/vocabulary-items/:id` | Get a single vocabulary item |
| `POST` | `/api/vocabulary-items` | Create a vocabulary item |
| `PUT` | `/api/vocabulary-items/:id` | Update a vocabulary item |
| `DELETE` | `/api/vocabulary-items/:id` | Delete a vocabulary item |
| `PUT` | `/api/vocabulary-items/:id/learned` | Update learned status |
| `GET` | `/api/vocabulary/daily` | Get daily vocabulary |