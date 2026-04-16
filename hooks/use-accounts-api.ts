import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { useAuth } from "./auth-store";
import * as accountApi from "@/services/account.api";
import * as mockApi from "@/services/mock-api";
import {
  getContractConfig,
  ContractConfigResponse,
  submitFeedback,
  FeedbackSubmitBody,
} from "@/services/contract.api";

import {
  AccountResponse,
  AccountMovementsResponse,
  AccountDetail,
  GetBeneficiariesResponse,
  AddBeneficiaryInitBody,
  AddBeneficiaryInitResponse,
  AddBeneficiaryConfirmBody,
  AddBeneficiaryConfirmResponse,
  InvalidInitRibErrorResponse,
  BeneficiaryConfirmWithChallengeRequest,
  BeneficiaryConfirmResponse,
  DeleteBeneficiaryBody,
  Profile,
  UpdateAccountsBody,
  UpdateAccountsCtx,
} from "@/types/account.type";
import { t } from "i18next";

/* ------------------------------------------------------------------ */
/* Query Keys (Centralized)                                            */
/* ------------------------------------------------------------------ */
export const accountQueryKeys = {
  accounts: ["accounts"] as const,
  accountDetails: (accountId: string) => ["accountDetails", accountId] as const,
  movements: (accountId: string | null, params?: unknown) =>
    ["accountMovements", accountId, params] as const,
  beneficiaries: ["beneficiaries"] as const,
  cheques: (accountId?: string) => ["cheques", accountId] as const,
  bills: (accountId?: string) => ["bankingBills", accountId] as const,
};
export const profileQueryKeys = {
  profile: ["contract", "profile"] as const,
};
export const contractQueryKeys = {
  config: ["contract", "config"] as const,
};
/* ------------------------------------------------------------------ */
/* Profile                                                           */
/* ------------------------------------------------------------------ */

