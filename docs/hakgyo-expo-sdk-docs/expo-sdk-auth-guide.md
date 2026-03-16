# Hakgyo Expo SDK Authentication Guide

This guide provides a comprehensive overview of how to implement authentication using the `hakgyo-expo-sdk` in your Expo application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initialization](#initialization)
3. [AuthProvider Setup](#authprovider-setup)
4. [Email Authentication](#email-authentication)
5. [Google Authentication](#google-authentication)
6. [Social Authentication (OAuth)](#social-authentication-oauth)
7. [Session Management](#session-management)
8. [React Hooks](#react-hooks)
9. [Error Handling](#error-handling)

## Prerequisites

Before starting, ensure you have the following dependencies installed in your Expo project:

```bash
bun add hakgyo-expo-sdk expo-secure-store @react-native-google-signin/google-signin
```

*Note: `expo-secure-store` is required for secure token storage, and `@react-native-google-signin/google-signin` is required if you plan to use Google Sign-In.*

## Initialization

Initialize the SDK at your app's entry point (e.g., `app/_layout.tsx` or `App.tsx`).

```typescript
import { initSDK } from 'hakgyo-expo-sdk';

initSDK({
  baseURL: 'https://your-api-url.com',
  auth: {
    storagePrefix: 'your_app_auth',
    deepLinkScheme: 'your-app-scheme://', // e.g., 'hakgyo://'
    autoRefresh: true,
  },
  logging: {
    enabled: true,
    level: 'debug',
  }
});
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `baseURL` | The base URL of your Better Auth server | Required |
| `auth.storagePrefix` | Prefix for keys in SecureStore | `hakgyo_auth` |
| `auth.deepLinkScheme` | Your app's URL scheme for OAuth redirects | `hakgyo://` |
| `auth.autoRefresh` | Automatically refresh session before expiry | `true` |
| `auth.sessionRefreshThreshold` | Minutes before expiry to trigger refresh | `5` |

## AuthProvider Setup

Wrap your root component with `AuthProvider` to provide authentication state to your entire app.

```typescript
import { AuthProvider } from 'hakgyo-expo-sdk';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack />
    </AuthProvider>
  );
}
```

## Email Authentication

### Sign In
```typescript
import { useAuth } from 'hakgyo-expo-sdk';

const { signInWithEmail } = useAuth();

const handleSignIn = async () => {
  const result = await signInWithEmail('user@example.com', 'password');
  if (result.success) {
    // Successfully signed in
  } else {
    // Handle error: result.error
  }
};
```

### Sign Up
```typescript
const { signUpWithEmail } = useAuth();

const handleSignUp = async () => {
  const result = await signUpWithEmail('user@example.com', 'password', 'User Name');
  if (result.success) {
    // Successfully signed up and logged in
  }
};
```

## Google Authentication

The SDK provides a simplified API for Google Sign-In using `@react-native-google-signin/google-signin`.

### Configuration
Ensure you have configured Google Sign-In in your `app.json` and initialized it:
```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
});
```

### Implementation
```typescript
import { useAuth } from 'hakgyo-expo-sdk';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const { signInWithGoogle } = useAuth();

const handleGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    // Pass raw data directly to the SDK
    const result = await signInWithGoogle(userInfo.data);
    
    if (result.success) {
      // Logged in!
    }
  } catch (error) {
    // Handle Google Sign-In errors
  }
};
```

## Social Authentication (OAuth)

For other providers (GitHub, Discord, Apple, etc.), use the `signInWithSocial` method. This handles the OAuth flow via the browser.

```typescript
import { useAuth } from 'hakgyo-expo-sdk';
import * as Linking from 'expo-linking';

const { signInWithSocial } = useAuth();

const handleGithubSignIn = async () => {
  const result = await signInWithSocial({
    provider: 'github',
    callbackOptions: {
      redirectTo: 'hakgyo://auth/callback', // Matches your deepLinkScheme
    }
  });

  if (result.success && result.redirectURL) {
    // Open the browser for OAuth flow
    await Linking.openURL(result.redirectURL);
  }
};
```

## Session Management

The SDK automatically manages sessions using `expo-secure-store`.

### Manual Refresh
```typescript
const { refreshSession } = useAuth();
await refreshSession();
```

### Sign Out
```typescript
const { signOut } = useAuth();
await signOut();
```

## React Hooks

### `useAuth()`
Returns the full authentication context.
- `session`: Current session object or `null`.
- `user`: Current user object or `null`.
- `loading`: Boolean indicating if session is being loaded.
- `signInWithEmail(email, password)`
- `signUpWithEmail(email, password, name)`
- `signInWithGoogle(data)`
- `signInWithSocial(params)`
- `signOut()`
- `refreshSession()`

### `useSession()`
A convenience hook for just the session data.
- `session`: Current session.
- `user`: Current user.
- `loading`: Loading state.

```typescript
import { useSession } from 'hakgyo-expo-sdk';

function Profile() {
  const { user, loading } = useSession();
  
  if (loading) return <Text>Loading...</Text>;
  if (!user) return <Text>Not logged in</Text>;
  
  return <Text>Hello, {user.name}!</Text>;
}
```

## Error Handling

The SDK uses a custom `AuthError` class for better debugging.

```typescript
import { AuthError } from 'hakgyo-expo-sdk';

try {
  await signInWithEmail(email, password);
} catch (error) {
  if (error instanceof AuthError) {
    console.error(`Auth Error [${error.code}]: ${error.message}`);
  }
}
```

Common Error Codes:
- `SIGN_IN_FAILED`
- `SIGN_UP_FAILED`
- `GOOGLE_SIGN_IN_FAILED`
- `SOCIAL_SIGN_IN_FAILED`
- `AUTH_CLIENT_NOT_INITIALIZED`
