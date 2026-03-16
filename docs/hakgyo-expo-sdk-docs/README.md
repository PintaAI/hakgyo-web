# HakgyoExpo SDK Documentation

Welcome to the comprehensive documentation for the HakgyoExpo SDK. This documentation provides everything you need to integrate the Hakgyo learning platform into your Expo/React Native applications.

## Introduction

HakgyoExpo SDK is a TypeScript SDK designed for seamless integration of Hakgyo webapp authentication and API functionality in Expo/React Native applications. It provides a type-safe, secure, and developer-friendly way to connect your mobile applications to the Hakgyo learning platform.

### Purpose

The SDK abstracts away the complexity of:
- **Authentication flows** - Email/password sign-up and sign-in, Google Sign-In, and OAuth social authentication
- **Session management** - Secure token storage using `expo-secure-store` with automatic refresh
- **API communication** - Type-safe API client with built-in retry logic and error handling
- **Real-time features** - Push notification registration and management

## Features

### Authentication
- **Better-Auth Integration** - Seamless authentication with Expo plugin support
- **Email Authentication** - Sign up and sign in with email/password
- **Google Sign-In** - Native Google authentication with `@react-native-google-signin/google-signin`
- **Social OAuth** - Support for multiple OAuth providers (Google, GitHub, Discord, Apple, Facebook)
- **Secure Storage** - Uses `expo-secure-store` for secure session token management
- **Auto Session Refresh** - Automatic token refresh before expiry

### API Client
- **Full TypeScript Support** - Complete type definitions for all API responses and requests
- **Retry Logic** - Built-in retry mechanism with exponential backoff for network resilience
- **Timeout Handling** - Configurable request timeouts with AbortController
- **Structured Error Handling** - Dedicated error classes for different scenarios (`AuthError`, `ApiError`, `NetworkError`)

### Data Models
- **Kelas (Classes)** - Full CRUD operations for courses/classes
- **Materi (Materials)** - Learning material management with progress tracking
- **Vocabulary** - Vocabulary sets and items with learning progress
- **Soal (Questions)** - Question management and daily challenges
- **Tryout** - Practice test functionality
- **Posts** - Social posts and comments
- **Gamification** - XP, levels, streaks, and leaderboards

### Developer Experience
- **React Hooks** - Authentication hooks for easy state management (`useAuth`)
- **Configurable** - Customize timeouts, retries, logging levels, and more
- **Pagination Support** - Standardized query parameters for paginated responses
- **Logging** - Configurable logging levels for debugging

## Installation

Install the SDK using your preferred package manager:

```bash
# Using bun (recommended)
bun add hakgyo-expo-sdk

# Using npm
npm install hakgyo-expo-sdk

# Using yarn
yarn add hakgyo-expo-sdk
```

## Peer Dependencies

The SDK requires the following peer dependencies to be installed in your project:

```bash
# Core dependencies
bun add expo react react-native

# Required for secure storage and Google Sign-In
bun add expo-secure-store @react-native-google-signin/google-signin
```

### Version Requirements

| Package | Minimum Version |
|---------|-----------------|
| `expo` | >=50.0.0 |
| `react` | >=18.0.0 |
| `react-native` | >=0.73.0 |
| `expo-secure-store` | >=12.0.0 |
| `@react-native-google-signin/google-signin` | >=16.0.0 |

## Quick Start

### 1. Initialize the SDK

Initialize the SDK in your app entry point (e.g., `App.tsx` or `app/_layout.tsx`):

```typescript
import { initSDK } from 'hakgyo-expo-sdk';

// Call this before rendering your app
initSDK({
  baseURL: 'https://your-hakgyo-api.com',
  
  // Optional: Override default auth configuration
  auth: {
    storagePrefix: 'hakgyo_auth',      // Prefix for secure storage keys
    sessionRefreshThreshold: 5,        // Refresh session 5 minutes before expiry
    autoRefresh: true,                 // Automatically refresh session
    deepLinkScheme: 'hakgyo://',       // Deep link scheme for OAuth callbacks
  },
  
  // Optional: Override default API configuration
  api: {
    timeout: 30000,    // Request timeout in milliseconds
    retries: 3,        // Number of retry attempts
    retryDelay: 1000,  // Base delay between retries in milliseconds
  },
  
  // Optional: Enable logging for debugging
  logging: {
    enabled: true,
    level: 'debug',    // 'debug' | 'info' | 'warn' | 'error'
  },
});
```

