/**
 * ============================================================
 * Cheque APIs
 * ============================================================
 */

import {
  CheckbookResponse,
  CheckImageResponse,
  CheckListResponse,
  ChequeFilterParams,
  ConfirmCheckbookRequest,
  ConfirmCheckbookResponse,
  InitCheckbookRequest,
  InitCheckbookResponse,
} from "@/types/cheque.type";
import api from "./lib/axios";

/**
 * Get list of cheques for one or more accounts with filters and pagination
 *
 * @param filters - ChequeFilterParams
 */
export const getCheques = async (
  filters: ChequeFilterParams,
): Promise<CheckListResponse> => {
  console.log("[API] Fetching cheques list with filters:", filters);

  const params: Record<string, string | number | undefined> = {};

  if (filters.accountIds) {
    params.accountIds = Array.isArray(filters.accountIds)
      ? filters.accountIds.join(",")
      : filters.accountIds;
  }

  if (filters.chequeNumber) {
    params.chequeNumber = Array.isArray(filters.chequeNumber)
      ? filters.chequeNumber.join(",")
      : filters.chequeNumber;
  }

  if (filters.outcome) {
    params.outcome = Array.isArray(filters.outcome)
      ? filters.outcome.join(",")
      : filters.outcome;
  }

  if (filters.minAmount !== undefined) {
    params.minAmount = filters.minAmount;
  }

  if (filters.maxAmount !== undefined) {
    params.maxAmount = filters.maxAmount;
  }

  if (filters.startDate) {
    params.startDate = filters.startDate;
  }

  if (filters.endDate) {
    params.endDate = filters.endDate;
  }

  if (filters.page !== undefined) {
    params.page = filters.page;
  }

  if (filters.limit !== undefined) {
    params.limit = filters.limit;
  }

  if (filters.remittanceNumber) {
    params.remittanceNumber = Array.isArray(filters.remittanceNumber)
      ? filters.remittanceNumber.join(",")
      : filters.remittanceNumber;
  }

  if (filters.sens) {
    params.sens = filters.sens;
  }

  if (filters.startChequeNumber) {
    params.startChequeNumber = filters.startChequeNumber;
  }

  if (filters.endChequeNumber) {
    params.endChequeNumber = filters.endChequeNumber;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.derCorresp) {
    params.derCorresp = Array.isArray(filters.derCorresp)
      ? filters.derCorresp.join(",")
      : filters.derCorresp;
  }

  if (filters.rib) {
    params.rib = filters.rib;
  }

  if (filters.natureCode) {
    params.natureCode = filters.natureCode;
  }

  if (filters.bankCode) {
    params.bankCode = filters.bankCode;
  }

  const { data } = await api.get<CheckListResponse>(
    "/api/payment-means/cheques",
    { params },
  );

  console.log("[API] Cheques fetched:", data.count, "page:", filters.page);
  return data;
};

/**
 * Get cheque image (Base64 string)
 *
 * @param chequeId - Cheque UUID
 */
export const getChequeImage = async (
  chequeId: string,
): Promise<CheckImageResponse> => {
  //   logBaseUrl();
  console.log("[API] Fetching cheque image:", chequeId);

  const { data } = await api.get<CheckImageResponse>(
    `/api/payment-means/cheques/${chequeId}/image`,
  );

  return data;
};

/**
 * Get checkbook requests for an account
 *
 * @param accountId - Account UUID
 */
export const getChequeBookRequests = async (
  accountId: string,
): Promise<CheckbookResponse> => {
  //   logBaseUrl();
  console.log("[API] Fetching cheque book requests");

  const { data } = await api.get<CheckbookResponse>(
    "/api/payment-means/cheque-book-requests",
    {
      params: { accountId },
    },
  );

  console.log("[API] Cheque book requests fetched:", data.count);
  return data;
};

/**
 * Initialize a new cheque book request
 *
 * @param payload - InitCheckbookRequest
 */
export const initChequeBookRequest = async (
  payload: InitCheckbookRequest,
): Promise<InitCheckbookResponse> => {
  console.log("[API] Initializing cheque book request");
  console.log("[API] Initializing cheque book request payload", payload);

  const response = await api.post<InitCheckbookResponse>(
    "/api/payment-means/cheque-book-requests/init",
    payload,
  );
  console.log("[API] Initializing cheque book request response", response.data);

  return response.data;
};

/**
 * Confirm a cheque book request (OTP / confirmation)
 *
 * @param payload - ConfirmCheckbookRequest
 */
export const confirmChequeBookRequest = async (
  payload: ConfirmCheckbookRequest,
): Promise<ConfirmCheckbookResponse> => {
  //   logBaseUrl();
  console.log("[API] Confirming cheque book request");
  console.log("[API] Confirming cheque book request payload", payload);

  const { data } = await api.post<ConfirmCheckbookResponse>(
    "/api/payment-means/cheque-book-requests/confirm",
    payload,
  );
  console.log("[API] Confirming cheque book request response", data);

  return data;
};
