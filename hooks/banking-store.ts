import createContextHook from "@nkzw/create-context-hook";
import {  useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import {

  SchoolingTransferRequest,
} from "@/types/banking";
import { useAuth } from "./auth-store";
import * as api from "@/services/mock-api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const [BankingProvider, useBanking] = createContextHook(() => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || "";
  const queryClient = useQueryClient();

  const makeSchoolingTransferMutation = useMutation({
    mutationFn: (request: SchoolingTransferRequest) =>
      api.createSchoolingTransferApi(accessToken, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolingFolders"] });
    },
  });

  const [enabledQuickActions, setEnabledQuickActions] = useState<string[]>([
    "send",
    "schooling",
    "beneficiaries",
    "cards",
  ]);
  const [isLoadingQuickActions, setIsLoadingQuickActions] = useState(true);

  useEffect(() => {
    const loadQuickActions = async () => {
      try {
        const stored = await AsyncStorage.getItem("quickActions");
        if (stored) {
          setEnabledQuickActions(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load quick actions:", error);
      } finally {
        setIsLoadingQuickActions(false);
      }
    };
    loadQuickActions();
  }, []);

  const saveQuickActions = async (actions: string[]) => {
    try {
      await AsyncStorage.setItem("quickActions", JSON.stringify(actions));
      setEnabledQuickActions(actions);
      console.log("Quick actions saved:", actions);
    } catch (error) {
      console.error("Failed to save quick actions:", error);
    }
  };

  return useMemo(
    () => ({
      schoolingTransfers: [],

      enabledQuickActions,
      isLoadingQuickActions,
      selectAccount: () => {},

      makeSchoolingTransfer: makeSchoolingTransferMutation.mutate,
      saveQuickActions,
    }),
    [
      enabledQuickActions,
      isLoadingQuickActions,
      makeSchoolingTransferMutation.mutate,
      saveQuickActions,
    ]
  );
});
