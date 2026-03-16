# SDK Configuration

The configuration module provides the foundation for initializing and managing the HakgyoExpo SDK. It defines the structure for SDK settings, default values, and validation logic.

## Overview

The config module handles:

- **SDK Initialization** - Setting up the SDK with required and optional configuration options
- **Configuration Management** - Storing and retrieving SDK configuration throughout the application lifecycle
- **Validation** - Ensuring configuration values are valid before the SDK is used
- **Default Values** - Providing sensible defaults for optional configuration options

## Configuration Interface

### `HakgyoSDKConfig`

The main configuration interface for the SDK. Located in [`packages/hakgyo-expo-sdk/src/config/index.ts`](packages/hakgyo-expo-sdk/src/config/index.ts:5).

```typescript
interface HakgyoSDKConfig {
  // Required
  baseURL: string;

  // Optional - Auth Configuration
  auth?: {
    storagePrefix?: string;
    sessionRefreshThreshold?: number;
    autoRefresh?: boolean;
    deepLinkScheme?: string;
  };

  // Optional - API Configuration
  api?: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  };

  // Optional - Logging
  logging?: {
    enabled?: boolean;
    level?: 'debug' | 'info' | 'warn' | 'error';
  };

  // Optional - Platform-specific
  platform?: {
    deviceId?: string;
    platformType?: 'ios' | 'android' | 'web';
  };
}
```

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `baseURL` | `string` | The base URL for all API requests. Must be a valid URL string. |

### Auth Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `storagePrefix` | `string` | `'hakgyo_auth'` | Prefix used for storing authentication data in secure storage |
| `sessionRefreshThreshold` | `number` | `5` | Number of minutes before session expiry to trigger refresh |
| `autoRefresh` | `boolean` | `true` | Enable automatic session token refresh |
| `deepLinkScheme` | `string` | `'hakgyo://'` | Deep link scheme for OAuth callbacks |

### API Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retries` | `number` | `3` | Number of retry attempts for failed requests |
| `retryDelay` | `number` | `1000` | Delay between retry attempts in milliseconds |

### Logging Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable or disable SDK logging |
| `level` | `'debug'` \| `'info'` \| `'warn'` \| `'error'` | `'error'` | Log level for filtering output |

### Platform Configuration Options

| Property | Type | Description |
|----------|------|-------------|
| `deviceId` | `string` | Custom device identifier |
| `platformType` | `'ios'` \| `'android'` \| `'web'` | Platform type override |

## Initialization

### `initSDK(config)`

Initializes the SDK with the provided configuration. This function must be called before using any other SDK features.

**Signature:**

```typescript
function initSDK(config: HakgyoSDKConfig): HakgyoSDKConfig
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `HakgyoSDKConfig` | Configuration object with required `baseURL` and optional settings |

**Returns:**

The merged configuration object with defaults applied.

**Behavior:**

1. Merges provided configuration with default values
2. Initializes the logger based on logging configuration
3. Configures the API client with the merged settings
4. Initializes the authentication client

**Example:**

```typescript
import { initSDK } from '@hakgyo/expo-sdk';

// Basic initialization
initSDK({
  baseURL: 'https://api.hakgyo.com',
});

// With custom configuration
initSDK({
  baseURL: 'https://api.hakgyo.com',
  auth: {
    autoRefresh: true,
    sessionRefreshThreshold: 10,
  },
  api: {
    timeout: 60000,
    retries: 5,
  },
  logging: {
    enabled: true,
    level: 'debug',
  },
});
```

## Getting Configuration

### `getConfig()`

Retrieves the current SDK configuration. Throws an error if the SDK has not been initialized.

**Signature:**

```typescript
function getConfig(): HakgyoSDKConfig
```

**Returns:**

The current SDK configuration object.

**Throws:**

`Error` - If SDK is not initialized (initSDK has not been called).

**Example:**

```typescript
import { getConfig } from '@hakgyo/expo-sdk';

try {
  const config = getConfig();
  console.log('API Base URL:', config.baseURL);
  console.log('Request Timeout:', config.api?.timeout);
} catch (error) {
  console.error('SDK not initialized:', error.message);
}
```

## Default Values

### `DEFAULT_CONFIG`

The default configuration values applied when optional settings are not provided.

**Reference:** [`packages/hakgyo-expo-sdk/src/config/index.ts`](packages/hakgyo-expo-sdk/src/config/index.ts:37)

```typescript
const DEFAULT_CONFIG: Partial<HakgyoSDKConfig> = {
  auth: {
    storagePrefix: 'hakgyo_auth',
    sessionRefreshThreshold: 5,
    autoRefresh: true,
    deepLinkScheme: 'hakgyo://',
  },
  api: {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
  },
  logging: {
    enabled: false,
    level: 'error',
  },
};
```

**Default Values Summary:**

| Category | Property | Default Value |
|----------|----------|---------------|
| Auth | `storagePrefix` | `'hakgyo_auth'` |
| Auth | `sessionRefreshThreshold` | `5` (minutes) |
| Auth | `autoRefresh` | `true` |
| Auth | `deepLinkScheme` | `'hakgyo://'` |
| API | `timeout` | `30000` (30 seconds) |
| API | `retries` | `3` |
| API | `retryDelay` | `1000` (1 second) |
| Logging | `enabled` | `false` |
| Logging | `level` | `'error'` |

## Configuration Validation

### `validateConfig(config)`

Validates the SDK configuration before initialization. Ensures required fields are present and properly formatted.

**Reference:** [`packages/hakgyo-expo-sdk/src/config/validation.ts`](packages/hakgyo-expo-sdk/src/config/validation.ts:3)

**Signature:**

```typescript
function validateConfig(config: HakgyoSDKConfig): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `HakgyoSDKConfig` | Configuration object to validate |

