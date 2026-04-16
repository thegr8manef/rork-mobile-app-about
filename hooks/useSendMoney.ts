// hooks/useSendMoney.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import {
  useCustomerAccounts,
  useBeneficiaries,
} from "@/hooks/use-accounts-api";
import type {
  Account,
  ApiErrorResponse,
  Beneficiary,
  TransferInitRequest,
} from "@/types/account.type";

import type {
  FormValues,
  Frequency,
  TransferType,
} from "../components/home/SendMoneyRefactor/types";

import { createSendMoneySchema } from "../components/home/SendMoneyRefactor/validation";
import {
  formatDateToYYYYMMDD,
  getMinEndDate,
  getMinExecutionDate as getMinExecutionDateBase,
  isDateAtLeast48h20minFromNow,
  startOfDay,
} from "../components/home/SendMoneyRefactor/utils";
import { serverNow } from "@/utils/serverTime";

// ✅ NEW — chapter validation import
import {
  validateVirementChapters,
  type ChapterValidationResult,
} from "../components/home/SendMoneyRefactor/chapter-validation";

import { useTransferInit } from "@/hooks/useTransfer";
import useShowMessage from "./useShowMessage";
import { useTranslation } from "react-i18next";

type RecipientTab = "beneficiaries" | "accounts";

export type SendMoneyPrefill = {
  beneficiaryId?: string;
  beneficiaryRib?: string;
};

const toNumber = (v: unknown): number => {
  const n = Number(
    String(v ?? "")
      .replace(",", ".")
      .trim(),
  );
  return Number.isFinite(n) ? n : NaN;
};

// Centralize: how to read RIB from an Account
const getAccountRib = (a: Account | null | undefined) => {
  if (!a) return "";
  return (
    (a as any).ribFormatAccount ?? (a as any).rib ?? (a as any).accountRib ?? ""
  );
};

// ✅ NEW — clean chapter error constant
const NO_CHAPTER_ERROR: ChapterValidationResult = {
  valid: true,
  errorKey: null,
  target: null,
};

