// utils/date-locale.ts
import { fr, enUS, arDZ } from "date-fns/locale";
import i18n from "@/features/i18next";
import type { AppLanguage } from "@/features/i18next";
import type { Locale } from "date-fns";

const DATE_LOCALES: Record<AppLanguage, Locale> = {
  fr,
  en: enUS,
  ar: arDZ,
};

export const getDateLocale = (): Locale =>
  DATE_LOCALES[i18n.language as AppLanguage] ?? fr;

export const formatLocalizedDate = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const localeMap: Record<AppLanguage, string> = {
    fr: "fr-FR",
    en: "en-US",
    ar: "ar-TN",
  };
  const locale = localeMap[i18n.language as AppLanguage] ?? "fr-FR";
  return new Date(date).toLocaleDateString(locale, options);
};