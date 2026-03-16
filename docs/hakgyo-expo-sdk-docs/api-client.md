# API Client Documentation

The API Client is the core networking layer of the HakgyoExpo SDK. It provides a unified interface for making HTTP requests to the backend API, handling authentication, error management, retries, and response parsing.

## Overview

The [`ApiClient`](packages/hakgyo-expo-sdk/src/api/client.ts:8) class is responsible for all HTTP communication between your Expo/React Native application and the Hakgyo backend server. It abstracts away the complexities of network requests and provides a clean, type-safe API for interacting with the platform's features.

### Key Responsibilities

- **Request Execution**: Execute HTTP requests (GET, POST, PUT, PATCH, DELETE)
- **Authentication**: Automatically inject authentication tokens into requests
- **Error Handling**: Parse and transform API errors into typed exceptions
- **Retry Logic**: Automatically retry failed requests with configurable policies
- **Timeout Management**: Handle request timeouts gracefully
- **Response Parsing**: Transform raw responses into typed TypeScript objects

---

## ApiClient Class

### Constructor and Initialization

The `ApiClient` is initialized with a [`HakgyoSDKConfig`](packages/hakgyo-expo-sdk/src/config/index.ts:5) object that contains the base URL and optional configuration settings.

```typescript
import { ApiClient } from '@hakgyo/expo-sdk';
import { initSDK } from '@hakgyo/expo-sdk';

// Initialize the SDK first
initSDK({
  baseURL: 'https://api.hakgyo.com',
  api: {
    timeout: 30000,
    retries: 3,
  },
});

// Access the pre-configured client
import { apiClient } from '@hakgyo/expo-sdk';
```

### Configuration Options

The following configuration options are available in the `api` section:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retries` | `number` | `3` | Maximum number of retry attempts |
| `retryDelay` | `number` | `1000` | Initial delay between retries (ms) |

### Setting Configuration Dynamically

You can update the client configuration after initialization:

```typescript
apiClient.setConfig({
  baseURL: 'https://api.hakgyo.com',
  api: {
    timeout: 60000,
    retries: 5,
  },
});
```

---

## Making Requests

The `ApiClient` provides methods for all standard HTTP verbs. All methods return a `Promise` that resolves to an [`ApiResponse<T>`](packages/hakgyo-expo-sdk/src/types/api.ts:1).

### GET Requests

Use the `get` method to fetch data from the server:

```typescript
import { apiClient, API_ENDPOINTS } from '@hakgyo/expo-sdk';

interface Kelas {
  id: number;
  name: string;
  description: string;
}

// Simple GET request
const response = await apiClient.get<Kelas[]>('/api/kelas');

if (response.success) {
  const kelasList = response.data;
  console.log(kelasList);
}

// GET with query parameters
const responseWithParams = await apiClient.get<Kelas[]>('/api/kelas', {
  page: 1,
  limit: 10,
  sortBy: 'name',
  sortOrder: 'asc',
});
```

### POST Requests

Use the `post` method to create new resources:

```typescript
interface CreateKelasPayload {
  name: string;
  description: string;
}

const newKelas = await apiClient.post<Kelas>('/api/kelas', {
  name: 'Mathematics 101',
  description: 'Introduction to Algebra',
} as CreateKelasPayload);

if (newKelas.success) {
  console.log('Created kelas:', newKelas.data);
}
```

### PUT Requests

Use the `put` method to update existing resources completely:

```typescript
const updatedKelas = await apiClient.put<Kelas>(
  `/api/kelas/${kelasId}`,
  {
    name: 'Updated Name',
    description: 'Updated Description',
  }
);
```

### PATCH Requests

Use the `patch` method for partial updates:

```typescript
const patchedKelas = await apiClient.patch<Kelas>(
  `/api/kelas/${kelasId}`,
  {
    name: 'New Name', // Only update the name
  }
);
```

### DELETE Requests

Use the `delete` method to remove resources:

```typescript
const deleteResponse = await apiClient.delete<void>(`/api/kelas/${kelasId}`);

