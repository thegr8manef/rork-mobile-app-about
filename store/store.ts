import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStringStorage } from "./mmkv";

type AppPreferencesState = {
  enabledQuickActions: string[];
  isLoadingQuickActions: boolean;
  setEnabledQuickActions: (actions: string[]) => void;

  // ✅ per-card last "recalculate pin" timestamp (ms)
  lastRecalculatePinByCardId: Record<string, number>;
  setLastRecalculatePin: (cardId: string, at?: number) => void;
  clearLastRecalculatePin: (cardId: string) => void;

  // ✅ preferences
  showTransactionDetail: boolean;
  setShowTransactionDetail: (v: boolean) => void;
  toggleShowTransactionDetail: () => void;

  showCardDetail: boolean;
  setShowCardDetail: (v: boolean) => void;
  toggleShowCardDetail: () => void;

  // ✅ current selected card (for header navigation)
  selectedCardId: string | null;
  setSelectedCardId: (id: string | null) => void;

  homeOnboardingCompleted: boolean;
  setHomeOnboardingCompleted: (v: boolean) => void;

  selectedLanguage: string | null;
  setSelectedLanguage: (lng: string | null) => void;

  beneficiarySwipeHintCount: number;
  incrementBeneficiarySwipeHint: () => void;

  // ✅ Store review — tracks login count and review prompt attempts
  loginCount: number;
  incrementLoginCount: () => void;
  reviewPromptCount: number; // how many times we've shown the review prompt
  incrementReviewPromptCount: () => void;
  lastReviewPromptLoginCount: number; // loginCount when we last showed the prompt
  setLastReviewPromptLoginCount: (v: number) => void;
};

const DEFAULT_ACTIONS = ["send", "transfers", "beneficiaries", "cards"];

export const useAppPreferencesStore = create<AppPreferencesState>()(
  persist(
    (set, get) => ({
      enabledQuickActions: DEFAULT_ACTIONS,
      isLoadingQuickActions: false,
      setEnabledQuickActions: (actions) =>
        set({ enabledQuickActions: actions }),

      // ✅ per-card recalculate pin lock
      lastRecalculatePinByCardId: {},
      setLastRecalculatePin: (cardId, at = Date.now()) =>
        set((state) => ({
          lastRecalculatePinByCardId: {
            ...state.lastRecalculatePinByCardId,
            [cardId]: at,
          },
        })),
      clearLastRecalculatePin: (cardId) =>
        set((state) => {
          const next = { ...state.lastRecalculatePinByCardId };
          delete next[cardId];
          return { lastRecalculatePinByCardId: next };
        }),

      // ✅ defaults
      showTransactionDetail: true,
      setShowTransactionDetail: (v) => set({ showTransactionDetail: v }),
      toggleShowTransactionDetail: () =>
        set({ showTransactionDetail: !get().showTransactionDetail }),

      showCardDetail: true,
      setShowCardDetail: (v) => set({ showCardDetail: v }),
      toggleShowCardDetail: () =>
        set({ showCardDetail: !get().showCardDetail }),

      // ✅ selected card id
      selectedCardId: null,
      setSelectedCardId: (id) => set({ selectedCardId: id }),

      homeOnboardingCompleted: false,
      setHomeOnboardingCompleted: (v) => set({ homeOnboardingCompleted: v }),

      selectedLanguage: null,
      setSelectedLanguage: (lng) => set({ selectedLanguage: lng }),

      beneficiarySwipeHintCount: 0,
      incrementBeneficiarySwipeHint: () =>
        set((state) => ({
          beneficiarySwipeHintCount: state.beneficiarySwipeHintCount + 1,
        })),

      // ✅ Store review
      loginCount: 0,
      incrementLoginCount: () =>
        set((state) => ({ loginCount: state.loginCount + 1 })),
      reviewPromptCount: 0,
      incrementReviewPromptCount: () =>
        set((state) => ({ reviewPromptCount: state.reviewPromptCount + 1 })),
      lastReviewPromptLoginCount: 0,
      setLastReviewPromptLoginCount: (v) =>
        set({ lastReviewPromptLoginCount: v }),
    }),
    {
      name: "app-preferences",
      storage: createJSONStorage(() => mmkvStringStorage),

      partialize: (state) => ({
        enabledQuickActions: state.enabledQuickActions,
        lastRecalculatePinByCardId: state.lastRecalculatePinByCardId,
        showTransactionDetail: state.showTransactionDetail,
        showCardDetail: state.showCardDetail,
        selectedCardId: state.selectedCardId,
        homeOnboardingCompleted: state.homeOnboardingCompleted,
        selectedLanguage: state.selectedLanguage,
        beneficiarySwipeHintCount: state.beneficiarySwipeHintCount,
        loginCount: state.loginCount,
        reviewPromptCount: state.reviewPromptCount,
        lastReviewPromptLoginCount: state.lastReviewPromptLoginCount,
      }),

      merge: (persisted: any, current) => {
        if (!persisted) return current;
        const saved = persisted as Partial<AppPreferencesState>;

        return {
          ...current,
          enabledQuickActions: saved.enabledQuickActions?.length
            ? saved.enabledQuickActions
            : DEFAULT_ACTIONS,

          lastRecalculatePinByCardId:
            saved.lastRecalculatePinByCardId ??
            current.lastRecalculatePinByCardId,

          showTransactionDetail:
            typeof saved.showTransactionDetail === "boolean"
              ? saved.showTransactionDetail
              : current.showTransactionDetail,

          showCardDetail:
            typeof saved.showCardDetail === "boolean"
              ? saved.showCardDetail
              : current.showCardDetail,

          selectedCardId:
            typeof saved.selectedCardId === "string" ||
            saved.selectedCardId === null
              ? saved.selectedCardId
              : current.selectedCardId,

          homeOnboardingCompleted:
            typeof saved.homeOnboardingCompleted === "boolean"
              ? saved.homeOnboardingCompleted
              : current.homeOnboardingCompleted,

          selectedLanguage:
            typeof saved.selectedLanguage === "string" ||
            saved.selectedLanguage === null
              ? saved.selectedLanguage
              : current.selectedLanguage,

          beneficiarySwipeHintCount:
            typeof saved.beneficiarySwipeHintCount === "number"
              ? saved.beneficiarySwipeHintCount
              : current.beneficiarySwipeHintCount,

          loginCount:
            typeof saved.loginCount === "number"
              ? saved.loginCount
              : current.loginCount,

          reviewPromptCount:
            typeof saved.reviewPromptCount === "number"
              ? saved.reviewPromptCount
              : current.reviewPromptCount,

          lastReviewPromptLoginCount:
            typeof saved.lastReviewPromptLoginCount === "number"
              ? saved.lastReviewPromptLoginCount
              : current.lastReviewPromptLoginCount,
        };
      },
    },
  ),
);