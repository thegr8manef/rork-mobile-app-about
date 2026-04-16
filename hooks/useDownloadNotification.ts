// hooks/useDownloadNotification.ts

import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as IntentLauncher from "expo-intent-launcher";
import { getContentUriAsync } from "expo-file-system/legacy";

const CHANNEL_ID = "downloads";

let channelReady = false;
let isOpening = false;

async function ensureChannel() {
  if (channelReady || Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Downloads",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
  channelReady = true;
}

/**
 * Converts any file URI to a content:// URI that Android can open.
 * Handles:
 * - content:// URIs (already valid, pass through)
 * - file:// URIs (convert via FileProvider)
 * - Raw paths without scheme (add file:// then convert)
 * - expo-file-system new API URIs
 */
async function toContentUri(fileUri: string): Promise<string> {
  // Already a content URI — no conversion needed
  if (fileUri.startsWith("content://")) {
    return fileUri;
  }

  // Normalize: ensure file:// prefix for raw paths
  let normalizedUri = fileUri;
  if (!normalizedUri.startsWith("file://")) {
    normalizedUri = `file://${normalizedUri}`;
  }

  return getContentUriAsync(normalizedUri);
}

export function useDownloadNotification() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        if (isOpening) return;
        isOpening = true;

        const data = response.notification.request.content.data;
        if (!data) {
          isOpening = false;
          return;
        }

        const fileUri = data.fileUri as string | undefined;
        const mimeType = (data.mimeType as string) || "*/*";

        if (!fileUri || Platform.OS !== "android") {
          isOpening = false;
          return;
        }

        try {
          const contentUri = await toContentUri(fileUri);

          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              type: mimeType,
              flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            },
          );
        } catch (e) {
          console.warn("[DownloadNotification] open file failed:", e);
        } finally {
          setTimeout(() => {
            isOpening = false;
          }, 1000);
        }
      },
    );

    return () => subscription.remove();
  }, []);

  const showComplete = async (
    title: string,
    body: string,
    fileUri: string,
    mimeType: string = "*/*",
  ) => {
    if (Platform.OS !== "android") return;

    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { fileUri, mimeType },
        android: {
          channelId: CHANNEL_ID,
          color: "#E87225",
        } as any,
      },
      trigger: null,
    });
  };

  return { showComplete };
}