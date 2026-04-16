import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export async function writePdfBase64ToFile(base64: string, filename: string) {
    //@ts-ignore
  const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!dir) throw new Error("No writable directory available");

  const uri = dir + filename;

  await FileSystem.writeAsStringAsync(uri, base64, {
    // avoid EncodingType typing issues
    encoding: "base64" as any });

  return uri;
}

export async function openOrSharePdf(uri: string) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    // If sharing isn't available, at least return the uri
    return { opened: false, uri };
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Open PDF",
    UTI: Platform.OS === "ios" ? "com.adobe.pdf" : undefined });

  return { opened: true, uri };
}
