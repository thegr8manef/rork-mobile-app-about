import type { TransferType } from "./types";
import { serverNow } from "@/utils/serverTime";

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatDateFR = (d?: Date) => {
  if (!d) return "";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const formatDateToYYYYMMDD = (d: Date) => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

export const getMinExecutionDate = (transferType: TransferType) => {
  if (transferType === "ponctuel") return startOfDay(serverNow());

  const now = serverNow();
  const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000 + 20 * 60 * 1000);
  return startOfDay(minDate);
};

export const isDateAtLeast48h20minFromNow = (date: Date) => {
  const now = serverNow();
  const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000 + 20 * 60 * 1000);
  return startOfDay(date).getTime() >= startOfDay(minDate).getTime();
};

export const getMinEndDate = (
  transferType: TransferType,
  executionDate?: Date
) => {
  if (transferType === "ponctuel") {
    return executionDate ? startOfDay(executionDate) : startOfDay(new Date());
  }
  return executionDate
    ? new Date(executionDate.getTime() + 24 * 60 * 60 * 1000)
    : getMinExecutionDate(transferType);
};



type TransferStatus = "EXECUTED" | "PENDING" | "CANCELED" | "REJECTED" | string;

type UITransferLike = {
  status?: TransferStatus;
  nature?: "immediate" | "deferred" | string;
  rawTransferType?: string;
  executionDateISO?: string;
};

const H24 = 24 * 60 * 60 * 1000;

const isDeferred = (tr: UITransferLike) => {
  // use what you already have (nature is best)
  if (tr.nature === "deferred") return true;

  // fallback if nature missing
  const raw = String(tr.rawTransferType ?? "").toUpperCase();
  return raw.includes("DEFERRED");
};

/**
 * ✅ Cancel rule for deferred transfers:
 * - Cancel button appears ONLY for DEFERRED
 * - ONLY when status is PENDING
 * - ONLY if we are at least 24h BEFORE execution date
 *
 * (This is the common banking rule. If your tester REALLY wants "24h AFTER execution",
 * I added the alternative below.)
 */
export const canCancelDeferredTransfer = (tr: UITransferLike) => {
  if (!isDeferred(tr)) return false;
  if (String(tr.status ?? "").toUpperCase() !== "PENDING") return false;

  const exec = tr.executionDateISO ? new Date(tr.executionDateISO) : null;
  if (!exec || Number.isNaN(exec.getTime())) return false;

  const now = Date.now();
  const diff = exec.getTime() - now; // time remaining until execution

  return diff >= H24; // ✅ at least 24h before execution
};

/**
 * Alternative (ONLY if your spec truly says "24h AFTER execution"):
 * export const canCancelDeferredTransfer = (tr: UITransferLike) => {
 *   if (!isDeferred(tr)) return false;
 *   if (String(tr.status ?? "").toUpperCase() !== "EXECUTED") return false;
 *   const exec = tr.executionDateISO ? new Date(tr.executionDateISO) : null;
 *   if (!exec || Number.isNaN(exec.getTime())) return false;
 *   return Date.now() - exec.getTime() >= H24;
 * };
 */
export const canConsultReceipt = (tr: UITransferLike) => {
  return String(tr.status ?? "").toUpperCase() === "EXECUTED";
};

export const canDownloadReceipt = (tr: UITransferLike) => {
  return String(tr.status ?? "").toUpperCase() === "EXECUTED";
};



export const amoutFormatter= () => {

}