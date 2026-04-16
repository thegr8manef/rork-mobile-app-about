//features\i18next.ts
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";
import { getDeviceLanguage } from "./getDeviceLanguage";

export const languageResources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

export type AppLanguage = "fr" | "en" | "ar";

// init immediately ON IMPORT
const initialLng = getDeviceLanguage(["fr", "en", "ar"]) as AppLanguage;

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    lng: "fr", // initialLng changed with this to get local language immediately, but fallback to fr if something goes wrong
    fallbackLng: "fr",
    resources: languageResources,
    interpolation: { escapeValue: false },

    returnEmptyString: false,
    returnNull: false,
    keySeparator: false,
  });
}

export function setAppLanguage(lng: AppLanguage) {
  return i18next.changeLanguage(lng);
}

export default i18next;
