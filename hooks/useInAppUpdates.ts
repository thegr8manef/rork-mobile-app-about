// hooks/useInAppUpdates.ts
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import SpInAppUpdates, {
  NeedsUpdateResponse,
  IAUUpdateKind,
} from "sp-react-native-in-app-updates";
import { getVersion } from "react-native-device-info";

const TAG = "[InAppUpdates]";

const inAppUpdates = new SpInAppUpdates(false);

/**
 * Parses "MAJOR.MINOR.PATCH" into its three numeric parts.
 * Returns [0, 0, 0] for anything unparseable.
 */
function parseSemver(version: string): [number, number, number] {
  const parts = version.split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/**
 * Returns true only when the store version has a higher MAJOR or MINOR.
 * Patch bumps (1.0.53 → 1.0.54) are intentionally ignored.
 */
function isMajorOrMinorUpdate(current: string, store: string): boolean {
  const [curMajor, curMinor] = parseSemver(current);
  const [storeMajor, storeMinor] = parseSemver(store);

  if (storeMajor > curMajor) return true;
  if (storeMajor === curMajor && storeMinor > curMinor) return true;
  return false;
}

/**
 * Returns whether the user should be prompted for an update.
 * Only triggers on MAJOR or MINOR version bumps — patch updates are silent.
 * Triggers the native Android flow immediately; on iOS exposes a flag
 * so the UI layer (InAppUpdateModal) can show a custom modal.
 */
export function useInAppUpdates(enabled: boolean = true) {
  const [showModal, setShowModal] = useState(false);
  // currentVersion  = version running on this device (read by the library via our shim)
  // storeVersion    = latest version published on Play Store / App Store
  // Initialized synchronously from the same source the library uses internally
  const [currentVersion, setCurrentVersion] = useState<string | null>(() => getVersion() ?? null);
  const [storeVersion, setStoreVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      console.log(`${TAG} Skipped — not enabled (dev/preview build?)`);
      return;
    }

    if (Platform.OS === "ios") {
      console.log(`${TAG} Skipped on iOS — version sync between native and app.json not guaranteed`);
      return;
    }

    if (Platform.OS !== "android") {
      console.log(`${TAG} Skipped — unsupported platform: ${Platform.OS}`);
      return;
    }

    const localVersion = getVersion();
    console.log(`${TAG} Checking for updates on platform: ${Platform.OS}, local version: ${localVersion}…`);

    // On iOS, the library fetches: https://itunes.apple.com/lookup?bundleId=com.tn.attijariup&country=tn
    inAppUpdates
      .checkNeedsUpdate({
        customVersionComparator: (current, store) => {
          // Capture both versions as soon as the library resolves them
          setCurrentVersion(current);
          setStoreVersion(store);

          const needed = isMajorOrMinorUpdate(current, store);
          console.log(
            `${TAG} Version compare — current: ${current}, store: ${store} → ${needed ? "MAJOR/MINOR bump → show update" : "patch only → ignore"}`,
          );
          return needed ? 1 : -1;
        },
      })
      .then((result: NeedsUpdateResponse) => {
        console.log(`${TAG} Check result:`, JSON.stringify(result, null, 2));
        console.log(`${TAG} shouldUpdate: ${result.shouldUpdate}, storeVersion: ${result.storeVersion ?? "unknown"}`);

        if (!result.shouldUpdate) {
          console.log(`${TAG} App is up-to-date. No update needed.`);
          return;
        }

        // Double-check with our own logic — library may ignore customVersionComparator
        const storeVer = result.storeVersion ?? "";
        if (!isMajorOrMinorUpdate(localVersion, storeVer)) {
          console.log(`${TAG} Library says update needed but it's only a patch bump (${localVersion} → ${storeVer}). Ignoring.`);
          return;
        }

        console.log(
          `${TAG} Update available! ${localVersion} → ${storeVer} (major/minor bump confirmed)`,
        );

        if (Platform.OS === "android") {
          console.log(`${TAG} [Android] Starting IMMEDIATE in-app update flow…`);
          inAppUpdates
            .startUpdate({ updateType: IAUUpdateKind.IMMEDIATE })
            .then(() => {
              console.log(`${TAG} [Android] startUpdate resolved.`);
            })
            .catch((err: unknown) => {
              console.error(`${TAG} [Android] startUpdate error:`, err);
            });
        } else {
          console.log(`${TAG} [iOS] Showing custom update modal…`);
          setShowModal(true);
        }
      })
      .catch((err: unknown) => {
        console.error(`${TAG} checkNeedsUpdate error:`, err);
      });
  }, [enabled]);

  const handleConfirm = () => {
    console.log(`${TAG} [iOS] User confirmed — opening App Store…`);
    setShowModal(false);
    inAppUpdates
      .startUpdate({ updateType: IAUUpdateKind.IMMEDIATE })
      .then(() => {
        console.log(`${TAG} [iOS] App Store opened successfully.`);
      })
      .catch((err: unknown) => {
        console.error(`${TAG} [iOS] Failed to open App Store:`, err);
      });
  };

  const handleDismiss = () => {
    console.log(`${TAG} [iOS] User dismissed the update modal.`);
    setShowModal(false);
  };

  return { showModal, handleConfirm, handleDismiss, currentVersion, storeVersion };
}
