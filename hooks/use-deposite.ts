import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "./auth-store";
import * as termDepositsApi from "@/services/deposite.api";
import { Deposit, DepositResponse } from "@/types/deposite.type";


/**
 * ============================================================
 * Query Keys
 * ============================================================
 */

export const termDepositsQueryKeys = {
  termDeposits: () => ["termDeposits"] as const,

  termDepositDetails: (depositId: string) => ["termDepositDetails", depositId] as const,
};

/**
 * ============================================================
 * Queries
 * ============================================================
 */

/**
 * Fetch term deposits list
 *
 * GET /api/financial-products/term-deposits
 */
export const useTermDeposits = () => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<DepositResponse, AxiosError>({
    queryKey: termDepositsQueryKeys.termDeposits(),
    queryFn: termDepositsApi.getTermDeposits,
    enabled: isAuthenticated,
  });
};

/**
 * Fetch term deposit details
 *
 * GET /api/financial-products/term-deposits/{depositId}
 */
export const useTermDepositDetails = (depositId: string) => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<Deposit, AxiosError>({
    queryKey: termDepositsQueryKeys.termDepositDetails(depositId),
    queryFn: () => termDepositsApi.getTermDepositDetails(depositId),
    enabled: isAuthenticated && !!depositId,
  });
};