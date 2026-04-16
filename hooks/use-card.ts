/**
 * ============================================================
 * CARD REACT QUERY HOOKS
 * ============================================================
 *
 * This module provides React Query hooks for all card operations.
 *
 * HOOK NAMING CONVENTION:
 * - useCards() - Query hooks (GET operations)
 * - useActivateCard() - Direct mutation hooks (no init/confirm)
 * - useUpdateCardLimitInit() - Init mutation hooks (step 1)
 * - useConfirmCardAction() - Confirm mutation hook (step 2)
 *
 * TYPICAL USAGE PATTERN FOR INIT/CONFIRM FLOW:
 *
 * ```tsx
 * const limitInitMutation = useUpdateCardLimitInit(cardId);
 * const confirmMutation = useConfirmCardAction(cardId);
 *
 * // Step 1: Initialize
 * const initResult = await limitInitMutation.mutateAsync({ newLimit: 590 });
 * const requestId = initResult.data.requestId;
 *
 * // Step 2: Get OTP from user, then confirm
 * await confirmMutation.mutateAsync({
 *   requestId,
 *   confirmationMethod: "TOTP",
 *   confirmationValue: userOtpCode
 * });
 * ```
 *
 * CACHE INVALIDATION:
 * All mutations automatically invalidate relevant queries to keep
 * the UI in sync with backend state.
 *
 * ============================================================
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import type { AxiosError, AxiosResponse } from "axios";
import { useAuth } from "./auth-store";

import * as cardApi from "@/services/card.api";

import type {
  CardListResponse,
  CardTransactionListResponse,
  CardCustomerDetails,
  CardActionResponse,
  CardActionInitResponse,
  DisableSecuredCardRequest,
  UpdateCardLimitRequest,
  CardActionConfirmationRequest,
  CardTransactionFilters,
  CardSearchResponse,
  ReloadCardInitRequest,
  ReloadCardInitResponse,
  ReloadCardConfirmRequest,
  FlexTransactionListResponse,
  UpdateInstallmentRequest,
  CardOperationsResponse,
} from "@/types/card.type";
import api from "@/services/lib/axios";

/* -------------------------------------------------------------------------- */
/*                              QUERY KEYS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query key factory for consistent cache management.
 *
 * @example
 * queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards() })
 */
export const cardQueryKeys = {
  /** All cards list */
  cards: () => ["cards"] as const,

  /** Single card details by ID */
  cardDetails: (cardId: string) => ["cardDetails", cardId] as const,

  /** Card transactions with optional filters */
  cardTransactions: (cardId: string, filters?: CardTransactionFilters) =>
    ["cardTransactions", cardId, filters] as const,

  /** Card search results by card number */
  cardSearch: (cardNumber: string) => ["cardSearch", cardNumber] as const,

  /** Flex transactions for a card */
  flexTransactions: (cardId: string) => ["flexTransactions", cardId] as const,

  /** Card operations history */
  cardOperations: (cardId: string) => ["cardOperations", cardId] as const,

  reloadHistory: (cardId: string) => ["cardReloadHistory", cardId] as const,
};

/* -------------------------------------------------------------------------- */
/*                          LOGGING UTILITIES                                 */
/* -------------------------------------------------------------------------- */

type LogLevel = "info" | "success" | "warn" | "error";

const now = () => new Date().toISOString();

const safeJson = (v: any) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

/**
 * Pretty log box for hook operations
 */
const box = (title: string, level: LogLevel, payload?: any) => {
  const icon =
    level === "info"
      ? "ℹ️"
      : level === "success"
        ? "✅"
        : level === "warn"
          ? "⚠️"
          : "❌";

  const line = "═".repeat(86);
  console.log(`\n${line}`);
  console.log(`${icon} ${title} @ ${now()}`);
  if (payload !== undefined) console.log(safeJson(payload));
  console.log(`${line}\n`);
};

/**
 * Check if value is an Axios response
 */
const isAxiosResponse = (v: any): v is AxiosResponse =>
  !!v && typeof v === "object" && typeof v.status === "number" && "data" in v;

/**
 * Log successful Axios response
 */
const logAxiosSuccess = (label: string, res: any, extra?: any) => {
  if (isAxiosResponse(res)) {
    box(`${label} SUCCESS`, "success", {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      data: res.data,
      ...extra,
    });
  } else {
    box(`${label} SUCCESS (non-axios)`, "success", { value: res, ...extra });
  }
};

