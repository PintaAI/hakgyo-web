# Kelas API Reference

The Kelas API provides methods for managing classes/courses in the HakgyoExpo platform. It enables you to list, create, update, and delete classes, as well as manage student enrollment and track learning progress.

## Installation

Ensure you have the SDK installed and configured:

```bash
npm install @hakgyo/expo-sdk
```

```typescript
import { kelasApi } from '@hakgyo/expo-sdk';
```

---

## Overview

The [`kelasApi`](packages/hakgyo-expo-sdk/src/api/kelas.ts:46) object provides the following functionality:

- **CRUD Operations**: Create, read, update, and delete classes
- **Enrollment Management**: Enroll and unenroll students from classes
- **Progress Tracking**: Monitor student progress through materials
- **Content Management**: Access question collections linked to classes

---

## Available Methods

### `list(params?)`

Retrieves a paginated list of all classes with optional filtering.

```typescript
const response = await kelasApi.list({
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

**Returns:** `Promise<ApiResponse<Kelas[], PaginatedMeta>>`

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Korean for Beginners",
      "description": "Learn Korean from scratch",
      "type": "REGULAR",
      "level": "BEGINNER",
      "isPaidClass": false,
      "isDraft": false,
      "authorId": "user-123",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "offset": 0,
    "limit": 10
  }
}
```

---

### `get(id)`

Retrieves a single class by its ID.

