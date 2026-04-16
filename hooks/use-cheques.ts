import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "./auth-store";
import * as chequesApi from "@/services/cheques.api";
import {
  CheckbookResponse,
  CheckListResponse,
  ChequeFilterParams,
  ConfirmCheckbookRequest,
  ConfirmCheckbookResponse,
  InitCheckbookRequest,
  CheckImageResponse,
  InitCheckbookResponse,
} from "@/types/cheque.type";
import { useEffect } from "react";
import useShowMessage from "./useShowMessage";

/**
 * ============================================================
 * Query Keys (✅ FIXED: stable primitives, not object reference)
 * ============================================================
 */

const normalizeString = (v: unknown) => String(v ?? "").trim();

const normalizeArrayOrString = (v: unknown) => {
  // accountIds / chequeNumber / outcome might be string or string[]
  if (Array.isArray(v)) return v.map(normalizeString).join(",");
  return normalizeString(v);
};

const normalizeNumber = (v: unknown) => {
  // keep as string so queryKey is stable
  if (v === null || v === undefined || v === "") return "";
  return String(v);
};

export const chequeQueryKeys = {
  /**
   * ✅ DO NOT DO: ["cheques", filters]
   * because filters object reference changes and triggers many refetches.
   *
   * ✅ DO: build queryKey from stable primitives
   */
  cheques: (filters: Omit<ChequeFilterParams, "page" | "limit">) =>
    [
      "cheques",
      normalizeArrayOrString(filters.accountIds),
      normalizeString(filters.sens),
      normalizeArrayOrString(filters.outcome),
      normalizeString(filters.startDate),
      normalizeString(filters.endDate),
      normalizeNumber(filters.minAmount),
      normalizeNumber(filters.maxAmount),
      normalizeArrayOrString(filters.chequeNumber),
      normalizeArrayOrString(filters.remittanceNumber),
      normalizeString(filters.startChequeNumber),
      normalizeString(filters.endChequeNumber),
      normalizeString(filters.status),
      normalizeArrayOrString(filters.derCorresp),
      normalizeString(filters.rib),
      normalizeString(filters.natureCode),
      normalizeString(filters.bankCode),
    ] as const,

  chequeImage: (chequeId: string) => ["chequeImage", chequeId] as const,

  chequeBookRequests: (accountId?: string) =>
    ["chequeBookRequests", accountId] as const,
};

/**
 * ============================================================
 * Queries
 * ============================================================
 */

const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch cheques list with infinite scroll pagination
 */
export const useCheques = (
  filters: Omit<ChequeFilterParams, "page" | "limit">,
) => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useInfiniteQuery<CheckListResponse, AxiosError>({
    queryKey: chequeQueryKeys.cheques(filters),

    queryFn: async ({ pageParam = 1 }) => {
      const page = Number(pageParam);

      const response = await chequesApi.getCheques({
        ...filters,
        page,
        limit: DEFAULT_PAGE_SIZE,
      });

      return response;
    },

    initialPageParam: 1,

    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const nextPage = currentPage + 1;
      const lastPageSize = lastPage?.data?.length ?? 0;

      // 1) If backend explicitly tells us
      if (typeof lastPage?.hasMore === "boolean") {
        const result = lastPage.hasMore ? nextPage : undefined;
        return result;
      }

      // 2) Fallback: page-size based pagination
      const result = lastPageSize === DEFAULT_PAGE_SIZE ? nextPage : undefined;
      return result;
    },

    enabled: isAuthenticated && !!filters.accountIds,

    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30_000,
  });
};

/**
 * Fetch cheque image (Base64)
 */
export const useChequeImage = (chequeId: string) => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<string, AxiosError>({
    queryKey: chequeQueryKeys.chequeImage(chequeId),
    queryFn: () => chequesApi.getChequeImage(chequeId),
    enabled: isAuthenticated && !!chequeId,
  });
};

/**
 * Fetch cheque book requests
 */
export const useChequeBookRequests = (accountId: string) => {
  const queryClient = useQueryClient();

  const {
    authState: { isAuthenticated },
  } = useAuth();

  // ✅ Auto-invalidate when account changes (or first time it becomes valid)
  useEffect(() => {
    if (!isAuthenticated || !accountId) return;

    queryClient.invalidateQueries({
      queryKey: chequeQueryKeys.chequeBookRequests(accountId),
    });
  }, [accountId, isAuthenticated, queryClient]);

  return useQuery<CheckbookResponse, AxiosError>({
    queryKey: chequeQueryKeys.chequeBookRequests(accountId),
    queryFn: () => chequesApi.getChequeBookRequests(accountId),
    enabled: isAuthenticated && !!accountId,

    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
};

/**
 * ============================================================
 * Mutations
 * ============================================================
 */

/**
 * Init cheque book request
 */
export const useInitChequeBookRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<InitCheckbookResponse, AxiosError, InitCheckbookRequest>({
    mutationFn: chequesApi.initChequeBookRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chequeBookRequests"],
      });
    },
  });
};

/**
 * Confirm cheque book request
 */
export const useConfirmChequeBookRequest = () => {
  const queryClient = useQueryClient();
  const { showMessageError } = useShowMessage();

  return useMutation<
    ConfirmCheckbookResponse,
    AxiosError,
    ConfirmCheckbookRequest
  >({
    mutationFn: chequesApi.confirmChequeBookRequest,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chequeBookRequests"] });
    },
  });
};
