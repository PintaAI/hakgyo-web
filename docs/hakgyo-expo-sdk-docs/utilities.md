# Utilities

The HakgyoExpo SDK provides several utility modules to help with common development tasks like logging and handling transient failures.

## Overview

The SDK exports two main utility modules from [`packages/hakgyo-expo-sdk/src/utils/`](packages/hakgyo-expo-sdk/src/utils/index.ts):

| Utility | Purpose |
|---------|---------|
| **Logger** | Structured logging with configurable log levels |
| **Retry** | Automatic retry logic with exponential backoff |

---

## Logger

The Logger utility provides a simple, configurable logging interface with support for multiple log levels. All log messages are prefixed with `[HakgyoSDK]` for easy identification.

### Importing

```typescript
import { Logger, LogLevel, logger } from '@hakgyo/expo-sdk';
```

### Log Levels

The [`LogLevel`](packages/hakgyo-expo-sdk/src/utils/logger.ts:1) enum defines the following levels (in order of verbosity):

| Level | Value | Description |
|-------|-------|-------------|
| `DEBUG` | 0 | Detailed information for debugging |
| `INFO` | 1 | General informational messages |
| `WARN` | 2 | Warning messages about potential issues |
| `ERROR` | 3 | Error messages |
| `NONE` | 4 | Disables all logging |

### Creating a Logger Instance

```typescript
// Use default level (INFO)
const logger = new Logger();

// Create with specific level
const debugLogger = new Logger(LogLevel.DEBUG);

// Create with DEBUG for development
const devLogger = new Logger(LogLevel.DEBUG);
```

### Configuration Options

The [`Logger`](packages/hakgyo-expo-sdk/src/utils/logger.ts:9) class accepts a [`LogLevel`](packages/hakgyo-expo-sdk/src/utils/logger.ts:1) in its constructor:

```typescript
const logger = new Logger(LogLevel.WARN);
```

You can also change the log level dynamically using [`setLevel()`](packages/hakgyo-expo-sdk/src/utils/logger.ts:16):

```typescript
logger.setLevel(LogLevel.DEBUG);
```

### Usage Examples

#### Basic Logging

```typescript
import { Logger, LogLevel } from '@hakgyo/expo-sdk';

const logger = new Logger(LogLevel.DEBUG);

logger.debug('Debug information:', { userId: 123 });
logger.info('User logged in', { username: 'john' });
logger.warn('API rate limit approaching', { remaining: 10 });
logger.error('Failed to fetch data', new Error('Network error'));
```

#### Using the Pre-configured Instance

The SDK exports a pre-configured logger instance:

```typescript
import { logger } from '@hakgyo/expo-sdk';

logger.info('Application started');
logger.error('Something went wrong');
```

#### Conditional Logging

Log messages are automatically filtered based on the configured level:

```typescript
const logger = new Logger(LogLevel.INFO);

// This will be logged (INFO >= INFO)
logger.info('Starting process');

// This will NOT be logged (DEBUG < INFO)
logger.debug('Processing details');
```

---

## Retry Logic

The retry utility provides automatic retry functionality with exponential backoff for handling transient failures.

### Importing

```typescript
import { withRetry } from '@hakgyo/expo-sdk';
```

### The `withRetry` Function

The [`withRetry<T>()`](packages/hakgyo-expo-sdk/src/utils/retry.ts:20) function wraps an async operation and automatically retries it on failure.

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>
```

### Retry Options

The [`RetryOptions`](packages/hakgyo-expo-sdk/src/utils/retry.ts:3) interface provides the following configuration:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `retries` | `number` | 3 | Maximum number of retry attempts |
| `minTimeout` | `number` | 1000 | Initial delay in milliseconds |
| `maxTimeout` | `number` | 5000 | Maximum delay in milliseconds |
| `factor` | `number` | 2 | Exponential backoff multiplier |
| `onRetry` | `(error: unknown, attempt: number) => void` | `() => {}` | Callback fired on each retry |
| `shouldRetry` | `(error: unknown) => boolean` | All errors | Function to determine if retry should occur |

### When to Use Retry

Use retry logic for:

- **Network requests** - Transient network failures
- **API calls** - Temporary server unavailability or rate limiting
- **Database operations** - Connection timeouts
- **File operations** - Temporary file system issues

### Usage Examples

#### Basic Retry

```typescript
import { withRetry } from '@hakgyo/expo-sdk';

async function fetchUserData(userId: string) {
  return withRetry(async () => {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  });
}
```

#### Custom Retry Configuration

```typescript
const result = await withRetry(
  async () => await api.fetchData(),
  {
    retries: 5,
    minTimeout: 2000,
    maxTimeout: 10000,
    factor: 1.5
  }
);
```

#### Custom Retry Condition

Only retry on specific error types:

```typescript
import { withRetry } from '@hakgyo/expo-sdk';

const result = await withRetry(
  async () => await api.submitForm(data),
  {
    retries: 3,
    shouldRetry: (error) => {
      if (error instanceof Error) {
        // Retry on network errors or 5xx status codes
        return error.message.includes('network') || 
               error.message.includes('500');
      }
      return false;
    }
  }
);
```

#### Logging Retries

Track retry attempts:

```typescript
import { withRetry } from '@hakgyo/expo-sdk';

await withRetry(
  async () => await api.syncData(),
  {
    retries: 3,
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}:`, error);
    }
  }
);
```

#### Exponential Backoff

The default configuration uses exponential backoff:

```typescript
// Default behavior: 1s → 2s → 4s (capped at 5s)
await withRetry(async () => await operation());

// Custom factor: 1s → 3s → 9s
await withRetry(async () => await operation(), {
  minTimeout: 1000,
  factor: 3,
  maxTimeout: 10000
});
```

---

## Best Practices

### Logger Best Practices

1. **Use appropriate log levels**
   - `DEBUG`: Development-only information
   - `INFO`: Normal operation events
   - `WARN`: Recoverable issues that need attention
   - `ERROR`: Failures that need investigation

2. **Include contextual data**
   ```typescript
   // Good
   logger.info('User purchased item', { userId, itemId, price });
   
   // Avoid
   logger.info('Purchase complete');
   ```

3. **Set appropriate levels per environment**
   ```typescript
   const logger = new Logger(
     process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN
   );
   ```

### Retry Best Practices

1. **Set reasonable retry limits**
   - Too few retries: operations fail unnecessarily
   - Too many retries: poor user experience during outages

2. **Use exponential backoff**
   - Prevents overwhelming failing services
   - Default factor of 2 is suitable for most cases

3. **Define clear retry conditions**
   ```typescript
   shouldRetry: (error) => {
     // Don't retry on client errors (4xx)
     if (error.status >= 400 && error.status < 500) return false;
     return true;
   }
   ```

4. **Handle retries in UI**
   ```typescript
   try {
     await withRetry(async () => await saveData());
     showSuccess('Data saved');
   } catch (error) {
     showError('Failed to save. Please try again.');
   }
   ```

5. **Log retry attempts for debugging**
   ```typescript
   onRetry: (error, attempt) => {
     logger.warn(`Operation failed, retrying...`, { attempt, error });
   }
   ```

---

## Related Documentation

- [Configuration](./config.md) - SDK configuration options
- [Error Handling](./errors.md) - Error types and handling patterns
- [API Client](./api-client.md) - Using the API client with utilities