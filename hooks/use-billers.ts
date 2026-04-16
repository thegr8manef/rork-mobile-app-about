import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  confirmBillPaymentApi,
  DeleteContractBillersPaymentApi,
  DeleteFavoriteBillersPaymentApi,
  fetchAllBillersApi,
  fetchBillerContractsApi,
  getAllPaymentsApi,
  getBills,
  initBillPaymentApi,
  ToggleFavoriteBillersPaymentApi,
} from "@/services/billers.api";

import { useAuth } from "@/hooks/auth-store";

import type { BillApiModel } from "@/types/bills.types";
import type { Biller, BillerContract, BillPayment } from "@/types/billers";
import type {
  ConfirmBillPaymentRequest,
  InitBillPaymentRequest,
  SearchBillsParams,
} from "@/types/billers.type";
import { PaymentInitResponse } from "@/types/bill-payment-init.types";

/* -------------------------------------------------------------------------- */
/*                                   KEYS                                     */
/* -------------------------------------------------------------------------- */

export const billerQueryKeys = {
  billers: {
    all: ["billers"] as const,

    payments: (page: number = 1, limit: number = 50) =>
      ["billers", "payments", { page, limit }] as const,

    paymentsInfinite: (limit: number = 10, extra?: Record<string, any>) =>
      ["billers", "payments", "infinite", { limit, ...(extra ?? {}) }] as const,

    paymentObjects: (params: SearchBillsParams) =>
      ["billers", "paymentObjects", params] as const,
  },

  contracts: {
    favorites: (isFavorite?: boolean) =>
      ["contracts", "favorites", isFavorite ?? "all"] as const,
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                              INVALIDATE HELPERS                            */
/* -------------------------------------------------------------------------- */

export const useBillersInvalidations = () => {
  const qc = useQueryClient();

  return {
    invalidateBillers: () =>
      qc.invalidateQueries({
        queryKey: billerQueryKeys.billers.all,
        refetchType: "all",
      }),

    // ✅ THIS IS THE IMPORTANT FIX
    invalidateContracts: () =>
      qc.invalidateQueries({ queryKey: ["contracts"], refetchType: "all" }),

    invalidatePayments: () =>
      qc.invalidateQueries({
        queryKey: ["billers", "payments"],
        refetchType: "all",
      }),

    invalidatePaymentObjects: () =>
      qc.invalidateQueries({
        queryKey: ["billers", "paymentObjects"],
        refetchType: "all",
      }),

    invalidateEverythingFactures: async () => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: billerQueryKeys.billers.all,
          refetchType: "all",
        }),
        qc.invalidateQueries({ queryKey: ["contracts"], refetchType: "all" }),
        qc.invalidateQueries({
          queryKey: ["billers", "payments"],
          refetchType: "all",
        }),
        qc.invalidateQueries({
          queryKey: ["billers", "paymentObjects"],
          refetchType: "all",
        }),
      ]);
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                                   QUERIES                                  */
/* -------------------------------------------------------------------------- */

export const useGetAllContracts = (isFavorite?: boolean) => {
  const {
    authState: { accessToken },
  } = useAuth();

  return useQuery<BillerContract[], AxiosError>({
    queryKey: billerQueryKeys.contracts.favorites(isFavorite),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetchBillerContractsApi(isFavorite);
      return res;
    },
  });
};

export const useFetchAllBillers = () => {
  const {
    authState: { accessToken },
  } = useAuth();

  return useQuery<Biller[], AxiosError>({
    queryKey: billerQueryKeys.billers.all,
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetchAllBillersApi();
      return res;
    },
  });
};

export const useGetAllPayments = (params?: {
  page?: number;
  limit?: number;
}) => {
  const {
    authState: { accessToken },
  } = useAuth();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;

  return useQuery<BillPayment[], AxiosError>({
    queryKey: billerQueryKeys.billers.payments(page, limit),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await getAllPaymentsApi(page, limit);
      return res;
    },
  });
};

export const useGetAllPaymentsInfinite = (params?: {
  limit?: number;
  keyExtra?: Record<string, any>;
}) => {
  const {
    authState: { accessToken },
  } = useAuth();

  const limit = params?.limit ?? 10;
  const keyExtra = params?.keyExtra ?? {};

  return useInfiniteQuery<BillPayment[], AxiosError>({
    queryKey: billerQueryKeys.billers.paymentsInfinite(limit, keyExtra),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      const status = (error as any)?.response?.status;
      if (status >= 400 && status < 600) return false;
      return failureCount < 2;
    },
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await getAllPaymentsApi(Number(pageParam), limit);
      return res;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < limit) return undefined;
      return allPages.length + 1;
    },
  });
};

