// hooks/use-edocs.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useAuth } from "@/hooks/auth-store";
import {
  downloadAccountDocumentApi,
  getAccountDocumentsApi,
} from "@/services/edocs.api";
import type {
  DocumentResult,
  DownloadDocumentParams,
  GetDocumentsParams,
} from "@/services/edocs.api";

export const edocsQueryKeys = {
  documents: {
    // keep if you want, but we won't rely on casting for queryKey
    list: (params: GetDocumentsParams) =>
      ["edocs", "documents", params] as const,
    root: ["edocs", "documents"] as const,
  },
} as const;

export const useEdocsInvalidations = () => {
  const qc = useQueryClient();

  return {
    invalidateDocuments: () =>
      qc.invalidateQueries({ queryKey: edocsQueryKeys.documents.root }),

    invalidateEverythingEdocs: () =>
      qc.invalidateQueries({ queryKey: ["edocs"] }),
  };
};

// Dates are optional inside GetDocumentsParams already (startDate?: / endDate?:)
export const useGetAccountDocuments = (params?: GetDocumentsParams) => {
  const {
    authState: { accessToken },
  } = useAuth();

  const enabled =
    !!accessToken && !!params?.accountId && !!params?.documentType;

  return useQuery<{ count: number; data: DocumentResult[] }, AxiosError>({
    queryKey: ["edocs", "documents", params ?? {}] as const,
    enabled,
    staleTime: 1000 * 60 * 5,
    retryDelay: 1000,
    queryFn: async () => {
      console.log("[useGetAccountDocuments] params:", {
        ...(params ?? {}),
        accessToken: !!accessToken,
      });

      return getAccountDocumentsApi(params!);
    },
  });
};

export const useDownloadAccountDocument = () => {
  return useMutation<string, AxiosError, DownloadDocumentParams>({
    mutationFn: (params) => downloadAccountDocumentApi(params),

    onMutate: (params) => {
      console.log("🔄 [useDownloadAccountDocument] payload:", params);
    },

    onSuccess: (res) => {
      console.log("✅ [useDownloadAccountDocument] success");
      console.log("Base64 length:", res?.length);
    },

    onError: (error, params) => {
      console.log("❌ [useDownloadAccountDocument] failed");
      console.log("Payload:", params);
      console.log("Status:", error?.response?.status);
      console.log("Response:", error?.response?.data);
      console.log("Message:", error?.message);
    },
  });
};
