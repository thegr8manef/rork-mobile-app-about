import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { BankingColors } from "@/constants/banking-colors";
import {
  Info,
  RefreshCw,
  Wallet,
  DollarSign,
  Edit3,
  ReceiptText,
  History,
  CreditCard,
} from "lucide-react-native";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";
import TransactionItem from "@/components/TransactionItem";
import CardSkeleton from "@/components/CardSkeleton";
import TransactionSkeleton from "@/components/TransactionSkeleton";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import CardItem from "@/components/cartes/CardItem";
import CardActionButton from "@/components/cartes/CardActionButton";
import CardUsageLimits from "@/components/cartes/CardUsageLimits";
import ScreenState from "@/components/ScreenState";
import TText from "@/components/TText";
import ApiErrorState from "@/components/Apierrorstate";
import { useTranslation } from "react-i18next";

import RecalculatePinModal from "@/components/cartes/RecalculatePinModal";
import CardDetailModal from "@/components/cartes/CardDetailModal";
import UnsecurePaymentModal from "@/components/cartes/UnsecurePaymentModal";
import RulesModal from "@/components/cartes/RulesModal";
import ModifyLimitModal from "@/components/cartes/ModifyLimitModal";
import ActivationModal from "@/components/cartes/ActivationModal";
import { width } from "@/utils/scale";
import useShowMessage from "@/hooks/useShowMessage";
import { useAppPreferencesStore } from "@/store/store";
import {
  cardQueryKeys,
  useActivateCard,
  useCards,
  useCardTransactions,
  useDisableCard,
  useDisableSecuredCardInit,
  useReplaceCardInit,
  useResetCardPinInit,
  useUpdateCardLimitInit,
} from "@/hooks/use-card";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue,
  useSharedValue,
  useAnimatedScrollHandler,
  withSpring,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import { Card } from "@/types/banking";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";

/* -------------------------------------------------------------------------- */
/*                         RESTRICTED PRODUCT CODES                           */
/* -------------------------------------------------------------------------- */

const RESTRICTED_PRODUCT_CODES = [
  // Technologique
  "49841",
  "48261",
  "48641",
  "49041",
  "49461",
  "55041",
  "63721",
  "65421",
  "65441",
  "65461",
  "65481",
  "65501",
  // Voyage
  "63441",
  "12061",
  "9241",
  "9261",
  "63901",
  "63921",
  // FLEX
  "77041",
  "77441",
  "77461",
];

export function isLimitModificationAllowed(card: {
  product: { code: string };
}): boolean {
  const allowed = !RESTRICTED_PRODUCT_CODES.includes(card.product.code);
  console.log(
    `[CARD] isLimitModificationAllowed: code=${card.product.code}, allowed=${allowed}`,
  );
  return allowed;
}

const CARD_WIDTH = width - Spacing.screenPadding * 4;

/* -------------------------------------------------------------------------- */
/*                         PAGINATION DOT COMPONENT                           */
/*                                                                            */
/* WHY defined OUTSIDE CartesScreen:                                          */
/* If defined inside, React treats it as a brand new component type on every  */
/* parent re-render (because the function reference changes). This causes     */
/* React to fully unmount + remount every dot on each render, which:          */
/*   1. Destroys Reanimated shared value connections => animation resets      */
/*   2. Causes visible flicker on scroll                                      */
/*   3. Wastes reconciliation work for every state change in CartesScreen     */
/*                                                                            */
/* WHY scrollX is passed as a prop instead of captured via closure:           */
/* Passing scrollX explicitly makes the dependency clear and avoids stale     */
/* closure bugs if the component is ever memoized.                            */
/* -------------------------------------------------------------------------- */
const PaginationDot = ({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    // WHY CARD_WIDTH + 16 and not just CARD_WIDTH:
    // snapToInterval={CARD_WIDTH + 16} (card width + gap between cards).
    // inputRange must match that exact interval so dot animation aligns
    // with snapping positions. Using just CARD_WIDTH shifts dot animation
    // ahead of the actual card position.
    const inputRange = [
      (index - 1) * (CARD_WIDTH + 16),
      index * (CARD_WIDTH + 16),
      (index + 1) * (CARD_WIDTH + 16),
    ];

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [Spacing.sm, Spacing.xxl, Spacing.sm],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolate.CLAMP,
    );

    const backgroundColor = interpolateColor(scrollX.value, inputRange, [
      BankingColors.textLight,
      BankingColors.primary,
      BankingColors.textLight,
    ]);

    return {
      width: withSpring(dotWidth, { damping: 15, stiffness: 100 }),
      opacity: withSpring(opacity, { damping: 15, stiffness: 100 }),
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.paginationDot, animatedDotStyle]} />;
};

