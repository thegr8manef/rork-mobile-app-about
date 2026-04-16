/**
 * ============================================================
 * CARD API SERVICE
 * ============================================================
 *
 * This module provides all API calls for card operations.
 *
 * ARCHITECTURE PATTERN:
 * Most operations follow a two-step Init/Confirm flow:
 *
 * 1. INIT - Start the operation (returns requestId)
 *    Example: activateCardInit() → { requestId: "abc-123" }
 *
 * 2. CONFIRM - Complete with OTP/biometric (uses requestId)
 *    Example: confirmCardAction(cardId, { requestId, confirmationMethod, code })
 *
 * EXCEPTIONS (direct operations):
 * - Enable card (activateCard) - Direct PATCH, no init
 * - Disable card (disableCard) - Direct PATCH, no init
 *
 * INIT/CONFIRM OPERATIONS:
 * - Update limit → updateCardLimitInit() + confirmCardAction()
 * - Request PIN → requestCardPinInit() + confirmCardAction()
 * - Reset PIN → resetCardPinInit() + confirmCardAction()
 * - Replace card → replaceCardInit() + confirmCardAction()
 * - Disable 3DS → disableSecuredCardInit() + confirmCardAction()
 * - Update installment → updateInstallmentInit() + confirmCardAction()
 * - Reload card → reloadCardInit() + reloadCardConfirm()
 *
 * ============================================================
 */

import type { AxiosResponse } from "axios";
import type {
  CardListResponse,
  CardTransactionListResponse,
  CardCustomerDetails,
  CardActionResponse,
  CardActionInitResponse,
  DisableSecuredCardRequest,
  UpdateCardLimitRequest,
  CardActionConfirmationRequest,
  CardTransactionFilters,
  CardSearchResponse,
  ReloadCardInitRequest,
  ReloadCardInitResponse,
  ReloadCardConfirmRequest,
  FlexTransactionListResponse,
  UpdateInstallmentRequest,
  CardOperationsResponse,
} from "@/types/card.type";

import api from "./lib/axios";
import { BASE_URL } from "@/constants/base-url";

/* -------------------------------------------------------------------------- */
/*                          DEBUG LOGGING HELPERS                             */
/* -------------------------------------------------------------------------- */

/**
 * Log API call with optional payload
 */
function logApiCall(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`\n[card.api] ▶ ${title}`);
    return;
  }
  console.log(`\n[card.api] ▶ ${title}\n`, JSON.stringify(payload, null, 2));
}

/**
 * Log successful API response
 */
function logApiResponse(title: string, payload: unknown) {
  console.log(`[card.api] ✅ ${title}\n`, JSON.stringify(payload, null, 2));
}

/**
 * Log API error with details
 */
function logApiError(title: string, err: any) {
  const payload = err?.response?.data ?? err?.message ?? err;
  console.log(`[card.api] ❌ ${title}\n`, JSON.stringify(payload, null, 2));
}

/* -------------------------------------------------------------------------- */
/*                            QUERY OPERATIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Get all cards for the authenticated customer.
 *
 * @endpoint GET /api/payment-means/cards
 * @returns List of customer's cards with full details
 */
export const getCards = async (): Promise<CardListResponse> => {
  logApiCall("GET /api/payment-means/cards");
  const { data } = await api.get<CardListResponse>("/api/payment-means/cards");
  logApiResponse("Cards fetched", { count: data.count });
  return data;
};

/**
 * Get detailed information for a specific card.
 *
 * @endpoint GET /api/payment-means/cards/{cardId}
 * @param cardId - UUID of the card
 * @returns Detailed card information
 */
export const getCardDetails = async (
  cardId: string,
): Promise<CardCustomerDetails> => {
  logApiCall("GET /api/payment-means/cards/:cardId", { cardId });
  const { data } = await api.get<CardCustomerDetails>(
    `/api/payment-means/cards/${cardId}`,
  );
  logApiResponse("Card details fetched", { cardId });
  return data;
};

/**
 * Get transaction history for a card with optional filters.
 *
 * @endpoint GET /api/payment-means/cards/{cardId}/transactions
 * @param cardId - UUID of the card
 * @param filters - Optional filters (date range, amount, pagination, etc.)
 * @returns List of transactions
 */