if (deleteResponse.success) {
  console.log('Kelas deleted successfully');
}
```

### Using Endpoint Constants

The SDK provides pre-defined endpoint constants in [`API_ENDPOINTS`](packages/hakgyo-expo-sdk/src/api/endpoints.ts:1) for type safety:

```typescript
import { apiClient, API_ENDPOINTS } from '@hakgyo/expo-sdk';

// Using endpoint constants
const kelas = await apiClient.get(API_ENDPOINTS.KELAS.GET(kelasId));
const kelasList = await apiClient.get(API_ENDPOINTS.KELAS.LIST);

// Create a new vocabulary set
const vocabSet = await apiClient.post(API_ENDPOINTS.VOCABULARY.SET_CREATE, {
  name: 'JLPT N5 Vocabulary',
  description: 'Essential Japanese vocabulary',
});
```

---

## Authentication Integration

The `ApiClient` automatically handles authentication by injecting cookies into each request. This is done through the private [`getHeaders()`](packages/hakgyo-expo-sdk/src/api/client.ts:19) method.

### How It Works

1. **Cookie Retrieval**: On each request, the client retrieves authentication cookies from the auth client
2. **Header Injection**: Cookies are automatically added to the `Cookie` header
3. **Automatic Handling**: No manual token management is required

```typescript
// The client automatically handles auth - no additional code needed
const response = await apiClient.get('/api/user/profile');

// This request will include authentication cookies automatically
// if the user is logged in
```

### Request Headers

The client automatically sets the following headers:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |
| `Origin` | Base URL from config |
| `Cookie` | Auth tokens (if available) |

### Custom Headers

You can add custom headers to individual requests:

```typescript
const response = await apiClient.get('/api/special-endpoint', {
  'X-Custom-Header': 'custom-value',
});
```

---

## Error Handling

The SDK provides a hierarchy of error classes for different failure scenarios.

### Error Types

#### ApiError

Thrown when the server returns an error response (4xx or 5xx status codes).

```typescript
import { ApiError, apiClient } from '@hakgyo/expo-sdk';

try {
  const response = await apiClient.get('/api/kelas/99999');
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.status);
    console.log('Message:', error.message);
    console.log('Data:', error.data);
    console.log('Code:', error.code);
  }
}
```

**Properties:**
- `message`: Human-readable error message
- `status`: HTTP status code
- `data`: Raw response data (if available)
- `code`: Error code string

#### NetworkError

Thrown when the request fails due to network issues (no connection, timeout, etc.).

```typescript
import { NetworkError, apiClient } from '@hakgyo/expo-sdk';

try {
  const response = await apiClient.get('/api/kelas');
} catch (error) {
  if (error instanceof NetworkError) {
    console.log('Network error:', error.message);
    console.log('Original error:', error.originalError);
  }
}
```

#### HakgyoError

Base error class that all SDK errors extend.

```typescript
import { HakgyoError, apiClient } from '@hakgyo/expo-sdk';

try {
  const response = await apiClient.get('/api/kelas');
} catch (error) {
  if (error instanceof HakgyoError) {
    console.log('Error code:', error.code);
    console.log('Error name:', error.name);
  }
}
```

### Error Handling Best Practices

```typescript
import { ApiError, NetworkError, apiClient } from '@hakgyo/expo-sdk';