### 2. Wrap Your App with AuthProvider

Add the `AuthProvider` to your app's root component:

```typescript
import { AuthProvider } from 'hakgyo-expo-sdk';

export default function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### 3. Use Authentication in Components

Use the `useAuth` hook to access authentication state and methods:

```typescript
import { useAuth } from 'hakgyo-expo-sdk';

function LoginScreen() {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    signOut, 
    user, 
    loading 
  } = useAuth();

  const handleEmailLogin = async () => {
    const result = await signInWithEmail('user@example.com', 'password');
    if (result.success) {
      console.log('Logged in:', result.session?.user);
    } else {
      console.error('Login failed:', result.error);
    }
  };

  const handleGoogleLogin = async () => {
    // First, configure Google Sign-In
    // Then call signInWithGoogle with the Google user data
    const result = await signInWithGoogle(googleUserData);
    if (result.success) {
      console.log('Logged in with Google:', result.session?.user);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return (
      <View>
        <Text>Welcome, {user.name}!</Text>
        <Button title="Sign Out" onPress={signOut} />
      </View>
    );
  }

  return (
    <View>
      <Button title="Sign In" onPress={handleEmailLogin} />
      <Button title="Sign In with Google" onPress={handleGoogleLogin} />
    </View>
  );
}
```

### 4. Use API Methods

Access the full API through the exported API modules:

```typescript
import { 
  kelasApi, 
  materiApi, 
  vocabularyApi, 
  soalApi, 
  tryoutApi, 
  userApi,
  gamificationApi,
  notificationsApi 
} from 'hakgyo-expo-sdk';

// Fetch list of classes
const { data, error } = await kelasApi.list({ 
  page: 1, 
  limit: 10,
  search: 'Korean basics' 
});

if (data) {
  console.log('Classes:', data.items);
  console.log('Total:', data.total);
}

// Get a specific class
const classResult = await kelasApi.get(123);
if (classResult.data) {
  console.log('Class details:', classResult.data);
}

// Enroll in a class
const enrollResult = await kelasApi.enroll(123);
if (enrollResult.data) {
  console.log('Enrolled successfully!');
}

// Get daily vocabulary
const vocabResult = await vocabularyApi.getDaily();
if (vocabResult.data) {
  console.log('Daily vocabulary:', vocabResult.data);
}

// Get gamification leaderboard
const leaderboard = await gamificationApi.getLeaderboard({ 
  limit: 10, 
  type: 'xp' 
});
```

## Architecture Overview

The SDK is organized into several modules, each responsible for a specific domain:

```
hakgyo-expo-sdk/
├── config/           # SDK configuration and initialization
├── auth/             # Authentication module
│   ├── client.ts     # Auth client (Better-Auth integration)
│   ├── hooks.tsx     # React hooks (AuthProvider, useAuth)
│   ├── session.ts    # Session management
│   └── storage.ts    # Secure token storage
├── api/              # API client and endpoints
│   ├── client.ts     # Base API client with retry/timeout
│   ├── endpoints.ts  # API endpoint definitions
│   ├── kelas.ts      # Class/course operations
│   ├── materi.ts     # Learning material operations
│   ├── vocabulary.ts # Vocabulary operations
│   ├── soal.ts       # Question operations
│   ├── tryout.ts     # Practice test operations
│   ├── posts.ts      # Social posts operations
│   ├── user.ts       # User profile operations
│   ├── gamification.ts # XP, levels, leaderboards
│   └── notifications.ts # Push notification management
├── types/            # TypeScript type definitions
│   ├── auth.ts       # Authentication types
│   ├── api.ts        # API response types
│   ├── models.ts     # Data model types
│   └── errors.ts     # Error types
├── errors/           # Custom error classes
│   ├── HakgyoError.ts   # Base error class
│   ├── AuthError.ts     # Authentication errors
│   ├── ApiError.ts      # API response errors
│   └── NetworkError.ts  # Network connectivity errors
└── utils/            # Utility functions
    ├── logger.ts     # Configurable logging
    └── retry.ts      # Retry logic with backoff
