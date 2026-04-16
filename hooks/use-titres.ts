import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "./auth-store";
import * as titresApi from "@/services/titre.api";

/** ============================
 * Query Keys
 * ============================ */
export const titresQueryKeys = {
  accountNumbers: () => ["accountNumbers"] as const,
  titres: (accountNumber: string) => ["titres", accountNumber] as const,
};

/** ============================
 * Types (match API responses)
 * ============================ */
export type AccountNumberItem = { accountNumber: string };

export type TitreRowApi = {
  securitiesAccount: string;
  valueCode: string;
  label: string;
  quantity: number;
  blockedQuantity: number;
  marketPrice: number;
  lastPriceEstimate: number;
  lastPriceEstimateDate: string; // "03-04-2025"
  unitCostPrice: number;
  costPriceEstimate: number;
  latentProfitLoss: number;
};

/** ============================
 * Queries
 * ============================ */
export const useAccountNumbers = () => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<AccountNumberItem[], AxiosError>({
    queryKey: titresQueryKeys.accountNumbers(),
    queryFn: titresApi.getAccountNumbers,
    enabled: isAuthenticated,
  });
};

export const useTitres = (accountNumber?: string | null) => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<TitreRowApi[], AxiosError>({
    queryKey: titresQueryKeys.titres(accountNumber || ""),
    queryFn: () => titresApi.getTitres(accountNumber!),
    enabled: isAuthenticated && !!accountNumber,
  });
};