async function fetchKelas(kelasId: number) {
  try {
    const response = await apiClient.get(`/api/kelas/${kelasId}`);
    return response.data;
  } catch (error) {
    if (error instanceof NetworkError) {
      // Handle no internet connection
      throw new Error('No internet connection. Please check your network.');
    }
    
    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          // Handle unauthorized - redirect to login
          throw new Error('Please log in to continue');
        case 403:
          // Handle forbidden
          throw new Error('You do not have permission to access this resource');
        case 404:
          // Handle not found
          throw new Error('Resource not found');
        case 429:
          // Handle rate limiting
          throw new Error('Too many requests. Please try again later.');
        default:
          throw new Error(error.message || 'An unexpected error occurred');
      }
    }
    
    throw error;
  }
}
```

---

## Retry Logic

The `ApiClient` includes automatic retry functionality for failed requests.

### Configuration

Retry behavior is configured through the SDK config:

```typescript
import { initSDK } from '@hakgyo/expo-sdk';

initSDK({
  baseURL: 'https://api.hakgyo.com',
  api: {
    retries: 3,        // Number of retry attempts
    retryDelay: 1000,  // Initial delay in milliseconds
  },
});
```

### Retry Strategy

The retry mechanism uses exponential backoff:

1. **First attempt**: Immediate
2. **Second attempt**: After `retryDelay * 2^0` ms (default: 1000ms)
3. **Third attempt**: After `retryDelay * 2^1` ms (default: 2000ms)
4. **Fourth attempt**: After `retryDelay * 2^2` ms (default: 4000ms)

### Retry Conditions

The client automatically retries on:
- Network errors
- 5xx server errors
- 429 Too Many Requests
- 408 Request Timeout

The client does NOT retry on:
- 4xx client errors (except 429 and 408)
- Successful responses

### Custom Retry Logic

You can customize retry behavior through the config:

```typescript
initSDK({
  baseURL: 'https://api.hakgyo.com',
  api: {
    retries: 5,
    timeout: 30000,
  },
});
```

---

## Pagination

The SDK provides support for paginated responses through query parameters and typed response interfaces.

### Paginated Responses

Paginated responses use the [`PaginatedResponse<T>`](packages/hakgyo-expo-sdk/src/types/api.ts:8) interface:

```typescript
import { PaginatedResponse, apiClient } from '@hakgyo/expo-sdk';

interface Kelas {
  id: number;
  name: string;
}

const response = await apiClient.get<PaginatedResponse<Kelas>>('/api/kelas', {
  page: 1,
  limit: 10,
});

if (response.success && response.data) {
  const { data, pagination } = response.data;
  
  console.log('Items:', data);
  console.log('Current page:', pagination.page);
  console.log('Total pages:', pagination.totalPages);
  console.log('Total items:', pagination.total);
  
  // Check for streak information
  if (response.data.streakInfo) {
    console.log('Current streak:', response.data.streakInfo.currentStreak);
  }
}
```

### Pagination Interface

```typescript
interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  pagination: {
    page: number;       // Current page number
    limit: number;      // Items per page
    total: number;      // Total number of items
    totalPages: number; // Total number of pages
  };
  streakInfo?: StreakInfo; // Optional streak data
}
```

### Query Parameters

Use the following parameters for pagination:

```typescript
const response = await apiClient.get('/api/kelas', {
  page: 2,           // Page number (1-indexed)
  limit: 20,         // Items per page
  sortBy: 'createdAt', // Field to sort by
  sortOrder: 'desc',   // Sort direction
  search: 'math',      // Search filter
});
```

### Pagination Helper Types

The SDK provides query parameter types for different endpoints:

```typescript
import { 
  QueryParams, 
  KoleksiSoalQueryParams, 
  SoaresQueryParams 
} from '@hakgyo/expo-sdk';

// Generic query params
const params: QueryParams = {
  page: 1,
  limit: 10,
  sortBy: 'name',
  sortOrder: 'asc',
};

// Specific to koleksi soal endpoint
const koleksiParams: KoleksiSoalQueryParams = {
  page: 1,
  limit: 20,
  userId: 'user123',
  kelasId: '456',
  onlyJoinedClasses: true,
};