/**
 * Log Axios error with details
 */
const logAxiosError = (label: string, error: AxiosError, extra?: any) => {
  box(`${label} ERROR`, "error", {
    message: error.message,
    code: (error as any)?.code,
    status: error.response?.status,
    data: error.response?.data,
    ...extra,
  });
};

/* -------------------------------------------------------------------------- */
/*                      CACHE INVALIDATION HELPER                             */
/* -------------------------------------------------------------------------- */

/**
 * Invalidate all card-related queries for a specific card.
 * Ensures UI stays in sync after mutations.
 */
const invalidateCardQueries = (
  qc: ReturnType<typeof useQueryClient>,
  cardId: string,
  filters?: CardTransactionFilters,
) => {
  return Promise.all([
    qc.invalidateQueries({ queryKey: cardQueryKeys.cards() }),
    qc.invalidateQueries({ queryKey: cardQueryKeys.cardDetails(cardId) }),
    qc.invalidateQueries({
      queryKey: cardQueryKeys.cardTransactions(cardId, filters),
    }),
    qc.invalidateQueries({ queryKey: cardQueryKeys.cardOperations(cardId) }),
    qc.invalidateQueries({ queryKey: cardQueryKeys.reloadHistory(cardId) }),
  ]);
};

/* -------------------------------------------------------------------------- */
/*                            QUERY HOOKS (READ)                              */
/* -------------------------------------------------------------------------- */

/**
 * Get all cards for the authenticated user.
 *
 * @returns Query result with cards list
 * @example
 * const { data, isLoading, error } = useCards();
 * const cards = data?.data ?? [];
 */
export const useCards = (): UseQueryResult<CardListResponse, AxiosError> => {
  const {
    authState: { accessToken },
  } = useAuth();

  return useQuery<CardListResponse, AxiosError>({
    queryKey: cardQueryKeys.cards(),
    queryFn: cardApi.getCards,
    staleTime: 1000 * 60 * 5,
    enabled: !!accessToken,
  });
};

/**
 * Get detailed information for a specific card.
 *
 * @param cardId - UUID of the card
 * @returns Query result with card details
 */
export const useCardDetails = (
  cardId: string,
): UseQueryResult<CardCustomerDetails, AxiosError> => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<CardCustomerDetails, AxiosError>({
    queryKey: cardQueryKeys.cardDetails(cardId),
    queryFn: () => cardApi.getCardDetails(cardId),
    staleTime: 1000 * 60 * 5,
    enabled: isAuthenticated && !!cardId,
  });
};

/**
 * Get transaction history for a card.
 *
 * @param cardId - UUID of the card
 * @param filters - Optional filters (date range, pagination, etc.)
 * @returns Query result with transaction list
 */
export const useCardTransactions = (
  cardId: string,
  filters?: CardTransactionFilters,
): UseQueryResult<CardTransactionListResponse, AxiosError> => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<CardTransactionListResponse, AxiosError>({
    queryKey: cardQueryKeys.cardTransactions(cardId, filters),
    queryFn: () => cardApi.getCardTransactions(cardId, filters),
    staleTime: 1000 * 60 * 5,
    enabled: isAuthenticated && !!cardId,
  });
};

/**
 * Search for a card by card number (auto-triggers when number is complete).
 *
 * @param cardNumber - 16-digit card number
 * @returns Query result with search results
 */
export const useSearchCardByNumber = (
  cardNumber: string,
): UseQueryResult<CardSearchResponse, AxiosError> => {
  const {
    authState: { isAuthenticated, accessToken },
  } = useAuth();

  return useQuery<CardSearchResponse, AxiosError>({
    queryKey: cardQueryKeys.cardSearch(cardNumber),
    enabled: isAuthenticated && !!accessToken && cardNumber.length === 16,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      box("SEARCH CARD START", "info", {
        cardNumber: "****" + cardNumber.slice(-4),
        hasToken: !!accessToken,
      });
      const res = await cardApi.searchCardByNumber(cardNumber);
      box("SEARCH CARD SUCCESS", "success", res);
      return res;
    },
  });
};

/**
 * Get flex transactions eligible for installment payment.
 *
 * @param cardId - UUID of the card
 * @returns Query result with flex transactions
 */
