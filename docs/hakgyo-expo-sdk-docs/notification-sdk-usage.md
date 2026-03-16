# Notification SDK Usage Guide

This guide provides comprehensive documentation for using the Push Notification API in the Hakgyo Expo SDK for React Native applications.

## Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [API Methods](#api-methods)
- [Type Definitions](#type-definitions)
- [Common Use Cases](#common-use-cases)
- [Error Handling](#error-handling)
- [Integration with Expo Notifications](#integration-with-expo-notifications)

---

## Overview

The Notification SDK provides a TypeScript client for managing push notification tokens in the Hakgyo platform. It handles:

- Registering push notification tokens (FCM/APNs)
- Unregistering push notification tokens
- Device identification for multi-device support

---

## Installation & Setup

### Installation

```bash
npm install @hakgyo-expo-sdk
```

### Basic Setup

```typescript
import { HakgyoSDK } from '@hakgyo-expo-sdk';

const sdk = new HakgyoSDK({
  baseURL: 'https://your-api.com',
  auth: {
    // Auth configuration
  }
});
```

### Accessing the Notification API

```typescript
import { notificationsApi } from '@hakgyo-expo-sdk';

// Now you can use all notificationsApi methods
```

---

## API Methods

### `notificationsApi.registerToken(pushToken, deviceId?)`

Register a push notification token for the current user. This allows the server to send push notifications to this device.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pushToken` | `string` | Yes | The push notification token (FCM or APNs) |
| `deviceId` | `string` | No | Optional device identifier for multi-device support |

**Returns:** `Promise<ApiResponse<void>>`

**Example:**

```typescript
import { notificationsApi } from '@hakgyo-expo-sdk';
import * as Notifications from 'expo-notifications';

// Register Expo push token
const registerPushToken = async () => {
  try {
    // Get Expo push token
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
    
    // Register with Hakgyo backend
    const response = await notificationsApi.registerToken(
      expoPushToken.data,
      // Optional: unique device identifier
      await getDeviceId()
    );
    
    if (response.success) {
      console.log('Push token registered successfully');
    }
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
};
```

**Using FCM Token:**

```typescript
import { notificationsApi } from '@hakgyo-expo-sdk';
import messaging from '@react-native-firebase/messaging';

// Register FCM token
const registerFCMToken = async () => {
  try {
    // Get FCM token
    const fcmToken = await messaging().getToken();
    
    // Register with Hakgyo backend
    const response = await notificationsApi.registerToken(
      fcmToken,
      await getDeviceId()
    );
    
    if (response.success) {
      console.log('FCM token registered successfully');
    }
  } catch (error) {
    console.error('Failed to register FCM token:', error);
  }
};
```

---

### `notificationsApi.unregisterToken(tokenId)`

Unregister a push notification token. This should be called when the user logs out or when the app is uninstalled.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | `string` | Yes | The token ID to unregister |

**Returns:** `Promise<ApiResponse<void>>`

**Example:**

```typescript
import { notificationsApi } from '@hakgyo-expo-sdk';
import * as Notifications from 'expo-notifications';

// Unregister on logout
const handleLogout = async () => {
  try {
    // Get current token
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
    
    // Unregister from Hakgyo backend
    const response = await notificationsApi.unregisterToken(expoPushToken.data);
    
    if (response.success) {
      console.log('Push token unregistered successfully');
    }
    
    // Proceed with logout
    await performLogout();
  } catch (error) {
    console.error('Failed to unregister push token:', error);
    // Proceed with logout anyway
    await performLogout();
  }
};
```

---

## Type Definitions

### ApiResponse

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## Common Use Cases

### 1. Initialize Push Notifications on App Start

```typescript
import { useEffect } from 'react';
import { notificationsApi } from '@hakgyo-expo-sdk';
import * as Notifications from 'expo-notifications';

const App = () => {
  useEffect(() => {
    setupPushNotifications();
  }, []);

  const setupPushNotifications = async () => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Get and register token
      const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
      
      // Register with backend
      const response = await notificationsApi.registerToken(
        expoPushToken.data,
        await getDeviceId()
      );

      if (response.success) {
        console.log('Push notifications initialized');
      }
    } catch (error) {
      console.error('Failed to setup push notifications:', error);
    }
  };

  return <YourAppContent />;
};
```

### 2. Handle Token Refresh

Push tokens can change over time. Handle token refresh events:

```typescript
import { useEffect } from 'react';
import { notificationsApi } from '@hakgyo-expo-sdk';
import * as Notifications from 'expo-notifications';

const usePushTokenRefresh = () => {
  useEffect(() => {
    const subscription = Notifications.addPushTokenListener(async ({ data }) => {
      try {
        const response = await notificationsApi.registerToken(
          data,
          await getDeviceId()
        );

        if (response.success) {
          console.log('Push token refreshed successfully');
        }
      } catch (error) {
        console.error('Failed to refresh push token:', error);
      }
    });

    return () => subscription.remove();
  }, []);
};

// Usage in component
const App = () => {
  usePushTokenRefresh();
  return <YourAppContent />;
};
```

### 3. Handle Incoming Notifications

```typescript
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

const useNotificationHandler = () => {
  useEffect(() => {
    // Handle notifications received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Show in-app notification banner
        showInAppNotification(notification);
      }
    );

    // Handle notifications tapped by user
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);
        
        // Navigate based on notification data
        handleNotificationTap(data);
      }
    );

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);
};