```typescript
const response = await kelasApi.get(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the class |

**Returns:** `Promise<ApiResponse<Kelas & { isEnrolled: boolean }>>`

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Korean for Beginners",
    "description": "Learn Korean from scratch",
    "type": "REGULAR",
    "level": "BEGINNER",
    "isEnrolled": true,
    "authorId": "user-123",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### `create(data)`

Creates a new class.

```typescript
const response = await kelasApi.create({
  title: "Advanced Korean Grammar",
  description: "Master Korean grammar structures",
  type: "REGULAR",
  level: "ADVANCED",
  isPaidClass: true,
  price: "99000",
  isDraft: false
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | [`Partial<Kelas>`](#kelas) | The class data to create |

**Returns:** `Promise<ApiResponse<Kelas>>`

---

### `update(id, data)`

Updates an existing class.

```typescript
const response = await kelasApi.update(1, {
  title: "Advanced Korean Grammar - Updated",
  description: "Updated description"
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the class |
| `data` | [`Partial<Kelas>`](#kelas) | The updated class data |

**Returns:** `Promise<ApiResponse<Kelas>>`

---

### `delete(id)`

Deletes a class.

```typescript
const response = await kelasApi.delete(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the class |

**Returns:** `Promise<ApiResponse<void>>`

---

### `enroll(id, options?)`

Enrolls the current user in a class.

```typescript
const response = await kelasApi.enroll(1);

// With options
const responseWithOptions = await kelasApi.enroll(1, {
  bypassPaymentCheck: true
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the class |
| `options` | [`EnrollOptions`](#enrolloptions) | Optional enrollment options |

**Returns:** `Promise<ApiResponse<{ enrolled: boolean; message?: string }>>`

---

### `unenroll(id)`

Unenrolls the current user from a class.

```typescript
const response = await kelasApi.unenroll(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the class |

**Returns:** `Promise<ApiResponse<{ enrolled: boolean; message?: string }>>`

---

### `getProgress(id)`

Retrieves the current user's progress in a class, including material completion status and assessment scores.

```typescript
const response = await kelasApi.getProgress(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the class |

**Returns:** `Promise<ApiResponse<KelasProgressResponse>>`

**Example Response:**

```json
{
  "success": true,
  "data": {
    "materis": [
      {
        "id": 1,
        "title": "Lesson 1: Hangul",
        "order": 1,
        "isAccessible": true,
        "isCompleted": true,
        "isFullyCompleted": true,
        "hasAssessment": true,
        "assessmentPassed": true,
        "score": 90,
        "canRetake": true
      }
    ],
    "overallProgress": {
      "completedCount": 5,
      "totalCount": 10,
      "completionPercentage": 50
    }
  }
}
```

---

### `getSoalCollections(id)`

Retrieves question collections linked to a class. Requires GURU or ADMIN role.

```typescript
const response = await kelasApi.getSoalCollections(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the class |

**Returns:** `Promise<ApiResponse<any[]>>`

---

## Types

### `Kelas`

The main class/course interface.

```typescript
interface Kelas {
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
  isEnrolled?: boolean;
  authorId: string;
  author?: User;
  createdAt: string;
  updatedAt: string;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Unique identifier |
| `title` | `string` | Class title |
| `description` | `string?` | Short description |
| `jsonDescription` | `any?` | Rich content in JSON format |
| `htmlDescription` | `string?` | Rich content in HTML format |
| `type` | `KelasType` | Class type: REGULAR, EVENT, GROUP, PRIVATE, or FUN |
| `level` | `KelasLevel` | Difficulty level: BEGINNER, INTERMEDIATE, or ADVANCED |
| `thumbnail` | `string?` | URL to class thumbnail image |
| `icon` | `string?` | Icon identifier |
| `isPaidClass` | `boolean` | Whether the class requires payment |
| `price` | `string?` | Class price in Indonesian Rupiah |
| `discount` | `string?` | Discounted price |
| `promoCode` | `string?` | Promotional code |
| `isDraft` | `boolean` | Whether the class is a draft |
| `authorId` | `string` | Creator's user ID |
| `author` | `User?` | Author details (included when fetching single class) |
| `createdAt` | `string` | Creation timestamp (ISO 8601) |
| `updatedAt` | `string` | Last update timestamp (ISO 8601) |

---

### `KelasCreateInput`

Input type for creating a new class (subset of Kelas properties).

```typescript
type KelasCreateInput = Partial<Kelas>;
```

---

### `KelasUpdateInput`

Input type for updating a class (subset of Kelas properties).

```typescript
type KelasUpdateInput = Partial<Kelas>;
```

---

### `QueryParams`

Standard query parameters for list endpoints.

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

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `page` | `number?` | Page number (1-indexed) |
| `limit` | `number?` | Number of items per page (defaults to 10) |
| `offset` | `number?` | Number of items to skip (alternative to page) |
| `sortBy` | `string?` | Field to sort by |
| `sortOrder` | `'asc' \| 'desc'?` | Sort direction |
| `search` | `string?` | Search query string |
| `type` | `string?` | Filter by class type |
| `level` | `string?` | Filter by difficulty level |
| `authorId` | `string?` | Filter by author ID |
| `authorEmail` | `string?` | Filter by author email |

---

### `EnrollOptions`

Options for enrolling in a class.

```typescript
interface EnrollOptions {
  bypassPaymentCheck?: boolean;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `bypassPaymentCheck` | `boolean?` | Skip payment verification (admin only) |

---

### `KelasProgressMaterial`

Progress information for a single material in a class.

```typescript
interface KelasProgressMaterial {
  id: number;
  title: string;
  order: number;
  isAccessible: boolean;
  isCompleted: boolean;
  isFullyCompleted: boolean;
  hasAssessment: boolean;
  assessmentPassed: boolean;
  score: number | null;
  canRetake: boolean;
}
```

---

### `KelasOverallProgress`

Overall progress summary for a class.

```typescript
interface KelasOverallProgress {
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
}
```

---

### `KelasProgressResponse`

Complete progress response for a class.

```typescript
interface KelasProgressResponse {
  materis: KelasProgressMaterial[];
  overallProgress: KelasOverallProgress;
}
```

---

## Usage Examples

### Listing Classes with Pagination

```typescript
import { kelasApi } from '@hakgyo/expo-sdk';

async function fetchClasses() {
  try {
    const response = await kelasApi.list({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    if (response.success && response.data) {
      console.log(`Found ${response.pagination.total} classes`);
      response.data.forEach(kelas => {
        console.log(`- ${kelas.title} (${kelas.level})`);
      });
    }
  } catch (error) {
    console.error('Failed to fetch classes:', error);
  }
}
```

---

### Creating a New Class

```typescript
async function createClass() {
  const classData = {
    title: "Korean Conversation Practice",
    description: "Practice everyday Korean conversations",
    type: "REGULAR",
    level: "INTERMEDIATE",
    isPaidClass: false,
    isDraft: true, // Save as draft first
    thumbnail: "https://example.com/thumbnail.jpg"
  };

  try {
    const newKelas = await kelasApi.create(classData);
    console.log("Class created:", newKelas.id);
    return newKelas;
  } catch (error) {
    console.error("Failed to create class:", error);
    throw error;
  }
}
```

---

### Enrolling in a Class

```typescript
async function enrollInClass(classId: number) {
  try {
    const result = await kelasApi.enroll(classId);

    if (result.success && result.enrolled) {
      console.log("Successfully enrolled!");
    } else if (result.message) {
      console.log("Enrollment info:", result.message);
    }
  } catch (error) {
    console.error("Failed to enroll:", error);
  }
}
```

---

### Checking Progress

```typescript
async function checkProgress(classId: number) {
  try {
    const progress = await kelasApi.getProgress(classId);

    console.log(`Progress: ${progress.overallProgress.completionPercentage}%`);
    console.log(`Completed: ${progress.overallProgress.completedCount}/${progress.overallProgress.totalCount}`);

    // List materials with their status
    progress.materis.forEach(materi => {
      const status = materi.isCompleted ? "✓" : "○";
      const score = materi.score !== null ? ` (Score: ${materi.score})` : "";
      console.log(`${status} ${materi.title}${score}`);
    });
  } catch (error) {
    console.error("Failed to fetch progress:", error);
  }
}
```

---

### Updating a Class

```typescript
async function updateClass(classId: number) {
  try {
    const updated = await kelasApi.update(classId, {
      title: "Updated Title",
      description: "Updated description",
      price: "150000", // New price
      discount: "100000" // New discounted price
    });
    console.log("Class updated successfully");
    return updated;
  } catch (error) {
    console.error("Failed to update class:", error);
  }
}
```

---

### Deleting a Class

```typescript
async function deleteClass(classId: number) {
  const confirmDelete = window.confirm("Are you sure you want to delete this class?");
  
  if (confirmDelete) {
    try {
      await kelasApi.delete(classId);
      console.log("Class deleted successfully");
      // Redirect to class list
    } catch (error) {
      console.error("Failed to delete class:", error);
    }
  }
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns error information in the response.

### Common Error Codes

| Status Code | Description | Handling |
|-------------|-------------|----------|
| `400` | Bad Request - Invalid parameters | Check request parameters |
| `401` | Unauthorized - Not logged in | Redirect to login |
| `403` | Forbidden - Insufficient permissions | Check user role |
| `404` | Not Found - Class doesn't exist | Verify class ID |
| `409` | Conflict - Already enrolled | Handle enrollment conflict |
| `500` | Server Error | Retry with exponential backoff |

### Error Response Format

```typescript
// Error response structure
{
  "success": false,
  "error": "Error message description",
  "message": "Additional context"
}
```

### Handling Errors

```typescript
import { kelasApi } from '@hakgyo/expo-sdk';

async function safeEnroll(classId: number) {
  try {
    const result = await kelasApi.enroll(classId);
    return result;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.response?.status === 409) {
      // Already enrolled
      return { success: true, enrolled: true, message: 'Already enrolled' };
    } else if (error.response?.status === 403) {
      // Payment required
      alert('Please complete payment to enroll');
    } else {
      // Generic error handling
      console.error('Enrollment failed:', error.message);
      throw error;
    }
  }
}
```

### Network Error Handling

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError!;
}

// Usage
const kelas = await fetchWithRetry(() => kelasApi.get(1));
```

---

## Best Practices

### 1. Use Pagination

Always use pagination when listing classes to improve performance:

```typescript
// Good: Use pagination
const response = await kelasApi.list({ page: 1, limit: 20 });

// Avoid: Loading all classes at once
// const response = await kelasApi.list(); // May return hundreds of items
```

### 2. Cache Class Data

Cache class information to reduce API calls:

```typescript
const classCache = new Map<number, { kelas: Kelas; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getKelasCached(id: number): Promise<Kelas> {
  const cached = classCache.get(id);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.kelas;
  }

  const kelas = await kelasApi.get(id);
  classCache.set(id, { kelas, timestamp: Date.now() });
  return kelas;
}
```

### 3. Handle Enrollment States

Check enrollment status before performing actions:

```typescript
async function handleClassAction(classId: number) {
  const progress = await kelasApi.getProgress(classId);
  
  if (!progress) {
    // Not enrolled - prompt to enroll
    const shouldEnroll = confirm("Join this class to access content?");
    if (shouldEnroll) {
      await kelasApi.enroll(classId);
    }
    return;
  }

  // Already enrolled - show progress
  console.log(`Your progress: ${progress.overallProgress.completionPercentage}%`);
}
```

### 4. Validate Before Creating

Validate class data before sending to the API:

```typescript
function validateClassData(data: Partial<Kelas>): string[] {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push("Title must be at least 3 characters");
  }

  if (data.isPaidClass && (!data.price || parseFloat(data.price) <= 0)) {
    errors.push("Price is required for paid classes");
  }

  if (!data.type) {
    errors.push("Class type is required");
  }

  return errors;
}

// Usage
const errors = validateClassData(classData);
if (errors.length > 0) {
  console.error("Validation errors:", errors);
  return;
}

await kelasApi.create(classData);
```

### 5. Use TypeScript

Leverage TypeScript types for better development experience:

```typescript
import { kelasApi } from '@hakgyo/expo-sdk';
import type { Kelas, KelasProgressResponse } from '@hakgyo/expo-sdk';

// Type-safe response handling
const response = await kelasApi.list({ limit: 10 });
const classes: Kelas[] = response.data || [];

// Type-safe progress handling
const progress: KelasProgressResponse = await kelasApi.getProgress(1);
const percentage: number = progress.overallProgress.completionPercentage;
```

### 6. Handle Offline Scenarios

Implement offline handling for mobile apps:

```typescript
async function fetchClassesOffline() {
  try {
    return await kelasApi.list();
  } catch (error: any) {
    if (!navigator.onLine) {
      // Return cached data or empty array
      return getCachedClasses() || { data: [], pagination: { total: 0 } };
    }
    throw error;
  }
}
```

### 7. Optimize Progress Updates

Don't fetch progress on every page load - use lazy loading:

```typescript
// Only fetch progress when user navigates to progress section
async function loadProgressTab(classId: number) {
  const progressElement = document.getElementById('progress');
  progressElement.textContent = 'Loading...';
  
  const progress = await kelasApi.getProgress(classId);
  
  progressElement.textContent = 
    `${progress.overallProgress.completionPercentage}% complete`;
}
```

---

## Related APIs

- [Materi API](./api-materi.md) - Manage class materials/lessons
- [Vocabulary API](./api-vocabulary.md) - Manage vocabulary sets
- [Soal API](./api-soal.md) - Manage questions and assessments
- [Posts API](./api-posts.md) - Manage class discussions

---

## Changelog

| Version | Changes |
|---------|---------|
| 1.0.0 | Initial release |
| 1.1.0 | Added `getSoalCollections` method |
| 1.2.0 | Added `unenroll` method (renamed from `leave`) |