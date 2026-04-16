// utils/downloadTransferReceipt.ts
import ReactNativeBlobUtil from "react-native-blob-util";
import { Platform } from "react-native";
import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";

export async function downloadTransferReceiptPdf(params: {
  baseUrl: string;
  transferId: string;
  token?: string;
  openAfterDownload?: boolean;
}) {
  const { baseUrl, transferId, token, openAfterDownload = true } = params;

  const url =
    `${baseUrl}/api/payment-means/docs/UNIT_TRANSFER` +
    `?reportType=PDF&transferId=${encodeURIComponent(transferId)}`;

  const fileName = `transfer_${transferId}.pdf`;

  const headers: Record<string, string> = {
    Accept: "application/pdf" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // ✅ ANDROID: Native DownloadManager
  if (Platform.OS === "android") {
    const dirs = ReactNativeBlobUtil.fs.dirs;
    const downloadPath = `${dirs.DownloadDir}/${fileName}`;

    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: downloadPath,
      appendExt: "pdf",
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        title: fileName,
        description: "Downloading receipt…",
        mime: "application/pdf",
        mediaScannable: true,
        path: downloadPath } }).fetch("GET", url, headers);

    const localPath = res.path();

    if (openAfterDownload) {
      try {
        // some devices need file:// prefix
        const openPath = localPath.startsWith("file://")
          ? localPath
          : `file://${localPath}`;

        ReactNativeBlobUtil.android.actionViewIntent(
          openPath,
          "application/pdf"
        );
      } catch (e) {
        // if no PDF viewer installed, ignore open step
        console.log("Open PDF failed:", e);
      }
    }

    return localPath;
  }

  // ✅ iOS: fetch -> save -> share (Save to Files)
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const folder = new Directory(Paths.document, "pdfs");
  await folder.create({ intermediates: true });

  const file = new File(folder, fileName);
  await file.write(bytes);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/pdf",
      dialogTitle: "Save PDF",
      UTI: "com.adobe.pdf" });
  }

  return file.uri;
}
