import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform, Alert } from "react-native";
import { Buffer } from "buffer";
import useShowMessage from "@/hooks/useShowMessage";

/**
 * Writes a base64 PDF to cache and opens the share sheet / viewer.
 * Returns file uri.
 */
export async function openPdfFromBase64(base64: string, filename: string) {
  // ✅ cache path using the NEW API
  const file = new File(Paths.cache, filename);
  const { showMessageError, showMessageSuccess } = useShowMessage();

  // base64 -> bytes
  const bytes = base64ToBytes(base64);

  // write bytes to file
  await file.write(bytes);

  // open/share
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    showMessageError(
      "Not supported",
      "Sharing is not available on this device.",
    );
    return file.uri;
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/pdf",
    dialogTitle: "Open PDF",
    UTI: Platform.OS === "ios" ? "com.adobe.pdf" : undefined });

  return file.uri;
}

function base64ToBytes(base64: string): Uint8Array {
  // React Native: global Buffer usually exists if you already use it
  // (you are using Buffer in getTransferPdfBase64)
  // If TS complains, install: npm i buffer
  // and add: import { Buffer } from "buffer";
  return new Uint8Array(Buffer.from(base64, "base64"));
}
