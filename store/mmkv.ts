import MMKVStorage from "react-native-mmkv-storage";

/**
 * Encrypted MMKV instance.
 * - On Android uses Keystore to protect the encryption key
 * - On iOS uses Keychain to protect the encryption key
 */
export const MMKV = new MMKVStorage.Loader()
  .withEncryption()
  .initialize();

/**
 * Adapter that matches Zustand persist storage interface.
 * NOTE: zustand expects string values (JSON strings).
 */
export const mmkvStringStorage = {
  getItem: async (name: string) => {
    const value = await MMKV.getStringAsync(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await MMKV.setStringAsync(name, value);
  },
  removeItem: async (name: string) => {
    await MMKV.removeItem(name);
  },
};

/**
 * Optional helpers if you want direct JSON outside zustand persist.
 */
export async function mmkvSetJSON<T>(key: string, value: T) {
  await MMKV.setStringAsync(key, JSON.stringify(value));
}

export async function mmkvGetJSON<T>(key: string): Promise<T | null> {
  const raw = await MMKV.getStringAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