const handleNotificationTap = (data: any) => {
  switch (data.type) {
    case 'NEW_MATERI':
      navigateToMateri(data.materiId);
      break;
    case 'TRYOUT_RESULT':
      navigateToTryoutResult(data.tryoutId);
      break;
    case 'CLASS_ANNOUNCEMENT':
      navigateToClass(data.kelasId);
      break;
    default:
      navigateToHome();
  }
};
```

### 4. Clean Up on Logout

```typescript
import { notificationsApi } from '@hakgyo-expo-sdk';
import * as Notifications from 'expo-notifications';

const handleLogout = async () => {
  try {
    // Unregister push token
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
    
    if (expoPushToken) {
      await notificationsApi.unregisterToken(expoPushToken.data);
    }
    
    // Clear auth session
    await clearAuthSession();
    
    // Navigate to login
    navigateToLogin();
  } catch (error) {
    console.error('Logout error:', error);
    // Proceed with logout anyway
    await clearAuthSession();
    navigateToLogin();
  }
};
```

### 5. Multi-Device Support

```typescript
import { notificationsApi } from '@hakgyo-expo-sdk';
import * as Device from 'expo-device';

const getDeviceId = async (): Promise<string> => {
  // Use device ID for multi-device support
  const deviceId = Device.deviceId || 
                   Device.modelName || 
                   'unknown-device';
  return deviceId;
};

const registerWithDeviceId = async () => {
  try {
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
    const deviceId = await getDeviceId();
    
    const response = await notificationsApi.registerToken(
      expoPushToken.data,
      deviceId
    );

    if (response.success) {
      console.log(`Registered for device: ${deviceId}`);
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

---

## Error Handling

### SDK Error Types

The SDK provides two main error types:

```typescript
import { ApiError, NetworkError } from '@hakgyo-expo-sdk';
```

### Try-Catch Pattern

```typescript
import { notificationsApi, ApiError, NetworkError } from '@hakgyo-expo-sdk';

try {
  const response = await notificationsApi.registerToken('push-token-123');
  
  if (response.success) {
    console.log('Token registered successfully');
  }
} catch (error) {
  if (error instanceof ApiError) {
    // API error (4xx, 5xx)
    console.error(`API Error: ${error.message}`);
    console.error(`Status: ${error.status}`);
    
    // Handle specific error codes
    switch (error.status) {
      case 401:
        showLoginRequired();
        break;
      case 400:
        showError('Invalid token format');
        break;
      default:
        showError('Failed to register push token');
    }
  } else if (error instanceof NetworkError) {
    // Network error (no connection, timeout, etc.)
    console.error('Network error:', error.message);
    showNetworkError();
  } else {
    // Unknown error
    console.error('Unknown error:', error);
    showGenericError();
  }
}
```

### Error Response Wrapper

```typescript
const safeRegisterToken = async (
  token: string,
  onSuccess: () => void,
  onError?: (error: Error) => void
) => {
  try {
    const response = await notificationsApi.registerToken(token);
    
    if (response.success) {
      onSuccess();
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  } catch (error) {
    onError?.(error as Error);
  }
};

// Usage
safeRegisterToken(
  'push-token-123',
  () => {
    showSuccess('Push notifications enabled');
  },
  (error) => {
    showError(error.message);
  }
);
```

### Common Error Codes

| Status | Error | Description | Action |
|--------|-------|-------------|--------|
| 400 | Bad Request | Invalid token format | Validate token |
| 401 | Unauthorized | Authentication required | Redirect to login |
| 500 | Internal Server Error | Server error | Show generic error message |

---

## Integration with Expo Notifications

### Complete Setup Example

```typescript
import { useEffect, useState } from 'react';
import { notificationsApi } from '@hakgyo-expo-sdk';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const usePushNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<string>('undetermined');

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermission(finalStatus);

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get token
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Required for Expo SDK 46+
    });

    setToken(expoPushToken);

    // Register with backend
    try {
      const deviceId = Device.deviceId || Device.modelName || 'unknown';
      const response = await notificationsApi.registerToken(
        expoPushToken,
        deviceId
      );

      if (response.success) {
        console.log('Push token registered with backend');
      }
    } catch (error) {
      console.error('Failed to register token with backend:', error);
    }
  };

  return { token, permission };
};

// Usage in component
const App = () => {
  const { token, permission } = usePushNotifications();

  return (
    <View>
      {permission === 'granted' ? (
        <Text>Push notifications enabled</Text>
      ) : (
        <Text>Push notifications disabled</Text>
      )}
    </View>
  );
};
```

### Android Setup

For Android, add the following to your `AndroidManifest.xml`:

```xml
<manifest>
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
</manifest>
```

### iOS Setup

For iOS, add the following to your `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

### Notification Channels (Android)

Create notification channels for better user experience:

```typescript
import * as Notifications from 'expo-notifications';

const createNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('materi-updates', {
      name: 'Materi Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('tryout-results', {
      name: 'Tryout Results',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
};

// Call on app start
createNotificationChannels();
```

---

## Related SDK Modules

- **Auth SDK** - User authentication and session management
- **Kelas SDK** - Manage classes and courses
- **Materi SDK** - Manage class materials
- **Tryout SDK** - Manage tryout exams
- **User SDK** - User profile and data

---

## Additional Resources

- [SDK Overview](./sdk-overview.md)
- [API Client Reference](../packages/hakgyo-expo-sdk/src/api/client.ts)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