export const useProfile = () => {
  const { authState } = useAuth();

  return useQuery<Profile>({
    queryKey: profileQueryKeys.profile,
    queryFn: accountApi.getProfile,
    // ✅ Defense-in-depth: only fire once we actually have a token in memory,
    // not just because isAuthenticated flipped. Prevents a 401 → forced
    // logout race during the biometric login handoff.
    enabled: !!authState.isAuthenticated && !!authState.accessToken,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
};

/* ------------------------------------------------------------------ */
/* Contract Config                                                     */
/* ------------------------------------------------------------------ */
export const useContractConfig = () => {
  const { authState } = useAuth();

  return useQuery<ContractConfigResponse>({
    queryKey: contractQueryKeys.config,
    queryFn: getContractConfig,
    enabled: !!authState.isAuthenticated,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, FeedbackSubmitBody>({
    mutationKey: ["feedbackSubmit"],
    mutationFn: submitFeedback,

    onMutate: (payload) => {
      console.log("🔄 [SubmitFeedback] payload:", payload);
    },

    onSuccess: (_, payload) => {
      console.log(
        "✅ [SubmitFeedback] success",
        payload.skip ? "(skipped)" : "(submitted)",
      );
      queryClient.invalidateQueries({ queryKey: contractQueryKeys.config });
    },

    onError: (error, payload) => {
      console.log("❌ [SubmitFeedback] failed");
      console.log("Payload:", payload);
      console.log("Status:", error?.response?.status);
      console.log("Message:", error?.message);
    },
  });
};

/* ------------------------------------------------------------------ */
/* Accounts                                                           */
/* ------------------------------------------------------------------ */
export const useCustomerAccounts = () => {
  const { authState } = useAuth();

  return useQuery<AccountResponse>({
    queryKey: accountQueryKeys.accounts,
    queryFn: accountApi.getAccounts,
    enabled: !!authState.isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

/* ------------------------------------------------------------------ */
/* Account Movements                                                   */
/* ------------------------------------------------------------------ */
export const useAccountMovements = (
  accountId: string | null,
  params?: accountApi.MovementsQueryParams,
) => {
  const { authState } = useAuth();

  return useQuery<AccountMovementsResponse>({
    queryKey: accountQueryKeys.movements(accountId, params),
    queryFn: async () => {
      // 👇 log params
      console.log("🧾 [useAccountMovements] params:", params);

      // 👇 log endpoint (best effort)
      const endpoint = `/accounts/${accountId}/movements`; // adjust to your real route
      console.log("🌐 [useAccountMovements] endpoint:", endpoint);

      return accountApi.getAccountMovements(accountId!, params);
    },
    enabled: authState.isAuthenticated && !!accountId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
};

/* ------------------------------------------------------------------ */
/* Account Details                                                     */
/* ------------------------------------------------------------------ */
export const useAccountDetails = (accountId: string | null) => {
  const { authState } = useAuth();

  return useQuery<AccountDetail>({
    queryKey: accountQueryKeys.accountDetails(accountId!),
    queryFn: () => accountApi.getAccountDetail(accountId!),
    enabled: authState.isAuthenticated && !!accountId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

/* ------------------------------------------------------------------ */
/* Cheques                                                            */
/* ------------------------------------------------------------------ */
export const useCheques = (accountId?: string) => {
  const { authState } = useAuth();

  return useQuery({
    queryKey: accountQueryKeys.cheques(accountId),
    //@ts-ignore
    queryFn: () => mockApi.fetchChequesApi(accountId),
    enabled: authState.isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

/* ------------------------------------------------------------------ */
/* Banking Bills                                                       */
/* ------------------------------------------------------------------ */
export const useBankingBills = (accountId?: string) => {
  const { authState } = useAuth();

  return useQuery({
    queryKey: accountQueryKeys.bills(accountId),
    //@ts-ignore
    queryFn: () => mockApi.fetchBankingBillsApi(accountId),
    enabled: authState.isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

/* ------------------------------------------------------------------ */
/* Beneficiaries                                                       */
/* ------------------------------------------------------------------ */
export const useBeneficiaries = () => {
  const { authState } = useAuth();

  return useQuery<GetBeneficiariesResponse>({
    queryKey: accountQueryKeys.beneficiaries,

    // ✅ BIG LOG ONLY HERE (no imports needed)
    queryFn: async () => {
      const startMs = Date.now();
      const startIso = new Date().toISOString();

      try {
        const res = await accountApi.getBeneficiaries();

        const endMs = Date.now();
        const dur = endMs - startMs;

        // try to show count without assuming exact shape
        let count: number | "?" = "?";
        try {
          const maybeList =
            (res as any)?.beneficiaries ??
            (res as any)?.data ??
            (Array.isArray(res) ? res : null);
          if (Array.isArray(maybeList)) count = maybeList.length;
        } catch {}

        return res;
      } catch (err: any) {
        throw err;
      }
    },

    enabled: !!authState.isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  });
};

/* ------------------------------------------------------------------ */
/* Add Beneficiary – INIT                                              */
/* ------------------------------------------------------------------ */
export const useAddBeneficiaryInit = () => {
  return useMutation<
    AddBeneficiaryInitResponse,
    AxiosError<InvalidInitRibErrorResponse>,
    AddBeneficiaryInitBody
  >({
    mutationKey: ["beneficiaryInit"],
    mutationFn: accountApi.addBeneficiaryInit,

    onMutate: (payload) => {
      console.log("🔄 [AddBeneficiaryInit] payload:", payload);
      return undefined;
    },

    onSuccess: (data, payload) => {
      console.log("✅ [AddBeneficiaryInit] success");
      console.log("Request payload:", payload);
      console.log("Response:", data);
    },

    onError: (error, payload) => {
      console.log("error:", error);
      console.log("❌ [AddBeneficiaryInit] failed");
      console.log("Request payload:", payload);
      console.log("Status:", error?.response?.status);
      console.log("Message:", error?.message);
      console.log("Response data:", error?.response?.data);

      // network / timeout / no response
      if (!error?.response) {
        console.log("No response received (network error / timeout / CORS).");
      }
    },
  });
};

/* ------------------------------------------------------------------ */
/* Add Beneficiary – CONFIRM                                           */
/* ------------------------------------------------------------------ */
export const useConfirmBeneficiary = () => {
  const queryClient = useQueryClient();
  return useMutation<
    AddBeneficiaryConfirmResponse,
    AxiosError,
    AddBeneficiaryConfirmBody
  >({
    mutationKey: ["beneficiaryConfirm"],

    mutationFn: accountApi.confirmBeneficiary,

    // 🔄 BEFORE request starts
    onMutate: (payload) => {
      console.log("🔄 [BeneficiaryConfirm] sending payload:", payload);
    },

    // ✅ SUCCESS
    onSuccess: async (data, payload) => {
      console.log("✅ [BeneficiaryConfirm] success response:", data);
      console.log("➡️ Payload that produced success:", payload);
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
    },

    onError: (error, payload) => {
      console.log("❌ [BeneficiaryConfirm] failed");
      console.log("➡️ Payload:", payload);
      console.log(
        "🚨 Error:",
        error?.response?.data ?? error.message ?? error.toString(),
      );
    },
  });
};

/* ------------------------------------------------------------------ */
/* BENIFICIER CHALLANGE  CONFIRM                                                      */
/* ------------------------------------------------------------------ */

export const useBeneficiaryConfirmChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BeneficiaryConfirmResponse,
    AxiosError,
    BeneficiaryConfirmWithChallengeRequest
  >({
    mutationFn: (payload) =>
      accountApi.beneficiaryConfirmWithChallenge(payload),

    onMutate: (payload) => {
      console.log("🔄 [BeneficiaryConfirmChallenge] payload:", payload);
      return undefined;
    },

    onSuccess: (data, payload) => {
      console.log(
        "✅ [BeneficiaryConfirmChallenge] success:",
        payload.requestId,
      );
      console.log("✅ [BeneficiaryConfirmChallenge] response:", data);

      // ✅ invalidate what makes sense
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
    },

    onError: (error, payload) => {
      console.log("❌ [BeneficiaryConfirmChallenge] failed");
      console.log("Payload:", payload);
      console.log("Status:", error?.response?.status);
      console.log("Response:", error?.response?.data);
      console.log("Message:", error?.message);
    },
  });
};

export const useDeleteBeneficiary = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, DeleteBeneficiaryBody>({
    mutationKey: ["beneficiaryDelete"],
    mutationFn: ({ beneficiaryId }) =>
      accountApi.deleteBeneficiaryRequest(beneficiaryId), // ✅ DELETE /beneficiaries/:id

    onMutate: (payload) => {
      console.log("🔄 [DeleteBeneficiary] payload:", payload);
      return undefined;
    },

    onSuccess: (_, payload) => {
      console.log("✅ [DeleteBeneficiary] success (204 No Content)");
      console.log("Request payload:", payload);

      // ✅ refresh list after delete
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
    },

    onError: (error, payload) => {
      console.log("❌ [DeleteBeneficiary] failed");
      console.log("Request payload:", payload);
      console.log("Status:", error?.response?.status);
      console.log("Message:", error?.message);

      if (!error?.response) {
        console.log("No response received (network error / timeout / CORS).");
      }
    },
  });
};

export const useUpdateAccounts = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, UpdateAccountsBody, UpdateAccountsCtx>({
    mutationKey: ["accountsUpdate"],
    mutationFn: accountApi.updateAccounts,

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: accountQueryKeys.accounts });

      const prev = queryClient.getQueryData<AccountResponse>(
        accountQueryKeys.accounts,
      );

      if (prev?.data?.length) {
        const patchById = new Map(payload.map((p) => [p.accountId, p]));

        const next: AccountResponse = {
          ...prev,
          data: prev.data.map((acc: any) => {
            const patch = patchById.get(acc.id);
            if (!patch) return acc;

            return {
              ...acc,
              accountLabel: patch.accountLabel,
              accountTitle: patch.accountLabel, // ← UI reads accountTitle
              displayIndex: patch.displayIndex,
            };
          }),
        };

        queryClient.setQueryData(accountQueryKeys.accounts, next);
      }

      return { prev };
    },

    onError: (err, payload, ctx) => {
      console.log(
        "❌ [accountsUpdate] failed",
        err?.response?.data ?? err?.message,
      );
      if (ctx?.prev) {
        queryClient.setQueryData(accountQueryKeys.accounts, ctx.prev);
      }
    },

    onSuccess: async () => {
      console.log("✅ [accountsUpdate] success (204)");
      await queryClient.invalidateQueries({
        queryKey: accountQueryKeys.accounts,
      });
    },
  });
};

/* ------------------------------------------------------------------ */
/* FCM Token                                                           */
/* ------------------------------------------------------------------ */
export const usePatchFcmToken = () => {
  return useMutation<void, AxiosError, string>({
    mutationKey: ["fcmToken"],
    mutationFn: (fcmToken) => accountApi.patchFcmToken(fcmToken),

    onSuccess: () => {
      console.log("✅ [FCM] Token sent to backend");
    },

    onError: (error) => {
      console.log(
        "❌ [FCM] Failed to send token:",
        error?.response?.data ?? error?.message,
      );
    },
  });
};
