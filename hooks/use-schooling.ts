import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "./auth-store";
import * as api from "@/services/schooling.api";
import {
  ConversionTradeResponse,
  fetchConversionTrade,
  fetchSchoolingFiles,
  SchoolingFilesResponse,
} from "@/services/schooling.api";
import { AxiosError } from "axios";

/**
 * SCHOOLING FILES
 */
export const useSchoolingFiles = () => {
  const {
    authState: { accessToken },
  } = useAuth();

  return useQuery<SchoolingFilesResponse, AxiosError>({
    queryKey: ["schoolingFiles", accessToken],
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      console.log("[useSchoolingFiles] params:", {
        accessToken: !!accessToken,
      });

      const res = await fetchSchoolingFiles();

      console.log(
        "[useSchoolingFiles] response:",
        JSON.stringify(res, null, 2),
      );
      return res;
    },
  });
};

/**
 * SCHOOLING Conversion Trade
 */
export const useConversionTrade = (
  schoolingId: string,
  sourceCurrencyCode: string,
  targetCurrencyCode: string,
  amount: number,
  enabled: boolean = true,
) => {
  const {
    authState: { accessToken },
  } = useAuth();

  return useQuery<ConversionTradeResponse, AxiosError>({
    queryKey: [
      "conversionTrade",
      schoolingId,
      sourceCurrencyCode,
      targetCurrencyCode,
      amount,
    ],
    enabled: !!accessToken && enabled && amount > 0 && !!schoolingId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      console.log("[useConversionTrade] params:", {
        accessToken: !!accessToken,
        schoolingId,
        sourceCurrencyCode,
        targetCurrencyCode,
        amount,
        enabled,
      });

      const res = await fetchConversionTrade({
        schoolingId,
        sourceCurrencyCode,
        targetCurrencyCode,
        amount,
      });

      console.log(
        "[useConversionTrade] response:",
        JSON.stringify(res, null, 2),
      );
      return res;
    },
  });
};

/**
 * INIT SCHOOLING TRANSFER
 * -> After success, invalidate schooling files + transfer history (and anything else that depends on it).
 */
export const useSchoolingTransferInit = () => {
  const qc = useQueryClient();

  return useMutation<
    api.SchoolingTransferInitResponse,
    AxiosError,
    api.SchoolingTransferInitRequest
  >({
    mutationFn: async (body) => {
      console.log(
        "[useSchoolingTransferInit] body:",
        JSON.stringify(body, null, 2),
      );

      const res = await api.initSchoolingTransfer(body);

      console.log(
        "[useSchoolingTransferInit] response:",
        JSON.stringify(res, null, 2),
      );
      return res;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["schoolingFiles"] }),
        qc.invalidateQueries({ queryKey: ["schoolingTransferHistory"] }),
        // optional if you cache conversion results and want them refreshed:
        qc.invalidateQueries({ queryKey: ["conversionTrade"] }),
      ]);
    },
  });
};

/**
 * ✅ CONFIRM SCHOOLING TRANSFER (TOTP / CHALLENGE)
 * - logs payload
 * - logs success / error details
 * - invalidates the same queries you already had
 */
export const useSchoolingTransferConfirm = () => {
  const qc = useQueryClient();

  return useMutation<
    api.SchoolingTransferInitResponse,
    AxiosError,
    api.SchoolingTransferConfirmRequest
  >({
    mutationFn: (body) => api.confirmSchoolingTransfer(body), // ✅ no accessToken

    onMutate: (body) => {
      console.log("🔄 [ConfirmSchoolingTransfer] payload:", body);
      return undefined;
    },

    onSuccess: async (data, body) => {
      console.log("✅ [ConfirmSchoolingTransfer] success:", body.requestId);
      console.log("✅ [ConfirmSchoolingTransfer] response:", data);

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["accounts"] }),
        qc.invalidateQueries({ queryKey: ["accountMovements"] }),
        qc.invalidateQueries({ queryKey: ["transactions"] }),
        qc.invalidateQueries({ queryKey: ["schoolingFiles"] }),
        qc.invalidateQueries({ queryKey: ["schoolingTransferHistory"] }),
      ]);
    },

    onError: (error, body) => {
      console.log("❌ [ConfirmSchoolingTransfer] failed");
      console.log("Payload:", body);
      console.log("Status:", error?.response?.status);
      console.log("Response:", error?.response?.data);
      console.log("Message:", error?.message);
    },
  });
};
/**
 * ✅ FIXES INCLUDED
 * 1) Robust pagination stop conditions:
 *    - If backend returns `count` -> stop when fetched >= count
 *    - Else fallback -> stop when lastPage.items.length < limit
 *    - Always stop on empty page
 *
 * 2) Stable queryKey:
 *    - `keyExtra` can change identity each render -> it causes refetch loops.
 *    - We stringify it into `keyExtraKey` so the key is stable.
 *
 * 3) Guard against NaN / weird pageParam
 * 4) Better logs (including computed next page)
 */