export const getCardTransactions = async (
  cardId: string,
  filters: CardTransactionFilters = {},
): Promise<CardTransactionListResponse> => {
  const { startDate = "2020-01-01", page = 1, size = 9, ...rest } = filters;
  const params = { startDate, page, size, ...rest };

  logApiCall("GET /api/payment-means/cards/:cardId/transactions", {
    cardId,
    params,
  });

  const { data } = await api.get<CardTransactionListResponse>(
    `/api/payment-means/cards/${cardId}/transactions`,
    { params },
  );

  logApiResponse("Transactions fetched", { cardId, count: data.count });
  return data;
};

/**
 * Search for a card by card number.
 *
 * @endpoint GET /api/payment-means/cards?cardNumber={cardNumber}
 * @param cardNumber - Full 16-digit card number
 * @returns Search results with matching cards
 */
export async function searchCardByNumber(
  cardNumber: string,
): Promise<CardSearchResponse> {
  if (!cardNumber || String(cardNumber).trim().length === 0) {
    throw new Error("searchCardByNumber: cardNumber is required");
  }

  const url = new URL(`${BASE_URL}/api/payment-means/cards`);
  url.searchParams.set("cardNumber", cardNumber.trim());

  logApiCall("GET /api/payment-means/cards?cardNumber=***", {
    cardNumber: "****" + cardNumber.slice(-4),
  });

  try {
    const { data } = await api.get<CardSearchResponse>(url.toString());
    logApiResponse("Card search completed", { count: data.count });
    return data;
  } catch (err) {
    logApiError("Card search failed", err);
    throw err;
  }
}

/**
 * Get operation history for a card.
 *
 * @endpoint GET /api/payment-means/cards/{cardId}/operations
 * @param cardId - UUID of the card
 * @returns List of operations performed on the card
 */
export const getCardOperations = async (
  cardId: string,
): Promise<CardOperationsResponse> => {
  logApiCall("GET /api/payment-means/cards/:cardId/operations", { cardId });

  const { data } = await api.get<CardOperationsResponse>(
    `/api/payment-means/cards/${cardId}/operations`,
  );

  logApiResponse("Card operations fetched", { cardId, count: data.count });
  return data;
};

/* -------------------------------------------------------------------------- */
/*                     DIRECT CARD ACTIONS (NO INIT)                          */
/* -------------------------------------------------------------------------- */

/**
 * Enable/activate a card (direct operation, no init required).
 *
 * @endpoint PATCH /api/payment-means/cards/{cardId}/activate
 * @param cardId - UUID of the card to activate
 * @returns Action response with operation ID
 *
 * @note This is one of the few operations that doesn't require init/confirm flow
 */
export const activateCard = async (
  cardId: string,
): Promise<AxiosResponse<CardActionResponse>> => {
  logApiCall("PATCH /api/payment-means/cards/:cardId/activate", { cardId });

  const res = await api.patch<CardActionResponse>(
    `/api/payment-means/cards/${cardId}/activate`,
  );

  logApiResponse("Card activated", { status: res.status, data: res.data });
  return res;
};

/**
 * Disable/block a card (direct operation, no init required).
 *
 * @endpoint PATCH /api/payment-means/cards/{cardId}/disable
 * @param cardId - UUID of the card to disable
 * @returns Action response with operation ID
 *
 * @note This is one of the few operations that doesn't require init/confirm flow
 */
export const disableCard = async (
  cardId: string,
): Promise<AxiosResponse<CardActionResponse>> => {
  logApiCall("PATCH /api/payment-means/cards/:cardId/disable", { cardId });

  const res = await api.patch<CardActionResponse>(
    `/api/payment-means/cards/${cardId}/disable`,
  );

  logApiResponse("Card disabled", { status: res.status, data: res.data });
  return res;
};

/* -------------------------------------------------------------------------- */
/*                    INIT OPERATIONS (STEP 1: START)                         */
/* -------------------------------------------------------------------------- */

/**
 * Initialize card limit update operation.
 *
 * @endpoint PATCH /api/payment-means/cards/{cardId}/limit/init
 * @param cardId - UUID of the card
 * @param body - New limit configuration
 * @returns Init response with requestId for confirmation
 *
 * @example
 * const result = await updateCardLimitInit(cardId, { newLimit: 590 });
 * // result.data = { requestId: "d9dd1636-7d8f-4468-b928-db155d2928e5" }
 * // Next: call confirmCardAction() with this requestId
 */
export const updateCardLimitInit = async (
  cardId: string,
  body: UpdateCardLimitRequest,
): Promise<AxiosResponse<CardActionInitResponse>> => {
  logApiCall("PATCH /api/payment-means/cards/:cardId/limit/init", {
    cardId,
    body,
  });

  const res = await api.patch<CardActionInitResponse>(
    `/api/payment-means/cards/${cardId}/limit/init`,
    body,
  );

  logApiResponse("Limit update initiated", {
    status: res.status,
    data: res.data,
  });
  return res;
};