export const useFlexTransactions = (
  cardId: string,
): UseQueryResult<FlexTransactionListResponse, AxiosError> => {
  const {
    authState: { isAuthenticated },
  } = useAuth();

  return useQuery<FlexTransactionListResponse, AxiosError>({
    queryKey: cardQueryKeys.flexTransactions(cardId),
    queryFn: () => cardApi.getFlexTransactions(cardId),
    staleTime: 1000 * 60 * 5,
    enabled: isAuthenticated && !!cardId,
  });
};

/**
 * Get operation history for a card.
 *
 * @param cardId - UUID of the card
 * @returns Query result with operations list
 */
export const useCardOperations = (
  cardId: string,
): UseQueryResult<CardOperationsResponse, AxiosError> => {
  const {
    authState: { isAuthenticated, accessToken },
  } = useAuth();

  return useQuery<CardOperationsResponse, AxiosError>({
    queryKey: cardQueryKeys.cardOperations(cardId),
    queryFn: () => cardApi.getCardOperations(cardId),
    enabled: isAuthenticated && !!accessToken && !!cardId,
  });
};

/* -------------------------------------------------------------------------- */
/*                  DIRECT MUTATIONS (NO INIT/CONFIRM)                        */
/* -------------------------------------------------------------------------- */

/**
 * Activate/enable a card (direct operation).
 *
 * @param cardId - UUID of the card
 * @returns Mutation hook
 *
 * @example
 * const activateMutation = useActivateCard(cardId);
 * await activateMutation.mutateAsync();
 */
export const useActivateCard = (
  cardId: string,
): UseMutationResult<AxiosResponse<CardActionResponse>, AxiosError, void> => {
  const qc = useQueryClient();

  return useMutation<AxiosResponse<CardActionResponse>, AxiosError, void>({
    mutationFn: () => cardApi.activateCard(cardId),

    onMutate: () => {
      box("ACTIVATE CARD START", "info", { cardId });
    },

    onSuccess: async (res) => {
      logAxiosSuccess("ACTIVATE CARD", res, { cardId });
      await invalidateCardQueries(qc, cardId);
    },

    onError: (error) => logAxiosError("ACTIVATE CARD", error, { cardId }),
  });
};

/**
 * Disable/block a card (direct operation).
 *
 * @param cardId - UUID of the card
 * @returns Mutation hook
 *
 * @example
 * const disableMutation = useDisableCard(cardId);
 * await disableMutation.mutateAsync();
 */
export const useDisableCard = (
  cardId: string,
): UseMutationResult<AxiosResponse<CardActionResponse>, AxiosError, void> => {
  const qc = useQueryClient();

  return useMutation<AxiosResponse<CardActionResponse>, AxiosError, void>({
    mutationFn: () => cardApi.disableCard(cardId),

    onMutate: () => {
      box("DISABLE CARD START", "info", { cardId });
    },

    onSuccess: async (res) => {
      logAxiosSuccess("DISABLE CARD", res, { cardId });
      await invalidateCardQueries(qc, cardId);
    },

    onError: (error) => logAxiosError("DISABLE CARD", error, { cardId }),
  });
};

/* -------------------------------------------------------------------------- */
/*                      INIT MUTATIONS (STEP 1)                               */
/* -------------------------------------------------------------------------- */

/**
 * Initialize card limit update (returns requestId).
 *
 * @param cardId - UUID of the card
 * @returns Mutation hook for init operation
 *
 * @example
 * const initMutation = useUpdateCardLimitInit(cardId);
 * const result = await initMutation.mutateAsync({ newLimit: 590 });
 * const requestId = result.data.requestId;
 * // Next: use requestId with useConfirmCardAction()
 */
export const useUpdateCardLimitInit = (
  cardId: string,
): UseMutationResult<
  AxiosResponse<CardActionInitResponse>,
  AxiosError,
  UpdateCardLimitRequest
> => {
  return useMutation<
    AxiosResponse<CardActionInitResponse>,
    AxiosError,
    UpdateCardLimitRequest
  >({
    mutationFn: (body) => cardApi.updateCardLimitInit(cardId, body),

    onMutate: (body) => {
      box("UPDATE LIMIT INIT START", "info", { cardId, payload: body });
    },

    onSuccess: (res, body) => {
      logAxiosSuccess("UPDATE LIMIT INIT", res, { cardId, payload: body });
    },

    onError: (error, body) =>
      logAxiosError("UPDATE LIMIT INIT", error, { cardId, payload: body }),
  });
};

