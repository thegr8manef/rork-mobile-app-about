import AsyncStorage from "@react-native-async-storage/async-storage";
import i18next from "./i18next";

export type Lang = "fr" | "en" | "ar";

const STORAGE_KEY = "@app_language";

export async function getSavedLanguage(): Promise<Lang | null> {
  const v = await AsyncStorage.getItem(STORAGE_KEY);
  if (v === "fr" || v === "en" || v === "ar") return v;
  return null;
}

export async function setAppLanguage(lang: Lang): Promise<void> {
  await i18next.changeLanguage(lang);
  await AsyncStorage.setItem(STORAGE_KEY, lang);
}

/**
 * Call once at app startup (e.g. in _layout.tsx)
 */
export async function hydrateLanguage(): Promise<Lang> {
  const saved = await getSavedLanguage();
  const lang: Lang = saved ?? "fr";

  if (i18next.language !== lang) {
    await i18next.changeLanguage(lang);
  }

  return lang;
}
