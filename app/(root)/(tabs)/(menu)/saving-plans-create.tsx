// app/(root)/(tabs)/(menu)/saving-plans-create.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Text,
} from "react-native";
import TText from "@/components/TText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  Banknote,
  ChevronDown,
  Sparkles,
  Calendar,
  Check,
  CreditCard,
  X,
  Search,
} from "lucide-react-native";

import { BankingColors, Spacing, FontSize, FontFamily } from "@/constants";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { useCards } from "@/hooks/use-card";
import {
  useSavingPlans,
  useSavingPlansGlobalInit,
} from "@/hooks/use-saving-plans";
import { SavingsType, CreateSavingPlanRequest } from "@/types/saving-plan.type";
import useShowMessage from "@/hooks/useShowMessage";

import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";

import { t } from "i18next";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import EndDatePickerModal from "@/components/home/SendMoneyRefactor/modals/EndDatePickerModal";
import { formatBalance } from "@/utils/account-formatters";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

/* =========================================================
 * Types (for bottom-sheet list items)
 * ========================================================= */
interface SourceItem {
  id: string;
  label: string;
  subtitle: string;
  type: "card";
}

interface SavingsAccountItem {
  id: string;
  label: string;
  subtitle: string;
  balance: string;
}

/* =========================================================
 * Helpers for DD/MM/YYYY (backend expects it)
 * ========================================================= */
const parseDdMmYyyy = (ddmmyyyy: string): Date | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy ?? "");
  if (!m) return null;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  const d = new Date(yyyy, mm - 1, dd);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDdMmYyyy = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/* =========================================================
 * ✅ Input rules & business validation
 * ========================================================= */
const MAX_SAVINGS_VALUE = 1_000_000;

// Business rules for "Montant / Pourcentage par opération"
const MIN_FIXED_AMOUNT = 3; // integer only
const MAX_FIXED_AMOUNT = 30; // integer only
const MIN_PERCENT = 2;
const MAX_PERCENT = 20;

/**
 * ✅ NEW RULE:
 * - NO DOTS, NO COMMAS, ONLY DIGITS (integer only)
 */
const normalizeIntegerInput = (raw: string) => {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\d]/g, "");
};

const isValidPositiveInt = (raw: string) => {
  const s = normalizeIntegerInput(raw);
  if (!s) return false;
  if (!/^\d+$/.test(s)) return false;
  const n = Number(s);
  return Number.isFinite(n) && n > 0;
};

const parseIntSafe = (raw: string) => Number(normalizeIntegerInput(raw));

/* =========================================================
 * Date helpers
 * ========================================================= */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addMonthsSafe = (d: Date, months: number) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setMonth(copy.getMonth() + months);
  return copy;
};

/* =========================================================
 * Normalizers (CPRO + account numbers)
 * ========================================================= */
const normalizeCpro = (code: any) =>
  String(code ?? "")
    .trim()
    .padStart(3, "0");

/**
 * General normalize for matching IBAN/RIB/account numbers
 * (remove spaces/dashes and uppercase)
 */
const normalize = (v: any) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .toUpperCase();

const normalizeAccNumber = (n: any) => normalize(n);

/**
 * Cards payload can be:
 *  - card.accounts: []
 *  - or card.accounts_len + card.accounts0/accounts1/... (from your logs)
 */
const getCardAccountNumbers = (card: any): string[] => {
  if (Array.isArray(card?.accounts)) {
    return card.accounts
      .map((a: any) => normalizeAccNumber(a?.accountNumber))
      .filter(Boolean);
  }

  const len = Number(card?.accounts_len ?? 0);
  if (len > 0) {
    const out: string[] = [];
    for (let i = 0; i < len; i++) {
      const acc = card?.[`accounts${i}`];
      const n = normalizeAccNumber(acc?.accountNumber);
      if (n) out.push(n);
    }
    return out;
  }

  const keys = Object.keys(card ?? {}).filter((k) => /^accounts\d+$/.test(k));
  if (keys.length) {
    return keys
      .map((k) => normalizeAccNumber(card?.[k]?.accountNumber))
      .filter(Boolean);
  }

  return [];
};