```

### Module Descriptions

| Module | Description |
|--------|-------------|
| **config** | SDK initialization and configuration management |
| **auth** | Authentication flows including email, Google, and OAuth providers |
| **api** | Type-safe API client with automatic session handling |
| **types** | Complete TypeScript definitions for all SDK operations |
| **errors** | Structured error handling with specific error types |
| **utils** | Internal utilities for logging and retry logic |

## Documentation Index

Explore the comprehensive documentation organized by category:

### Core Documentation

| Document | Description |
|----------|-------------|
| **[README.md](./README.md)** | Getting started guide with installation, quick start, and architecture overview |
| **[config.md](./config.md)** | SDK configuration options including auth, API, logging, and platform settings |
| **[api-client.md](./api-client.md)** | API client usage, request/response handling, pagination, and error handling |
| **[types.md](./types.md)** | Complete TypeScript type definitions for all SDK data models |
| **[errors.md](./errors.md)** | Error handling guide with custom error classes and best practices |
| **[utilities.md](./utilities.md)** | Logger configuration and retry utilities with exponential backoff |

### API Documentation

| Document | Description |
|----------|-------------|
| **[api-kelas.md](./api-kelas.md)** | Kelas (Class) API - CRUD operations, enrollment, progress tracking |
| **[api-materi.md](./api-materi.md)** | Materi (Material) API - Learning materials, content management |
| **[api-vocabulary.md](./api-vocabulary.md)** | Vocabulary API - Vocabulary sets, items, and daily challenges |
| **[api-soal.md](./api-soal.md)** | soal (Question) API - Question management, daily challenges |
| **[api-tryout.md](./api-tryout.md)** | Tryout (Test) API - Practice tests, assessments, scoring |
| **[api-posts.md](./api-posts.md)** | Posts (Discussion) API - Social posts, comments, threads |
| **[api-user.md](./api-user.md)** | User API - Profile management, settings, preferences |

### Feature Guides

| Document | Description |
|----------|-------------|
| **[expo-sdk-auth-guide.md](./expo-sdk-auth-guide.md)** | Complete authentication guide: email, Google Sign-In, OAuth flows, session management |
| **[gamification-sdk-usage.md](./gamification-sdk-usage.md)** | Gamification features: XP system, levels, streaks, leaderboards, activity logging |
| **[notification-sdk-usage.md](./notification-sdk-usage.md)** | Push notifications: token registration, device management, notification handling |

### Quick Navigation

- **New to the SDK?** Start with [README.md](./README.md) → [config.md](./config.md) → [api-client.md](./api-client.md)
- **Need Authentication?** See [expo-sdk-auth-guide.md](./expo-sdk-auth-guide.md)
- **Working with Classes?** Check [api-kelas.md](./api-kelas.md)
- **Adding Gamification?** See [gamification-sdk-usage.md](./gamification-sdk-usage.md)
- **Setting up Notifications?** Check [notification-sdk-usage.md](./notification-sdk-usage.md)

## API Reference

### Configuration Options

```typescript
interface HakgyoSDKConfig {
  // Required
  baseURL: string;

  // Auth Configuration
  auth?: {
    storagePrefix?: string;        // Default: 'hakgyo_auth'
    sessionRefreshThreshold?: number; // Minutes before expiry. Default: 5
    autoRefresh?: boolean;         // Default: true
    deepLinkScheme?: string;       // Default: 'hakgyo://'
  };

  // API Configuration
  api?: {
    timeout?: number;              // Default: 30000 (ms)
    retries?: number;              // Default: 3
    retryDelay?: number;           // Default: 1000 (ms)
  };

  // Logging Configuration
  logging?: {
    enabled?: boolean;             // Default: false
    level?: 'debug' | 'info' | 'warn' | 'error'; // Default: 'error'
  };

  // Platform Configuration
  platform?: {
    deviceId?: string;
    platformType?: 'ios' | 'android' | 'web';
  };
}
```

### User Types

```typescript
type UserRole = 'MURID' | 'GURU' | 'ADMIN';
type UserTier = 'FREE' | 'PREMIUM' | 'CUSTOM';

interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
  image?: string;
  bio?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
  accessTier?: UserTier;
}
```

### Error Handling

The SDK provides structured error classes for proper error handling:

```typescript
import { AuthError, ApiError, NetworkError } from 'hakgyo-expo-sdk';

try {
  const result = await kelasApi.get(123);
} catch (error) {
  if (error instanceof AuthError) {
    console.log('Auth error:', error.code, error.message);
  } else if (error instanceof ApiError) {
    console.log('API error:', error.statusCode, error.message);
  } else if (error instanceof NetworkError) {
    console.log('Network error:', error.message);
  }
}
```

## Support

For issues, feature requests, or contributions, please visit the project repository or contact the development team.

## License

MIT License - See [LICENSE](https://opensource.org/licenses/MIT) for details.