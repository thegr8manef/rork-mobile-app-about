// utils/savePdfBase64.ts
import { Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import * as Sharing from "expo-sharing";
import * as Notifications from "expo-notifications";

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────
export async function savePdfToDownloads(
  base64: string,
  filename: string,
): Promise<string> {
  return saveFileToDownloads(base64, filename, "application/pdf");
}

export async function saveExcelToDownloads(
  base64: string,
  filename: string,
): Promise<string> {
  return saveFileToDownloads(
    base64,
    filename,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

export async function saveFileToDownloads(
  base64: string,
  filename: string,
  mimeType?: string,
): Promise<string> {
  if (Platform.OS === "ios") {
    return saveToIosWithPicker(base64, filename, mimeType);
  }

  const mime = mimeType || getMimeType(filename);
  const isAndroid10Plus = Number(Platform.Version) >= 29;

  let uri: string;

  if (isAndroid10Plus) {
    uri = await saveToAndroidMediaStore(base64, filename, mime);
  } else {
    uri = await saveToAndroidPublicFolderLegacy(base64, filename, mime);
  }

  await showDownloadNotification(filename);
  return uri;
}

// ─────────────────────────────────────────────────────────
// Android 10+ (API 29+): MediaStore → Documents category
// ─────────────────────────────────────────────────────────
async function saveToAndroidMediaStore(
  base64: string,
  filename: string,
  mimeType: string,
): Promise<string> {
  const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
  const tempPath = `${cacheDir}/${filename}`;

  await ReactNativeBlobUtil.fs.writeFile(tempPath, base64, "base64");

  const uri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
    {
      name: filename,
      parentFolder: "",
      mimeType },
    "Download",
    tempPath,
  );

  try {
    await ReactNativeBlobUtil.fs.unlink(tempPath);
  } catch {}

  return uri;
}

// ─────────────────────────────────────────────────────────
// Android < 10 (API < 29): Direct file path + scanFile
// ─────────────────────────────────────────────────────────
async function saveToAndroidPublicFolderLegacy(
  base64: string,
  filename: string,
  mimeType: string,
): Promise<string> {
  const targetDir =
    ReactNativeBlobUtil.fs.dirs.DownloadDir || "/storage/emulated/0/Download";
  await ensureDirectoryExists(targetDir);

  const uniqueName = await getNextAvailableNameInDir(targetDir, filename);
  const filePath = `${targetDir}/${uniqueName}`;

  await ReactNativeBlobUtil.fs.writeFile(filePath, base64, "base64");

  try {
    await ReactNativeBlobUtil.fs.scanFile([{ path: filePath, mime: mimeType }]);
  } catch {}

  return `file://${filePath}`;
}

// ─────────────────────────────────────────────────────────
// iOS: Save to temp then open share sheet → user picks where
// ─────────────────────────────────────────────────────────
async function saveToIosWithPicker(
  base64: string,
  filename: string,
  mimeType?: string,
): Promise<string> {
  const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
  const tempPath = `${cacheDir}/${filename}`;

  await ReactNativeBlobUtil.fs.writeFile(tempPath, base64, "base64");

  const fileUri = `file://${tempPath}`;

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(fileUri, {
      mimeType: mimeType || getMimeType(filename),
      UTI: getUTI(filename) });
  }

  return fileUri;
}

// ─────────────────────────────────────────────────────────
// App-internal save (for PDF viewer, sharing, temp usage)
// ─────────────────────────────────────────────────────────
export async function savePdfBase64ToAppDir(
  base64: string,
  filename: string,
): Promise<string> {
  const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
  const appDir = `${cacheDir}/attijariUp`;
  await ensureDirectoryExists(appDir);

  // Overwrite with fixed name — this is a temp viewer cache, no need to version
  const filePath = `${appDir}/${filename}`;

  await ReactNativeBlobUtil.fs.writeFile(filePath, base64, "base64");

  return `file://${filePath}`;
}

export const saveFileBase64ToAppDir = savePdfBase64ToAppDir;
export const saveImageBase64ToAppDir = savePdfBase64ToAppDir;

// ─────────────────────────────────────────────────────────
// Save image to gallery
// ─────────────────────────────────────────────────────────
export async function saveImageToGallery(
  base64: string,
  filename: string,
): Promise<string> {
  if (Platform.OS === "ios") {
    return saveToIosWithPicker(base64, filename);
  }

  const mime = getMimeType(filename);
  const isAndroid10Plus = Number(Platform.Version) >= 29;

  if (isAndroid10Plus) {
    const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
    const tempPath = `${cacheDir}/${filename}`;
    await ReactNativeBlobUtil.fs.writeFile(tempPath, base64, "base64");

    const uri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
      {
        name: filename,
        parentFolder: "",
        mimeType: mime },
      "Image",
      tempPath,
    );

    try {
      await ReactNativeBlobUtil.fs.unlink(tempPath);
    } catch {}

    return uri;
  }

  // Legacy
  const picturesDir = await getPicturesDirectory();
  await ensureDirectoryExists(picturesDir);

  const uniqueName = await getNextAvailableNameInDir(picturesDir, filename);
  const path = `${picturesDir}/${uniqueName}`;

  await ReactNativeBlobUtil.fs.writeFile(path, base64, "base64");

  try {
    await ReactNativeBlobUtil.fs.scanFile([{ path, mime }]);
  } catch {}

  return `file://${path}`;
}