export const flattenInfinitePayments = (data?: { pages?: any[][] }) =>
  data?.pages?.flat() ?? [];

/* -------------------------------------------------------------------------- */
/*                                  MUTATIONS                                 */
/* -------------------------------------------------------------------------- */

export const useInitBillPayment = () => {
  const qc = useQueryClient();

  return useMutation<any, AxiosError, InitBillPaymentRequest>({
    mutationFn: initBillPaymentApi,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: ["billers", "payments"],
          refetchType: "all",
        }),
        qc.invalidateQueries({ queryKey: ["contracts"], refetchType: "all" }),
        qc.invalidateQueries({
          queryKey: billerQueryKeys.billers.all,
          refetchType: "all",
        }),
      ]);
    },
  });
};

export const useConfirmBillPayment = () => {
  const qc = useQueryClient();

  return useMutation<any, AxiosError, ConfirmBillPaymentRequest>({
    mutationFn: (body) => confirmBillPaymentApi(body),

    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: ["billers", "payments"],
          refetchType: "all",
        }),
        qc.invalidateQueries({ queryKey: ["accounts"] }),
        qc.invalidateQueries({ queryKey: ["accountMovements"] }),
        qc.invalidateQueries({ queryKey: ["transactions"] }),
        qc.invalidateQueries({ queryKey: ["contracts"], refetchType: "all" }),
        qc.invalidateQueries({
          queryKey: billerQueryKeys.billers.all,
          refetchType: "all",
        }),
      ]);
    },
  });
};

/**
 * ✅ IMPORTANT:
 * If this mutation is what your "add contract" screen calls,
 * then invalidate contracts here so favorites refresh instantly.
 */
type BillsResponse = {
  count: number;
  data: BillApiModel[];
};
export const useSearchBillsMutation = () => {
  const qc = useQueryClient();
  const {
    authState: { accessToken },
  } = useAuth();

  return useMutation<BillApiModel[], AxiosError, SearchBillsParams>({
    mutationFn: async (params) => {
      const res = await getBills(params);
      // ✅ EMPTY RESPONSE => stop flow (caller will go to catch)
      if (!res || res.length === 0 || !Array.isArray(res)) {
        throw new Error("NO_BILLS_FOUND");
      }

      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["contracts"],
        refetchType: "all",
      });
    },
  });
};

// export const useDeleteFavoriteBillersPayment = () => {
//   const qc = useQueryClient();

//   return useMutation<any, AxiosError, { contractId: string }>({
//     mutationFn: ({ contractId }) => DeleteFavoriteBillersPaymentApi(contractId),

//     onSuccess: async () => {
//       await Promise.all([
//         qc.invalidateQueries({ queryKey: ["contracts"], refetchType: "all" }),
//         qc.invalidateQueries({
//           queryKey: ["billers", "payments"],
//           refetchType: "all",
//         }),
//         qc.invalidateQueries({ queryKey: ["billers"], refetchType: "all" }),
//       ]);
//     },
//   });
// };

export const useDeleteContractBillersPayment = () => {
  const qc = useQueryClient();

  return useMutation<void, AxiosError, { contractId: string }>({
    mutationFn: ({ contractId }) => DeleteContractBillersPaymentApi(contractId),

    onSuccess: async () => {
      console.log("[biller-contracts] delete success for");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["contracts"], refetchType: "all" }),
        qc.invalidateQueries({
          queryKey: ["billers", "payments"],
          refetchType: "all",
        }),
        qc.invalidateQueries({ queryKey: ["billers"], refetchType: "all" }),
      ]);
    },
  });
};

export const useToggleFavoriteBillersPayment = () => {
  const qc = useQueryClient();

  return useMutation<
    BillApiModel[],
    AxiosError,
    { contractId: string; isFavorite: boolean }
  >({
    mutationFn: async ({ contractId, isFavorite }) => {
      const res = await ToggleFavoriteBillersPaymentApi(contractId, isFavorite);

      if (!res || !Array.isArray(res)) {
        throw new Error("NO_BILLS_FOUND");
      }

      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["contracts"],
        refetchType: "all",
      });
    },
  });
};