/**
 * Initialize PIN request (returns requestId).
 *
 * @param cardId - UUID of the card
 * @returns Mutation hook for init operation
 */
export const useRequestCardPinInit = (
  cardId: string,
): UseMutationResult<
  AxiosResponse<CardActionInitResponse>,
  AxiosError,
  void
> => {
  return useMutation<AxiosResponse<CardActionInitResponse>, AxiosError, void>({
    mutationFn: () => cardApi.requestCardPinInit(cardId),

    onMutate: () => {
      box("REQUEST PIN INIT START", "info", { cardId });
    },

    onSuccess: (res) => {
      logAxiosSuccess("REQUEST PIN INIT", res, { cardId });
    },

    onError: (error) => logAxiosError("REQUEST PIN INIT", error, { cardId }),
  });
};

/**
 * Initialize PIN reset (returns requestId).
 *
 * @param cardId - UUID of the card
 * @returns Mutation hook for init operation
 */
export const useResetCardPinInit = (
  cardId: string,
): UseMutationResult<
  AxiosResponse<CardActionInitResponse>,
  AxiosError,
  void
> => {
  return useMutation<AxiosResponse<CardActionInitResponse>, AxiosError, void>({
    mutationFn: () => cardApi.resetCardPinInit(cardId),

    onMutate: () => {
      box("RESET PIN INIT START", "info", { cardId });
    },

    onSuccess: (res) => {
      logAxiosSuccess("RESET PIN INIT", res, { cardId });
    },

    onError: (error) => logAxiosError("RESET PIN INIT", error, { cardId }),
  });
};

/**
 * Initialize card replacement (returns requestId).
 *
 * @param cardId - UUID of the card
 * @returns Mutation hook for init operation
 */
export const useReplaceCardInit = (
  cardId: string,
): UseMutationResult<
  AxiosResponse<CardActionInitResponse>,
  AxiosError,
  void
> => {
  return useMutation<AxiosResponse<CardActionInitResponse>, AxiosError, void>({
    mutationFn: () => cardApi.replaceCardInit(cardId),

    onMutate: () => {
      box("REPLACE CARD INIT START", "info", { cardId });
    },

    onSuccess: (res) => {
      logAxiosSuccess("REPLACE CARD INIT", res, { cardId });
    },

    onError: (error) => logAxiosError("REPLACE CARD INIT", error, { cardId }),
  });
};

/**
 * Initialize 3D Secure disable (returns requestId).
 *
 * @param cardId - UUID of the card
 * @returns Mutation hook for init operation
 */
export const useDisableSecuredCardInit = (
  cardId: string,
): UseMutationResult<
  AxiosResponse<CardActionInitResponse>,
  AxiosError,
  DisableSecuredCardRequest
> => {
  return useMutation<
    AxiosResponse<CardActionInitResponse>,
    AxiosError,
    DisableSecuredCardRequest
  >({
    mutationFn: (body) => cardApi.disableSecuredCardInit(cardId, body),

    onMutate: (body) => {
      box("DISABLE 3DS INIT START", "info", { cardId, payload: body });
    },

    onSuccess: (res, body) => {
      logAxiosSuccess("DISABLE 3DS INIT", res, { cardId, payload: body });
    },

    onError: (error, body) =>
      logAxiosError("DISABLE 3DS INIT", error, { cardId, payload: body }),
  });
};

/**
 * Initialize installment update for flex transaction (returns requestId).
 *
 * @param cardId - UUID of the card (for cache invalidation)
 * @returns Mutation hook for init operation
 */
export const useUpdateInstallmentInit = (
  cardId: string,
): UseMutationResult<
  AxiosResponse<CardActionInitResponse>,
  AxiosError,
  { authCode: string; body: UpdateInstallmentRequest }
> => {
  return useMutation<
    AxiosResponse<CardActionInitResponse>,
    AxiosError,
    { authCode: string; body: UpdateInstallmentRequest }
  >({
    mutationFn: ({ authCode, body }) =>
      cardApi.updateInstallmentInit(authCode, body),

    onMutate: (vars) => {
      box("UPDATE INSTALLMENT INIT START", "info", vars);
    },

    onSuccess: (res, vars) => {
      logAxiosSuccess("UPDATE INSTALLMENT INIT", res, vars);
    },

    onError: (error, vars) =>
      logAxiosError("UPDATE INSTALLMENT INIT", error, vars),
  });
};

