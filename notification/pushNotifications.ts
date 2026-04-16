import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import {
  getFcmToken,
  getInitialNotificationOnce,
  onForegroundMessage,
  onNotificationOpened,
  onTokenRefreshListener,
  requestPushPermission,
} from "@/notification/fcm";

type PushData = Record<string, string>;

export type PushEvent =
  | { type: "FOREGROUND_MESSAGE"; title?: string; body?: string; data?: PushData }
  | { type: "OPENED_FROM_BACKGROUND"; data?: PushData }
  | { type: "OPENED_FROM_QUIT"; data?: PushData }
  | { type: "TOKEN"; token: string }
  | { type: "PERMISSION"; granted: boolean };

export type PushInitOptions = {
  onEvent: (event: PushEvent) => void;
  showSystemInForeground?: boolean;
};

function normalizePushData(data: any): PushData | undefined {
  if (!data || typeof data !== "object") return undefined;
  const out: PushData = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  });
}

// ✅ GLOBAL singleton (survives duplicate module instances & fast refresh)
const KEY = "__ATTIJARI_PUSH_SINGLETON__";
type GlobalState = {
  didInit: boolean;
  cached: { token: string | null; cleanup: () => void } | null;
};

const g = globalThis as any;
const state: GlobalState = (g[KEY] ??= { didInit: false, cached: null });

export async function initPushNotifications(opts: PushInitOptions) {
  if (state.didInit && state.cached) return state.cached;
  state.didInit = true;

  const { onEvent, showSystemInForeground = true } = opts;

  await ensureAndroidChannel();

  const granted = await requestPushPermission();
  onEvent({ type: "PERMISSION", granted });

  if (!granted) {
    state.cached = { token: null, cleanup: () => {} };
    return state.cached;
  }

  const token = await getFcmToken();
  console.log("🚀 ~ initPushNotifications ~ token:", token)
  onEvent({ type: "TOKEN", token });

  const unsubToken = onTokenRefreshListener((t) => {
    onEvent({ type: "TOKEN", token: t });
  });

  const unsubFg = onForegroundMessage(async (msg: any) => {
    const data = normalizePushData(msg?.data);

    const title =
      msg?.notification?.title ??
      (msg?.data?.title as string | undefined) ??
      "New notification";

    const body =
      msg?.notification?.body ??
      (msg?.data?.body as string | undefined) ??
      "";

    onEvent({ type: "FOREGROUND_MESSAGE", title, body, data });

    if (showSystemInForeground) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data ?? {},
          ...(Platform.OS === "android" ? { channelId: "default" } : null),
        } as any,
        trigger: null,
      });
    }
  });

  const unsubOpened = onNotificationOpened((msg: any) => {
    onEvent({
      type: "OPENED_FROM_BACKGROUND",
      data: normalizePushData(msg?.data),
    });
  });

  const initial = await getInitialNotificationOnce();
  if (initial) {
    onEvent({
      type: "OPENED_FROM_QUIT",
      data: normalizePushData(initial?.data),
    });
  }

  const cleanup = () => {
    try {
      unsubToken?.();
      unsubFg?.();
      unsubOpened?.();
    } catch {}
  };

  state.cached = { token, cleanup };
  return state.cached;
}
