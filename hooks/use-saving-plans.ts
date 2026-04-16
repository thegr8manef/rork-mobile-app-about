import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuth } from "./auth-store";

import * as savingPlansApi from "@/services/saving-plans.api";
import {
  SavingPlansResponse,
  CreateSavingPlanRequest,
  SavingPlan,
  GlobalSavingPlanResponse,
  GlobalSavingPlanConfirmRequest,
} from "@/types/saving-plan.type";

import {
  CallType,
  initSavingPlansGlobal,
  confirmSavingPlansGlobal,
  initSavingPlansResign,
  ResignSavingPlanRequest,
  confirmSavingPlansResign,
} from "@/services/saving-plans.api";

export const savingPlanQueryKeys = {
  savingPlans: ["savingPlans"] as const,
};

export const useSavingPlans = () => {
  const {
    authState: { accessToken },
  } = useAuth();

return useQuery<SavingPlansResponse, AxiosError>({
  queryKey: savingPlanQueryKeys.savingPlans,
  queryFn: savingPlansApi.getSavingPlans,
  enabled: !!accessToken,
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 5,
  refetchOnMount: true,       // ✅ always refetch on mount
  refetchOnWindowFocus: true, // ✅ refetch when app comes to foreground
});
};

export const useSavingPlansGlobalInit = (
  callType: CallType = "CREATING",
  savingPlanId?: string,
) => {
  const mutation = useMutation<
    GlobalSavingPlanResponse,
    AxiosError,
    CreateSavingPlanRequest
  >({
    mutationFn: (body) => initSavingPlansGlobal(body, callType, savingPlanId),
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};

/**
 * ✅ FIX: make args optional so you can call: useSavingPlansGlobalConfirm()
 * Default is CREATING (no savingPlanId/accountId required).
 */
export const useSavingPlansGlobalConfirm = (
  callType: CallType = "CREATING",
  savingPlanId?: string,
  accountId?: string,
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    SavingPlan,
    AxiosError,
    GlobalSavingPlanConfirmRequest
  >({
    mutationFn: (body) =>
      confirmSavingPlansGlobal(body, callType, savingPlanId, accountId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: savingPlanQueryKeys.savingPlans,
        }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["accountMovements"] }),
      ]);
      console.log("[SavingPlans] confirm completed successfully");
    },

    onError: (error, body) => {
      console.log("❌ [SavingPlans] confirm failed");
      console.log("Payload:", body);
      console.log("Status:", error?.response?.status);
      console.log("Response:", error?.response?.data);
      console.log("Message:", error?.message);
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};

export const useActiveSavingPlansCount = () => {
  const { data } = useSavingPlans();
  const isActive = (s?: "RE" | "VA" | "MO" | null) => s === "VA";
  return data?.data?.filter((plan) => isActive(plan.status)).length ?? 0;
};

export const useSavingPlansResignInit = (savingPlanId?: string) => {
  const mutation = useMutation<any, AxiosError, ResignSavingPlanRequest>({
    mutationFn: (body) => initSavingPlansResign(body, savingPlanId),
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};

export const useSavingPlansResignConfirm = (savingPlanId?: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    SavingPlan,
    AxiosError,
    GlobalSavingPlanConfirmRequest
  >({
    mutationFn: (body) => confirmSavingPlansResign(body, savingPlanId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: savingPlanQueryKeys.savingPlans,
        }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["accountMovements"] }),
      ]);
      console.log("[SavingPlans] confirm completed successfully");
    },

    onError: (error, body) => {
      console.log("❌ [SavingPlans] confirm failed");
      console.log("Payload:", body);
      console.log("Status:", error?.response?.status);
      console.log("Response:", error?.response?.data);
      console.log("Message:", error?.message);
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};