/**
 * Initialize PIN request operation.
 *
 * @endpoint PATCH /api/payment-means/cards/{cardId}/request-pin/init
 * @param cardId - UUID of the card
 * @returns Init response with requestId for confirmation
 */
export const requestCardPinInit = async (
  cardId: string,
): Promise<AxiosResponse<CardActionInitResponse>> => {
  logApiCall("PATCH /api/payment-means/cards/:cardId/request-pin/init", {
    cardId,
  });

  const res = await api.patch<CardActionInitResponse>(
    `/api/payment-means/cards/${cardId}/request-pin/init`,
  );

  logApiResponse("PIN request initiated", {
    status: res.status,
    data: res.data,
  });
  return res;
};

/**
 * Initialize PIN reset operation.
 *
 * @endpoint PATCH /api/payment-means/cards/{cardId}/reset-pin/init
 * @param cardId - UUID of the card
 * @returns Init response with requestId for confirmation
 */
export const resetCardPinInit = async (
  cardId: string,
): Promise<AxiosResponse<CardActionInitResponse>> => {
  logApiCall("PATCH /api/payment-means/cards/:cardId/reset-pin/init", {
    cardId,
  });

  const res = await api.patch<CardActionInitResponse>(
    `/api/payment-means/cards/${cardId}/reset-pin/init`,
  );

  logApiResponse("PIN reset initiated", { status: res.status, data: res.data });
  return res;
};

/**
 * Initialize card replacement operation.
 *
 * @endpoint PATCH /api/payment-means/cards/{cardId}/replace/init
 * @param cardId - UUID of the card to replace
 * @returns Init response with requestId for confirmation
 */
export const replaceCardInit = async (
  cardId: string,
): Promise<AxiosResponse<CardActionInitResponse>> => {
  logApiCall("PATCH /api/payment-means/cards/:cardId/replace/init", { cardId });

  const res = await api.patch<CardActionInitResponse>(
    `/api/payment-means/cards/${cardId}/replace/init`,
  );

  logApiResponse("Card replacement initiated", {
    status: res.status,
    data: res.data,
  });
  return res;
};

/**
 * Initialize 3D Secure disable operation.
 *
 * @endpoint PATCH /api/payment-means/cards/{cardId}/disable-secured/init
 * @param cardId - UUID of the card
 * @param body - Configuration including end date for 3DS re-enable
 * @returns Init response with requestId for confirmation
 */
export const disableSecuredCardInit = async (
  cardId: string,
  body: DisableSecuredCardRequest,
): Promise<AxiosResponse<CardActionInitResponse>> => {
  logApiCall("PATCH /api/payment-means/cards/:cardId/disable-secured/init", {
    cardId,
    body,
  });

  const res = await api.patch<CardActionInitResponse>(
    `/api/payment-means/cards/${cardId}/disable-secured/init`,
    body,
  );

  logApiResponse("3DS disable initiated", {
    status: res.status,
    data: res.data,
  });
  return res;
};

/* -------------------------------------------------------------------------- */
/*              CONFIRM OPERATION (STEP 2: COMPLETE WITH OTP)                 */
/* -------------------------------------------------------------------------- */

/**
 * Confirm a card action with OTP or biometric authentication.
 *
 * @endpoint PATCH /api/payment-means/cards/{cardId}/confirm
 * @param cardId - UUID of the card
 * @param body - Confirmation details (requestId, method, code/proof)
 * @returns Confirmation response (often 204 No Content)
 *
 * @example TOTP confirmation:
 * await confirmCardAction(cardId, {
 *   requestId: "abc-123",
 *   confirmationMethod: "TOTP",
 *   confirmationValue: "123456"
 * });
 *
 * @example Challenge confirmation:
 * await confirmCardAction(cardId, {
 *   requestId: "abc-123",
 *   confirmationMethod: "CHALLENGE",
 *   challengeConfirmationValue: {
 *     deviceId: "device-xyz",
 *     challengeId: "challenge-123",
 *     proof: "base64-proof-string"
 *   }
 * });
 */
