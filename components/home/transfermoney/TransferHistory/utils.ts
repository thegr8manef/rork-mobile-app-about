import { BankingColors } from "@/constants/banking-colors";
import type { TransferRequestStatus } from "@/types/account.type";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

export const normalizeStatus = (status: TransferRequestStatus) =>
  String(status ?? "").toUpperCase();

export const getStatusColor = (status: TransferRequestStatus) => {
  const s = normalizeStatus(status);
  if (s === "EXECUTED" || s === "CONFIRMED" || s === "COMPLETED")
    return "#10B981";
  if (s === "PENDING") return "#F59E0B";
  if (s === "CANCELLED" || s === "CANCELED") return "#EF4444";
  if (s === "FAILED" || s === "REJECTED") return "#EF4444";
  return BankingColors.textSecondary;
};


export const getStatusText = (status: TransferRequestStatus): string => {
  const s = normalizeStatus(status);
  const result =
    s === "EXECUTED" || s === "CONFIRMED" || s === "COMPLETED"
      ? "transferStatus.executed"
      : s === "PENDING"
        ? "transferStatus.pending"
        : s === "CANCELLED" || s === "CANCELED"
          ? "transferStatus.cancelled"
          : s === "FAILED" || s === "REJECTED"
            ? "transferStatus.rejected"
            : "transferStatus.unknown";

  return result;
};
export const parseApiDate = (dateString: string) => {
  if (!dateString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const formatDateJJMMYYYY = (iso: string) => {
  const d = parseApiDate(iso);
  if (!d) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

export const formatDateJjMoisYyyy = (iso: string, locale: string) => {
  const d = parseApiDate(iso);
  if (!d) return "-";
  return d.toLocaleDateString(locale || "fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric" });
};

/** ✅ DT -> TND (and safe fallback) */
export const normalizeCurrencyCode = (currency?: string) => {
  const c = String(currency ?? "").trim().toUpperCase();
  if (c === "DT") return "TND";
  return c || "TND";
};

/**
 * ✅ Keep your logic (always 3 decimals)
 * ✅ But display decimal separator as comma `,` (fr style)
 * ✅ And show DT as TND
 */
export const formatCurrency = (amount: number, currency: string) => {
  const curr = normalizeCurrencyCode(currency);

  // keep same behavior: if amount is falsy -> "0.000"
  const fixed = amount ? Number(amount).toFixed(3) : "0.000";

  // replace "." with "," (only decimal part is present here anyway)
  const fixedComma = fixed.replace(".", ",");

  return `${fixedComma} ${curr}`;
};

export const normalizeRibForCompare = (rib: string) =>
  String(rib ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();

export const formatGroupHeader = (iso: string, locale: string, t: any) => {
  const d = parseApiDate(iso);
  if (!d) return "—";

  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  if (sameDay) return t("transferHistory.today", "Aujourd'hui");

  return d.toLocaleDateString(locale || "fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric" });
};

export const inferNature = (
  transferTypeUi: "ponctuel" | "permanent",
  executionISO: string,
) => {
  if (transferTypeUi !== "ponctuel") return "other" as const;
  const d = parseApiDate(executionISO);
  if (!d) return "other" as const;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime()
    ? ("deferred" as const)
    : ("immediate" as const);
};

export const canCancelDeferred24h = (
  rawType: string,
  executionISO: string,
  status: string,
) => {
  const st = String(status ?? "").toUpperCase();
  if (st !== "PENDING") return false;

  const tpe = String(rawType ?? "").toUpperCase();
  if (tpe !== "DEFERRED") return false;

  const d = parseApiDate(executionISO);
  if (!d) return false;

  const diffMs = d.getTime() - Date.now();
  return diffMs > 24 * 60 * 60 * 1000;
};