export const useSchoolingTransferHistory = (params: {
  schoolingFileId: string;
  limit?: number;
  enabled?: boolean;
  keyExtra?: Record<string, any>;
}) => {
  const {
    authState: { accessToken },
  } = useAuth();

  const qcEnabled = params.enabled ?? true;
  const limit = params.limit ?? 10;
  const schoolingFileId = params.schoolingFileId;

  // ✅ IMPORTANT: make keyExtra stable (prevents infinite refetch if object identity changes)
  const keyExtraKey = JSON.stringify(params.keyExtra ?? {});

  return useInfiniteQuery<
    { items: api.SchoolingTransferHistoryItem[]; count?: number; page: number },
    AxiosError
  >({
    queryKey: [
      "schoolingTransferHistoryInfinite",
      schoolingFileId,
      limit,
      keyExtraKey,
    ],
    enabled: !!accessToken && qcEnabled && !!schoolingFileId,
    staleTime: 1000 * 60 * 5,
    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam);
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;

      console.log("[useSchoolingTransferHistoryInfinite] params:", {
        schoolingFileId,
        page: safePage,
        limit,
        accessToken: !!accessToken,
      });

      const res = await api.fetchSchoolingTransferHistory(
        schoolingFileId,
        safePage,
        limit,
      );

      // ✅ your api returns { count, data }
      const items = res?.data ?? [];
      const countRaw = res?.count;
      const count =
        countRaw === undefined || countRaw === null
          ? undefined
          : Number(countRaw);

      console.log("[useSchoolingTransferHistoryInfinite] response meta:", {
        page: safePage,
        count,
        itemsLen: items.length,
        firstId: items?.[0]?.id,
        // NOTE: your backend payload uses transferDate not executionDate
        firstTransferDate: (items?.[0] as any)?.transferDate,
      });

      return { items, count, page: safePage };
    },

    getNextPageParam: (lastPage, allPages) => {
      const lastLen = lastPage?.items?.length ?? 0;

      // ✅ Stop if empty page
      if (!lastPage?.items || lastLen === 0) {
        console.log(
          "[useSchoolingTransferHistoryInfinite] nextPage: STOP (empty page)",
        );
        return undefined;
      }

      // ✅ Primary: stop based on count if available
      const totalFetched = allPages.reduce(
        (acc, p) => acc + (p.items?.length ?? 0),
        0,
      );
      const totalCount = lastPage?.count;

      if (
        typeof totalCount === "number" &&
        Number.isFinite(totalCount) &&
        totalCount > 0
      ) {
        const stop = totalFetched >= totalCount;
        console.log("[useSchoolingTransferHistoryInfinite] paging (count):", {
          totalFetched,
          totalCount,
          lastPageLen: lastLen,
          stop,
        });
        if (stop) return undefined;

        const next = (lastPage.page ?? allPages.length) + 1;
        console.log("[useSchoolingTransferHistoryInfinite] nextPage:", next);
        return next;
      }

      // ✅ Fallback: classic pagination rule
      // If backend gives less than limit, there's no next page.
      if (lastLen < limit) {
        console.log(
          "[useSchoolingTransferHistoryInfinite] nextPage: STOP (lastLen < limit)",
          {
            lastLen,
            limit,
          },
        );
        return undefined;
      }

      const next = (lastPage.page ?? allPages.length) + 1;
      console.log("[useSchoolingTransferHistoryInfinite] paging (fallback):", {
        totalFetched,
        lastPageLen: lastLen,
        next,
      });
      return next;
    },
  });
};