**Throws:**

- `Error: 'HakgyoSDK Configuration Error: baseURL is required'` - When baseURL is missing or empty
- `Error: 'HakgyoSDK Configuration Error: baseURL must be a valid URL'` - When baseURL is not a valid URL format

**Validation Rules:**

1. `baseURL` must be present and non-empty
2. `baseURL` must be a valid URL format (parseable by the URL constructor)

**Example:**

```typescript
import { validateConfig } from '@hakgyo/expo-sdk/src/config/validation';

// Valid configuration
validateConfig({ baseURL: 'https://api.example.com' }); // No error

// Invalid - missing baseURL
validateConfig({}); // Throws: baseURL is required

// Invalid - malformed URL
validateConfig({ baseURL: 'not-a-url' }); // Throws: baseURL must be a valid URL
```

## Error Handling

### Common Configuration Errors

#### SDK Not Initialized

**Error Message:** `'SDK not initialized. Call initSDK() first.'`

**Cause:** Calling `getConfig()` before `initSDK()`.

**Solution:**

```typescript
// Incorrect
const config = getConfig(); // Throws error

// Correct
initSDK({ baseURL: 'https://api.example.com' });
const config = getConfig(); // Works
```

#### Missing Base URL

**Error Message:** `'HakgyoSDK Configuration Error: baseURL is required'`

**Cause:** Initializing SDK without providing a `baseURL`.

**Solution:**

```typescript
// Incorrect
initSDK({}); // Throws error

// Correct
initSDK({ baseURL: 'https://api.example.com' });
```

#### Invalid URL Format

**Error Message:** `'HakgyoSDK Configuration Error: baseURL must be a valid URL'`

**Cause:** Providing a malformed URL string.

**Solution:**

```typescript
// Incorrect
initSDK({ baseURL: 'api.example.com' }); // Missing protocol

// Correct
initSDK({ baseURL: 'https://api.example.com' });
```

## Examples

### Development Setup

Configuration optimized for development with verbose logging and shorter timeouts.

```typescript
import { initSDK } from '@hakgyo/expo-sdk';

initSDK({
  baseURL: 'http://localhost:3000',
  auth: {
    storagePrefix: 'hakgyo_dev',
    autoRefresh: true,
  },
  api: {
    timeout: 10000, // 10 seconds for faster feedback
    retries: 1, // Fewer retries during development
    retryDelay: 500,
  },
  logging: {
    enabled: true,
    level: 'debug', // Verbose logging
  },
});
```

### Production Setup

Configuration optimized for production with error-only logging and robust retry logic.

```typescript
import { initSDK } from '@hakgyo/expo-sdk';

initSDK({
  baseURL: 'https://api.hakgyo.com',
  auth: {
    storagePrefix: 'hakgyo_auth',
    sessionRefreshThreshold: 10,
    autoRefresh: true,
    deepLinkScheme: 'hakgyo://',
  },
  api: {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
  },
  logging: {
    enabled: true,
    level: 'error', // Only log errors in production
  },
});
```

### With Custom Logger

Configuration with custom logging settings for debugging specific issues.

```typescript
import { initSDK } from '@hakgyo/expo-sdk';

initSDK({
  baseURL: 'https://api.hakgyo.com',
  logging: {
    enabled: true,
    level: 'info', // Log info, warnings, and errors
  },
});
```

### With Retry Configuration

Configuration with aggressive retry settings for unreliable network conditions.

```typescript
import { initSDK } from '@hakgyo/expo-sdk';

initSDK({
  baseURL: 'https://api.hakgyo.com',
  api: {
    timeout: 45000, // 45 seconds
    retries: 5, // More retry attempts
    retryDelay: 2000, // 2 second delay between retries
  },
});
```

### Platform-Specific Configuration

Configuration with platform-specific settings for mobile apps.

```typescript
import { initSDK } from '@hakgyo/expo-sdk';
import { Platform } from 'react-native';

initSDK({
  baseURL: 'https://api.hakgyo.com',
  auth: {
    deepLinkScheme: 'hakgyo://auth',
  },
  platform: {
    platformType: Platform.OS as 'ios' | 'android',
  },
});
```

### Staging Environment Setup

Configuration for staging/testing environments.

```typescript
import { initSDK } from '@hakgyo/expo-sdk';

initSDK({
  baseURL: 'https://staging-api.hakgyo.com',
  auth: {
    storagePrefix: 'hakgyo_staging',
    sessionRefreshThreshold: 15,
  },
  api: {
    timeout: 20000,
    retries: 2,
  },
  logging: {
    enabled: true,
    level: 'warn', // Log warnings and errors
  },
});
```

## Related Documentation

- [Authentication Guide](./expo-sdk-auth-guide.md) - Authentication configuration and usage
- [API Client](./api-client.md) - API client configuration and request handling
- [README](./README.md) - SDK overview and getting started