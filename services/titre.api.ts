import api from "./lib/axios";
import type { AccountNumberItem, TitreRowApi } from "@/hooks/use-titres";

/**
 * GET /api/accounts/all/securitiesAccounts
 * Response: [{ accountNumber: "300556" }]
 */
export const getAccountNumbers = async (): Promise<AccountNumberItem[]> => {
  const { data } = await api.get<{data: AccountNumberItem[]}>(
    "/api/accounts/all/securitiesAccounts",
  );
  return data?.data ?? [];
};

/**
 * GET /api/accounts/securitiesAccounts/{accountNumber}/portfolio
 * Response: [{ securitiesAccount, valueCode, ... }]
 */
export const getTitres = async (
  accountNumber: string,
): Promise<TitreRowApi[]> => {
  const { data } = await api.get<{data: TitreRowApi[]}>(
    `/api/accounts/securitiesAccounts/${accountNumber}/portfolio`,
  );
  return data?.data ?? [];
};