export const useSendMoney = (prefill?: SendMoneyPrefill) => {
  const { t } = useTranslation();
  const beneficiaryId = prefill?.beneficiaryId;
  const beneficiaryRib = prefill?.beneficiaryRib;

  const { data: accountsData, isLoading: isLoadingAccounts } =
    useCustomerAccounts();
  const { data: beneficiariesData, isLoading: isLoadingBeneficiaries } =
    useBeneficiaries();

  const transferInitMutation = useTransferInit();

  const accounts = useMemo<Account[]>(
    () => accountsData?.data ?? [],
    [accountsData],
  );

  const beneficiaries = useMemo<Beneficiary[]>(
    () => beneficiariesData?.data ?? [],
    [beneficiariesData],
  );

  // IMPORTANT: per PDF -> do not select by default
  const [fromAccount, setFromAccount] = useState<Account | null>(null);

  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState<Beneficiary | null>(null);

  // Keep your internal values for now
  const [transferType, setTransferType] = useState<TransferType>("ponctuel");
  const [frequency, setFrequency] = useState<Frequency>("mensuelle");

  const [showExecutionPicker, setShowExecutionPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());
  const [tempPickerMode, setTempPickerMode] = useState<"execution" | "end">(
    "execution",
  );

  const [showFromAccountModal, setShowFromAccountModal] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [recipientTab, setRecipientTab] =
    useState<RecipientTab>("beneficiaries");
  const [searchQuery, setSearchQuery] = useState("");

  const prevTransferTypeRef = useRef<TransferType>("ponctuel");
  const lastAutoEndTsRef = useRef<number | null>(null);
  const { showMessageError, showMessageSuccess } = useShowMessage();

  // ✅ NEW — chapter error state
  const [chapterError, setChapterError] =
    useState<ChapterValidationResult>(NO_CHAPTER_ERROR);

  // ✅ NEW — clear chapter error whenever user changes from/to/beneficiary
  useEffect(() => {
    setChapterError(NO_CHAPTER_ERROR);
  }, [fromAccount, toAccount, selectedBeneficiary]);

  // ---------------- helpers ----------------

  const addMinutes = (date: Date, minutes: number) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + minutes);
    return d;
  };

  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const addYears = (date: Date, years: number) => {
    const d = new Date(date);
    const m = d.getMonth();
    d.setFullYear(d.getFullYear() + years);
    if (d.getMonth() !== m) d.setDate(0);
    return d;
  };

  const dayTs = (d?: Date) => (d ? startOfDay(d).getTime() : null);

  const isPermanent = useMemo(
    () => String(transferType).trim() === "permanent",
    [transferType],
  );

  const apiFrequency = useMemo<"MONTHLY" | "ANNUAL">(() => {
    return frequency === "annuelle" ? "ANNUAL" : "MONTHLY";
  }, [frequency]);

  const getPermanentDefaultEnd = (exec: Date) => {
    return apiFrequency === "ANNUAL" ? addYears(exec, 1) : addDays(exec, 31);
  };

  // ---------------- search filters ----------------

  const filteredBeneficiaries = useMemo<Beneficiary[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return beneficiaries;

    return beneficiaries.filter((b) => {
      const name = (b.fullName || "").toLowerCase();
      const bank = (b.bankName || "").toLowerCase();
      const rib = (b.rib || "").toLowerCase();
      return name.includes(q) || bank.includes(q) || rib.includes(q);
    });
  }, [beneficiaries, searchQuery]);

  const filteredAccounts = useMemo<Account[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = accounts ?? [];

    // exclude the selected debit account (if any)
    const filtered = list.filter((a) => a.id !== fromAccount?.id);

    if (!q) return filtered;

    return filtered.filter((a) => {
      const label = (a.accountLabel || "").toLowerCase();
      const rib = getAccountRib(a).toLowerCase();
      const num = (a.accountNumber || "").toLowerCase();
      return label.includes(q) || rib.includes(q) || num.includes(q);
    });
  }, [accounts, searchQuery, fromAccount?.id]);

  // ---------------- dates rules ----------------

  const getMinExecutionDate = useMemo(() => {
    return () => {
      if (isPermanent) {
        const min = addMinutes(serverNow(), 48 * 60 + 20);
        return startOfDay(min);
      }
      return getMinExecutionDateBase(transferType);
    };
  }, [isPermanent, transferType]);

  const schema = useMemo(() => {
    return createSendMoneySchema({
      transferType,
      getMinExecutionDate,
      isDateAtLeast48h20minFromNow,
    });
  }, [transferType, getMinExecutionDate]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    resetField,
  } = useForm<FormValues>({
    //@ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      description: "",
      executionDate: getMinExecutionDate(),
      endDate: undefined,
    },
    mode: "onChange",
  });

  const executionDate = watch("executionDate");
  const endDate = watch("endDate");
  const amount = watch("amount");
  const description = watch("description");

  // ---------------- init selections ----------------
  // ✅ auto-select ONLY if beneficiaryId or beneficiaryRib was passed
  // (NOT selecting debit account still respects PDF requirement)
  useEffect(() => {
    if (isLoadingBeneficiaries) return;
    if (!beneficiaryId && !beneficiaryRib) return;

    const found =
      (beneficiaryId
        ? beneficiaries.find((b) => b.id === beneficiaryId)
        : undefined) ??
      (beneficiaryRib
        ? beneficiaries.find((b) => b.rib === beneficiaryRib)
        : undefined);

    if (!found) return;

    setSelectedBeneficiary(found);
    setToAccount(null);
  }, [beneficiaryId, beneficiaryRib, beneficiaries, isLoadingBeneficiaries]);

  // ---------------- transferType transitions ----------------

  useEffect(() => {
    const prev = prevTransferTypeRef.current;

    if (prev === "permanent" && transferType === "ponctuel") {
      const minPonctuel = getMinExecutionDateBase("ponctuel");
      setValue("executionDate", minPonctuel, {
        shouldValidate: true,
        shouldDirty: true,
      });
      resetField("endDate");
      lastAutoEndTsRef.current = null;
    }

    prevTransferTypeRef.current = transferType;
  }, [transferType, resetField, setValue]);

  // Clamp executionDate and keep endDate clean
  useEffect(() => {
    const minExec = getMinExecutionDate();
    const minTs = dayTs(minExec)!;

    const cur = executionDate ?? minExec;
    const curTs = dayTs(cur)!;

    if (!isPermanent) {
      if (curTs < minTs) {
        setValue("executionDate", new Date(minTs), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      if (endDate) resetField("endDate");
      lastAutoEndTsRef.current = null;
      return;
    }

    if (!isDateAtLeast48h20minFromNow(cur)) {
      if (curTs !== minTs) {
        setValue("executionDate", new Date(minTs), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [
    isPermanent,
    transferType,
    executionDate,
    endDate,
    getMinExecutionDate,
    resetField,
    setValue,
  ]);

  // Permanent default endDate (auto)
  useEffect(() => {
    if (!isPermanent) return;

    const exec = startOfDay(executionDate ?? getMinExecutionDate());
    const minEnd = startOfDay(getPermanentDefaultEnd(exec));

    const minEndTs = dayTs(minEnd)!;
    const currentEndTs = dayTs(endDate);

    const isAuto =
      currentEndTs !== null && currentEndTs === lastAutoEndTsRef.current;
    const missing = currentEndTs === null;
    const invalid = currentEndTs !== null && currentEndTs < minEndTs;

    if (missing || invalid || isAuto) {
      if (currentEndTs !== minEndTs) {
        setValue("endDate", new Date(minEndTs), {
          shouldValidate: true,
          shouldDirty: true,
        });
        lastAutoEndTsRef.current = minEndTs;
      }
    }
  }, [
    isPermanent,
    apiFrequency,
    executionDate,
    endDate,
    getMinExecutionDate,
    setValue,
  ]);

  // ---------------- pickers ----------------

  const openExecutionPicker = () => {
    setTempPickerMode("execution");
    setTempPickerDate(executionDate || getMinExecutionDate());
    setShowExecutionPicker(true);
  };

  const openEndPicker = () => {
    setTempPickerMode("end");
    const exec = startOfDay(executionDate ?? getMinExecutionDate());
    const defaultEnd = getPermanentDefaultEnd(exec);
    setTempPickerDate(endDate ?? defaultEnd);
    setShowEndPicker(true);
  };

  const minEndDate = useMemo(() => {
    if (!isPermanent) return getMinEndDate(transferType, executionDate);
    const exec = startOfDay(executionDate ?? getMinExecutionDate());
    return startOfDay(getPermanentDefaultEnd(exec));
  }, [
    isPermanent,
    transferType,
    executionDate,
    getMinExecutionDate,
    apiFrequency,
  ]);

  const clampExecutionIfPermanent = (picked: Date) => {
    if (!isPermanent) return picked;
    if (isDateAtLeast48h20minFromNow(picked)) return picked;
    return getMinExecutionDate();
  };

  const onChangePicker = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempPickerDate(selected);
    if (Platform.OS !== "android") return;

    if (!_event || _event.type === "dismissed") {
      setShowExecutionPicker(false);
      setShowEndPicker(false);
      return;
    }

    const picked = selected ?? tempPickerDate;

    if (tempPickerMode === "execution") {
      const safePicked = clampExecutionIfPermanent(picked);
      setValue("executionDate", safePicked, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setShowExecutionPicker(false);

      if (!isPermanent) {
        resetField("endDate");
        lastAutoEndTsRef.current = null;
      }
      return;
    }

    const exec = startOfDay(executionDate ?? getMinExecutionDate());
    const minEnd = isPermanent
      ? startOfDay(getPermanentDefaultEnd(exec))
      : startOfDay(exec);

    const pickedSafe =
      startOfDay(picked).getTime() < minEnd.getTime() ? minEnd : picked;

    setValue("endDate", pickedSafe, {
      shouldValidate: true,
      shouldDirty: true,
    });
    lastAutoEndTsRef.current = null; // user manual choice
    setShowEndPicker(false);
  };

  const confirmIOSPicker = () => {
    const picked = tempPickerDate;

    if (tempPickerMode === "execution") {
      const safePicked = clampExecutionIfPermanent(picked);
      setValue("executionDate", safePicked, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setShowExecutionPicker(false);

      if (!isPermanent) {
        resetField("endDate");
        lastAutoEndTsRef.current = null;
      }
      return;
    }

    const exec = startOfDay(executionDate ?? getMinExecutionDate());
    const minEnd = isPermanent
      ? startOfDay(getPermanentDefaultEnd(exec))
      : startOfDay(exec);

    const pickedSafe =
      startOfDay(picked).getTime() < minEnd.getTime() ? minEnd : picked;

    setValue("endDate", pickedSafe, {
      shouldValidate: true,
      shouldDirty: true,
    });
    lastAutoEndTsRef.current = null;
    setShowEndPicker(false);
  };

  const cancelIOSPicker = () => {
    setShowExecutionPicker(false);
    setShowEndPicker(false);
  };

  const handlePrimaryAction = () => {
    router.navigate("/(root)/(tabs)/(home)/transfer-history");
  };

  // ---------------- submit ----------------

  const submit = handleSubmit(async (data) => {
    try {
      if (!fromAccount) {
        showMessageError("errorTitle", "selectDebtorAccountMessage");
        return;
      }

      if (!selectedBeneficiary && !toAccount) {
        showMessageError("errorTitle", "selectRecipientMessage");
        return;
      }

      if (toAccount && toAccount.id === fromAccount.id) {
        showMessageError("errorTitle", "sameAccountTransferMessage");
        return;
      }

      // ═══════════════════════════════════════════════════════════════
      // ✅ NEW — Chapter validation (before any other business check)
      // For beneficiary transfers: pass null (no chapter to check)
      // For own-account transfers: validate both debit + credit chapters
      // ═══════════════════════════════════════════════════════════════
      const creditAccount = toAccount ?? null;
      const chapterResult = validateVirementChapters(
        fromAccount,
        creditAccount,
      );
      console.log("🚀 ~ useSendMoney ~ chapterResult:", chapterResult)

      if (!chapterResult.valid) {
        setChapterError(chapterResult);
        showMessageError(
          chapterResult.errorKey!,
          `${chapterResult.errorKey!}.desc`,
        );
        return;
      }
      // ═══════════════════════════════════════════════════════════════

      const debtorAlpha = (fromAccount.currencyAccount?.alphaCode ?? "")
        .trim()
        .toUpperCase();
      if (debtorAlpha !== "TND") {
        showMessageError(
          "errorTitle",
          `unsupportedCurrencyMessage ${
            fromAccount.currencyAccount?.alphaCode ?? "-"
          }`,
        );
        return;
      }

      const amountNumber = toNumber(data.amount);
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        showMessageError("errorTitle", "invalidAmountMessage");
        return;
      }
      // ✅ deferred = ponctuel + executionDate strictly after today
      const isDeferredPonctuel =
        transferType === "ponctuel" &&
        startOfDay(data.executionDate).getTime() >
          startOfDay(new Date()).getTime();

      const available = toNumber(fromAccount.availableBalance ?? "0");
      if (!Number.isFinite(available)) {
        showMessageError("invalidBalanceTitle", "invalidBalanceMessage");
        return;
      }
      const shouldCheckBalance = !isDeferredPonctuel && !isPermanent;

      if (shouldCheckBalance) {
        if (available <= 0 || amountNumber > available) {
          showMessageError(
            "insufficientBalanceTitle",
            "insufficientBalanceMessage",
          );
          return;
        }
      }

      const frequencyPayload = isPermanent ? apiFrequency : undefined;

      if (selectedBeneficiary) {
        const payload: TransferInitRequest = {
          executionDate: formatDateToYYYYMMDD(data.executionDate),
          motif: data.description,
          amount: amountNumber,
          debtorAccountId: fromAccount.id,
          beneficiaryId: selectedBeneficiary.id,
          ...(isPermanent ? { frequency: frequencyPayload } : {}),
          ...(isPermanent && data.endDate
            ? { endExecutionDate: formatDateToYYYYMMDD(data.endDate) }
            : {}),
        };

        const response = await transferInitMutation.mutateAsync(payload);

        router.navigate({
          pathname: "/(root)/transaction-summary",
          params: {
            transactionType: "transfer",
            data: JSON.stringify({
              requestId: response.id,
              transferType,
              fromAccount: {
                id: fromAccount.id,
                accountLabel: fromAccount.accountLabel,
                accountNumber: fromAccount.accountNumber,
                rib: getAccountRib(fromAccount),
              },
              beneficiary: {
                id: selectedBeneficiary.id,
                fullName: selectedBeneficiary.fullName,
                rib: selectedBeneficiary.rib,
              },
              amount: response.amount,
              currency: fromAccount.currencyAccount.alphaCode,
              executionDate: data.executionDate,
              endDate: isPermanent ? data.endDate : undefined,
              frequency: isPermanent ? apiFrequency : "once",
              description: response.motif,
              createdAt: isPermanent ? new Date().toISOString() : undefined,
            }),
          },
        });
        return;
      }

      // account-to-account
      const payloadAccToAcc: TransferInitRequest = {
        executionDate: formatDateToYYYYMMDD(data.executionDate),
        motif: data.description?.trim() ? data.description.trim() : "Virement",
        amount: amountNumber,
        debtorAccountId: fromAccount.id,
        creditorAccountId: toAccount!.id,
        ...(isPermanent ? { frequency: frequencyPayload } : {}),
        ...(isPermanent && data.endDate
          ? { endExecutionDate: formatDateToYYYYMMDD(data.endDate) }
          : {}),
      };

      const response = await transferInitMutation.mutateAsync(payloadAccToAcc);

      router.navigate({
        pathname: "/(root)/transaction-summary",
        params: {
          transactionType: "transfer",
          data: JSON.stringify({
            requestId: response.id,
            transferType,
            fromAccount: {
              id: fromAccount.id,
              accountLabel: fromAccount.accountLabel,
              accountNumber: fromAccount.accountNumber,
              rib: getAccountRib(fromAccount),
            },
            beneficiary: null,
            toAccount: {
              id: toAccount!.id,
              accountLabel: toAccount!.accountLabel,
              accountNumber: toAccount!.accountNumber,
              rib: getAccountRib(toAccount),
            },
            amount: response.amount ?? amountNumber,
            currency: fromAccount.currencyAccount.alphaCode,
            executionDate: data.executionDate,
            endDate: isPermanent ? data.endDate : undefined,
            frequency: isPermanent ? apiFrequency : "once",
            description: response.motif ?? payloadAccToAcc.motif,
          }),
        },
      });
    } catch (e) {
      let msg = "Erreur";
      if (isAxiosError(e)) {
        const d = e.response?.data as ApiErrorResponse;
        msg = d?.message ?? msg;
        if (d?.errorCode === "DAILY_CEILING_EXCEEDED") {
          showMessageError("errorTitle", d?.errorCode);
          return;
        }
      }
      showMessageError("errorTitle", "ERR_BAD_RESPONSE");
    }
  });

  const handleTransfer = submit;

  // ---------------- selection handlers ----------------

  const handleSelectBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setToAccount(null);
    setShowRecipientModal(false);
    setSearchQuery("");
  };

  const handleSelectAccount = (account: Account) => {
    setToAccount(account);
    setSelectedBeneficiary(null);
    setShowRecipientModal(false);
    setSearchQuery("");
  };

  const handleAddBeneficiary = () => {
    setShowRecipientModal(false);
    setSearchQuery("");
    setTimeout(() => {
      router.navigate({
        pathname: "/add-beneficiary",
        params: {
          returnTo: "/send-money",
          returnParams: JSON.stringify({ from: "add-beneficiary" }),
        },
      });
    }, 350);
  };

  const onCloseRecipientModal = () => {
    setShowRecipientModal(false);
    setSearchQuery("");
  };

  const isLoading = isLoadingAccounts || isLoadingBeneficiaries;
  const isTransferring = transferInitMutation.isPending;

  return {
    accounts,
    beneficiaries,
    fromAccount,
    toAccount,
    selectedBeneficiary,

    control,
    errors,
    isValid,
    amount,
    description,
    executionDate,
    endDate,

    transferType,
    setTransferType,
    frequency,
    setFrequency,

    showExecutionPicker,
    showEndPicker,
    tempPickerDate,
    tempPickerMode,
    setTempPickerMode,
    setTempPickerDate,
    openExecutionPicker,
    openEndPicker,
    onChangePicker,
    confirmIOSPicker,
    cancelIOSPicker,

    minExecutionDate: getMinExecutionDate(),
    minEndDate,

    showFromAccountModal,
    setShowFromAccountModal,
    showRecipientModal,
    setShowRecipientModal,
    recipientTab,
    setRecipientTab,
    searchQuery,
    setSearchQuery,
    filteredBeneficiaries,
    filteredAccounts,

    onCloseRecipientModal,
    setFromAccount,
    setToAccount,
    setSelectedBeneficiary,
    handleSelectBeneficiary,
    handleSelectAccount,
    handleAddBeneficiary,

    handleTransfer,
    handlePrimaryAction,
    isLoading,
    isTransferring,

    getAccountRib,

    // ✅ NEW — exposed for UI red border
    chapterError,
  };
};
