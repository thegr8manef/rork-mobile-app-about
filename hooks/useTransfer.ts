import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import * as accountApi from "@/services/account.api";
import {
  GetTransferRequestsParams,
  TransferCancelRequest,
  TransferConfirmChallengeDTO,
  TransferConfirmRequest,
  TransferConfirmResponse,
  TransferConfirmWithCHALLENGEequest,
  TransferHistoryItem,
  TransferInitChallengeBody,
  TransferInitCHALLENGEesponse,
  TransferInitRequest,
  TransferInitResponse,
  TransferRequestConfirmResponse,
} from "@/types/account.type";
import { AxiosError } from "axios";

export const useTransferInit = () => {
  const queryClient = useQueryClient();

  return useMutation<TransferInitResponse, AxiosError, TransferInitRequest>({
    mutationFn: (payload) => accountApi.transferInit(payload),

    onMutate: (payload) => {
      console.log("====================================");
      console.log(
        "🔄 [TransferInit] starting request with payload:",
        JSON.stringify(payload, null, 2),
      );
      console.log("====================================");

      return undefined;
    },

    onSuccess: (data, payload) => {
      console.log("✅ [TransferInit] request succeeded");
      console.log("✅ Response data:", data);
      console.log("✅ Payload sent:", payload);

      // If you want to inspect deep fields:
      console.log("✅ Response JSON:", JSON.stringify(data, null, 2));
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountMovements"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transferRequests"] });
    },

    onError: (error, payload) => {
      console.log("❌ [TransferInit] request failed");
      console.log("Payload:", payload);
      console.log("Status:", error?.response?.status);
      console.log("Response:", error?.response?.data);
      console.log("Message:", error?.message);
    },
  });
};

export const useTransferConfirm = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TransferConfirmResponse,
    AxiosError,
    TransferConfirmRequest
  >({
    mutationFn: accountApi.transferConfirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountMovements"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transferRequests"] });

      console.log("Transfer completed successfully");
    },
  });
};

export const transferQueryKeys = {
  all: ["transferRequests"] as const,

  // 1. Keep the base history key separate for easy invalidation
  history: () => [...transferQueryKeys.all, "history"] as const,

  // 2. Infinite version
  historyInfinite: (params?: GetTransferRequestsParams) =>
    [...transferQueryKeys.history(), "infinite", params] as const,
};

/**
 * Extract transfer rows from API response
 * Handles multiple response formats from backend
 */
function extractRows(resp: any): TransferHistoryItem[] {
  if (!resp) return [];
  if (Array.isArray(resp?.data)) return resp.data as TransferHistoryItem[];
  if (Array.isArray(resp?.data?.data))
    return resp.data.data as TransferHistoryItem[];
  return [];
}

/**
 * Hook for fetching transfer history with infinite scroll
 * Supports all filters: date range, amount range, status, type, sorting
 */
// Maximum pages to auto-fetch via infinite scroll.
// Beyond this only manual scroll (user-triggered) will load more.
export const TRANSFER_HISTORY_MAX_AUTO_PAGES = 3;

export const useTransferHistoryInfinite = (
  params?: Omit<GetTransferRequestsParams, "page">,
  options?: { enabled?: boolean },
) => {
  const PAGE_SIZE = params?.size ?? 20;

  return useInfiniteQuery({
    queryKey: transferQueryKeys.historyInfinite(params || {}),
    enabled: options?.enabled ?? true,
    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      const traceId = `p${pageParam}-${Date.now()}`;
      console.log(`[TH][API] ▶️ fetch`, { traceId, page: pageParam, params });

      const res = await accountApi.getTransferRequests({
        ...(params ?? {}),
        page: pageParam,
        size: PAGE_SIZE,
      });

      const rows = extractRows(res);
      console.log(
        "res: trasnfer Historue inside useTransfer hooks length ====>  ",
        res.data.length,
      );
      console.log(`[TH][API] ✅ success`, {
        page: pageParam,
        rows: rows.length,
      });

      return res;
    },

    getNextPageParam: (lastPage, allPages) => {
      // Stop if last page was not full (no more data on server)
      const rows = extractRows(lastPage);
      if (rows.length < PAGE_SIZE) {
        console.log(`[TH][API] ⛔ end — last page not full`, {
          lastPageRows: rows.length,
          pageSize: PAGE_SIZE,
        });
        return undefined;
      }

      return allPages.length + 1;
    },

    retry: 1,
    retryDelay: 800,
  });
};