/* -------------------------------------------------------------------------- */
/*                      CONFIRM MUTATION (STEP 2)                             */
/* -------------------------------------------------------------------------- */

/**
 * Confirm a card action with OTP or biometric authentication.
 *
 * This is the second step after any init operation.
 * Use the requestId returned from init operations.
 *
 * @param cardId - UUID of the card
 * @returns Mutation hook for confirmation
 *
 * @example TOTP flow:
 * const confirmMutation = useConfirmCardAction(cardId);
 * await confirmMutation.mutateAsync({
 *   requestId: "abc-123",
 *   confirmationMethod: "TOTP",
 *   confirmationValue: "123456"
 * });
 *
 * @example Challenge flow:
 * await confirmMutation.mutateAsync({
 *   requestId: "abc-123",
 *   confirmationMethod: "CHALLENGE",
 *   challengeConfirmationValue: {
 *     deviceId: "device-xyz",
 *     challengeId: "challenge-123",
 *     proof: "base64-proof"
 *   }
 * });
 */
export const useConfirmCardAction = (
  cardId: string,
): UseMutationResult<
  AxiosResponse<void>,
  AxiosError,
  CardActionConfirmationRequest
> => {
  const qc = useQueryClient();

  return useMutation<
    AxiosResponse<void>,
    AxiosError,
    CardActionConfirmationRequest
  >({
    mutationFn: (body) => cardApi.confirmCardAction(cardId, body),

    onMutate: (body) => {
      box("CONFIRM CARD ACTION START", "info", { cardId, payload: body });
    },

    onSuccess: async (res, body) => {
      logAxiosSuccess("CONFIRM CARD ACTION", res, { cardId, payload: body });
      await invalidateCardQueries(qc, cardId);
    },

    onError: (error, body) =>
      logAxiosError("CONFIRM CARD ACTION", error, { cardId, payload: body }),
  });
};

/* -------------------------------------------------------------------------- */
/*                       RELOAD CARD OPERATIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Initialize card reload/top-up operation.
 *
 * @returns Mutation hook for reload init
 *
 * @example
 * const initMutation = useReloadCardInit();
 * const result = await initMutation.mutateAsync({
 *   cardId: "card-uuid",
 *   body: { amount: 100, debtorAccountId: "account-123" }
 * });
 * const requestId = result.data.id;
 */
export const useReloadCardInit = (): UseMutationResult<
  AxiosResponse<ReloadCardInitResponse>,
  AxiosError,
  { cardId: string; body: ReloadCardInitRequest }
> => {
  const qc = useQueryClient();

  return useMutation<
    AxiosResponse<ReloadCardInitResponse>,
    AxiosError,
    { cardId: string; body: ReloadCardInitRequest }
  >({
    mutationFn: async ({ cardId, body }) =>
      cardApi.reloadCardInit(cardId, body),

    onMutate: (vars) => {
      box("RELOAD CARD INIT START", "info", vars);
    },

    onSuccess: async (res) => {
      logAxiosSuccess("RELOAD CARD INIT", res);
      await qc.invalidateQueries({ queryKey: cardQueryKeys.cards() });
    },

    onError: (error, vars) => logAxiosError("RELOAD CARD INIT", error, vars),
  });
};

/**
 * Confirm card reload with OTP or biometric.
 *
 * @returns Mutation hook for reload confirmation
 *
 * @example
 * const confirmMutation = useReloadCardConfirm();
 * await confirmMutation.mutateAsync({
 *   requestId: "request-123",
 *   confirmationMethod: "TOTP",
 *   confirmationValue: "123456"
 * });
 */
export const useReloadCardConfirm = (): UseMutationResult<
  AxiosResponse<void>,
  AxiosError,
  ReloadCardConfirmRequest
