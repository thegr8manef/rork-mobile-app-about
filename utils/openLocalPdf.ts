import { Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import * as Sharing from "expo-sharing";

export async function openLocalPdf(fileUri: string) {
  if (!fileUri) return;

  if (Platform.OS === "android") {
    // convert file://... to real path
    const path = fileUri.startsWith("file://") ? fileUri.replace("file://", "") : fileUri;

    // this uses FileProvider internally
    ReactNativeBlobUtil.android.actionViewIntent(path, "application/pdf");
    return;
  }

  // iOS: share sheet (Save to Files / open in)
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf" });
  }
}