export const useTransferCancel = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: (requestId) => accountApi.cancelTransferRequest(requestId),

    onSuccess: () => {
      // ✅ invalidate ALL transfer history caches (all filters/pages)
      queryClient.invalidateQueries({ queryKey: transferQueryKeys.history() });
      console.log("Transfer cancelled successfully");
    },
  });
};

/**
 * Init CHALLENGE for a transfer transaction
 * POST /api/v1/auth/init-transaction-challenge
 */
export const useTransferInitChallenge = () => {
  return useMutation<
    TransferInitCHALLENGEesponse,
    AxiosError,
    TransferInitChallengeBody
  >({
    mutationFn: (body) => accountApi.transferInitChallenge(body),

    onMutate: (body) => {
      console.log("🔄 [TransferInitChallenge] payload:", body);
      return undefined;
    },

    onSuccess: (data) => {
      console.log("✅ [TransferInitChallenge] success:", data);
    },

    onError: (error, body) => {
      console.log("❌ [TransferInitChallenge] failed");
      console.log("Payload:", body);
      console.log("Status:", error?.response?.status);
      console.log("Response:", error?.response?.data);
      console.log("Message:", error?.message);
    },
  });
};

/**
 * Confirm transfer using CHALLENGE / PINCODE / TOTP
 * POST /api/payment-means/transfer-requests/confirm
 */
export const useTransferConfirmChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TransferConfirmResponse,
    AxiosError,
    TransferConfirmChallengeDTO
  >({
    mutationFn: (payload) => accountApi.transferConfirmWithChallenge(payload),

    onMutate: (payload) => {
      console.log("🔄 [TransferConfirmChallenge] payload:", payload);
      return undefined;
    },

    onSuccess: (data, payload) => {
      console.log("✅ [TransferConfirmChallenge] success:", payload.requestId);
      console.log("✅ [TransferConfirmChallenge] response:", data);

      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accountMovements"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transferRequests"] });
    },

    onError: (error, payload) => {
      console.log("❌ [TransferConfirmChallenge] failed");
      console.log("Payload:", payload);
      console.log("Status:", error?.response?.status);
      console.log("Response:", error?.response?.data);
      console.log("Message:", error?.message);
    },
  });
};

/**
 * Hook for downloading transfer PDF
 * Returns base64 string for React Native rendering
 * Use with saveBase64PdfToDevice utility to save the PDF
 */
export const useTransferPdf = (
  transferId: string | null,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["transferPdf", transferId],
    enabled: options?.enabled ?? !!transferId,

    queryFn: async () => {
      if (!transferId) throw new Error("Transfer ID is required");

      console.log("🔄 [TransferPdf] Fetching PDF for:", transferId);

      const blob = await accountApi.getTransferPdf(transferId);

      // Convert blob to base64 for React Native
      const reader = new FileReader();

      return new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          console.log("✅ [TransferPdf] PDF loaded successfully");
          resolve(base64data);
        };

        reader.onerror = () => {
          console.log("❌ [TransferPdf] Failed to read PDF");
          reject(new Error("Failed to read PDF"));
        };
        //@ts-ignore
        reader.readAsDataURL(blob);
      });
    },

    retry: 1,
    retryDelay: 800,
    staleTime: 1000 * 60 * 5, // 5 minutes - PDFs don't change often
  });
};
