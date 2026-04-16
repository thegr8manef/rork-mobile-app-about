// bills/use-bills.ts
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "./auth-store";
import * as billsApi from "@/services/bills.api";
import {
  BillOfExchangeListResponse,
  BillFilterParams,
} from "@/types/bill-of-exchange.type";

/**
 * ============================================================
 * Query Keys
 * ============================================================
 */
export const billQueryKeys = {
  bills: (filters: Omit<BillFilterParams, "page" | "limit">) =>
    ["bills", filters] as const,

  billImage: (billId: string) => ["billImage", billId] as const,
};

/**
 * ============================================================
 * Queries
 * ============================================================
 */

// ✅ Use a small page size so pagination is visible and reliable
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch bills list with infinite scroll pagination
 */
export const useBills = (filters: Omit<BillFilterParams, "page" | "limit">) => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useInfiniteQuery<BillOfExchangeListResponse, AxiosError>({
    queryKey: ["bills", filters],
    enabled: isAuthenticated && !!filters.accountId,
    staleTime: 1000 * 60 * 5,
    initialPageParam: 1,

    queryFn: ({ pageParam }) =>
      billsApi.getBills({
        ...filters,
        page: Number(pageParam),
        limit: DEFAULT_PAGE_SIZE,
      }),

    // ✅ YOUR API: count = items in current page
    // So we paginate using page-size rule
    getNextPageParam: (lastPage, allPages) => {
      const lastLen = lastPage?.data?.length ?? 0;

      // if we got a full page, there might be another page
      if (lastLen === DEFAULT_PAGE_SIZE) {
        return allPages.length + 1;
      }

      // if less than limit => last page
      return undefined;
    },
  });
};

/**
 * Fetch bill image (Base64)
 */
export const useBillImage = (billId: string) => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<string, AxiosError>({
    queryKey: billQueryKeys.billImage(billId),
    queryFn: () => billsApi.getBillImage(billId),
    enabled: isAuthenticated && !!billId,
  });
};
