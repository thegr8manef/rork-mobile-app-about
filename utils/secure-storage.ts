import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type SecureOpts = {
  /**
   * If true: iOS can require FaceID/TouchID for reading.
   * Android behavior varies by device/OS version.
   */
  requireAuth?: boolean;
};

const baseOpts = (opts?: SecureOpts): SecureStore.SecureStoreOptions => ({
  // iOS: prompts biometric/passcode when reading item if enabled
  requireAuthentication: !!opts?.requireAuth });

/** Strings */
export async function secureSet(key: string, value: string, opts?: SecureOpts) {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(key, value, baseOpts(opts));
}

export async function secureGet(key: string, opts?: SecureOpts) {
  if (Platform.OS === "web") return null;
  return (await SecureStore.getItemAsync(key, baseOpts(opts))) ?? null;
}

export async function secureDel(key: string) {
  if (Platform.OS === "web") return;
  await SecureStore.deleteItemAsync(key);
}

/** JSON */
export async function secureSetJSON<T>(key: string, value: T, opts?: SecureOpts) {
  await secureSet(key, JSON.stringify(value), opts);
}

export async function secureGetJSON<T>(key: string, opts?: SecureOpts): Promise<T | null> {
  const raw = await secureGet(key, opts);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
