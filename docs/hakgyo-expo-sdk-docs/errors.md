# Error Handling

The HakgyoExpo SDK provides a comprehensive error handling system that allows you to gracefully handle various types of errors that can occur during API requests, authentication, and network operations.

## Overview

The SDK uses a hierarchical error class system with [`HakgyoError`](packages/hakgyo-expo-sdk/src/errors/HakgyoError.ts:1) as the base class. All SDK errors inherit from this base class, making it easy to catch and handle any SDK-related error.

```typescript
import { HakgyoError, AuthError, ApiError, NetworkError } from '@hakgyo/hakgyo-expo-sdk';
```

## Error Classes

### HakgyoError

The base error class for all SDK errors. All other error types extend this class.

```typescript
import { HakgyoError } from '@hakgyo/hakgyo-expo-sdk';

throw new HakgyoError('Something went wrong', 'CUSTOM_ERROR');
```

### AuthError

Extends [`HakgyoError`](packages/hakgyo-expo-sdk/src/errors/HakgyoError.ts:1) and is thrown when authentication-related errors occur, such as invalid credentials, session expiration, or token refresh failures.

```typescript
import { AuthError } from '@hakgyo/hakgyo-expo-sdk';

throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
```

### ApiError

Extends [`HakgyoError`](packages/hakgyo-expo-sdk/src/errors/HakgyoError.ts:1) and is thrown when API requests fail. This includes HTTP errors like 404 (Not Found), 403 (Forbidden), validation errors, and rate limiting.

```typescript
import { ApiError } from '@hakgyo/hakgyo-expo-sdk';

throw new ApiError('Resource not found', 404, { id: '123' }, 'NOT_FOUND');
```

### NetworkError

Extends [`HakgyoError`](packages/hakgyo-expo-sdk/src/errors/HakgyoError.ts:1) and is thrown when network connectivity issues occur, such as timeouts or when the device is offline.

```typescript
import { NetworkError } from '@hakgyo/hakgyo-expo-sdk';

throw new NetworkError('Network request failed');
```

## Error Properties

Each error class provides specific properties to help you identify and handle errors appropriately.

### HakgyoError Properties

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Human-readable error message |
| `code` | `string` | Error code for programmatic error handling |
| `name` | `string` | Always set to `'HakgyoError'` |
| `originalError` | `unknown` | The original error that was caught (if any) |

### AuthError Properties

Inherits all properties from [`HakgyoError`](packages/hakgyo-expo-sdk/src/errors/HakgyoError.ts:1).

### ApiError Properties

Inherits all properties from [`HakgyoError`](packages/hakgyo-expo-sdk/src/errors/HakgyoError.ts:1) plus:

| Property | Type | Description |
|----------|------|-------------|
| `status` | `number \| undefined` | HTTP status code from the API response |
| `data` | `unknown \| undefined` | Response data from the API (if available) |

### NetworkError Properties

Inherits all properties from [`HakgyoError`](packages/hakgyo-expo-sdk/src/errors/HakgyoError.ts:1).

## Error Codes

The SDK provides a comprehensive set of error codes defined in [`ErrorCodes`](packages/hakgyo-expo-sdk/src/types/errors.ts:2):

```typescript
import { ErrorCodes } from '@hakgyo/hakgyo-expo-sdk';
```

### Authentication Errors

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User is not authenticated |
| `INVALID_CREDENTIALS` | Invalid username or password |
| `SESSION_EXPIRED` | User session has expired |
| `TOKEN_REFRESH_FAILED` | Failed to refresh authentication token |

### API Errors

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Requested resource not found (HTTP 404) |
| `FORBIDDEN` | Access to resource is forbidden (HTTP 403) |
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests, rate limit exceeded |

### Network Errors

| Code | Description |
|------|-------------|
| `NETWORK_ERROR` | General network error |
| `TIMEOUT` | Request timed out |
| `OFFLINE` | Device is offline |

### Default Error Codes

| Code | Description |
|------|-------------|
| `UNKNOWN_ERROR` | Unknown error occurred |
| `API_ERROR` | General API error |
| `AUTH_ERROR` | General authentication error |

## Handling Patterns

### Try-Catch Pattern

The most common way to handle errors is using try-catch blocks:

```typescript
import { AuthError, ApiError, NetworkError } from '@hakgyo/hakgyo-expo-sdk';

async function fetchUserData(userId: string) {
  try {
    const user = await hakgyo.user.get(userId);
    return user;
  } catch (error) {
    if (error instanceof AuthError) {
      // Handle authentication errors
      console.error('Authentication failed:', error.message);
      // Redirect to login or refresh token
    } else if (error instanceof ApiError) {
      // Handle API errors
      console.error('API error:', error.status, error.message);
    } else if (error instanceof NetworkError) {
      // Handle network errors
      console.error('Network error:', error.message);
    } else {
      // Handle unknown errors
      console.error('Unknown error:', error);
    }
    throw error;
  }
}
```

### Error Type Checking

Use `instanceof` to check error types:

```typescript
import { HakgyoError, AuthError, ApiError, NetworkError } from '@hakgyo/hakgyo-expo-sdk';

function handleError(error: unknown) {
  if (error instanceof HakgyoError) {
    // Handle any SDK error
    console.log(`Error code: ${error.code}`);
    console.log(`Error message: ${error.message}`);
    
    if (error instanceof AuthError) {
      // Handle auth-specific logic
    } else if (error instanceof ApiError) {
      // Handle API-specific logic
      console.log(`Status: ${error.status}`);
    } else if (error instanceof NetworkError) {
      // Handle network-specific logic
    }
  }
}
```

### Checking Error Codes

For more granular error handling, check the error code:

