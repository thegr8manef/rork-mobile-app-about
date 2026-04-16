// @/notification/fcm.ts
import { Platform, PermissionsAndroid } from "react-native";
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  registerDeviceForRemoteMessages,
  AuthorizationStatus,
  setBackgroundMessageHandler, // Add this for modular background handling
} from "@react-native-firebase/messaging";

/**
 * Request permissions for both Android (API 33+) and iOS
 */
export async function requestPushPermission() {
  if (Platform.OS === "android" && Platform.Version >= 33) {
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return res === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === "ios") {
    const status = await requestPermission(getMessaging());
    return (
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL
    );
  }

  return true;
}

/**
 * Get the current FCM token
 */
export async function getFcmToken() {
  const messaging = getMessaging();

  if (Platform.OS === "ios" && !messaging.isDeviceRegisteredForRemoteMessages) {
    await registerDeviceForRemoteMessages(messaging);
  }

  return getToken(messaging);
}

/**
 * Handle messages when the app is in the foreground
 */
export function onForegroundMessage(cb: (msg: any) => void) {
  return onMessage(getMessaging(), cb);
}

/**
 * Handle background messages
 * NOTE: This must be called outside of your component lifecycle (ideally in index.js)
 */
export function setBackgroundHandler(cb: (msg: any) => Promise<any>) {
  return setBackgroundMessageHandler(getMessaging(), cb);
}

/**
 * Listen for token refreshes
 */
export function onTokenRefreshListener(cb: (token: string) => void) {
  return onTokenRefresh(getMessaging(), cb);
}

/**
 * Handle notification interaction when app is in background (but not quit)
 */
export function onNotificationOpened(cb: (msg: any) => void) {
  return onNotificationOpenedApp(getMessaging(), cb);
}

/**
 * Check if the app was opened from a quit state via a notification
 */
export async function getInitialNotificationOnce() {
  return getInitialNotification(getMessaging());
}