// ─────────────────────────────────────────────────────────
// Download notification (Android only)
// ─────────────────────────────────────────────────────────
async function showDownloadNotification(_filename: string): Promise<void> {
  try {
    await Notifications.setNotificationChannelAsync("downloads", {
      name: "Downloads",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Téléchargement terminé",
        body: "Le fichier a été enregistré dans vos téléchargements.",
        sound: false,
        android: {
          channelId: "downloads",
          color: "#E87225",
        } as any,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn("[showDownloadNotification] failed:", e);
  }
}

// ═════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════
async function getPicturesDirectory(): Promise<string> {
  const candidates = [
    ReactNativeBlobUtil.fs.dirs.PictureDir,
    "/storage/emulated/0/Pictures",
    "/storage/emulated/0/DCIM",
  ];

  for (const dir of candidates) {
    if (!dir) continue;
    try {
      if (await ReactNativeBlobUtil.fs.isDir(dir)) return dir;
    } catch {}
  }

  const fallback = "/storage/emulated/0/Pictures";
  await ensureDirectoryExists(fallback);
  return fallback;
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    if (await ReactNativeBlobUtil.fs.isDir(dirPath)) return;
  } catch {}

  try {
    await ReactNativeBlobUtil.fs.mkdir(dirPath);
  } catch (e) {
    if (!(await ReactNativeBlobUtil.fs.isDir(dirPath))) {
      throw new Error(`Cannot create directory: ${dirPath}`);
    }
  }
}

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "pdf":
      return "application/pdf";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "xls":
      return "application/vnd.ms-excel";
    default:
      return "application/octet-stream";
  }
}

function getUTI(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "com.adobe.pdf";
    case "png":
      return "public.png";
    case "jpg":
    case "jpeg":
      return "public.jpeg";
    case "xlsx":
      return "org.openxmlformats.spreadsheetml.sheet";
    case "xls":
      return "com.microsoft.excel.xls";
    default:
      return "public.data";
  }
}

async function getNextAvailableNameInDir(
  dirPath: string,
  filename: string,
): Promise<string> {
  const { base, ext } = splitName(filename);

  let candidate = `${base}${ext}`;
  if (!(await ReactNativeBlobUtil.fs.exists(`${dirPath}/${candidate}`)))
    return candidate;

  for (let i = 1; i < 1000; i++) {
    candidate = `${base} (${i})${ext}`;
    if (!(await ReactNativeBlobUtil.fs.exists(`${dirPath}/${candidate}`)))
      return candidate;
  }

  return `${base} (${Date.now()})${ext}`;
}

function splitName(filename: string): { base: string; ext: string } {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return { base: filename, ext: "" };
  return { base: filename.slice(0, dot), ext: filename.slice(dot) };
}