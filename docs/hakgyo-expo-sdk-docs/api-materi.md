# Materi API Reference

The Materi API provides methods for managing learning materials within classes in the HakgyoExpo platform. It enables you to retrieve materials, track completion progress, and manage assessments.

## Installation

Ensure you have the SDK installed and configured:

```bash
npm install hakgyo-expo-sdk
```

```typescript
import { materiApi } from 'hakgyo-expo-sdk';
```

---

## Overview

The [`materiApi`](packages/hakgyo-expo-sdk/src/api/materi.ts:5) object provides the following functionality:

- **Material Retrieval**: Fetch individual materials by ID
- **Progress Tracking**: Mark materials as complete and track student progress
- **Assessment Management**: Submit answers and retrieve assessment configurations
- **Integration with Kelas**: Materials are linked to classes for organized learning paths

---

## Available Methods

### `get(id)`

Retrieves a single material by its ID.

```typescript
const materi = await materiApi.get(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the material |

**Returns:** `Promise<Materi>`

**Example Response:**

```json
{
  "id": 1,
  "title": "Korean Alphabet - Hangul",
  "description": "Learn the basics of Korean writing system",
  "jsonDescription": { "type": "doc", "content": [...] },
  "htmlDescription": "<p>Learn the basics of Korean writing system</p>",
  "order": 1,
  "isDemo": false,
  "isDraft": false,
  "koleksiSoalId": 5,
  "passingScore": 70,
  "kelasId": 1,
  "kelas": {
    "id": 1,
    "title": "Korean for Beginners",
    "type": "REGULAR",
    "level": "BEGINNER"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

---

### `complete(id)`

Marks a material as completed by the current user. This is typically called when a student finishes reading or studying a material.

```typescript
await materiApi.complete(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the material to mark as complete |

**Returns:** `Promise<void>`

**Example Usage:**

```typescript
// After the user finishes studying the material
try {
  await materiApi.complete(materiId);
  console.log('Material marked as complete!');
  
  // Optionally refresh the kelas progress
  const progress = await kelasApi.getProgress(kelasId);
  updateProgressDisplay(progress);
} catch (error) {
  console.error('Failed to complete material:', error);
}
```

---

### `submitAssessment(id, answers)`

Submits answers for a material's assessment (quiz). The assessment is linked to the material through `koleksiSoalId`.

```typescript
const result = await materiApi.submitAssessment(1, [
  { questionId: 1, answerId: 3 },
  { questionId: 2, answerId: 5 },
  { questionId: 3, answerId: 1 }
]);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the material |
| `answers` | `Array<{ questionId: number, answerId: number }>` | Array of answers submitted by the user |

**Returns:** `Promise<any>` - Assessment result including score and pass/fail status

**Example Response:**

```json
{
  "passed": true,
  "score": 85,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "passingScore": 70,
  "completedAt": "2024-01-20T16:00:00Z"
}
```

---

### `getAssessmentConfig(id)`

Retrieves the assessment configuration for a material, including questions, options, and passing score.

```typescript
const config = await materiApi.getAssessmentConfig(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the material |

**Returns:** `Promise<any>` - Assessment configuration object

**Example Response:**

```json
{
  "materiId": 1,
  "title": "Korean Alphabet Quiz",
  "passingScore": 70,
  "questions": [
    {
      "id": 1,
      "pertanyaan": "What is the first letter of Hangul?",
      "difficulty": "BEGINNER",
      "opsis": [
        { "id": 1, "opsiText": "ㄱ", "isCorrect": true, "order": 1 },
        { "id": 2, "opsiText": "ㄴ", "isCorrect": false, "order": 2 },
        { "id": 3, "opsiText": "ㅇ", "isCorrect": false, "order": 3 },
        { "id": 4, "opsiText": "ㅎ", "isCorrect": false, "order": 4 }
      ]
    }
  ]
}
```

---

## Types

### `Materi`

The main material interface representing a learning material in the system.

```typescript
interface Materi {
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

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Unique identifier for the material |
| `title` | `string` | Title of the material |
| `description` | `string` | Plain text description |
| `jsonDescription` | `any` | Rich text content in JSON format (TipTap/ProseMirror) |
| `htmlDescription` | `string` | HTML representation of the content |
| `order` | `number` | Order of the material within the class |
| `isDemo` | `boolean` | Whether this is a demo material |
| `isDraft` | `boolean` | Whether the material is a draft |
| `koleksiSoalId` | `number?` | ID of the linked question collection (for assessments) |
| `passingScore` | `number?` | Minimum score required to pass (percentage) |
| `kelasId` | `number` | ID of the parent class |
| `kelas` | `Kelas?` | Associated class object (included when fetching with relations) |
| `createdAt` | `string` | ISO timestamp of creation |
| `updatedAt` | `string` | ISO timestamp of last update |

---

## Usage Examples

### Basic Material Retrieval

```typescript
import { materiApi } from 'hakgyo-expo-sdk';

async function fetchMaterial(materialId: number) {
  try {
    const materi = await materiApi.get(materialId);
    
    console.log(`Material: ${materi.title}`);
    console.log(`Description: ${materi.description}`);
    console.log(`Order in class: ${materi.order}`);
    
    return materi;
  } catch (error) {
    console.error('Failed to fetch material:', error);
    throw error;
  }
}
```

### Complete Material and Track Progress

```typescript
import { materiApi, kelasApi } from 'hakgyo-expo-sdk';

async function studyMaterial(materialId: number, kelasId: number) {
  try {
    // 1. Fetch the material content
    const materi = await materiApi.get(materialId);
    
    // 2. Display content to user (implementation depends on your UI)
    displayMaterialContent(materi);
    
    // 3. After user finishes, mark as complete
    await materiApi.complete(materialId);
    
    // 4. Check if there's an assessment
    if (materi.koleksiSoalId) {
      const assessmentConfig = await materiApi.getAssessmentConfig(materialId);
      return { materi, hasAssessment: true, assessmentConfig };
    }
    
    // 5. Refresh class progress
    const progress = await kelasApi.getProgress(kelasId);
    updateProgressUI(progress);
    
    return { materi, hasAssessment: false };
  } catch (error) {
    console.error('Error studying material:', error);
    throw error;
  }
}
```

### Taking an Assessment

```typescript
import { materiApi } from 'hakgyo-expo-sdk';

async function submitAssessment(
  materialId: number, 
  userAnswers: Map<number, number>
) {
  try {
    // Convert Map to array format
    const answers = Array.from(userAnswers.entries()).map(
      ([questionId, answerId]) => ({ questionId, answerId })
    );
    
    // Submit answers
    const result = await materiApi.submitAssessment(materialId, answers);
    
    if (result.passed) {
      console.log(`🎉 Congratulations! You passed with ${result.score}%`);
    } else {
      console.log(`❌ You scored ${result.score}%. Need ${result.passingScore}% to pass.`);
      console.log(`Correct answers: ${result.correctAnswers}/${result.totalQuestions}`);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to submit assessment:', error);
    throw error;
  }
}
```

### Building a Learning Path UI

```typescript
import { materiApi, kelasApi } from 'hakgyo-expo-sdk';

interface MaterialWithStatus extends Materi {
  isCompleted: boolean;
}

async function loadClassMaterials(kelasId: number): Promise<MaterialWithStatus[]> {
  try {
    // Get class details which includes materials
    const kelas = await kelasApi.get(kelasId);
    
    // Get progress to determine completion status
    const progress = await kelasApi.getProgress(kelasId);
    const completedMateriIds = new Set(progress.completedMateriIds || []);
    
    // Map materials with completion status
    const materialsWithStatus: MaterialWithStatus[] = kelas.materi?.map(materi => ({
      ...materi,
      isCompleted: completedMateriIds.has(materi.id)
    })) || [];
    
    // Sort by order
    return materialsWithStatus.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Failed to load materials:', error);
    throw error;
  }
}
```

---

## Error Handling

The Materi API uses the standard error handling mechanism provided by the SDK's API client. Here are common errors you may encounter:

### Common Errors

| Error Type | Status Code | Description | Handling |
|------------|-------------|-------------|----------|
| `NotFoundError` | 404 | Material not found | Check if the material ID is valid |
| `UnauthorizedError` | 401 | User not authenticated | Ensure user is logged in |
| `ForbiddenError` | 403 | User doesn't have access | Verify user enrollment in the class |
| `ValidationError` | 400 | Invalid request data | Check answer format and IDs |
| `NetworkError` | - | Network connectivity issues | Implement retry logic |

### Error Handling Example

```typescript
import { 
  materiApi, 
  ApiError, 
  NotFoundError, 
  UnauthorizedError,
  ForbiddenError 
} from 'hakgyo-expo-sdk';

async function safeGetMaterial(materialId: number) {
  try {
    return await materiApi.get(materialId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.error(`Material ${materialId} not found`);
      // Handle: show "Material not found" UI
    } else if (error instanceof UnauthorizedError) {
      console.error('Please log in to access this material');
      // Handle: redirect to login
    } else if (error instanceof ForbiddenError) {
      console.error('You are not enrolled in this class');
      // Handle: show enrollment prompt
    } else if (error instanceof ApiError) {
      console.error(`API Error: ${error.message}`);
      // Handle: generic API error
    } else {
      console.error('Unexpected error:', error);
      // Handle: unknown error
    }
    throw error;
  }
}
```

### Handling Assessment Errors

```typescript
async function handleAssessmentSubmission(materialId: number, answers: any[]) {
  try {
    const result = await materiApi.submitAssessment(materialId, answers);
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          // Invalid answers format
          console.error('Invalid answer format:', error.message);
          break;
        case 404:
          // Assessment not found for this material
          console.error('No assessment available for this material');
          break;
        case 422:
          // Assessment already submitted
          console.error('You have already submitted this assessment');
          break;
        default:
          console.error('Assessment submission failed:', error.message);
      }
    }
    throw error;
  }
}
```

---

## Best Practices

### 1. Check for Assessment Before Completion

Always check if a material has an associated assessment before marking it as complete:

```typescript
async function processMaterial(materialId: number) {
  const materi = await materiApi.get(materialId);
  
  if (materi.koleksiSoalId) {
    // Show assessment prompt
    const shouldTakeAssessment = await confirmTakeAssessment();
    if (shouldTakeAssessment) {
      const config = await materiApi.getAssessmentConfig(materialId);
      return { mode: 'assessment', config };
    }
  }
  
  // No assessment, mark as complete
  await materiApi.complete(materialId);
  return { mode: 'completed' };
}
```

### 2. Cache Assessment Configurations

Assessment configurations don't change frequently. Consider caching them:

```typescript
const assessmentCache = new Map<number, { config: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedAssessmentConfig(materialId: number) {
  const cached = assessmentCache.get(materialId);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config;
  }
  
  const config = await materiApi.getAssessmentConfig(materialId);
  assessmentCache.set(materialId, { config, timestamp: Date.now() });
  
  return config;
}
```

### 3. Handle Offline Scenarios

Implement offline support for material access:

```typescript
import * as SecureStore from 'expo-secure-store';

async function getMaterialWithOfflineSupport(materialId: number) {
  try {
    // Try to fetch from API
    const materi = await materiApi.get(materialId);
    
    // Cache for offline use
    await SecureStore.setItemAsync(
      `materi_${materialId}`, 
      JSON.stringify(materi)
    );
    
    return materi;
  } catch (error) {
    // Fallback to cached version
    const cached = await SecureStore.getItemAsync(`materi_${materialId}`);
    if (cached) {
      console.log('Using cached material data');
      return JSON.parse(cached);
    }
    throw error;
  }
}
```

### 4. Track Progress Efficiently

Batch progress updates to reduce API calls:

```typescript
class ProgressTracker {
  private pendingCompletions: Set<number> = new Set();
  private flushTimeout: NodeJS.Timeout | null = null;
  
  async markComplete(materialId: number) {
    this.pendingCompletions.add(materialId);
    
    // Debounce API calls
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    
    this.flushTimeout = setTimeout(() => this.flush(), 2000);
  }
  
  private async flush() {
    const ids = Array.from(this.pendingCompletions);
    this.pendingCompletions.clear();
    
    // Process completions
    await Promise.all(ids.map(id => materiApi.complete(id)));
  }
}
```

### 5. Validate Assessment Answers Before Submission

Provide better user feedback by validating answers locally:

```typescript
function validateAnswers(
  answers: any[], 
  config: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check all questions are answered
  if (answers.length < config.questions.length) {
    errors.push(`Please answer all questions (${config.questions.length} total)`);
  }
  
  // Validate answer format
  for (const answer of answers) {
    if (!answer.questionId || !answer.answerId) {
      errors.push('Invalid answer format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Related APIs

- **[Kelas API](./api-kelas.md)** - Materials are associated with classes
- **[Vocabulary API](./api-vocabulary.md)** - Vocabulary learning within materials
- **[Soal API](./api-soal.md)** - Question management for assessments

---

## API Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/materi/{id}` | Get material by ID |
| `POST` | `/api/materi/{id}/complete` | Mark material as complete |
| `POST` | `/api/materi/{id}/assessment` | Submit assessment answers |
| `GET` | `/api/materi/{id}/assessment-config` | Get assessment configuration |