// Specific to soal endpoint
const soalParams: SoaresQueryParams = {
  page: 1,
  limit: 10,
  authorId: 'user123',
  koleksiSoalId: '456',
};
```

---

## TypeScript Support

The `ApiClient` is fully typed with generic type parameters for response data.

### Generic Response Types

All request methods accept a generic type parameter that specifies the expected response data type:

```typescript
// Define your data types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'guru' | 'admin';
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

// Use generics for type safety
const userResponse = await apiClient.get<User>('/api/user/profile');
const createResponse = await apiClient.post<User, CreateUserPayload>(
  '/api/user',
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secure123',
  }
);
```

### ApiResponse Type

All responses are wrapped in the `ApiResponse` type:

```typescript
interface ApiResponse<T = any> {
  success: boolean;    // Whether the request succeeded
  data?: T;           // The response data
  error?: string;     // Error message (if any)
  message?: string;   // Additional message
}
```

### Usage Examples

```typescript
// GET request with typed response
interface KelasListItem {
  id: number;
  name: string;
  description: string;
  memberCount: number;
}

const response = await apiClient.get<KelasListItem[]>('/api/kelas');

if (response.success && response.data) {
  // TypeScript knows response.data is KelasListItem[]
  response.data.forEach(kelas => {
    console.log(kelas.name); // Type-safe access
  });
}

// POST request with request and response types
interface CreateSoalPayload {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface CreatedSoal {
  id: number;
  question: string;
  createdAt: string;
}

const soalResponse = await apiClient.post<CreatedSoal, CreateSoalPayload>(
  '/api/soal',
  {
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
  }
);
```

### Type-Safe Endpoints

Use the `API_ENDPOINTS` constants for type-safe endpoint references:

```typescript
import { API_ENDPOINTS, apiClient } from '@hakgyo/expo-sdk';

// Dynamic endpoints with parameters
const endpoint = API_ENDPOINTS.KELAS.GET(123); // Returns '/api/kelas/123'
const response = await apiClient.get(endpoint);

// Static endpoints
const dailyVocab = await apiClient.get(API_ENDPOINTS.VOCABULARY.DAILY);
```

---

## Complete Example

Here's a comprehensive example showing how to use the API client in a real application:

```typescript
import { 
  apiClient, 
  API_ENDPOINTS, 
  ApiError, 
  NetworkError,
  initSDK 
} from '@hakgyo/expo-sdk';

// Initialize the SDK
initSDK({
  baseURL: 'https://api.hakgyo.com',
  api: {
    timeout: 30000,
    retries: 3,
  },
  logging: {
    enabled: true,
    level: 'debug',
  },
});

// Define types
interface Kelas {
  id: number;
  name: string;
  description: string;
}

interface PaginatedKelas {
  items: Kelas[];
  page: number;
  totalPages: number;
}

// Make API calls
async function fetchKelasList(page = 1, limit = 10) {
  try {
    const response = await apiClient.get<PaginatedKelas>(
      API_ENDPOINTS.KELAS.LIST,
      { page, limit }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch kelas');
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('Network error:', error.message);
      throw error;
    }
    
    if (error instanceof ApiError) {
      console.error('API error:', error.status, error.message);
      throw error;
    }
    
    throw error;
  }
}

async function createKelas(name: string, description: string) {
  try {
    const response = await apiClient.post<Kelas>(
      API_ENDPOINTS.KELAS.CREATE,
      { name, description }
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to create kelas');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // Handle unauthorized
      console.log('Please log in first');
    }
    throw error;
  }
}

// Usage
const kelasList = await fetchKelasList(1, 20);
const newKelas = await createKelas('Physics 101', 'Introduction to Mechanics');
```

---

## Related Documentation

- [Configuration Guide](config.md) - SDK configuration options
- [Authentication Guide](expo-sdk-auth-guide.md) - User authentication
- [API Endpoints Reference](packages/hakgyo-expo-sdk/src/api/endpoints.ts) - Complete endpoint list