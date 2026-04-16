// bills/bills.api.ts
/**
 * ============================================================
 * Bill of Exchange APIs
 * ============================================================
 */

import {
  BillFilterParams,
  BillImageResponse,
  BillOfExchangeListResponse,
} from "@/types/bill-of-exchange.type";
import api from "./lib/axios";

/**
 * Get list of bills of exchange with filters and pagination
 */
export const getBills = async (
  filters: BillFilterParams,
): Promise<BillOfExchangeListResponse> => {
  const params: Record<string, string | number | undefined> = {};

  if (filters.accountId) params.accountId = filters.accountId;
  if (filters.sens) params.sens = filters.sens;
  if (filters.billNumber) params.billNumber = filters.billNumber;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.limit !== undefined) params.limit = filters.limit;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.minAmount !== undefined) params.minAmount = filters.minAmount;
  if (filters.maxAmount !== undefined) params.maxAmount = filters.maxAmount;
  if (filters.outcome) params.outcome = filters.outcome;

  // backend expects typeEffet
  if ((filters as any).typeEffet) params.typeEffet = (filters as any).typeEffet;

  console.log("[API] Fetching bill params:", params);

  const { data } = await api.get<BillOfExchangeListResponse>(
    "/api/payment-means/bills",
    { params },
  );

  console.log("[API] Fetching bill data:", data);
  return data;
};

/**
 * Get bill image (Base64 string)
 *
 * @param billId - Bill ID
 */
export const getBillImage = async (
  billId: string,
): Promise<BillImageResponse> => {
  console.log("[API] Fetching bill image:", billId);

  const { data } = await api.get<BillImageResponse>(
    `/api/payment-means/bills/${billId}/export-image`,
  );

  return data;
};
