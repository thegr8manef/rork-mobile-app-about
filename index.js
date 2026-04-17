// index.js
import "expo-router/entry";

import {
  getMessaging,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Platform, Text, TextInput } from "react-native";

// Disable font scaling globally to prevent large system font sizes from breaking layout
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

const APP_SCHEME = "attijariup";
const ANDROID_CHANNEL_ID = "default";

// Foreground behavior for Expo local notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function errMsg(e) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function logBlock(title, payload) {
  console.log("====================================");
  console.log(title);
  if (payload !== undefined) {
    console.log(
      typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
    );
  }
  console.log("====================================");
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      showBadge: false,
    });
  } catch (e) {
    logBlock("❌ ensureAndroidChannel failed", errMsg(e));
  }
}

function forcePathStyle(url) {
  try {
    if (typeof url !== "string" || !url) return url;

    // already correct: attijariup:///path
    if (url.startsWith(`${APP_SCHEME}:///`)) return url;

    // convert host style attijariup://send-money -> attijariup:///send-money
    if (url.startsWith(`${APP_SCHEME}://`)) {
      const rest = url.slice(`${APP_SCHEME}://`.length);
      return `${APP_SCHEME}:///${rest.replace(/^\/+/, "")}`;
    }

    return url;
  } catch {
    return url;
  }
}

function buildDeepLinkFromData(data) {
  try {
    if (!data || typeof data !== "object") return null;

    if (typeof data.url === "string" && data.url.trim().length > 0) {
      return forcePathStyle(data.url.trim());
    }

    const screen = typeof data.screen === "string" ? data.screen.trim() : "";
    if (!screen) return null;

    const cleanScreen = screen.replace(/^\/+/, "");
    const p = data.params;

    const isEmptyParam =
      p === null ||
      p === undefined ||
      (typeof p === "string" &&
        (p.trim() === "" ||
          p.trim().toLowerCase() === "null" ||
          p.trim().toLowerCase() === "undefined"));

    if (isEmptyParam) return `${APP_SCHEME}:///${cleanScreen}`;

    // optional: you can add query params instead of path segment, but keep it simple for now
    if (
      typeof p === "string" ||
      typeof p === "number" ||
      typeof p === "boolean"
    ) {
      return `${APP_SCHEME}:///${cleanScreen}?p=${encodeURIComponent(String(p))}`;
    }

    let encoded;
    try {
      encoded = encodeURIComponent(JSON.stringify(p));
    } catch {
      encoded = encodeURIComponent(String(p));
    }
    return `${APP_SCHEME}:///${cleanScreen}?p=${encoded}`;
  } catch (e) {
    logBlock("❌ buildDeepLinkFromData error", errMsg(e));
    return null;
  }
}

async function scheduleLocalNotificationFromRemote(remoteMessage) {
  await ensureAndroidChannel();

  const title =
    remoteMessage?.notification?.title ??
    remoteMessage?.data?.title ??
    "New message";
  const body =
    remoteMessage?.notification?.body ?? remoteMessage?.data?.body ?? "";
  const data = remoteMessage?.data ?? {};

  const deepLink = buildDeepLinkFromData(data);

  logBlock("✅ BG remoteMessage", remoteMessage);
  logBlock("🔗 BG BUILT DEEPLINK", deepLink ?? "null");

  const localData = {
    ...data,
    ...(deepLink ? { url: deepLink } : {}),
    __source: "LOCAL_BG",
  };

  logBlock("🧾 LOCAL NOTIF DATA THAT WILL BE SAVED", localData);

  // ✅ IMPORTANT: use TIME_INTERVAL trigger on Android with channelId
  const trigger =
    Platform.OS === "android"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId: ANDROID_CHANNEL_ID,
        }
      : null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: localData,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : null),
    },
    trigger,
  });

  logBlock("✅ LOCAL NOTIF SCHEDULED id", id);
}

// ✅ Modular background handler (v22+)
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  try {
    await scheduleLocalNotificationFromRemote(remoteMessage);
  } catch (e) {
    logBlock("❌ BG handler failed", errMsg(e));
  }
});