```typescript
import { ErrorCodes, HakgyoError } from '@hakgyo/hakgyo-expo-sdk';

function handleError(error: unknown) {
  if (error instanceof HakgyoError) {
    switch (error.code) {
      case ErrorCodes.SESSION_EXPIRED:
        // Refresh session or redirect to login
        break;
      case ErrorCodes.RATE_LIMIT_EXCEEDED:
        // Show rate limit message and retry later
        break;
      case ErrorCodes.NOT_FOUND:
        // Resource not found - show appropriate message
        break;
      case ErrorCodes.OFFLINE:
        // Show offline message
        break;
      default:
        // Handle other errors
        break;
    }
  }
}
```

### Retry Logic

The SDK provides a [`withRetry`](packages/hakgyo-expo-sdk/src/utils/retry.ts:20) utility for implementing retry logic:

```typescript
import { withRetry, NetworkError, ApiError, ErrorCodes } from '@hakgyo/hakgyo-expo-sdk';

async function fetchWithRetry() {
  const result = await withRetry(
    () => hakgyo.kelas.getAll(),
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      factor: 2,
      onRetry: (error, attempt) => {
        console.log(`Retry attempt ${attempt}:`, error);
      },
      shouldRetry: (error) => {
        // Only retry on network errors or rate limiting
        if (error instanceof NetworkError) return true;
        if (error instanceof ApiError && error.code === ErrorCodes.RATE_LIMIT_EXCEEDED) {
          return true;
        }
        return false;
      }
    }
  );
  return result;
}
```

### User-Friendly Error Messages

Create user-friendly error messages based on error types:

```typescript
import { HakgyoError, AuthError, ApiError, NetworkError, ErrorCodes } from '@hakgyo/hakgyo-expo-sdk';

function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  if (error instanceof AuthError) {
    switch (error.code) {
      case ErrorCodes.INVALID_CREDENTIALS:
        return 'Invalid username or password. Please try again.';
      case ErrorCodes.SESSION_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case ErrorCodes.TOKEN_REFRESH_FAILED:
        return 'Unable to refresh your session. Please log in again.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
  
  if (error instanceof ApiError) {
    switch (error.code) {
      case ErrorCodes.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorCodes.FORBIDDEN:
        return 'You do not have permission to access this resource.';
      case ErrorCodes.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorCodes.RATE_LIMIT_EXCEEDED:
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
  
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}
```

## Examples

### Complete Error Handling Example

```typescript
import { 
  HakgyoError, 
  AuthError, 
  ApiError, 
  NetworkError,
  ErrorCodes 
} from '@hakgyo/hakgyo-expo-sdk';

async function performAuthenticatedAction() {
  try {
    // Attempt to fetch protected data
    const data = await hakgyo.kelas.getAll();
    return { success: true, data };
  } catch (error) {
    if (error instanceof NetworkError) {
      return {
        success: false,
        error: 'Unable to connect. Please check your internet connection.',
        type: 'network'
      };
    }
    
    if (error instanceof AuthError) {
      if (error.code === ErrorCodes.SESSION_EXPIRED) {
        // Try to refresh the session
        const refreshed = await hakgyo.auth.refreshSession();
        if (refreshed) {
          // Retry the original request
          try {
            const data = await hakgyo.kelas.getAll();
            return { success: true, data };
          } catch {
            return {
              success: false,
              error: 'Session expired. Please log in again.',
              type: 'auth'
            };
          }
        }
      }
      return {
        success: false,
        error: 'Please log in to continue.',
        type: 'auth'
      };
    }
    
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return {
          success: false,
          error: 'The requested content was not found.',
          type: 'api'
        };
      }
      if (error.status === 403) {
        return {
          success: false,
          error: 'You do not have permission to perform this action.',
          type: 'api'
        };
      }
      return {
        success: false,
        error: error.message || 'An error occurred.',
        type: 'api'
      };
    }
    
    // Unknown error
    return {
      success: false,
      error: 'An unexpected error occurred.',
      type: 'unknown'
    };
  }
}
```

### Handling Multiple Error Types

```typescript
import { ApiError, NetworkError, ErrorCodes } from '@hakgyo/hakgyo-expo-sdk';

async function robustApiCall<T>(
  apiCall: () => Promise<T>,
  onSuccess: (data: T) => void,
  onError: (message: string) => void
) {
  try {
    const data = await apiCall();
    onSuccess(data);
  } catch (error) {
    if (error instanceof NetworkError) {
      onError('Connection failed. Please check your internet.');
    } else if (error instanceof ApiError) {
      if (error.status === 0) {
        onError('Server unreachable. Please try again later.');
      } else if (error.code === ErrorCodes.RATE_LIMIT_EXCEEDED) {
        onError('Too many requests. Please wait before trying again.');
      } else {
        onError(error.message || 'Request failed.');
      }
    } else {
      onError('An unexpected error occurred.');
    }
  }
}

// Usage
robustApiCall(
  () => hakgyo.vocabulary.getSets(),
  (data) => console.log('Vocabulary sets:', data),
  (message) => console.error('Error:', message)
);
```

### Error Boundary Pattern for React

```typescript
import { Component, ReactNode } from 'react';
import { HakgyoError, AuthError, ApiError, NetworkError } from '@hakgyo/hakgyo-expo-sdk';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      // Default error UI
      let message = 'An unexpected error occurred.';
      let title = 'Error';

      if (this.state.error instanceof NetworkError) {
        title = 'Connection Error';
        message = 'Unable to connect to the server. Please check your internet connection.';
      } else if (this.state.error instanceof AuthError) {
        title = 'Authentication Error';
        message = 'Please log in to continue.';
      } else if (this.state.error instanceof ApiError) {
        title = 'Request Error';
        message = this.state.error.message;
      }

      return (
        <div className="error-boundary">
          <h2>{title}</h2>
          <p>{message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;