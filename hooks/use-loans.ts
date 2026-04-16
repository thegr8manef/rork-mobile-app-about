import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "./auth-store";
import * as loansApi from "@/services/ioans.api";
import { LoansResponse, LoanDetails } from "@/types/ioans.type";

/**
 * ============================================================
 * Query Keys
 * ============================================================
 */

export const loansQueryKeys = {
  loans: () => ["loans"] as const,

  loanDetails: (loanId: string) => ["loanDetails", loanId] as const,
};

/**
 * ============================================================
 * Queries
 * ============================================================
 */

/**
 * Fetch loans list
 *
 * GET /api/financial-products/loans
 */
export const useLoans = () => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<LoansResponse, AxiosError>({
    queryKey: loansQueryKeys.loans(),
    queryFn: async () => {
      const res = await loansApi.getLoans();
      console.log("🚀 ~ useLoans ~ response:", JSON.stringify(res, null, 2));
      return res;
    },
    enabled: isAuthenticated,
  });
};

/**
 * Fetch loan details
 *
 * GET /api/financial-products/loans/{loanId}
 */
export const useLoanDetails = (loanId: string) => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<LoanDetails, AxiosError>({
    queryKey: loansQueryKeys.loanDetails(loanId),
    queryFn: () => loansApi.getLoanDetails(loanId),
    enabled: isAuthenticated && !!loanId,
  });
};