export default function SavingPlansCreateScreen() {
  const insets = useSafeAreaInsets();
  const { showMessageError } = useShowMessage();

  const { planId, mode } = useLocalSearchParams<{
    planId?: string;
    mode?: "create" | "edit";
  }>();

  const isEditing = mode === "edit" && !!planId;

  /* =========================================================
   * Source selection (CARD ONLY)
   * ========================================================= */
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>(""); // kept, not used

  /* =========================================================
   * Savings account selection (filtered by CPRO)
   * ========================================================= */
  const [selectedSavingsAccountId, setSelectedSavingsAccountId] =
    useState<string>("");

  /* =========================================================
   * Form fields
   * ========================================================= */
  const [savingsType, setSavingsType] = useState<SavingsType>("MNT");
  const [savingsValue, setSavingsValue] = useState<string>("");
  const [savingsMensualValue, setSavingsMensualValue] = useState<string>("");

  /* =========================================================
   * End date state
   * ========================================================= */
  const [endDate, setEndDate] = useState<Date>(() =>
    addMonthsSafe(new Date(), 3),
  );
  const [tempPickerDate, setTempPickerDate] = useState<Date>(endDate);
  const [showEndPicker, setShowEndPicker] = useState(false);

  /* =========================================================
   * Bottom sheet state
   * ========================================================= */
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [savingsSearchQuery, setSavingsSearchQuery] = useState("");

  const sourceSheetRef = useRef<BottomSheetModal>(null);
  const savingsSheetRef = useRef<BottomSheetModal>(null);

  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);

  /* =========================================================
   * Data hooks
   * ========================================================= */
  const { data: accountsData, isLoading: accountsLoading } =
    useCustomerAccounts();
  const { data: cardsData, isLoading: cardsLoading } = useCards();
  const { data: savingPlansData, isLoading: plansLoading } = useSavingPlans();

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const accounts = useMemo(
    () => accountsData?.data ?? [],
    [accountsData?.data],
  );
  const cards = useMemo(() => cardsData?.data ?? [], [cardsData?.data]);
  const savingPlans = useMemo(
    () => savingPlansData?.data ?? [],
    [savingPlansData?.data],
  );

  /* =========================================================
   * ✅ Savings accounts restriction by CPRO (096, 069)
   * ========================================================= */
  const ALLOWED_SAVINGS_CPRO = useMemo(() => new Set(["096", "069"]), []);
  const savingsAccounts = useMemo(() => {
    return accounts.filter((acc: any) => {
      const code = normalizeCpro(acc?.accountType?.code);
      return ALLOWED_SAVINGS_CPRO.has(code);
    });
  }, [accounts, ALLOWED_SAVINGS_CPRO]);

  /* =========================================================
   * ✅ Cards restriction by linked account product code (001,027,028)
   *
   * Correct rule (your latest):
   * - Find the account linked to the card by checking if
   *   account.accountRib OR account.ibanFormatAccount OR account.ribFormatAccount
   *   contains the cardAccountNumber (after normalization)
   * - Then check that matched account's accountType.code in {001,027,028}
   * - If no match OR code not allowed => card excluded
   * ========================================================= */
  const ALLOWED_CARD_CPRO = useMemo(() => new Set(["001", "027", "028"]), []);

  const accountsIndexForCards = useMemo(() => {
    return accounts.map((acc: any) => {
      const code = normalizeCpro(acc?.accountType?.code);

      const rib = normalize(acc?.accountRib);
      const ibanFmt = normalize(acc?.ibanFormatAccount);
      const ribFmt = normalize(acc?.ribFormatAccount);

      return {
        id: acc?.id,
        productCode: code,
        haystacks: [rib, ibanFmt, ribFmt].filter(Boolean),
      };
    });
  }, [accounts]);

  const isCardEligible = useCallback(
    (card: any) => {
      const cardAccNums = getCardAccountNumbers(card);

      if (cardAccNums.length === 0) {
        return false;
      }

      // Eligible if any cardAcc is contained in any account's haystack
      // AND the matched account has allowed productCode
      for (const cardAcc of cardAccNums) {
        const matchAcc = accountsIndexForCards.find((acc) =>
          acc.haystacks.some((hs: string) => hs.includes(cardAcc)),
        );
        if (
          matchAcc?.productCode &&
          ALLOWED_CARD_CPRO.has(matchAcc.productCode)
        ) {
          return true;
        }
      }
      return false;
    },
    [accountsIndexForCards, ALLOWED_CARD_CPRO],
  );

  const allowedCards = useMemo(() => {
    const result = cards.filter((card: any) => isCardEligible(card));

    console.log("[CardFilter] Summary:", {
      totalCards: cards.length,
      allowedCards: result.length,
      allowedCodes: Array.from(ALLOWED_CARD_CPRO),
    });

    return result;
  }, [cards, isCardEligible, ALLOWED_CARD_CPRO]);

  /* =========================================================
   * Debug samples (help you verify payload structure)
   * ========================================================= */
  useEffect(() => {
    console.log("[CardsDebug] accounts size:", accounts.length);
    console.log("[CardsDebug] cards size:", cards.length);

    console.log(
      "[CardsDebug] sample account:",
      accounts[0]
        ? {
            id: accounts[0].id,
            accountNumber: accounts[0].accountNumber,
            accountType: accounts[0].accountType,
            accountRib: accounts[0].accountRib,
            ibanFormatAccount: accounts[0].ibanFormatAccount,
            ribFormatAccount: accounts[0].ribFormatAccount,
          }
        : null,
    );

    console.log(
      "[CardsDebug] sample card:",
      cards[0]
        ? {
            id: cards[0].id,
            pcipan: cards[0].pcipan,
            product: cards[0].product,
            // accounts_len:
            //   typeof cards[0].accounts_len !== "undefined"
            //     ? cards[0].accounts_len
            //     : Array.isArray(cards[0].accounts)
            //       ? cards[0].accounts.length
            //       : null,
            accounts0: Array.isArray(cards[0].accounts)
              ? cards[0].accounts[0]
              : ((cards[0] as any).accounts0 ?? null),
          }
        : null,
    );

    const eligible = cards.filter((c: any) => isCardEligible(c));
    console.log(
      "[CardsDebug] eligible cards:",
      eligible.map((c: any) => c?.id),
    );
  }, [accounts, cards, isCardEligible]);

  /* =========================================================
   * Date picker limits
   * ========================================================= */
  const minEndDate = useMemo(() => addMonthsSafe(startOfToday(), 3), []);

  /* =========================================================
   * Editing mode: find plan
   * ========================================================= */
  const editingPlan = useMemo(() => {
    if (!isEditing) return null;
    return (
      savingPlans.find(
        (p: any) => String(p?.savingsPlanId ?? "") === String(planId),
      ) ?? null
    );
  }, [isEditing, planId, savingPlans]);

  /* =========================================================
   * INIT mutation
   * ========================================================= */
  const initMutation = useSavingPlansGlobalInit(
    isEditing ? "UPDATING" : "CREATING",
    isEditing ? String(planId) : undefined,
  );

  /* =========================================================
   * Hydrate form when editing
   * ========================================================= */
  useEffect(() => {
    if (!editingPlan) return;

    // If plan has cardId: keep it (even if it becomes not eligible now, UI will show "no eligible cards" list)
    if (editingPlan.cardId) {
      setSelectedCardId(editingPlan.cardId);
      setSelectedAccountId("");
    } else if (editingPlan.accountId) {
      // Legacy: if plan saved with accountId, try to find a linked card
      const acc = accounts.find((a: any) => a.id === editingPlan.accountId);

      const accHaystacks = [
        normalize(acc?.accountRib),
        normalize(acc?.ibanFormatAccount),
        normalize(acc?.ribFormatAccount),
      ].filter(Boolean);

      const linkedCard = cards.find((c: any) => {
        const cardAccNums = getCardAccountNumbers(c);
        return cardAccNums.some((cardAcc) =>
          accHaystacks.some((hs) => hs.includes(cardAcc)),
        );
      });

      setSelectedCardId(linkedCard?.id ?? "");
      setSelectedAccountId("");
    } else {
      setSelectedCardId("");
      setSelectedAccountId("");
    }

    setSelectedSavingsAccountId(editingPlan.savingsAccountId || "");

    const backendType = (editingPlan.savingsType as SavingsType) || "MNT";
    setSavingsType(backendType);

    const v =
      backendType === "PRC"
        ? Number(editingPlan.savingsPercentage ?? null)
        : Number(editingPlan.savingsAmount ?? null);
    setSavingsValue(String(Math.trunc(Number.isFinite(v) ? v : 0)));

    const max = Number(editingPlan.maxSavingsAmount ?? 0);
    setSavingsMensualValue(String(Math.trunc(Number.isFinite(max) ? max : 0)));

    const d = parseDdMmYyyy(editingPlan.dueDate);
    if (d) {
      const min = addMonthsSafe(startOfToday(), 3);
      const chosen = new Date(d);
      chosen.setHours(0, 0, 0, 0);

      const safe = chosen < min ? min : new Date(chosen.getTime());
      setEndDate(safe);
      setTempPickerDate(safe);
    }
  }, [editingPlan, accounts, cards]);

  /* =========================================================
   * Bottom sheet open/close sync
   * ========================================================= */
  useEffect(() => {
    if (sourceModalVisible) sourceSheetRef.current?.present();
    else sourceSheetRef.current?.dismiss();
  }, [sourceModalVisible]);

  useEffect(() => {
    if (savingsModalVisible) savingsSheetRef.current?.present();
    else savingsSheetRef.current?.dismiss();
  }, [savingsModalVisible]);

  /* =========================================================
   * Display helpers
   * ========================================================= */
  const getSelectedSourceLabel = useCallback(() => {
    if (selectedCardId) {
      const card = cards.find((c: any) => c.id === selectedCardId);
      const last4 = String(card?.pcipan ?? "").slice(-4);
      return card && last4 ? `**** **** **** ${last4}` : null;
    }
    return null;
  }, [selectedCardId, cards]);

  const getSelectedSourceSubtitle = useCallback(() => {
    if (selectedCardId) {
      const card = cards.find((c: any) => c.id === selectedCardId);
      return card?.product?.description || "Carte";
    }
    return null;
  }, [selectedCardId, cards]);

  const getSelectedSavingsLabel = useCallback(() => {
    const acc = savingsAccounts.find(
      (a: any) => a.id === selectedSavingsAccountId,
    );
    return acc ? `${acc.accountLabel || acc.accountTitle}` : null;
  }, [selectedSavingsAccountId, savingsAccounts]);

  const getSelectedSavingsSubtitle = useCallback(() => {
    const acc = savingsAccounts.find(
      (a: any) => a.id === selectedSavingsAccountId,
    );
    return acc ? formatBalance(acc.availableBalance || "0", "TND") : null;
  }, [selectedSavingsAccountId, savingsAccounts]);

  /* =========================================================
   * Recap fields used in payload + summary screen
   * ========================================================= */
  const selectedCard = useMemo(
    () => cards.find((c: any) => c.id === selectedCardId) ?? null,
    [cards, selectedCardId],
  );

  const selectedSavingsAccount = useMemo(
    () =>
      savingsAccounts.find((a: any) => a.id === selectedSavingsAccountId) ??
      null,
    [savingsAccounts, selectedSavingsAccountId],
  );

  const sourceCardLabel = useMemo(
    () => selectedCard?.product?.description || "Carte",
    [selectedCard],
  );

  const sourceCardNumber = useMemo(() => {
    const last4 = String(selectedCard?.pcipan ?? "").slice(-4);
    return last4 ? `**** **** **** ${last4}` : "";
  }, [selectedCard]);

  const savingsAccountLabel = useMemo(() => {
    return (
      selectedSavingsAccount?.accountLabel ||
      selectedSavingsAccount?.accountTitle ||
      "Compte épargne"
    );
  }, [selectedSavingsAccount]);

  const savingsAccountRib = useMemo(
    () => selectedSavingsAccount?.accountRib || "",
    [selectedSavingsAccount],
  );

  const savingsAccountRibPretty = useMemo(
    () => String(savingsAccountRib ?? "").trim(),
    [savingsAccountRib],
  );

  /* =========================================================
   * Date picker integration
   * ========================================================= */
  const openEndPicker = useCallback(() => {
    const min = addMonthsSafe(startOfToday(), 3);
    const base = new Date(endDate);
    base.setHours(0, 0, 0, 0);
    let safe = base;
    if (safe < min) safe = min;

    setTempPickerDate(safe);
    setShowEndPicker(true);
  }, [endDate]);

  const closeEndPicker = useCallback(() => {
    setShowEndPicker(false);
  }, []);

  const onChangePicker = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (event?.type === "dismissed" || !selected) return;

      const min = addMonthsSafe(startOfToday(), 3);
      const chosen = new Date(selected);
      chosen.setHours(0, 0, 0, 0);

      if (chosen < min) {
        showMessageError("common.error", "savingPlans.errorInvalidDate");
        return;
      }

      setTempPickerDate(selected);
      setEndDate(selected);
    },
    [showMessageError],
  );

  /* =========================================================
   * Derived numbers
   * ========================================================= */
  const savingsValueNumber = useMemo(() => {
    if (!savingsValue) return NaN;
    return parseIntSafe(savingsValue);
  }, [savingsValue]);

  const mensualValueNumber = useMemo(() => {
    if (!savingsMensualValue) return NaN;
    return parseIntSafe(savingsMensualValue);
  }, [savingsMensualValue]);

  /* =========================================================
   * Range validation per type
   * ========================================================= */
  const savingsValueRangeError = useMemo((): string | null => {
    if (!savingsValue) return null;
    if (!Number.isFinite(savingsValueNumber))
      return t("savingPlans.errorInvalidValue");

    if (savingsType === "PRC") {
      if (!isValidPositiveInt(savingsValue))
        return t("savingPlans.errorPercentageRange", {
          min: MIN_PERCENT,
          max: MAX_PERCENT,
        });
      if (savingsValueNumber > 100)
        return t("savingPlans.errorInvalidPercentage");

      if (
        savingsValueNumber < MIN_PERCENT ||
        savingsValueNumber > MAX_PERCENT
      ) {
        return t("savingPlans.errorPercentageRange", {
          min: MIN_PERCENT,
          max: MAX_PERCENT,
        });
      }
      return null;
    }

    if (!isValidPositiveInt(savingsValue))
      return t("savingPlans.errorAmountRange", {
        min: String(MIN_FIXED_AMOUNT),
        max: String(MAX_FIXED_AMOUNT),
      });

    if (
      savingsValueNumber < MIN_FIXED_AMOUNT ||
      savingsValueNumber > MAX_FIXED_AMOUNT
    ) {
      return t("savingPlans.errorAmountRange", {
        min: String(MIN_FIXED_AMOUNT),
        max: String(MAX_FIXED_AMOUNT),
      });
    }

    return null;
  }, [savingsType, savingsValue, savingsValueNumber]);

  /* =========================================================
   * Hard cap validations
   * ========================================================= */
  const isSavingsValueWithinMaxCap = useMemo(() => {
    if (!savingsValue) return false;
    const n = parseIntSafe(savingsValue);
    return Number.isFinite(n) && n > 0 && n <= MAX_SAVINGS_VALUE;
  }, [savingsValue]);

  const isMensualValueWithinMaxCap = useMemo(() => {
    if (!savingsMensualValue) return false;
    const n = parseIntSafe(savingsMensualValue);
    return Number.isFinite(n) && n > 0 && n <= MAX_SAVINGS_VALUE;
  }, [savingsMensualValue]);

  /* =========================================================
   * Rule: monthly limit >= amount per operation (only MNT)
   * ========================================================= */
  const isPlafondGteAmount = useMemo(() => {
    if (!savingsMensualValue || !savingsValue) return false;

    const max = parseIntSafe(savingsMensualValue);
    if (!Number.isFinite(max) || max <= 0) return false;

    if (savingsType === "MNT") {
      const sv = parseIntSafe(savingsValue);
      if (!Number.isFinite(sv) || sv <= 0) return false;
      return max >= sv;
    }

    return true;
  }, [savingsMensualValue, savingsValue, savingsType]);

  /* =========================================================
   * Form-ready state
   * ========================================================= */
  const isEndDateValid = useMemo(() => {
    const min = addMonthsSafe(startOfToday(), 3);
    const chosen = new Date(endDate);
    chosen.setHours(0, 0, 0, 0);
    return chosen >= min;
  }, [endDate]);

  const isSavingsValueValid = useMemo(() => {
    if (!savingsValue) return false;
    if (!isSavingsValueWithinMaxCap) return false;
    return savingsValueRangeError === null;
  }, [savingsValue, isSavingsValueWithinMaxCap, savingsValueRangeError]);

  const isMensualValueValid = useMemo(() => {
    if (!savingsMensualValue) return false;
    if (!isMensualValueWithinMaxCap) return false;
    return isValidPositiveInt(savingsMensualValue);
  }, [savingsMensualValue, isMensualValueWithinMaxCap]);

  const isFormReady = useMemo(() => {
    return (
      !!selectedCardId &&
      !!selectedSavingsAccountId &&
      isSavingsValueValid &&
      isMensualValueValid &&
      isPlafondGteAmount &&
      isEndDateValid
    );
  }, [
    selectedCardId,
    selectedSavingsAccountId,
    isSavingsValueValid,
    isMensualValueValid,
    isPlafondGteAmount,
    isEndDateValid,
  ]);

  /* =========================================================
   * Validation (submit)
   * ========================================================= */
  const validateInputs = useCallback(() => {
    if (!selectedCardId) {
      showMessageError("common.error", "savingPlans.errorSelectSource");
      return false;
    }
    if (!selectedSavingsAccountId) {
      showMessageError("common.error", "savingPlans.errorSelectSavings");
      return false;
    }
    if (!isSavingsValueWithinMaxCap || savingsValueRangeError) {
      showMessageError("common.error", "savingPlans.errorInvalidValue");
      return false;
    }
    if (
      !isMensualValueWithinMaxCap ||
      !isValidPositiveInt(savingsMensualValue)
    ) {
      showMessageError("common.error", "savingPlans.errorInvalidLimit");
      return false;
    }
    if (!isPlafondGteAmount) {
      showMessageError("common.error", "savingPlans.errorInvalidLimit");
      return false;
    }

    const min = addMonthsSafe(startOfToday(), 3);
    const chosen = new Date(endDate);
    chosen.setHours(0, 0, 0, 0);

    if (chosen < min) {
      showMessageError("common.error", "savingPlans.errorInvalidDate");
      return false;
    }

    return true;
  }, [
    selectedCardId,
    selectedSavingsAccountId,
    savingsValueRangeError,
    isSavingsValueWithinMaxCap,
    isMensualValueWithinMaxCap,
    savingsMensualValue,
    isPlafondGteAmount,
    endDate,
    showMessageError,
  ]);

  /* =========================================================
   * Submit
   * ========================================================= */
  const handleSubmit = useCallback(async () => {
    if (!validateInputs()) return;

    const sv = parseIntSafe(savingsValue);
    const mensual = parseIntSafe(savingsMensualValue);

    const payload: CreateSavingPlanRequest = {
      savingsAccountId: selectedSavingsAccountId,
      accountId: undefined,
      cardId: selectedCardId,

      sourceCardLabel,
      sourceCardNumber,
      savingsAccountLabel,
      savingsAccountRib,

      dueDate: formatDdMmYyyy(endDate),
      subscriptionDate: formatDdMmYyyy(new Date()),

      savingsType,
      savingsAmount: savingsType === "MNT" ? sv : null,
      savingsPercentage: savingsType === "PRC" ? sv : null,

      maxSavingsAmount: mensual,
    } as any;

    try {
      const res: any = await initMutation.mutateAsync(payload);

      const requestId = res?.requestId;
      if (!requestId) {
        showMessageError("common.error", "savingPlans.errorGeneric");
        return;
      }

      router.push({
        pathname: "/(root)/transaction-summary",
        params: {
          transactionType: "savingPlans",
          data: JSON.stringify({
            requestId,
            subscriptionNumber: isEditing
              ? String(planId)
              : (res?.savingsPlanId ?? ""),
            cardId: payload.cardId,
            accountId: payload.accountId,
            savingsAccountId: payload.savingsAccountId,

            sourceCardLabel,
            sourceCardNumber,
            savingsAccountLabel,
            savingsAccountRib,

            dueDate: payload.dueDate,
            savingsType: payload.savingsType,
            savingsAmount: String(payload.savingsAmount),
            savingsPercentage: String(payload.savingsPercentage),
            maxSavingsAmount: String(payload.maxSavingsAmount),
            subscriptionDate: payload.subscriptionDate,

            isEditing,
            callType: isEditing ? "UPDATING" : "CREATING",
            savingPlanId: isEditing
              ? String(planId)
              : (res?.savingsPlanId ?? ""),
          }),
        },
      });
    } catch (e: any) {
      console.error(
        "[SavingPlansCreate] init failed:",
        e?.response?.data ?? e?.message ?? e,
      );
      showMessageError("common.error", "savingPlans.errorGeneric");
    }
  }, [
    validateInputs,
    savingsValue,
    savingsMensualValue,
    savingsType,
    selectedCardId,
    selectedSavingsAccountId,
    endDate,
    initMutation,
    isEditing,
    planId,
    showMessageError,
    sourceCardLabel,
    sourceCardNumber,
    savingsAccountLabel,
    savingsAccountRib,
  ]);

  /* =========================================================
   * UI mapping & filtering
   * ========================================================= */
  const uiType = savingsType === "PRC" ? "PERCENTAGE" : "FIXED_AMOUNT";

  // ✅ Use allowedCards instead of all cards
  const filteredCards = useMemo(() => {
    const q = sourceSearchQuery.trim().toLowerCase();
    if (!q) return allowedCards;

    return allowedCards.filter(
      (card: any) =>
        String(card.pcipan ?? "").includes(q) ||
        String(card.namePrinted ?? "")
          .toLowerCase()
          .includes(q) ||
        String(card.product?.description ?? "")
          .toLowerCase()
          .includes(q),
    );
  }, [allowedCards, sourceSearchQuery]);

  const filteredSavingsAccounts = useMemo(() => {
    const q = savingsSearchQuery.trim().toLowerCase();
    if (!q) return savingsAccounts;

    return savingsAccounts.filter(
      (acc: any) =>
        String(acc.accountLabel ?? "")
          .toLowerCase()
          .includes(q) ||
        String(acc.accountTitle ?? "")
          .toLowerCase()
          .includes(q) ||
        String(acc.accountNumber ?? "").includes(q) ||
        String(acc.accountRib ?? "").includes(q),
    );
  }, [savingsAccounts, savingsSearchQuery]);

  /* =========================================================
   * Bottom sheet backdrop (shared)
   * ========================================================= */
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const isSubmitting = initMutation.isPending;
  const isLoading = accountsLoading || cardsLoading || plansLoading;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.formScrollContent}
      >
        {/* Header */}
        <View style={styles.formHeader}>
          <View style={styles.formIconWrapper}>
            <Sparkles size={24} color={BankingColors.primary} />
          </View>

          <View style={styles.formHeaderText}>
            <TText
              tKey={
                isEditing
                  ? "savingPlans.editSubscription"
                  : "savingPlans.subscriptionForm"
              }
              style={styles.formTitle}
            />
            <TText
              tKey="savingPlans.formSubtitle"
              style={styles.formSubtitle}
            />
          </View>
        </View>

        {/* SOURCE (CARD ONLY) */}
        <View style={styles.formSection}>
          <TText
            tKey="savingPlans.sourceAccountOrCard"
            style={styles.formSectionLabel}
          />

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setSourceModalVisible(true)}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            {selectedCardId ? (
              <View style={styles.selectorContent}>
                <View style={styles.selectorIconWrapper}>
                  <CreditCard size={20} color={BankingColors.primary} />
                </View>

                <View style={styles.selectorTextWrapper}>
                  <Text style={styles.selectorMainText}>
                    {getSelectedSourceLabel()}
                  </Text>
                  <Text style={styles.selectorSubText}>
                    {getSelectedSourceSubtitle()}
                  </Text>
                </View>
              </View>
            ) : (
              <TText
                tKey="savingPlans.selectSourcePlaceholder"
                style={styles.selectorPlaceholder}
              />
            )}

            <ChevronDown size={20} color={BankingColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* SAVINGS ACCOUNT */}
        <View style={styles.formSection}>
          <TText
            tKey="savingPlans.savingsAccount"
            style={styles.formSectionLabel}
          />

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setSavingsModalVisible(true)}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            {selectedSavingsAccountId ? (
              <View style={styles.selectorContent}>
                <View style={styles.selectorIconWrapper}>
                  <Banknote size={20} color={BankingColors.primary} />
                </View>

                <View style={styles.selectorTextWrapper}>
                  <Text style={styles.selectorMainText}>
                    {getSelectedSavingsLabel()}
                  </Text>

                  {!!savingsAccountRibPretty && (
                    <Text style={styles.selectorSubText}>
                      {savingsAccountRibPretty}
                    </Text>
                  )}

                  <Text style={styles.selectorSubText}>
                    {getSelectedSavingsSubtitle()}
                  </Text>
                </View>
              </View>
            ) : (
              <TText
                tKey="savingPlans.selectSavingsPlaceholder"
                style={styles.selectorPlaceholder}
              />
            )}

            <ChevronDown size={20} color={BankingColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* TYPE */}
        <View style={styles.formSection}>
          <TText
            tKey="savingPlans.savingsType"
            style={styles.formSectionLabel}
          />

          <View style={styles.typeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.typeToggleOption,
                uiType === "FIXED_AMOUNT" && styles.typeToggleOptionActive,
              ]}
              onPress={() => setSavingsType("MNT")}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <View
                style={[
                  styles.typeToggleRadio,
                  uiType === "FIXED_AMOUNT" && styles.typeToggleRadioActive,
                ]}
              >
                {uiType === "FIXED_AMOUNT" && (
                  <View style={styles.typeToggleRadioInner} />
                )}
              </View>

              <View style={styles.typeToggleTextWrapper}>
                <TText
                  tKey="savingPlans.fixedAmount"
                  style={[
                    styles.typeToggleTitle,
                    uiType === "FIXED_AMOUNT" && styles.typeToggleTitleActive,
                  ]}
                />
                <TText
                  tKey="savingPlans.fixedAmountDesc"
                  style={styles.typeToggleDesc}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeToggleOption,
                uiType === "PERCENTAGE" && styles.typeToggleOptionActive,
              ]}
              onPress={() => setSavingsType("PRC")}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <View
                style={[
                  styles.typeToggleRadio,
                  uiType === "PERCENTAGE" && styles.typeToggleRadioActive,
                ]}
              >
                {uiType === "PERCENTAGE" && (
                  <View style={styles.typeToggleRadioInner} />
                )}
              </View>

              <View style={styles.typeToggleTextWrapper}>
                <TText
                  tKey="savingPlans.percentage"
                  style={[
                    styles.typeToggleTitle,
                    uiType === "PERCENTAGE" && styles.typeToggleTitleActive,
                  ]}
                />
                <TText
                  tKey="savingPlans.percentageDesc"
                  style={styles.typeToggleDesc}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* VALUE */}
        <View style={styles.formSection}>
          <TText
            tKey={
              savingsType === "PRC"
                ? "savingPlans.percentageLabel"
                : "savingPlans.amountPerOperation"
            }
            style={styles.formSectionLabel}
          />

          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={savingsValue}
              onChangeText={(txt) => {
                const cleaned = normalizeIntegerInput(txt);
                const n = Number(cleaned);
                if (cleaned && Number.isFinite(n) && n > MAX_SAVINGS_VALUE) {
                  setSavingsValue(String(MAX_SAVINGS_VALUE));
                  return;
                }
                setSavingsValue(cleaned);
              }}
              keyboardType="number-pad"
              placeholder={savingsType === "PRC" ? "Ex: 5" : "Ex: 10"}
              placeholderTextColor={BankingColors.textLight}
              editable={!isSubmitting}
            />

            <View style={styles.amountSuffix}>
              <Text style={styles.amountSuffixText}>
                {savingsType === "PRC" ? "%" : "TND"}
              </Text>
            </View>
          </View>

          {!!savingsValueRangeError && (
            <Text style={styles.inlineErrorText}>{savingsValueRangeError}</Text>
          )}
        </View>

        {/* MONTHLY LIMIT */}
        <View style={styles.formSection}>
          <TText
            tKey="savingPlans.monthlyLimit"
            style={styles.formSectionLabel}
          />

          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={savingsMensualValue}
              onChangeText={(txt) => {
                const cleaned = normalizeIntegerInput(txt);
                const n = Number(cleaned);
                if (cleaned && Number.isFinite(n) && n > MAX_SAVINGS_VALUE) {
                  setSavingsMensualValue(String(MAX_SAVINGS_VALUE));
                  return;
                }
                setSavingsMensualValue(cleaned);
              }}
              keyboardType="number-pad"
              placeholder="Ex: 100"
              placeholderTextColor={BankingColors.textLight}
              editable={!isSubmitting}
            />

            <View style={styles.amountSuffix}>
              <TText style={styles.amountSuffixText} tKey="common.currency" />
            </View>
          </View>

          {savingsType === "MNT" &&
            !!savingsMensualValue &&
            !!savingsValue &&
            isValidPositiveInt(savingsMensualValue) &&
            isValidPositiveInt(savingsValue) &&
            !isPlafondGteAmount && (
              <Text style={styles.inlineErrorText}>
                {t("savingPlans.errorInvalidLimit")}
              </Text>
            )}
        </View>

        {/* DATE */}
        <View style={styles.formSection}>
          <TText
            tKey="savingPlans.savingsDeadline"
            style={styles.formSectionLabel}
          />

          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => {
              const min = addMonthsSafe(startOfToday(), 3);
              const base = new Date(endDate);
              base.setHours(0, 0, 0, 0);
              let safe = base;
              if (safe < min) safe = min;

              setTempPickerDate(safe);
              setShowEndPicker(true);
            }}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            <Text style={styles.dateInput}>
              {endDate.toLocaleDateString(selectedLanguage ?? undefined)}
            </Text>

            <View style={styles.calendarIconContainer}>
              <Calendar size={20} color={BankingColors.primary} />
            </View>
          </TouchableOpacity>

          <Text style={styles.dateHintText}>
            {t("savingPlans.dateMinHint", {
              date: minEndDate.toLocaleDateString(
                selectedLanguage ?? undefined,
              ),
            })}
          </Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <TText tKey="common.cancel" style={styles.cancelButtonText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || !isFormReady) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !isFormReady}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Check size={18} color="#FFF" />
                <TText
                  tKey={
                    isEditing ? "savingPlans.update" : "savingPlans.validate"
                  }
                  style={styles.submitButtonText}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SOURCE SHEET */}
      <BottomSheetModal
        ref={sourceSheetRef}
        snapPoints={["85%"]}
        enableDynamicSizing={false}
        onDismiss={() => {
          setSourceModalVisible(false);
          setSourceSearchQuery("");
        }}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <View
          style={[
            styles.sheetContainer,
            isLarge && contentMaxWidth
              ? {
                  alignSelf: "center",
                  width: "100%",
                  maxWidth: contentMaxWidth,
                }
              : null,
          ]}
        >
          <View style={styles.sheetHeader}>
            <TText
              tKey="savingPlans.selectSourceTitle"
              style={styles.sheetTitle}
            />
            <TouchableOpacity
              onPress={() => setSourceModalVisible(false)}
              style={styles.sheetCloseButton}
            >
              <X size={24} color={BankingColors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={BankingColors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t("savingPlans.SearchCard")}
              value={sourceSearchQuery}
              onChangeText={setSourceSearchQuery}
              placeholderTextColor={BankingColors.textLight}
            />
          </View>

          <BottomSheetFlatList
            data={filteredCards.map((card: any) => ({
              id: card.id,
              label: card.product?.description || "Carte",
              subtitle: `**** **** **** ${String(card.pcipan ?? "").slice(-4)}`,
              type: "card" as const,
            }))}
            keyExtractor={(item: SourceItem) => `card-${item.id}`}
            renderItem={({ item }: { item: SourceItem }) => {
              const isSelected = item.id === selectedCardId;

              return (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    isSelected && styles.listItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCardId(item.id);
                    setSelectedAccountId("");
                    setSourceModalVisible(false);
                    setSourceSearchQuery("");
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.listItemAvatar}>
                    <CreditCard size={24} color={BankingColors.primary} />
                  </View>

                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemLabel}>{item.label}</Text>
                    <Text style={styles.listItemSubtitle}>{item.subtitle}</Text>
                  </View>

                  {isSelected && (
                    <View style={styles.listItemCheck}>
                      <Check size={16} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <CreditCard size={48} color={BankingColors.textLight} />
                <Text style={styles.emptyListText}>
                  {`Aucune carte éligible`}
                </Text>
              </View>
            }
          />
        </View>
      </BottomSheetModal>

      {/* SAVINGS ACCOUNT SHEET */}
      <BottomSheetModal
        ref={savingsSheetRef}
        snapPoints={["70%"]}
        enableDynamicSizing={false}
        onDismiss={() => {
          setSavingsModalVisible(false);
          setSavingsSearchQuery("");
        }}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <View
          style={[
            styles.sheetContainer,
            isLarge && contentMaxWidth
              ? {
                  alignSelf: "center",
                  width: "100%",
                  maxWidth: contentMaxWidth,
                }
              : null,
          ]}
        >
          <View style={styles.sheetHeader}>
            <TText
              tKey="savingPlans.selectSavingsTitle"
              style={styles.sheetTitle}
            />
            <TouchableOpacity
              onPress={() => setSavingsModalVisible(false)}
              style={styles.sheetCloseButton}
            >
              <X size={24} color={BankingColors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={BankingColors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t("savingPlans.SearchSavingAccount")}
              value={savingsSearchQuery}
              onChangeText={setSavingsSearchQuery}
              placeholderTextColor={BankingColors.textLight}
            />
          </View>

          <BottomSheetFlatList
            data={filteredSavingsAccounts.map((acc: any) => ({
              id: acc.id,
              label: acc.accountLabel || acc.accountTitle || "Compte épargne",
              subtitle: acc.accountRib || acc.accountNumber || "",
              balance: formatBalance(acc.availableBalance || "0", "TND"),
            }))}
            keyExtractor={(item: SavingsAccountItem) => item.id}
            renderItem={({ item }: { item: SavingsAccountItem }) => {
              const isSelected = item.id === selectedSavingsAccountId;

              return (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    isSelected && styles.listItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedSavingsAccountId(item.id);
                    setSavingsModalVisible(false);
                    setSavingsSearchQuery("");
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.listItemAvatar}>
                    <Banknote size={24} color={BankingColors.primary} />
                  </View>

                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemLabel}>{item.label}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {item.subtitle} • {item.balance}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={styles.listItemCheck}>
                      <Check size={16} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Banknote size={48} color={BankingColors.textLight} />
                <TText
                  tKey="savingPlans.noSavingsAccount"
                  style={styles.emptyListText}
                />
              </View>
            }
          />
        </View>
      </BottomSheetModal>

      <EndDatePickerModal
        visible={showEndPicker}
        tempPickerDate={tempPickerDate}
        onChange={onChangePicker}
        onCancel={() => setShowEndPicker(false)}
        onConfirm={() => {}}
        minimumDate={minEndDate}
        styles={styles}
      />
    </View>
  );
}

/* =========================================================
 * Styles
 * ========================================================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  scrollView: { flex: 1 },
  formScrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  formIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(246, 68, 39, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  formHeaderText: { flex: 1 },
  formTitle: { fontSize: 20, fontFamily: FontFamily.bold, color: "#1A1A1A" },
  formSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },

  formSection: { marginBottom: Spacing.lg },
  formSectionLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
  },

  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: BankingColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  selectorContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  selectorIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(246, 68, 39, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectorTextWrapper: { flex: 1 },
  selectorMainText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  selectorSubText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: 2,
  },
  selectorPlaceholder: {
    flex: 1,
    fontSize: FontSize.md,
    color: BankingColors.textLight,
  },

  hintText: {
    marginTop: 8,
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 18,
  },

  typeToggleContainer: { gap: Spacing.md },
  typeToggleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: BankingColors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    gap: Spacing.md,
  },
  typeToggleOptionActive: {
    borderColor: BankingColors.primary,
    backgroundColor: "rgba(246, 68, 39, 0.04)",
  },
  typeToggleRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  typeToggleRadioActive: { borderColor: BankingColors.primary },
  typeToggleRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BankingColors.primary,
  },
  typeToggleTextWrapper: { flex: 1 },
  typeToggleTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  typeToggleTitleActive: { color: BankingColors.primary },
  typeToggleDesc: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: 2,
  },

  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BankingColors.border,
    overflow: "hidden",
  },
  amountInput: {
    flex: 1,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  amountSuffix: {
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  amountSuffixText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },

  inlineErrorText: {
    marginTop: 8,
    fontSize: FontSize.sm,
    color: "#D32F2F",
  },

  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BankingColors.border,
    overflow: "hidden",
  },
  dateInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: BankingColors.text,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  calendarIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  dateHintText: {
    marginTop: 8,
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },

  formActions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: BankingColors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
  },
  submitButton: {
    flex: 1.5,
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: BankingColors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: "#FFF",
  },

  sheetBackground: {
    backgroundColor: BankingColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetIndicator: { backgroundColor: BankingColors.border },
  sheetContainer: { flex: 1, paddingBottom: 24 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  sheetTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },
  sheetCloseButton: { padding: 4, marginLeft: 12 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BankingColors.background,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: BankingColors.text },

  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: BankingColors.background,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  listItemSelected: {
    backgroundColor: BankingColors.primary + "20",
    borderWidth: 2,
    borderColor: BankingColors.primary,
  },
  listItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  listItemInfo: { flex: 1 },
  listItemLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
  },
  listItemCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyList: { alignItems: "center", paddingVertical: 40 },
  emptyListText: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
