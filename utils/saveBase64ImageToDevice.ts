import { Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";

type ToastFn = (title: string, message: string) => void;

type SaveBase64Options = {
  onSuccess?: ToastFn;
  onError?: ToastFn;
  albumName?: string;
};

function normalizeBase64(base64: string) {
  return base64.includes("base64,") ? base64.split("base64,")[1] : base64;
}

function inferExtensionFromBase64(cleanBase64: string) {
  if (cleanBase64.startsWith("iVBORw0KGgo")) return "png";
  return "jpg";
}

export async function saveBase64ImageToDevice(
  base64: string,
  filenameWithoutExt: string,
  options?: SaveBase64Options,
) {
  const onSuccess = options?.onSuccess;
  const onError = options?.onError;
  const albumName = options?.albumName ?? "Cheques";

  try {
    const clean = normalizeBase64(base64);
    if (!clean || clean.length < 50) {
      onError?.("Erreur", "Image invalide (base64 vide ou trop court).");
      return;
    }

    const ext = inferExtensionFromBase64(clean);
    const filename = `${filenameWithoutExt}.${ext}`;
    const mime = ext === "png" ? "image/png" : "image/jpeg";

    if (Platform.OS === "android") {
      const picturesDir = ReactNativeBlobUtil.fs.dirs.PictureDir;
      const albumDir = `${picturesDir}/${albumName}`;

      const dirExists = await ReactNativeBlobUtil.fs.isDir(albumDir);
      if (!dirExists) {
        await ReactNativeBlobUtil.fs.mkdir(albumDir);
      }

      const path = `${albumDir}/${filename}`;
      const exists = await ReactNativeBlobUtil.fs.exists(path);
      const finalPath = exists
        ? `${albumDir}/${filenameWithoutExt}_${Date.now()}.${ext}`
        : path;

      console.log("[saveBase64ImageToDevice] Saving to:", finalPath);
      await ReactNativeBlobUtil.fs.writeFile(finalPath, clean, "base64");

      try {
        await ReactNativeBlobUtil.fs.scanFile([{ path: finalPath, mime }]);
      } catch (e) {
        console.warn("[saveBase64ImageToDevice] scanFile failed:", e);
      }

      onSuccess?.("Succès", "Image du chèque enregistrée ✅");
    } else {
      // iOS - save to app cache
      const tempDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
      const tempPath = `${tempDir}/${filename}`;
      await ReactNativeBlobUtil.fs.writeFile(tempPath, clean, "base64");

      onSuccess?.("Succès", "Image du chèque enregistrée ✅");
    }
  } catch (e: any) {
    console.log("❌ Save image error:", e);
    onError?.("Erreur", "Impossible d'enregistrer l'image.");
  }
}