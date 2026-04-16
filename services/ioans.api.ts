/**
 * ============================================================
 * Loans APIs
 * ============================================================
 */

import type { LoansResponse, LoanDetails } from "@/types/ioans.type";
import api from "./lib/axios";

/**
 * Get all loans for the customer
 *
 * GET /api/financial-products/loans
 */
export const getLoans = async (): Promise<LoansResponse> => {
  console.log("[API] Fetching loans list");

  const { data } = await api.get<LoansResponse>(
    "/api/financial-products/loans"
  );

  console.log("[API] Loans fetched:", data.count);
  return data;
};

/**
 * Get loan details by loan ID
 *
 * GET /api/financial-products/loans/{loanId}
 */
export const getLoanDetails = async (loanId: string): Promise<LoanDetails> => {
  console.log("[API] Fetching loan details:", loanId);

  const { data } = await api.get<LoanDetails>(
    `/api/financial-products/loans/${loanId}`
  );

  return data;
};
