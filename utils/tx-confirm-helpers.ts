// utils/tx-confirm-helpers.ts
// Shared helpers for transaction confirmation screens (passcode, biometric, OTP)
// Eliminates duplication across 3 files

import { getErrorMapping } from "@/utils/api-error-mapper";

/** =========================
 *  LOGGER
 *  ========================= */

export type TxLogLevel = "info" | "warn" | "error";
export type TxLogMeta = Record<string, any>;

export type TxLogger = {
  info: (event: string, meta?: TxLogMeta) => void;
  warn: (event: string, meta?: TxLogMeta) => void;
  error: (event: string, meta?: TxLogMeta) => void;
};

export const createTxLogger = (tag: string, baseMeta?: TxLogMeta): TxLogger => {
  const start = Date.now();

  const emit = (level: TxLogLevel, event: string, meta?: TxLogMeta) => {
    const payload = {
      at: new Date().toISOString(),
      ms: Date.now() - start,
      tag,
      event,
      ...(baseMeta ?? {}),
      ...(meta ?? {}) };

    if (level === "error") console.log(`[${tag}] ❌ ${event}`, payload);
    else if (level === "warn") console.log(`[${tag}] ⚠️ ${event}`, payload);
    else console.log(`[${tag}] ✅ ${event}`, payload);
  };

  return {
    info: (event, meta) => emit("info", event, meta),
    warn: (event, meta) => emit("warn", event, meta),
    error: (event, meta) => emit("error", event, meta) };
};

/** =========================
 *  SAFE UTILS
 *  ========================= */

export const maskRib = (rib?: string) => {
  if (!rib) return "";
  const s = String(rib).trim();
  if (s.length <= 6) return "***";
  return `${s.slice(0, 3)}***${s.slice(-3)}`;
};

export const safeError = (e: any) => ({
  message: e?.message,
  status: e?.response?.status,
  errorCode: e?.response?.data?.errorCode,
  backendMessage: e?.response?.data?.message });

export const safeStr = (v: any): string | undefined => {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
};

export const safeParseJson = (raw?: string) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** =========================
 *  DATA EXTRACTION
 *  ========================= */

export const extractData = (res: any) => {
  if (res && typeof res === "object" && "data" in res) return (res as any).data;
  return res;
};

export const extractBeneficiaryFields = (res: any) => {
  const d = extractData(res);
  return {
    beneficiaryId: safeStr(d?.id) || safeStr(d?.beneficiaryId),
    fullName: safeStr(d?.fullName),
    rib: safeStr(d?.rib) };
};

/** =========================
 *  TYPES
 *  ========================= */

export type TransactionType =
  | "bill"
  | "bill-recharge"
  | "reload"
  | "transfer"
  | "schooling"
  | "add-beneficiary"
  | "confirm-chequebook"
  | "cardAction"
  | "installment"
  | "savingPlansResign"
  | "savingPlans";

export type CardActionType =
  | "resetPin"
  | "modifyLimit"
  | "disableSecured"
  | "replaceCard";

export type TransactionConfirmNavData = {
  transactionType: TransactionType;
  requestId: string;
  transactionId?: string;
  amount?: string | number;

  cardId?: string;
  action?: CardActionType;
  paymentAmount?: string | number;

  savingPlanId?: string;
  accountId?: string;
  callType?: "CREATING" | "UPDATING";

  returnTo?: string;
  returnParams?: string;
};

/** =========================
 *  RESULT NAVIGATION PAYLOAD
 *  ========================= */

export type ResultPayload = {
  success: boolean;
  actionType: string;
  message?: string;
  errorMessage?: string;
  errorCode?: string;
  transactionId?: string;
  amount?: string | number;
  transferStatus?: string;
  data?: any;
};

/** Serialize payload into flat string params for expo-router */
export const serializeResultParams = (payload: ResultPayload) => ({
  success: payload.success ? "true" : "false",
  actionType: payload.actionType,
  message: payload.message ?? "",
  errorMessage: payload.errorMessage ?? "",
  errorCode: payload.errorCode ?? "",
  transactionId: payload.transactionId ?? "",
  amount: payload.amount != null ? String(payload.amount) : "",
  transferStatus: payload.transferStatus ?? "",
  data: payload.data ? JSON.stringify(payload.data) : "" });

/** =========================
 *  FALLBACK ROUTES
 *  ========================= */

export const getDefaultFallback = (type?: TransactionType | string) => {
  switch (type) {
    case "bill":
    case "bill-recharge":
      return "/(root)/(tabs)/(factures)";
    case "reload":
    case "cardAction":
    case "installment":
      return "/(root)/(tabs)/(cartes)";
    case "confirm-chequebook":
      return "/(root)/(tabs)/(menu)/create-chequebook";
    case "schooling":
      return "/(root)/(tabs)/(menu)/schooling";
    case "savingPlansResign":
    case "savingPlans":
      return "/(root)/(tabs)/(menu)/saving-plans";
    case "transfer":
    case "add-beneficiary":
    default:
      return "/(root)/(tabs)/(home)";
  }
};

export const getSmartFallback = (data?: TransactionConfirmNavData | null) => {
  if (data?.returnTo) {
    const parsed = safeParseJson(data.returnParams);
    return parsed
      ? ({ pathname: data.returnTo, params: parsed } as const)
      : (data.returnTo as any);
  }
  return getDefaultFallback(data?.transactionType);
};

/** =========================
 *  CARD ACTION → RESULT ACTION TYPE
 *  ========================= */

export const mapCardActionToResultType = (
  cardAction?: CardActionType,
): string => {
  switch (cardAction) {
    case "resetPin":
      return "cardResetPin";
    case "modifyLimit":
      return "cardModifyLimit";
    case "disableSecured":
      return "card3DSecure";
    case "replaceCard":
      return "cardReplaceCard";
    default:
      return "cardAction";
  }
};

/** =========================
 *  ERROR → i18n (uses api-error-mapper)
 *  ========================= */

export const getErrorKeysFromCode = (errorCode?: string | null) => {
  return getErrorMapping(errorCode);
};

export const extractErrorCode = (error: any): string => {
  return error?.response?.data?.errorCode || "GENERIC_ERROR";
};

export const extractErrorMessage = (error: any): string => {
  return (
    error?.response?.data?.message || error?.message || "An error occurred"
  );
};