> => {
  const qc = useQueryClient();

  return useMutation<AxiosResponse<void>, AxiosError, ReloadCardConfirmRequest>(
    {
      mutationFn: (body) => cardApi.reloadCardConfirm(body),

      onMutate: (body) => {
        box("RELOAD CARD CONFIRM START", "info", { payload: body });
      },

      onSuccess: async (res, body) => {
        logAxiosSuccess("RELOAD CARD CONFIRM", res, { payload: body });
        await Promise.all([
          qc.invalidateQueries({ queryKey: cardQueryKeys.cards() }),
          qc.invalidateQueries({ queryKey: ["accounts"] }),
          qc.invalidateQueries({ queryKey: ["accountMovements"] }),
          qc.invalidateQueries({ queryKey: ["transactions"] }),
        ]);
      },

      onError: (error, body) =>
        logAxiosError("RELOAD CARD CONFIRM", error, { payload: body }),
    },
  );
};

/* -------------------------------------------------------------------------- */
/*                         LEGACY / DEPRECATED                                */
/* -------------------------------------------------------------------------- */

/**
 * @deprecated Use useUpdateCardLimitInit() + useConfirmCardAction() instead
 */
export const useUpdateCardLimit = (cardId: string) => {
  console.warn(
    "[DEPRECATED] useUpdateCardLimit() is deprecated. Use useUpdateCardLimitInit() + useConfirmCardAction() instead.",
  );
  const qc = useQueryClient();

  return useMutation<
    AxiosResponse<CardActionResponse>,
    AxiosError,
    UpdateCardLimitRequest
  >({
    mutationFn: (body) => {
      // This would need the old API endpoint if it still exists
      throw new Error(
        "This endpoint no longer exists. Use updateCardLimitInit() instead.",
      );
    },

    onMutate: (body) => {
      box("UPDATE LIMIT (LEGACY) START", "warn", { cardId, payload: body });
    },

    onSuccess: async (res, body) => {
      logAxiosSuccess("UPDATE LIMIT (LEGACY)", res, { cardId, payload: body });
      await invalidateCardQueries(qc, cardId);
    },

    onError: (error, body) =>
      logAxiosError("UPDATE LIMIT (LEGACY)", error, { cardId, payload: body }),
  });
};

/**
 * @deprecated Use useRequestCardPinInit() + useConfirmCardAction() instead
 */
export const useRequestCardPin = (cardId: string) => {
  console.warn(
    "[DEPRECATED] useRequestCardPin() is deprecated. Use useRequestCardPinInit() + useConfirmCardAction() instead.",
  );
  const qc = useQueryClient();

  return useMutation<AxiosResponse<CardActionResponse>, AxiosError, void>({
    mutationFn: () => {
      throw new Error(
        "This endpoint no longer exists. Use requestCardPinInit() instead.",
      );
    },

    onMutate: () => {
      box("REQUEST PIN (LEGACY) START", "warn", { cardId });
    },

    onSuccess: async (res) => {
      logAxiosSuccess("REQUEST PIN (LEGACY)", res, { cardId });
      await invalidateCardQueries(qc, cardId);
    },

    onError: (error) =>
      logAxiosError("REQUEST PIN (LEGACY)", error, { cardId }),
  });
};

/**
 * @deprecated Use useResetCardPinInit() + useConfirmCardAction() instead
 */
export const useResetCardPin = (cardId: string) => {
  console.warn(
    "[DEPRECATED] useResetCardPin() is deprecated. Use useResetCardPinInit() + useConfirmCardAction() instead.",
  );
  const qc = useQueryClient();

  return useMutation<AxiosResponse<CardActionResponse>, AxiosError, void>({
    mutationFn: () => {
      throw new Error(
        "This endpoint no longer exists. Use resetCardPinInit() instead.",
      );
    },

    onMutate: () => {
      box("RESET PIN (LEGACY) START", "warn", { cardId });
    },

    onSuccess: async (res) => {
      logAxiosSuccess("RESET PIN (LEGACY)", res, { cardId });
      await invalidateCardQueries(qc, cardId);
    },

    onError: (error) => logAxiosError("RESET PIN (LEGACY)", error, { cardId }),
  });
};

/**
 * @deprecated Use useReplaceCardInit() + useConfirmCardAction() instead
 */
