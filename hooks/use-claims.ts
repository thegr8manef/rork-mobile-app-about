import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "./auth-store";
import * as claimsApi from "@/services/claims.api";
import {
  ClaimResponse,
  Claim,
  CreateClaimBody,
  ClaimFilters,
} from "@/types/claim.type";

export const claimQueryKeys = {
  claims: (filters?: ClaimFilters) => ["claims", filters] as const,
  claimDetail: (claimId: string) => ["claimDetail", claimId] as const,
  claimAttachment: (claimId: string, attachmentId: string) =>
    ["claimAttachment", claimId, attachmentId] as const,
};

export const useClaims = (filters?: ClaimFilters) => {
  const { authState } = useAuth();

  return useInfiniteQuery<ClaimResponse, AxiosError>({
    queryKey: claimQueryKeys.claims(filters),
    queryFn: ({ pageParam = 1 }) =>
      claimsApi.getClaims({
        ...filters,
        page: pageParam as number,
        limit: filters?.limit || 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (sum, page) => sum + page.data.length,
        0,
      );
      if (totalLoaded < lastPage.count) {
        return allPages.length + 1;
      }
      return undefined;
    },
    enabled: authState.isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useClaimDetail = (claimId: string | null) => {
  const { authState } = useAuth();

  return useQuery<Claim, AxiosError>({
    queryKey: claimQueryKeys.claimDetail(claimId!),
    queryFn: () => claimsApi.getClaimById(claimId!),
    enabled: authState.isAuthenticated && !!claimId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useCreateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation<Claim, AxiosError, CreateClaimBody>({
    mutationFn: claimsApi.createClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["claims"],
      });
    },
  });
};

export const useDownloadClaimAttachment = () => {
  return useMutation<
    string,
    AxiosError,
    { claimId: string; attachmentId: string }
  >({
    mutationFn: ({ claimId, attachmentId }) =>
      claimsApi.downloadClaimAttachment(claimId, attachmentId),
  });
};
