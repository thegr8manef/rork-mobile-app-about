import { Platform, PermissionsAndroid } from "react-native";
import { showPermissionModal } from "@/utils/permissionModalController";

export type PermissionResult = {
  granted: boolean;
};

export async function requestStoragePermission(): Promise<PermissionResult> {
  if (Platform.OS !== "android") {
    return { granted: true };
  }

  // Android 10+ (API 29+) doesn't need runtime permission
  // react-native-blob-util writes to PictureDir/DownloadDir via scoped storage
  const apiLevel = Platform.Version;
  if (typeof apiLevel === "number" && apiLevel >= 29) {
    return { granted: true };
  }

  // Android 9 and below — need WRITE_EXTERNAL_STORAGE runtime permission
  try {
    const status = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );

    if (status) {
      return { granted: true };
    }

    const userChoice = await showPermissionModal("request");
    if (userChoice !== "allow") {
      return { granted: false };
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return { granted: true };
    }

    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      await showPermissionModal("deniedPermanent");
    } else {
      await showPermissionModal("denied");
    }

    return { granted: false };
  } catch (error) {
    console.log("[StoragePermission] Error:", error);
    return { granted: false };
  }
}