/* -------------------------------------------------------------------------- */
/*                              MAIN SCREEN                                   */
/* -------------------------------------------------------------------------- */

export default function CartesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showMessageError, showMessageSuccess, showMessageInfo } =
    useShowMessage();

  // ------------------ Query ------------------
  const {
    data: cardsData,
    isLoading: isLoadingCards,
    isFetching: isUpdatingCard,
    isError: isCardsError,
    refetch: refetchCards,
    // WHY we removed useFocusEffect + manual refetch():
    // useCards now has staleTime + placeholderData, so React Query
    // automatically refetches on mount when data is stale. Adding a manual
    // refetch() on every focus causes DOUBLE fetches:
    //   1. React Query's own mount refetch (when stale)
    //   2. Our manual refetch() from useFocusEffect
    // This doubles network calls and can cause flickering.
    // Only add useFocusEffect + refetch() back if you need to bypass
    // staleTime for a specific reason (e.g. after a push notification).
  } = useCards();

  const cards = cardsData?.data ?? [];

  const setSelectedCardId = useAppPreferencesStore((s) => s.setSelectedCardId);

  // Shared value for scroll animation -- lives on the UI thread via Reanimated
  const scrollX = useSharedValue(0);

  // ------------------ Local state ------------------
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showCardInfo, setShowCardInfo] = useState<Record<string, boolean>>({});
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRecalculatePinModal, setShowRecalculatePinModal] = useState(false);
  const [showUnsecurePaymentModal, setShowUnsecurePaymentModal] =
    useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [activationDate, setActivationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [pickerDate, setPickerDate] = useState(defaultDate);

  const [showModifyLimitModal, setShowModifyLimitModal] = useState(false);
  const [limitAmount, setLimitAmount] = useState("0");

  const [showActivationModal, setShowActivationModal] = useState(false);
  const [pendingActivationCardId, setPendingActivationCardId] = useState<
    string | null
  >(null);

  // ------------------ Safe currentCard index clamping ------------------
  // WHY: if cards array shrinks (e.g. a card gets removed), currentCardIndex
  // could point out of bounds. Clamping prevents undefined currentCard.
  useEffect(() => {
    if (!cards.length) return;
    setCurrentCardIndex((i) => Math.min(i, cards.length - 1));
  }, [cards.length]);

  // ------------------ PIN recalculate rate limiting ------------------
  const lastRecalculatePinByCardId = useAppPreferencesStore(
    (s) => s.lastRecalculatePinByCardId,
  );
  const setLastRecalculatePin = useAppPreferencesStore(
    (s) => s.setLastRecalculatePin,
  );

  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const canRecalculatePin = (cardId?: string) => {
    if (!cardId) return false;
    const last = lastRecalculatePinByCardId?.[cardId];
    if (!last) return true;
    return Date.now() - last >= ONE_WEEK_MS;
  };

  const getRemainingMs = (cardId?: string) => {
    if (!cardId) return ONE_WEEK_MS;
    const last = lastRecalculatePinByCardId?.[cardId];
    if (!last) return 0;
    const elapsed = Date.now() - last;
    return Math.max(0, ONE_WEEK_MS - elapsed);
  };

  const formatRemaining = (ms: number) => {
    const totalMinutes = Math.ceil(ms / (60 * 1000));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
    const minutes = totalMinutes - days * 60 * 24 - hours * 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const currentCard = cards.length > 0 ? cards[currentCardIndex] : undefined;

  useRefetchOnFocus([
    { queryKey: cardQueryKeys.cards() },
    {
      queryKey: cardQueryKeys.cardDetails(currentCard?.id ?? ""),
      enabled: !!currentCard?.id,
    },
    {
      queryKey: cardQueryKeys.cardTransactions(currentCard?.id ?? ""),
      enabled: !!currentCard?.id,
    },
  ]);

  // ------------------ Limits ------------------
  const paymentLimit =
    currentCard?.limits?.find((l: any) => l.typetrx === 0) ??
    currentCard?.limits?.[currentCardIndex];

  const allowedMaxLimit = Math.min(
    paymentLimit?.maxLimit ?? Infinity,
    currentCard?.maxLimitProduct ?? Infinity,
  );

  // Sync limitAmount input with the current card's actual limit
  useEffect(() => {
    if (paymentLimit?.currentLimit != null) {
      setLimitAmount(String(paymentLimit.currentLimit));
    }
  }, [paymentLimit]);

  // ------------------ Transactions query ------------------
  // useCardTransactions has `enabled: !!cardId` so passing "" safely disables
  // the query when no card is selected yet.
  const { data: txData, isLoading: isLoadingCardTransactions } =
    useCardTransactions(currentCard?.id || "");

  const cardTransactions = txData?.data ?? [];

  // ------------------ Mutations ------------------
  // WHY currentCard?.id || "" for all mutations:
  // Hooks cannot be called conditionally, so we always call them.
  // Passing "" is safe because:
  //   - Every handler guards with `if (!currentCard) return` before mutateAsync
  //   - Cache invalidation on key ["cardDetails", ""] is harmless (no query uses it)
  const activateCard = useActivateCard(currentCard?.id || "");
  const disableCard = useDisableCard(currentCard?.id || "");
  const resetPinInit = useResetCardPinInit(currentCard?.id || "");
  const replaceCardInit = useReplaceCardInit(currentCard?.id || "");
  const disableSecuredInit = useDisableSecuredCardInit(currentCard?.id || "");
  const updateLimitInit = useUpdateCardLimitInit(currentCard?.id || "");

  // ------------------ Card type flags (from business rules) ------------------
  const accountType = currentCard?.accounts?.[0]?.accountType;
  const currencyNumericCode = currentCard?.accounts?.[0]?.currency?.numericCode;

  const isPrepaid = accountType === "2" || accountType === 2;
  const isCredit = accountType === "4" || accountType === 4;

  const showReload = !!currentCard && isPrepaid;
  const showInstallments = !!currentCard && isCredit;
  const isCardActive = currentCard?.cardStatus?.activation === "1";

  // WHY numericCode 788: ISO numeric code for TND (Tunisian Dinar).
  // Unsecured payment (3DS disable) is only shown for foreign currency cards.
  const showUnsecuredPayment =
    !!currentCard &&
    currencyNumericCode != null &&
    Number(currencyNumericCode) !== 788;

  // ------------------ Pretty logger ------------------
  type LogLevel = "info" | "warn" | "error" | "success";

  const safeJson = (v: any) => {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };

  const now = () => new Date().toISOString();

  const logBox = (title: string, level: LogLevel, data?: any) => {
    const icon =
      level === "info"
        ? "ℹ️"
        : level === "warn"
          ? "⚠️"
          : level === "error"
            ? "❌"
            : "✅";
    const line = "═".repeat(74);
    console.log(`\n${line}`);
    console.log(`${icon} [${level.toUpperCase()}] ${title} @ ${now()}`);
    if (data !== undefined) console.log(safeJson(data));
    console.log(`${line}\n`);
  };

  const isAxiosResponse = (v: any) =>
    v && typeof v === "object" && typeof v.status === "number" && "data" in v;

  const logMutationError = (name: string, err: any) => {
    logBox(`MUTATION ERROR -> ${name}`, "error", {
      message: err?.message,
      name: err?.name,
      code: err?.code,
      status: err?.response?.status,
      data: err?.response?.data,
    });
  };

  // Generic mutation runner with consistent logging + error handling
  async function runMutation<TRes, TArgs>(
    name: string,
    mutateAsync: (args?: any) => Promise<TRes>,
    args?: TArgs,
    ctx?: any,
  ): Promise<TRes> {
    logBox(`MUTATION START -> ${name}`, "info", { args, ctx });
    try {
      const res = await mutateAsync(args as any);
      if (isAxiosResponse(res)) {
        logBox(`MUTATION SUCCESS -> ${name}`, "success", {
          status: (res as any).status,
          data: (res as any).data,
        });
      } else {
        logBox(`MUTATION SUCCESS -> ${name}`, "success", res);
      }
      return res;
    } catch (err: any) {
      showMessageError("ERR_BAD_RESPONSE");
      logMutationError(name, err);
      throw err;
    }
  }

  // Keep global selectedCardId store in sync with carousel position
  useEffect(() => {
    setSelectedCardId(currentCard?.id ?? null);
  }, [currentCard?.id, setSelectedCardId]);

  // Smooth animated scroll handler -- runs entirely on UI thread (no bridge)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    // WHY onMomentumEnd instead of setInterval:
    // The old setInterval read scrollX.value from the JS thread every 100ms,
    // which is wasteful and may read mid-scroll (not the final snapped value).
    // onMomentumEnd fires exactly once when the scroll finishes snapping --
    // perfect timing, zero overhead, always reads the final position.
    // runOnJS is required because setState cannot be called from a worklet
    // (Reanimated worklets run on the UI thread, not the JS thread).
    onMomentumEnd: (event) => {
      const newIndex = Math.round(event.contentOffset.x / (CARD_WIDTH + 16));
      runOnJS(setCurrentCardIndex)(newIndex);
      const nextCardId = cards[newIndex]?.id;
      if (nextCardId) runOnJS(setSelectedCardId)(nextCardId);
    },
  });

  // ------------------ Helpers ------------------

  const toggleCardActivation = (cardId: string) => {
    setPendingActivationCardId(cardId);
    setShowActivationModal(true);
  };

  const toggleShowCardInfo = (cardId: string) => {
    setShowCardInfo((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${year}`;
  };

  const navigateToTransactionSummary = (
    requestId: string,
    cardActionData: Record<string, any>,
  ) => {
    logBox("NAVIGATING TO TRANSACTION SUMMARY", "info", {
      requestId,
      cardActionData,
    });
    router.navigate({
      pathname: "/(root)/transaction-summary",
      params: {
        transactionType: "cardAction",
        data: JSON.stringify({ requestId, ...cardActionData }),
      },
    });
  };

  const getActionColors = (
    enabledIcon: string,
    enabledBg: string,
    disabled: boolean,
  ) => {
    if (!disabled)
      return { iconColor: enabledIcon, backgroundColor: enabledBg };
    return {
      iconColor: BankingColors.textLight,
      backgroundColor: BankingColors.backgroundGray,
    };
  };

  // ------------------ Mutation Handlers ------------------

  const handleConfirmActivation = async () => {
    if (!currentCard) return;
    const isActive = currentCard.cardStatus.activation === "1";
    const action = isActive ? "disable" : "activate";
    const ctx = {
      cardId: currentCard.id,
      cardName: currentCard.product?.description,
      action,
      accountType,
      currencyNumericCode,
    };
    try {
      const res = isActive
        ? await runMutation(
            "disableCard",
            () => disableCard.mutateAsync(),
            undefined,
            ctx,
          )
        : await runMutation(
            "activateCard",
            () => activateCard.mutateAsync(),
            undefined,
            ctx,
          );
      logBox(
        "ACTIVATE/DISABLE completed WITHOUT transaction-summary",
        "success",
        { action, res },
      );
    } catch {
      // already logged in runMutation
    } finally {
      // WHY finally: ensures modal always closes, even if mutation throws.
      // Without this, a failed mutation leaves the modal open and the user stuck.
      setShowActivationModal(false);
      setPendingActivationCardId(null);
    }
  };

  const handleConfirmResetPin = async () => {
    if (!currentCard) return;
    const ctx = {
      cardId: currentCard.id,
      cardName: currentCard.product?.description,
    };
    try {
      const res = await runMutation(
        "resetPin",
        () => resetPinInit.mutateAsync(),
        undefined,
        ctx,
      );
      const requestId = res.data.requestId;
      if (!requestId) {
        logBox("Reset PIN: requestId missing from init response", "error", res);
        showMessageError("ERR_BAD_RESPONSE");
        return;
      }
      navigateToTransactionSummary(requestId, {
        cardId: currentCard.id,
        action: "resetPin",
        cardName: currentCard.product?.description,
      });
    } catch {
      // already logged
    } finally {
      setShowRecalculatePinModal(false);
    }
  };

  const handleConfirmModifyLimit = async () => {
    if (!currentCard || !limitAmount) return;
    const payload = { newLimit: Number(limitAmount) };
    const ctx = {
      cardId: currentCard.id,
      cardName: currentCard.product?.description,
      payload,
    };
    try {
      const res = await runMutation(
        "updateLimit",
        (args) => updateLimitInit.mutateAsync(args),
        payload,
        ctx,
      );
      const requestId = res.data.requestId;
      if (!requestId) {
        logBox(
          "Update Limit: requestId missing from init response",
          "error",
          res,
        );
        showMessageError("ERR_BAD_RESPONSE");
        return;
      }
      navigateToTransactionSummary(requestId, {
        cardId: currentCard.id,
        action: "modifyLimit",
        newLimit: limitAmount,
        cardName: currentCard.product?.description,
      });
    } catch {
      // already logged
    } finally {
      setShowModifyLimitModal(false);
    }
  };

  const handleConfirmDisableSecured = async () => {
    if (!currentCard) return;
    const payload = { endDate: activationDate };
    const ctx = {
      cardId: currentCard.id,
      cardName: currentCard.product?.description,
      payload,
      pickerDate: pickerDate?.toISOString?.(),
    };
    try {
      const res = await runMutation(
        "disableSecured",
        (args) => disableSecuredInit.mutateAsync(args),
        payload,
        ctx,
      );
      const requestId = res.data.requestId;
      if (!requestId) {
        logBox(
          "Disable Secured: requestId missing from init response",
          "error",
          res,
        );
        showMessageError("ERR_BAD_RESPONSE");
        return;
      }
      navigateToTransactionSummary(requestId, {
        cardId: currentCard.id,
        action: "disableSecured",
        endDate: activationDate,
        cardName: currentCard.product?.description,
      });
    } catch {
      // already logged
    } finally {
      setShowRulesModal(false);
    }
  };

  const handleConfirmReplaceCard = async () => {
    if (!currentCard) return;
    const ctx = {
      cardId: currentCard.id,
      cardName: currentCard.product?.description,
    };
    try {
      const res = await runMutation(
        "replaceCard",
        () => replaceCardInit.mutateAsync(),
        undefined,
        ctx,
      );
      const requestId = res.data.requestId;
      if (!requestId) {
        logBox(
          "Replace Card: requestId missing from init response",
          "error",
          res,
        );
        showMessageError("ERR_BAD_RESPONSE");
        return;
      }
      navigateToTransactionSummary(requestId, {
        cardId: currentCard.id,
        action: "replaceCard",
        cardName: currentCard.product?.description,
      });
    } catch {
      // already logged
    }
  };

  // ------------------ Rendering ------------------

  if (isLoadingCards) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="cards.myCards"
                showBackButton={false}
              />
            ),
          }}
        />
        <Animated.ScrollView style={styles.content}>
          <CardSkeleton
            count={1}
            showActions
            showUsageLimits
            showTransactions
          />
        </Animated.ScrollView>
      </View>
    );
  }

  if (isCardsError) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="cards.title"
                showBackButton={false}
              />
            ),
          }}
        />
        <ApiErrorState
          title={t("common.error")}
          description={t("cards.fetchError")}
          onRetry={() => refetchCards()}
        />
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="cards.title"
                showBackButton={false}
              />
            ),
          }}
        />
        <ScreenState
          variant="empty"
          titleKey="cards.noCards"
          descriptionKey="cards.noCardsDescription"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Cards carousel */}
        <View style={styles.cardsSection}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.cardsScrollContent}
          >
            {cards.map((card: any, index: number) => (
              <CardItem
                key={card.id + index.toString()}
                card={card}
                isInfoVisible={showCardInfo[card.id] ?? false}
                onToggleVisibility={() => toggleShowCardInfo(card.id)}
                onToggleActivation={() => toggleCardActivation(card.id)}
                index={index}
                scrollX={scrollX}
              />
            ))}
          </Animated.ScrollView>

          {/* Only show pagination dots when there is more than one card */}
          {cards.length > 1 && (
            <View style={styles.pagination}>
              {cards.map((_: any, index: number) => (
                // WHY key={index} is safe here: dots are purely positional,
                // their identity IS their index and they are never reordered.
                <PaginationDot key={index} index={index} scrollX={scrollX} />
              ))}
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionsSection}>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsScrollContent}
          >
            {/* DETAILS -- always visible */}
            {(() => {
              const c = getActionColors(
                BankingColors.primary,
                BankingColors.actionRed,
                false,
              );
              return (
                <CardActionButton
                  icon={Info}
                  iconColor={c.iconColor}
                  backgroundColor={c.backgroundColor}
                  labelKey="cards.cardDetails"
                  onPress={() => setShowDetailModal(true)}
                />
              );
            })()}

            {/* RECALCULATE PIN -- disabled if inactive or within 1 week of last reset */}
            {(() => {
              const blockedByWeek = !canRecalculatePin(currentCard?.id);
              const disabled = isUpdatingCard || !isCardActive || blockedByWeek;
              const c = getActionColors(
                BankingColors.accentBlue,
                BankingColors.actionBlue,
                disabled,
              );
              return (
                <CardActionButton
                  icon={RefreshCw}
                  iconColor={c.iconColor}
                  backgroundColor={c.backgroundColor}
                  labelKey="cards.recalculatePin"
                  onPress={() => {
                    if (blockedByWeek) {
                      const remaining = getRemainingMs(currentCard?.id);
                      showMessageInfo(
                        "cards.recalculatePinBlocked.title",
                        "cards.recalculatePinBlocked.desc",
                      );
                      logBox("Recalculate PIN blocked by 1 week rule", "warn", {
                        cardId: currentCard?.id,
                        remainingMs: remaining,
                        remaining: formatRemaining(remaining),
                      });
                      return;
                    }
                    setShowRecalculatePinModal(true);
                  }}
                  disabled={disabled}
                />
              );
            })()}

            {/* UNSECURE PAYMENT -- only for non-TND cards */}
            {showUnsecuredPayment &&
              (() => {
                const disabled = isUpdatingCard || !isCardActive;
                const c = getActionColors(
                  BankingColors.accentAmber,
                  BankingColors.actionOrange,
                  disabled,
                );
                return (
                  <CardActionButton
                    icon={Wallet}
                    iconColor={c.iconColor}
                    backgroundColor={c.backgroundColor}
                    labelKey="cards.unsecurePayment"
                    onPress={() => setShowUnsecurePaymentModal(true)}
                    disabled={disabled}
                  />
                );
              })()}

            {/* RELOAD -- only for prepaid cards */}
            {isPrepaid &&
              (() => {
                const disabled = isUpdatingCard || !isCardActive;
                const c = getActionColors(
                  BankingColors.accentGreen,
                  BankingColors.actionGreen,
                  disabled,
                );
                return (
                  <CardActionButton
                    icon={DollarSign}
                    iconColor={c.iconColor}
                    backgroundColor={c.backgroundColor}
                    labelKey="cards.reloadCard"
                    onPress={() =>
                      router.navigate({
                        pathname: "/(root)/(tabs)/(cartes)/reload-card",
                        params: { cardId: currentCard?.id ?? "" },
                      })
                    }
                    disabled={disabled}
                  />
                );
              })()}

            {/* MODIFY LIMIT -- not for prepaid, not for credit, not for restricted codes */}
            {currentCard &&
              !isPrepaid &&
              !showInstallments &&
              isLimitModificationAllowed(currentCard) &&
              (() => {
                const disabled = isUpdatingCard || !isCardActive;
                const c = getActionColors(
                  BankingColors.accentPurple,
                  BankingColors.actionPurple,
                  disabled,
                );
                return (
                  <CardActionButton
                    icon={Edit3}
                    iconColor={c.iconColor}
                    backgroundColor={c.backgroundColor}
                    labelKey="cards.modifyLimit"
                    onPress={() => setShowModifyLimitModal(true)}
                    disabled={disabled}
                  />
                );
              })()}

            {/* INSTALLMENTS -- only for credit cards */}
            {showInstallments && currentCard && (
              <CardActionButton
                icon={ReceiptText}
                iconColor={BankingColors.installments}
                backgroundColor={BankingColors.errorLightRed}
                labelKey="cards.installments"
                onPress={() =>
                  router.navigate(
                    `/(root)/(tabs)/(cartes)/installments?cardId=${currentCard.id}`,
                  )
                }
              />
            )}

            {/* CARD HISTORY */}
            <CardActionButton
              icon={History}
              iconColor={BankingColors.textSecondary}
              backgroundColor={BankingColors.borderMedium}
              labelKey="cards.history"
              onPress={() =>
                router.push({
                  pathname: "/carte-history",
                  params: { cardId: currentCard?.id ?? "" },
                })
              }
              disabled={!currentCard?.id}
            />
          </Animated.ScrollView>
        </View>

        {/* Usage limits */}
        {currentCard && (
          <View style={styles.usageLimitsSection}>
            <CardUsageLimits card={currentCard} />
          </View>
        )}

        {/* Recent transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <TText
              style={styles.sectionTitle}
              tKey="cards.recentTransactions"
            />
            {/* WHY the condition: hide "View All" when loading or when there are
                no transactions — there is nothing to navigate to in that case. */}
            {!isLoadingCardTransactions && cardTransactions.length > 0 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() =>
                  router.navigate({
                    pathname: "/(root)/(tabs)/(cartes)/card-transactions",
                    params: { cardIndex: currentCardIndex },
                  })
                }
              >
                <TText style={styles.viewMoreText} tKey="common.viewAll" />
              </TouchableOpacity>
            )}
          </View>

          {isLoadingCardTransactions ? (
            <TransactionSkeleton count={3} />
          ) : cardTransactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <View style={styles.emptyTransactionsIconWrap}>
                <CreditCard
                  size={22}
                  color={BankingColors.primary}
                  strokeWidth={1.5}
                />
              </View>
              <TText
                style={styles.emptyTransactionsTitle}
                tKey="cards.noRecentTransactions"
              />
              <TText
                style={styles.emptyTransactionsText}
                tKey="cards.noRecentTransactionsDesc"
              />
            </View>
          ) : (
            cardTransactions.slice(0, 3).map((ct: any) => {
              const transaction = {
                id: ct.transactionRef,
                accountId:
                  currentCard?.accounts?.[currentCardIndex]?.accountNumber ??
                  "",
                type: "debit",
                amount: ct.amount * -1,
                currency: ct.currency.alphaCode,
                description: ct.label,
                category: ct.shortLabel,
                date: ct.datetime,
                ledgerDate: ct.datetime,
                valueDate: ct.datetime,
                // WHY both "1" and "0" map to "completed":
                // Backend returns "1" for approved, "0" for settled --
                // both are final successful states from the user's perspective.
                status:
                  ct.status.code === "1" || ct.status.code === "0"
                    ? "completed"
                    : "failed",
                recipient: ct.label,
              };
              return (
                <TransactionItem
                  key={transaction.id}
                  // @ts-ignore
                  transaction={transaction}
                  onPress={() =>
                    router.navigate({
                      pathname: "/transaction-details",
                      params: {
                        id: transaction.id,
                        type: transaction.type,
                        amount: transaction.amount.toString(),
                        currency: transaction.currency,
                        description: transaction.description,
                        category: transaction.category,
                        date: transaction.date,
                        status: transaction.status,
                        recipient: transaction.recipient || "",
                        reference: "",
                        accountId: transaction.accountId,
                      },
                    })
                  }
                />
              );
            })
          )}
        </View>

        <View style={{ height: Spacing.huge }} />
      </Animated.ScrollView>

      {/* ── Modals ── */}

      <CardDetailModal
        visible={showDetailModal}
        currentCard={currentCard}
        formatExpiryDate={formatExpiryDate}
        onClose={() => setShowDetailModal(false)}
        styles={styles}
      />

      <RecalculatePinModal
        visible={showRecalculatePinModal}
        isUpdatingCard={resetPinInit.isPending}
        onCancel={() => setShowRecalculatePinModal(false)}
        onConfirm={handleConfirmResetPin}
        styles={styles}
      />

      <UnsecurePaymentModal
        visible={showUnsecurePaymentModal}
        onCancel={() => setShowUnsecurePaymentModal(false)}
        onConfirm={() => {
          setShowUnsecurePaymentModal(false);
          setShowRulesModal(true);
        }}
        styles={styles}
      />

      <RulesModal
        visible={showRulesModal}
        activationDate={activationDate}
        pickerDate={pickerDate}
        onChangePickerDate={setPickerDate}
        onChangeDate={setActivationDate}
        onCancel={() => setShowRulesModal(false)}
        onConfirm={handleConfirmDisableSecured}
        isUpdatingCard={disableSecuredInit.isPending}
        styles={styles}
      />

      <ModifyLimitModal
        visible={showModifyLimitModal}
        value={limitAmount}
        onChange={setLimitAmount}
        onCancel={() => setShowModifyLimitModal(false)}
        onConfirm={handleConfirmModifyLimit}
        isUpdatingCard={updateLimitInit.isPending}
        maxLimit={currentCard!.maxLimitProduct}
        minLimit={0}
        card={currentCard}
      />

      <ActivationModal
        visible={showActivationModal}
        card={cards.find((c: any) => c.id === pendingActivationCardId)}
        onCancel={() => {
          setShowActivationModal(false);
          setPendingActivationCardId(null);
        }}
        onConfirm={handleConfirmActivation}
        isUpdatingCard={activateCard.isPending || disableCard.isPending}
        styles={styles}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  content: {
    flex: 1,
  },
  activationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  activationText: {
    fontSize: FontSize.xs,
    color: BankingColors.white,
    fontFamily: FontFamily.semibold,
  },
  activationSwitch: {
    transform: [{ scaleX: 1 }, { scaleY: 1 }],
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BankingColors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.md,
  },
  emptyDescription: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  cardsSection: {
    paddingVertical: Spacing.xxl,
  },
  cardsScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  cardGradientLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#4F4236",
    opacity: 0.6,
  },
  cardRadialLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "50%",
    height: "50%",
    backgroundColor: "#4B4E4B",
    opacity: 0.3,
    borderBottomLeftRadius: 300,
  },
  cardPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  cardPatternCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -50,
    right: -50,
  },
  cardPatternCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    bottom: -40,
    left: -30,
  },
  signatureBackground: {
    position: "absolute",
    width: 120,
    height: 80,
    bottom: 20,
    right: 10,
    opacity: 0.15,
    overflow: "visible",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  cardBankInfo: {
    flex: 1,
  },
  bankNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bankLogo: {
    width: 24,
    height: 24,
  },
  cardBankName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardHeaderActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  visibilityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.successLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BankingColors.success,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
  cardName: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: BankingColors.white,
    opacity: 0.8,
    marginBottom: Spacing.md,
  },
  cardNumber: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
    letterSpacing: 3,
    marginBottom: Spacing.xs,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  cardFooterItem: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: BankingColors.white,
    opacity: 0.7,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
  cardActivationFooter: {
    marginTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  activationContainerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    gap: 6,
  },
  activationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activationStatusText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  paginationDot: {
    height: Spacing.md,
    minWidth: Spacing.md,
    borderRadius: Spacing.sm,
  },

  actionsSection: {
    marginBottom: Spacing.xxl,
  },
  actionsScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  actionButton: {
    alignItems: "center",
    minWidth: 70,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.xs,
    color: BankingColors.text,
    textAlign: "center",
    lineHeight: 14,
  },
  usageLimitsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },

  usageCard: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadow.card,
  },
  usageHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  usageTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  usageAmount: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: BankingColors.borderGray,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.xs,
  },
  usageItemsContainer: {
    gap: Spacing.sm,
  },
  usageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  usageItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  usageIcon: {
    width: 33,
    height: 33,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  usageItemText: {
    fontSize: FontSize.xs,
    color: BankingColors.text,
    lineHeight: 16,
    fontFamily: FontFamily.medium,
  },
  usageItemAmount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  transactionsSection: {
    paddingHorizontal: Spacing.xs,
  },
  transactionsHeader: {
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    flexShrink: 1,
  },
  viewMoreText: {
    fontSize: FontSize.sm,
    color: BankingColors.primary,
    fontFamily: FontFamily.bold,
    flexShrink: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: BankingColors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  detailModalContent: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 400,
  },
  detailModalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.borderPale,
  },
  detailLabel: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
  },
  detailValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "right",
  },
  detailNote: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  okButton: {
    backgroundColor: BankingColors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  okButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
  confirmModalContent: {
    backgroundColor: BankingColors.white,
    borderRadius: 20,
    width: "100%",
    maxWidth: 520, // ✅ bigger on tablets
    paddingVertical: 20,
    paddingHorizontal: 18,

    // ✅ make it taller but responsive
    maxHeight: "85%",
  },

  confirmModalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },

  modifyCardInfoBox: {
    backgroundColor: BankingColors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: BankingColors.borderPale,
    marginBottom: Spacing.lg,
  },

  modifyCardProduct: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "center",
  },

  modifyCardHolder: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },

  // ✅ Make slider area cleaner
  sliderContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: 4,
  },

  sliderMetaText: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
  },

  modalButtonsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
  rulesContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  rulesHeader: {
    backgroundColor: BankingColors.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rulesHeaderTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF",
  },
  rulesContent: {
    flex: 1,
    padding: 20,
  },
  rulesText: {
    fontSize: 13,
    color: BankingColors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  rulesSectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  rulesAcceptText: {
    fontSize: 13,
    color: BankingColors.text,
    lineHeight: 20,
    marginTop: 24,
    marginBottom: 16,
    fontFamily: FontFamily.semibold,
  },
  dateInputContainer: {
    marginBottom: 24,
  },
  dateInputLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 8,
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: BankingColors.text,
  },
  rulesFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  rulesCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center",
  },
  rulesCancelButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  rulesActivateButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: BankingColors.primary,
    alignItems: "center",
  },
  rulesActivateButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF",
  },
  limitModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  limitModalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    marginBottom: 24,
    textAlign: "center",
  },
  limitInputContainer: {
    marginBottom: 16,
  },
  limitInputLabel: {
    fontSize: 14,
    color: BankingColors.text,
    marginBottom: 12,
  },
  limitInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  limitInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  limitCurrency: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
  },
  limitInputError: { borderColor: "red" },
  limitHintText: { marginTop: 6, opacity: 0.7 },
  limitErrorText: { marginTop: 6, color: "red" },
  sliderMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  sliderTrack: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    top: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    marginLeft: -10,
  },
  emptyTransactions: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  emptyTransactionsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BankingColors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTransactionsTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "center",
  },
  emptyTransactionsText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sliderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderBtnDisabled: {
    opacity: 0.5,
  },
  dateHint: {
    marginTop: 8,
    fontSize: 12,
    color: BankingColors.textSecondary,
    opacity: 0.8,
  },
});
