// i18n/getDeviceLanguage.ts
import * as Localization from "expo-localization";

export function getDeviceLanguage(supported: string[] = ["fr", "en", "ar"]) {
  const locales = Localization.getLocales?.() ?? [];
  const tag = locales[0]?.languageTag ?? "fr"; // ex: fr-FR
  const base = tag.split("-")[0].toLowerCase(); // fr
  return supported.includes(base) ? base : "fr";
}