export async function confirmCardAction(
  cardId: string,
  body: CardActionConfirmationRequest,
): Promise<AxiosResponse<void>> {
  if (!cardId || String(cardId).trim().length === 0) {
    throw new Error("confirmCardAction: cardId is required");
  }

  const url = `${BASE_URL}/api/payment-means/cards/${cardId}/confirm`;
  logApiCall("PATCH /api/payment-means/cards/:cardId/confirm", {
    cardId,
    body,
  });

  try {
    const res = await api.patch<void>(url, body);
    logApiResponse("Card action confirmed", { status: res.status });
    return res;
  } catch (err) {
    logApiError("Card action confirmation failed", err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*                      RELOAD CARD (PREPAID CARDS)                           */
/* -------------------------------------------------------------------------- */

/**
 * Initialize card reload/top-up operation.
 *
 * @endpoint POST /api/payment-means/cards/reload-card/{cardId}/init
 * @param cardId - UUID of the card to reload
 * @param body - Reload details (amount, source account, description)
 * @returns Init response with request details and requestId
 */
export async function reloadCardInit(
  cardId: string,
  body: ReloadCardInitRequest,
): Promise<AxiosResponse<ReloadCardInitResponse>> {
  if (!cardId) {
    throw new Error("reloadCardInit: cardId is required");
  }

  const url = `${BASE_URL}/api/payment-means/cards/reload-card/${cardId}/init`;
  logApiCall("POST /api/payment-means/cards/reload-card/:cardId/init", {
    cardId,
    body,
  });

  try {
    const res = await api.post<ReloadCardInitResponse>(url, body);
    logApiResponse("Card reload initiated", {
      status: res.status,
      data: res.data,
    });
    return res;
  } catch (err) {
    logApiError("Card reload init failed", err);
    throw err;
  }
}

/**
 * Confirm card reload operation with OTP or biometric.
 *
 * @endpoint POST /api/payment-means/cards/reload-card/confirm
 * @param body - Confirmation details with requestId from init
 * @returns Confirmation response (often 204 No Content)
 */
export async function reloadCardConfirm(
  body: ReloadCardConfirmRequest,
): Promise<AxiosResponse<void>> {
  if (!body?.requestId) {
    throw new Error("reloadCardConfirm: requestId is required");
  }

  const confirmationMethod = (body.confirmationMethod ?? "CHALLENGE") as
    | "TOTP"
    | "CHALLENGE";

  const normalized: ReloadCardConfirmRequest =
    confirmationMethod === "CHALLENGE"
      ? {
          ...body,
          confirmationMethod: "CHALLENGE",
          challengeConfirmationValue: body.challengeConfirmationValue,
          confirmationValue: body.confirmationValue ?? "",
        }
      : {
          ...body,
          confirmationMethod: "TOTP",
          confirmationValue: body.confirmationValue,
          challengeConfirmationValue: undefined,
        };

  if (confirmationMethod === "CHALLENGE") {
    const v = normalized.challengeConfirmationValue;
    if (!v?.deviceId || !v?.challengeId || !v?.proof) {
      throw new Error(
        "reloadCardConfirm: challengeConfirmationValue{deviceId,challengeId,proof} is required for CHALLENGE",
      );
    }
  } else {
    if (
      !normalized.confirmationValue ||
      String(normalized.confirmationValue).trim().length === 0
    ) {
      throw new Error(
        "reloadCardConfirm: confirmationValue is required for TOTP",
      );
    }
  }

  const url = `${BASE_URL}/api/payment-means/cards/reload-card/confirm`;
  logApiCall("POST /api/payment-means/cards/reload-card/confirm", normalized);

  try {
    const res = await api.post<void>(url, normalized);
    logApiResponse("Card reload confirmed", { status: res.status });
    return res;
  } catch (err) {
    logApiError("Card reload confirmation failed", err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*                    FLEX / INSTALLMENT OPERATIONS                           */
/* -------------------------------------------------------------------------- */

/**
 * Get all flex transactions eligible for installment payment.
 *
 * @endpoint GET /api/payment-means/cards/{cardId}/flex
 * @param cardId - UUID of the card
 * @returns List of flex-eligible transactions
 */
export const getFlexTransactions = async (
  cardId: string,
): Promise<FlexTransactionListResponse> => {
  logApiCall("GET /api/payment-means/cards/:cardId/flex", { cardId });

  const { data } = await api.get<FlexTransactionListResponse>(
    `/api/payment-means/cards/${cardId}/flex`,
  );

  logApiResponse("Flex transactions fetched", { cardId, count: data.count });
  return data;
};

/**
 * Initialize installment settings update for a flex transaction.
 *
 * @endpoint PATCH /api/payment-means/cards/flex/{authCode}/installment/init
 * @param authCode - Authorization code of the transaction
 * @param body - New installment settings (number of installments, payment day)
 * @returns Init response with requestId for confirmation
 */
export const updateInstallmentInit = async (
  authCode: string,
  body: UpdateInstallmentRequest,
): Promise<AxiosResponse<CardActionInitResponse>> => {
  logApiCall("PATCH /api/payment-means/cards/flex/:authCode/installment/init", {
    authCode,
    body,
  });

  const res = await api.patch<CardActionInitResponse>(
    `/api/payment-means/cards/flex/${authCode}/installment/init`,
    body,
  );

  logApiResponse("Installment update initiated", {
    status: res.status,
    data: res.data,
  });
  return res;
};

/**
 * Legacy method - kept for backward compatibility.
 * Use updateInstallmentInit() + confirmCardAction() instead.
 *
 * @deprecated
 */
export const updateInstallment = async (
  authCode: string,
  body: UpdateInstallmentRequest,
): Promise<AxiosResponse<void>> => {
  console.warn(
    "[DEPRECATED] updateInstallment() is deprecated. Use updateInstallmentInit() + confirmCardAction() instead.",
  );

  logApiCall("PATCH /api/payment-means/cards/flex/:authCode/installment", {
    authCode,
    body,
  });

  const res = await api.patch<void>(
    `/api/payment-means/cards/flex/${authCode}/installment`,
    body,
  );

  logApiResponse("Installment updated (legacy)", { status: res.status });
  return res;
};

// ✅ add in "@/services/card.api.ts"

// Types (adjust path if you keep types elsewhere)
export type ReloadCardHistoryItem = {
  id: string;
  amount: number;
  debtor?: { rib?: string | null } | null;
  transactionEve?: any;
  executionDate?: string | null;
  status?: string | null;
  customerId?: string | null;
  cardNumber?: string | null;
  cardId?: string | null;
};

export type ReloadCardHistoryResponse = {
  count: number;
  data: ReloadCardHistoryItem[];
};

// API
export const getReloadCardHistory = async (
  cardId: string,
): Promise<ReloadCardHistoryResponse> => {
  if (!cardId) throw new Error("cardId is required");
  const { data } = await api.get<ReloadCardHistoryResponse>(
    `/api/payment-means/cards/${cardId}/reload`,
  );
  return data;
};

/**
 * Download reload card receipt/document.
 *
 * @endpoint GET /api/payment-means/cards/docs/CARD_RELOAD?reloadId={reloadId}
 * @param reloadId - UUID of the reload operation
 * @returns Reload receipt/document
 */
export const getReloadCardDocument = async (
  reloadId: string,
): Promise<AxiosResponse<Blob>> => {
  logApiCall("GET /api/payment-means/cards/docs/CARD_RELOAD", {
    reloadId,
  });

  const res = await api.get<Blob>(`/api/payment-means/cards/docs/CARD_RELOAD`, {
    params: { reloadId },
    responseType: "blob",
  });

  logApiResponse("Reload card document fetched", {
    status: res.status,
    reloadId,
  });

  return res;
}; // ── Add this to services/card.api.ts ────────────────────────────────

/**
 * Download reload card receipt as base64 string.
 *
 * Uses the same endpoint as getReloadCardDocument but returns
 * arraybuffer → base64 (same pattern as getTransferPdfBase64).
 *
 * @endpoint GET /api/payment-means/cards/docs/CARD_RELOAD?reloadId={reloadId}
 */


/**
 * Download reload card PDF document
 * GET /api/payment-means/docs/UNIT_RELOAD
 */
export const getReloadCardPdf = async (
  reloadId: string,
  reportType: "PDF" = "PDF"
): Promise<ArrayBuffer> => {
  console.log("====================================");
  console.log("[API] Downloading reload card PDF", { reloadId, reportType });
  console.log("====================================");

  const { data } = await api.get("/api/payment-means/docs/UNIT_RELOAD", {
    params: { reportType, reloadId },
    responseType: "arraybuffer",
    headers: { Accept: "application/pdf" },
  });

  return data;
};

export const getReloadCardPdfBase64 = async (
  reloadId: string,
  reportType: "PDF" = "PDF"
): Promise<string> => {
  const res = await api.get("/api/payment-means/docs/UNIT_RELOAD", {
    params: { reportType, reloadId },
    responseType: "arraybuffer",
    headers: { Accept: "application/pdf" },
  });

  const data: ArrayBuffer = res.data;
  return Buffer.from(new Uint8Array(data)).toString("base64");
};