export const useReplaceCard = (cardId: string) => {
  console.warn(
    "[DEPRECATED] useReplaceCard() is deprecated. Use useReplaceCardInit() + useConfirmCardAction() instead.",
  );
  const qc = useQueryClient();

  return useMutation<AxiosResponse<CardActionResponse>, AxiosError, void>({
    mutationFn: () => {
      throw new Error(
        "This endpoint no longer exists. Use replaceCardInit() instead.",
      );
    },

    onMutate: () => {
      box("REPLACE CARD (LEGACY) START", "warn", { cardId });
    },

    onSuccess: async (res) => {
      logAxiosSuccess("REPLACE CARD (LEGACY)", res, { cardId });
      await invalidateCardQueries(qc, cardId);
    },

    onError: (error) =>
      logAxiosError("REPLACE CARD (LEGACY)", error, { cardId }),
  });
};

/**
 * @deprecated Use useDisableSecuredCardInit() + useConfirmCardAction() instead
 */
export const useDisableSecuredCard = (cardId: string) => {
  console.warn(
    "[DEPRECATED] useDisableSecuredCard() is deprecated. Use useDisableSecuredCardInit() + useConfirmCardAction() instead.",
  );
  const qc = useQueryClient();

  return useMutation<
    AxiosResponse<CardActionResponse>,
    AxiosError,
    DisableSecuredCardRequest
  >({
    mutationFn: (body) => {
      throw new Error(
        "This endpoint no longer exists. Use disableSecuredCardInit() instead.",
      );
    },

    onMutate: (body) => {
      box("DISABLE 3DS (LEGACY) START", "warn", { cardId, payload: body });
    },

    onSuccess: async (res, body) => {
      logAxiosSuccess("DISABLE 3DS (LEGACY)", res, { cardId, payload: body });
      await invalidateCardQueries(qc, cardId);
    },

    onError: (error, body) =>
      logAxiosError("DISABLE 3DS (LEGACY)", error, { cardId, payload: body }),
  });
};

/**
 * @deprecated Use useUpdateInstallmentInit() + useConfirmCardAction() instead
 */
export const useUpdateInstallment = (cardId: string) => {
  console.warn(
    "[DEPRECATED] useUpdateInstallment() is deprecated. Use useUpdateInstallmentInit() + useConfirmCardAction() instead.",
  );
  const qc = useQueryClient();

  return useMutation<
    AxiosResponse<void>,
    AxiosError,
    { authCode: string; body: UpdateInstallmentRequest }
  >({
    mutationFn: ({ authCode, body }) =>
      cardApi.updateInstallment(authCode, body),

    onMutate: (vars) => {
      box("UPDATE INSTALLMENT (LEGACY) START", "warn", vars);
    },

    onSuccess: async (res, vars) => {
      logAxiosSuccess("UPDATE INSTALLMENT (LEGACY)", res, vars);
      await qc.invalidateQueries({
        queryKey: cardQueryKeys.flexTransactions(cardId),
      });
    },

    onError: (error, vars) =>
      logAxiosError("UPDATE INSTALLMENT (LEGACY)", error, vars),
  });
};
// ✅ add in your hooks file (the big one you pasted)

// ✅ NEW QUERY HOOK: reload card history
export const useReloadCardHistory = (
  cardId: string,
): UseQueryResult<cardApi.ReloadCardHistoryResponse, AxiosError> => {
  const {
    authState: { isAuthenticated, accessToken },
  } = useAuth();

  return useQuery<cardApi.ReloadCardHistoryResponse, AxiosError>({
    queryKey: cardQueryKeys.reloadHistory(cardId),
    enabled: isAuthenticated && !!accessToken && !!cardId,
    retry: (failureCount, error) => {
      const status = (error as any)?.response?.status;
      if (status >= 400 && status < 600) return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      box("RELOAD HISTORY START", "info", { cardId });
      const res = await cardApi.getReloadCardHistory(cardId);
      // box("RELOAD HISTORY SUCCESS", "success", res);
      return res;
    },
  });
};

export const getRechargeCartePdfBase64 = async (
  reloadId: string,
  reportType: "PDF" = "PDF",
  cardId: string,
): Promise<string> => {
  const config = {
    url: "/api/payment-means/cards/docs/CARD_RELOAD",
    method: "get" as const,
    params: { reportType, reloadId, cardId },
    responseType: "arraybuffer" as const,
  };

  console.log("[getRechargeCartePdfBase64] full URL:", api.getUri(config));
  console.log("[getRechargeCartePdfBase64] params:", config.params);

  const res = await api.request(config);

  const data: ArrayBuffer = res.data;
  return Buffer.from(new Uint8Array(data)).toString("base64");
};