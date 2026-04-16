// app/(root)/transaction-summary.tsx

import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CreditCard,
  FileText,
  Wallet,
  GraduationCap,
  Smartphone,
  Fingerprint,
  KeyRound,
  ScanFace,
  Building2,
  Hash,
  Banknote,
  User,
  Calendar,
  RefreshCw,
  Shield,
  Edit3,
  RotateCw,
  BookOpen,
  ArrowDownUp,
  Upload,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  IconSize,
  FontFamily,
} from "@/constants";

import { useAuth } from "@/hooks/auth-store";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import TText from "@/components/TText";
import ConfirmationButton from "@/components/ConfirmationButton";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";
import useShowMessage from "@/hooks/useShowMessage";
import { formatBalance } from "@/utils/account-formatters";
import { initTransactionChallengeApi } from "@/services/auth.api";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./(tabs)/(menu)/language";

const maskCardNumber = (full?: string) => {
  if (!full) return "-";
  const s = String(full).replace(/\s+/g, "");
  if (s.length < 4) return s;
  return `**** **** **** ${s.slice(-4)}`;
};

/** -------------------- TYPES -------------------- */
type TransactionType =
  | "reload"
  | "schooling"
  | "bill"
  | "transfer"
  | "bill-recharge"
  | "add-beneficiary"
  | "cardAction"
  | "confirm-chequebook"
  | "savingPlansResign"
  | "savingPlans"
  | "installment";

/** -------------------- DATA TYPES -------------------- */
interface ReloadData {
  reloadId: string;
  cardId: string;
  cardNumber: string;
  cardHolder?: string;
  accountId: string;
  accountLabel?: string;
  accountNumber?: string;
  rib?: string;
  amount: number;
  currency?: string;
  motif?: string;
}

type SchoolingSummaryNavData = {
  requestId: string;
  fileId: string;
  studentName: string;
  fileRef?: string;
  amount: number;
  currency: string;
  comment?: string;
  SchoolingTransactionType: string;
  feeType: string;
  attachments?: number;
};

interface BillData {
  requestId: string;
  billerId: string;
  billerName: string;
  billerLogo?: string;
  contractRef?: string;
  accountId: string;
  accountLabel?: string;
  accountNumber?: string;
  amount: number;
  currency?: string;
}

interface TransferData {
  requestId: string;
  transferType: "ponctuel" | "permanent";
  fromAccount?: {
    id: string;
    accountLabel: string;
    accountNumber: string;
    rib?: string;
  } | null;

  beneficiary?: { id: string; fullName: string; rib: string } | null;

  toAccount?: {
    id: string;
    accountLabel: string;
    accountNumber: string;
    rib?: string;
  } | null;

  amount: number;
  currency: string;

  executionDate: string;
  endDate?: string;
  frequency?: "MONTHLY" | "ANNUAL";
  description?: string;
  createdAt?: string; // ← add this
}

interface AddBeneficiaryData {
  requestId: string;
  fullName: string;
  rib: string;

  returnTo?: string;
  returnParams?: string;
}

interface CardActionData {
  requestId: string;
  cardId: string;
  action: "resetPin" | "modifyLimit" | "disableSecured" | "replaceCard";
  cardName?: string;
  newLimit?: string | number;
  endDate?: string;
}

interface InstallmentData {
  requestId: string;
  cardId: string;
  merchantName?: string;
  transactionAmount?: number;
  installmentNumber: number;
  installmentDay: number;
}

interface ConfirmChequebookData {
  requestId: string;
  accountId?: string;
  accountLabel?: string;
  accountNumber?: string;
  rib?: string;
}

interface SavingPlansData {
  requestId: string;

  // backend naming
  savingsAccountId: string;

  // Source used for funding
  cardId?: string;
  accountId?: string;
  sourceCardLabel: string;
  sourceCardNumber: string;
  savingsAccountLabel: string;
  savingsAccountRib: string;
  // Plan attributes (for display only)
  dueDate?: string;
  savingsType?: string;
  savingsAmount?: string;
  savingsPercentage?: string;
  maxSavingsAmount?: string;
  subscriptionDate: string;

  // Flow context
  callType?: "CREATING" | "UPDATING";
  savingPlanId?: string; // required when callType = UPDATING
}

interface SavingPlansResignData {
  requestId: string;
  // backend naming
  savingsAccountId: string;

  // Source used for funding
  cardId?: string;
  accountId?: string;
  sourceCardLabel: string;
  sourceCardNumber: string;
  savingsAccountLabel: string;
  savingsAccountRib: string;
  // Plan attributes (for display only)
  dueDate?: string;
  savingsType?: string;
  savingsAmount?: string;
  savingsPercentage?: string;
  maxSavingsAmount?: string;
  subscriptionDate: string;

  savingPlanId: string; // required for resign confirm url
  savingsPlanStatus: "RE";
}

type TransactionData =
  | ReloadData
  | SchoolingSummaryNavData
  | BillData
  | TransferData
  | AddBeneficiaryData
  | CardActionData
  | InstallmentData
  | ConfirmChequebookData
  | SavingPlansResignData
  | SavingPlansData;

/** -------------------- HELPERS -------------------- */
const toAmountString = (v: string | number) => {
  if (typeof v === "number") return String(v);
  return String(v).replace(",", ".").trim();
};

const getCurrencyDecimals = (alpha?: string) => {
  const c = String(alpha ?? "")
    .trim()
    .toUpperCase();
  if (!c) return 2;
  if (c === "TND") return 3;
  if (c === "JPY") return 0;
  return 2;
};

// compare by day (ignore time)
const isAfterToday = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;

  const today = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  return a > b;
};

export default function TransactionSummaryScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showMessageError } = useShowMessage();
  const { authState, deviceId, biometricType } = useAuth();

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDateFR = (dateString?: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  const params = useLocalSearchParams<{
    transactionType?: string;
    data?: string;
  }>();
  console.log("==========================================================");
  console.log(
    "🚀 ~ TransactionSummaryScreen ~ params:",
    JSON.stringify(params.data, null, 2),
  );
  console.log("==========================================================");

  const [isLoading, setIsLoading] = useState(false);
  const [pressedMethod, setPressedMethod] = useState<
    "passcode" | "biometric" | "otp" | null
  >(null);

  const [showMethodModal, setShowMethodModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<
    "passcode" | "biometric" | "otp" | null
  >(null);

  const transactionType = params.transactionType as TransactionType | undefined;

  const transactionData = useMemo<TransactionData | null>(() => {
    if (!params.data) return null;
    try {
      const raw = Array.isArray(params.data) ? params.data[0] : params.data;
      return JSON.parse(String(raw));
    } catch {
      return null;
    }
  }, [params.data]);

  const goBackAfterFail = useCallback(() => {
    showMessageError("common.tryAgainLater");
    setTimeout(() => router.back(), 250);
  }, [showMessageError]);

  const formatTodayFR = () =>
    new Date().toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  if (!transactionType || !transactionData) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <TText style={styles.errorText} tKey="common.error" />
      </View>
    );
  }

  const getHeaderTitleKey = (): string => {
    switch (transactionType) {
      case "reload":
        return "transactionSummary.reloadTitle";
      case "schooling":
        return "transactionSummary.schoolingTitle";
      case "bill":
        return "transactionSummary.billTitle";
      case "bill-recharge":
        return "transactionSummary.billTitle.recharge";
      case "transfer":
        return "transactionSummary.transferTitle";
      case "add-beneficiary":
        return "transactionSummary.addBeneficiaryTitle";
      case "cardAction":
        return "transactionSummary.cardActionTitle";
      case "confirm-chequebook":
        return "transactionSummary.chequebookTitle";
      case "savingPlansResign":
      case "savingPlans":
        return "transactionSummary.savingPlans";
      case "installment":
        return "transactionSummary.installmentTitle";
      default:
        return "transactionSummary.title";
    }
  };

  const getRequestId = (): string => {
    switch (transactionType) {
      case "reload":
        return (transactionData as ReloadData).reloadId;
      case "schooling":
        return (transactionData as SchoolingSummaryNavData).requestId;
      case "bill":
      case "bill-recharge":
        return (transactionData as BillData).requestId;
      case "transfer":
        return (transactionData as TransferData).requestId;
      case "add-beneficiary":
        return (transactionData as AddBeneficiaryData).requestId;
      case "cardAction":
        return (transactionData as CardActionData).requestId;
      case "confirm-chequebook":
        return (transactionData as ConfirmChequebookData).requestId;
      case "savingPlans":
        return (transactionData as SavingPlansData).requestId;
      case "savingPlansResign":
        return (transactionData as SavingPlansResignData).requestId;
      case "installment":
        return (transactionData as InstallmentData).requestId;
      default:
        return "";
    }
  };

  const requestId = getRequestId();

  const isDeviceOwned = authState.isDeviceOwnedByCurrentUser;
  const preferred = authState.preferredLoginMethod;

  const canUsePasscodeEntry =
    Platform.OS !== "web" &&
    !!deviceId &&
    !!requestId &&
    authState.hasTrustedDevice &&
    isDeviceOwned;

  const canUseBiometricEntry =
    Platform.OS !== "web" &&
    !!deviceId &&
    !!requestId &&
    authState.hasTrustedDevice &&
    authState.biometricEnabled &&
    isDeviceOwned;

  const passcodeDisabled = isLoading || !canUsePasscodeEntry;
  const biometricDisabled = isLoading || !canUseBiometricEntry;
  const otpDisabled = isLoading;

  const hasPasscodeMethod =
    isDeviceOwned && authState.hasTrustedDevice && authState.hasPasscode;

  const hasBiometricMethod =
    isDeviceOwned && authState.hasTrustedDevice && authState.biometricEnabled;

  /** -------------------- NAV BUILDERS -------------------- */
  const buildOtpPayload = () => {
    switch (transactionType) {
      case "reload": {
        const d = transactionData as ReloadData;
        return {
          actionType: "reload" as const,
          data: {
            requestId: d.reloadId,
            cardId: d.cardId,
            amount: toAmountString(d.amount),
          },
        };
      }

      case "schooling": {
        const d = transactionData as SchoolingSummaryNavData;
        return {
          actionType: "schooling" as const,
          data: {
            requestId: d.requestId,
            fileId: d.fileId,
            studentName: d.studentName,
            amount: toAmountString(d.amount),
            currency: d.currency,
            SchoolingTransactionType: d.SchoolingTransactionType,
            feeType: d.feeType,
            attachments: d.attachments,
          },
        };
      }

      case "bill-recharge":
      case "bill": {
        const d = transactionData as BillData;
        return {
          actionType: transactionType as "bill" | "bill-recharge",
          data: {
            requestId: d.requestId,
            transactionId: d.requestId,
            amount: toAmountString(d.amount),
            billerId: d.billerId,
          },
        };
      }

      case "transfer": {
        const d = transactionData as TransferData;
        return {
          actionType: "transfer" as const,
          data: {
            requestId: d.requestId,
            transactionId: d.requestId,
            amount: toAmountString(d.amount),
          },
        };
      }

      case "add-beneficiary": {
        const d = transactionData as AddBeneficiaryData;
        return {
          actionType: "add-beneficiary" as const,
          data: { requestId: d.requestId },
        };
      }

      case "cardAction": {
        const d = transactionData as CardActionData;
        return {
          actionType: "cardAction" as const,
          data: {
            requestId: d.requestId,
            cardId: d.cardId,
            action: d.action,
            cardName: d.cardName,
            newLimit: d.newLimit,
            endDate: d.endDate,
          },
        };
      }

      case "confirm-chequebook": {
        const d = transactionData as ConfirmChequebookData;
        return {
          actionType: "confirm-chequebook" as const,
          data: { requestId: d.requestId },
        };
      }

      case "savingPlans": {
        const d = transactionData as SavingPlansData;
        return {
          actionType: "savingPlans" as const,
          data: {
            requestId: d.requestId,
            savingsAccountId: d.savingsAccountId,
            cardId: d.cardId,
            accountId: d.accountId,
            dueDate: d.dueDate,
            savingsType: d.savingsType,
            savingsAmount: d.savingsAmount,
            savingsPercentage: d.savingsPercentage,
            maxSavingsAmount: d.maxSavingsAmount,
            subscriptionDate: d.subscriptionDate,
            callType: d.callType,
            savingPlanId: d.savingPlanId,
            sourceCardLabel: d.sourceCardLabel,
            sourceCardNumber: d.sourceCardNumber,
            savingsAccountLabel: d.savingsAccountLabel,
            savingsAccountRib: d.savingsAccountRib,
          },
        };
      }
      case "savingPlansResign": {
        const d = transactionData as SavingPlansResignData;
        return {
          actionType: "savingPlansResign" as const,
          data: {
            requestId: d.requestId,
            accountId: d.accountId,
            savingsAccountId: d.savingsAccountId,
            cardId: d.cardId,
            savingPlanId: d.savingPlanId,
            savingsPlanStatus: d.savingsPlanStatus,
            dueDate: d.dueDate,
            savingsType: d.savingsType,
            savingsAmount: d.savingsAmount,
            savingsPercentage: d.savingsPercentage,
            maxSavingsAmount: d.maxSavingsAmount,
            subscriptionDate: d.subscriptionDate,
            sourceCardLabel: d.sourceCardLabel,
            sourceCardNumber: d.sourceCardNumber,
            savingsAccountLabel: d.savingsAccountLabel,
            savingsAccountRib: d.savingsAccountRib,
          },
        };
      }
      case "installment": {
        const d = transactionData as InstallmentData;
        return {
          actionType: "installment" as const,
          data: {
            requestId: d.requestId,
            cardId: d.cardId,
            installmentNumber: d.installmentNumber,
            installmentDay: d.installmentDay,
          },
        };
      }
      default:
        return { actionType: "transfer" as const, data: { requestId } };
    }
  };

  const buildConfirmPayload = () => {
    switch (transactionType) {
      case "reload": {
        const d = transactionData as ReloadData;
        return {
          transactionType: "reload" as const,
          requestId: d.reloadId,
          transactionId: d.reloadId,
          amount: d.amount,
          cardId: d.cardId,
        };
      }

      case "schooling": {
        const d = transactionData as SchoolingSummaryNavData;
        return {
          transactionType: "schooling" as const,
          requestId: d.requestId,
          transactionId: d.requestId,
          amount: d.amount,
          fileId: d.fileId,
          studentName: d.studentName,
          currency: d.currency,
          SchoolingTransactionType: d.SchoolingTransactionType,
          feeType: d.feeType,
          attachments: d.attachments,
        };
      }

      case "bill":
      case "bill-recharge": {
        const d = transactionData as BillData;
        return {
          transactionType: transactionType as "bill" | "bill-recharge",
          requestId: d.requestId,
          transactionId: d.requestId,
          paymentAmount: d.amount,
          amount: d.amount,
          billerId: d.billerId,
          currency: d.currency,
          sourceAccountId: d.accountId,
        };
      }

      case "transfer": {
        const d = transactionData as TransferData;
        return {
          transactionType: "transfer" as const,
          requestId: d.requestId,
          transactionId: d.requestId,
          amount: d.amount,
          description: d.description,
          fromAccountId: d.fromAccount?.id,
          beneficiaryId: d.beneficiary?.id,
          currency: d.currency,
          transferType: d.transferType,
          executionDate: d.executionDate,
          endDate: d.endDate,
          frequency: d.frequency,
        };
      }

      case "add-beneficiary": {
        const d = transactionData as AddBeneficiaryData;
        return {
          transactionType: "add-beneficiary" as const,
          requestId: d.requestId,
          transactionId: d.requestId,
          returnTo: d.returnTo,
          returnParams: d.returnParams,
        };
      }

      case "cardAction": {
        const d = transactionData as CardActionData;
        return {
          transactionType: "cardAction" as const,
          requestId: d.requestId,
          transactionId: d.requestId,
          cardId: d.cardId,
          action: d.action,
          cardName: d.cardName,
          newLimit: d.newLimit,
          endDate: d.endDate,
        };
      }

      case "confirm-chequebook": {
        const d = transactionData as ConfirmChequebookData;
        return {
          transactionType: "confirm-chequebook" as const,
          requestId: d.requestId,
          transactionId: d.requestId,
        };
      }

      case "savingPlans": {
        const d = transactionData as SavingPlansData;
        return {
          transactionType: "savingPlans" as const,
          requestId: d.requestId,
          savingsAccountId: d.savingsAccountId,
          cardId: d.cardId,
          accountId: d.accountId,
          dueDate: d.dueDate,
          savingsType: d.savingsType,
          savingsAmount: d.savingsAmount,
          savingsPercentage: d.savingsPercentage,
          maxSavingsAmount: d.maxSavingsAmount,
          subscriptionDate: d.subscriptionDate,
          callType: d.callType,
          savingPlanId: d.savingPlanId,
          sourceCardLabel: d.sourceCardLabel,
          sourceCardNumber: d.sourceCardNumber,
          savingsAccountLabel: d.savingsAccountLabel,
          savingsAccountRib: d.savingsAccountRib,
        };
      }
      case "savingPlansResign": {
        const d = transactionData as SavingPlansResignData;
        return {
          transactionType: "savingPlansResign" as const,
          requestId: d.requestId,
          accountId: d.accountId,
          savingsAccountId: d.savingsAccountId,
          cardId: d.cardId,
          savingPlanId: d.savingPlanId,
          savingsPlanStatus: d.savingsPlanStatus,
          dueDate: d.dueDate,
          savingsType: d.savingsType,
          savingsAmount: d.savingsAmount,
          savingsPercentage: d.savingsPercentage,
          maxSavingsAmount: d.maxSavingsAmount,
          subscriptionDate: d.subscriptionDate,
          sourceCardLabel: d.sourceCardLabel,
          sourceCardNumber: d.sourceCardNumber,
          savingsAccountLabel: d.savingsAccountLabel,
          savingsAccountRib: d.savingsAccountRib,
        };
      }
      case "installment": {
        const d = transactionData as InstallmentData;
        return {
          transactionType: "installment" as const,
          requestId: d.requestId,
          transactionId: d.requestId,
          cardId: d.cardId,
          installmentNumber: d.installmentNumber,
          installmentDay: d.installmentDay,
        };
      }
      default:
        return { transactionType: "transfer" as const, requestId };
    }
  };

  /** -------------------- ACTIONS -------------------- */
  const handleConfirmWithOTP = useCallback(async () => {
    if (!requestId) {
      goBackAfterFail();
      return;
    }

    setPressedMethod("otp");
    setIsLoading(true);

    try {
      const initRes = await initTransactionChallengeApi(
        deviceId ?? "",
        requestId,
        "TOTP",
      );

      const payload = buildOtpPayload();
      router.navigate({
        pathname: "/(root)/otp-verification",
        params: {
          actionType: payload.actionType,
          data: JSON.stringify(payload.data),
        },
      });
    } catch (e: any) {
      console.log("[TxSummary] ❌ OTP nav failed:", e?.message);
      setPressedMethod(null);
      goBackAfterFail();
    } finally {
      setIsLoading(false);
    }
  }, [requestId, goBackAfterFail, transactionType, transactionData]);

  const handleConfirmWithPasscode = useCallback(async () => {
    if (!canUsePasscodeEntry || !authState.hasPasscode) {
      await handleConfirmWithOTP();
      return;
    }

    setPressedMethod("passcode");
    setIsLoading(true);

    try {
      const payload = buildConfirmPayload();
      router.navigate({
        pathname: "/(root)/transaction-passcode-confirm",
        params: { data: JSON.stringify(payload) },
      });
    } catch (e: any) {
      console.log("[TxSummary] ❌ Passcode nav failed:", e?.message);
      setPressedMethod(null);
      goBackAfterFail();
    } finally {
      setIsLoading(false);
    }
  }, [
    authState.hasPasscode,
    canUsePasscodeEntry,
    handleConfirmWithOTP,
    goBackAfterFail,
    transactionType,
    transactionData,
  ]);

  const handleConfirmWithBiometric = useCallback(async () => {
    if (!canUseBiometricEntry) {
      await handleConfirmWithOTP();
      return;
    }

    setPressedMethod("biometric");
    setIsLoading(true);

    try {
      const payload = buildConfirmPayload();
      router.navigate({
        pathname: "/(root)/transaction-biometric-confirm",
        params: { data: JSON.stringify(payload) },
      });
    } catch (e: any) {
      console.log("[TxSummary] ❌ Biometric nav failed:", e?.message);
      setPressedMethod(null);
      goBackAfterFail();
    } finally {
      setIsLoading(false);
    }
  }, [
    canUseBiometricEntry,
    handleConfirmWithOTP,
    goBackAfterFail,
    transactionType,
    transactionData,
  ]);

  /** -------------------- DETAILS RENDERING -------------------- */
  const formatCurrency = (amount: number, currency?: string) => {
    const c = currency || "TND";
    return formatBalance(amount, c);
  };

  const renderReloadDetails = () => {
    const d = transactionData as ReloadData;
    return (
      <>
        <DetailRow
          icon={Wallet}
          label={t("transactionSummary.reloadAccount")}
          value={d.rib || d.accountNumber || "-"}
          subValue={d.accountLabel}
        />
        <DetailRow
          icon={CreditCard}
          label={t("transactionSummary.rechargedCard")}
          value={maskCardNumber(d.cardNumber)}
        />
        <DetailRow
          icon={Banknote}
          label={t("transactionSummary.amount")}
          value={formatCurrency(d.amount, d.currency)}
          highlighted
        />
        {!!d.motif && (
          <DetailRow
            icon={FileText}
            label={t("transactionSummary.motif")}
            value={d.motif}
          />
        )}
      </>
    );
  };

  const renderSchoolingDetails = () => {
    const d = transactionData as SchoolingSummaryNavData;
    return (
      <>
        <DetailRow
          icon={GraduationCap}
          label={t("transactionSummary.student")}
          value={d.studentName}
          subValue={
            d.fileRef
              ? `${t("transactionSummary.ref")} ${d.fileRef}`
              : undefined
          }
        />
        <DetailRow
          icon={Banknote}
          label={t("transactionSummary.amount")}
          value={formatCurrency(d.amount, d.currency)}
          highlighted
        />
        <DetailRow
          icon={Banknote}
          label={t("schooling.feeType")}
          value={t(d.feeType)}
        />
        <DetailRow
          icon={Banknote}
          label={t("schooling.transactionType")}
          value={d.SchoolingTransactionType}
        />
        {!!d.comment && (
          <DetailRow
            icon={FileText}
            label={t("transactionSummary.comment")}
            value={d.comment}
          />
        )}
        {!!d.attachments && (
          <DetailRow
            icon={Upload}
            label={t("schooling.filesAttached")}
            value={d.attachments.toString()}
          />
        )}
      </>
    );
  };

  const renderBillDetails = () => {
    const d = transactionData as BillData;
    return (
      <>
        <DetailRow
          icon={Building2}
          label={t("transactionSummary.biller")}
          value={d.billerName}
        />
        {!!d.contractRef && (
          <DetailRow
            icon={Hash}
            label={t("transactionSummary.contractRef")}
            value={d.contractRef}
          />
        )}
        <DetailRow
          icon={Wallet}
          label={t("transactionSummary.fromAccount")}
          value={d.accountLabel || "-"}
          subValue={d.accountNumber}
        />
        <DetailRow
          icon={Banknote}
          label={t("transactionSummary.amount")}
          value={formatCurrency(d.amount, d.currency)}
          highlighted
        />
      </>
    );
  };

  const isPermanentTransfer = (d: TransferData) =>
    d.transferType === "permanent";
  const isDeferredTransfer = (d: TransferData) =>
    !isPermanentTransfer(d) && isAfterToday(d.executionDate);

  const getTransferNatureKey = (d: TransferData) => {
    if (isPermanentTransfer(d)) return "transactionSummary.permanent";
    return isDeferredTransfer(d)
      ? "transactionSummary.deferred"
      : "transactionSummary.immediate";
  };

  const renderTransferDetails = () => {
    const d = transactionData as TransferData;
    const from = d.fromAccount ?? null;
    const ben = d.beneficiary ?? null;
    const toAcc = d.toAccount ?? null;

    let recipientLabelKey = "transactionSummary.toAccount";
    let recipientName = "-";
    let recipientRib: string | undefined;

    if (ben) {
      recipientLabelKey = "transactionSummary.beneficiary";
      recipientName = ben.fullName;
      recipientRib = ben.rib;
    } else if (toAcc) {
      recipientLabelKey = "transactionSummary.destinationAccount";
      recipientName = toAcc.accountLabel;
      recipientRib = toAcc.rib || toAcc.accountNumber;
    }

    const permanent = isPermanentTransfer(d);
    const deferred = isDeferredTransfer(d);
    const shouldShowEnd = permanent || (deferred && !!d.endDate);

    const executionLabelKey = permanent
      ? "etransfer.startExecutionDate"
      : "transactionSummary.executionDate";

    return (
      <>
        <DetailRow
          icon={RefreshCw}
          label={t("transactionSummary.transferType")}
          value={t(getTransferNatureKey(d))}
        />

        <DetailRow
          icon={Banknote}
          label={t("transactionSummary.amount")}
          value={formatCurrency(d.amount, d.currency)}
          highlighted
        />

        <DetailRow
          icon={Wallet}
          label={t("transactionSummary.fromAccount")}
          value={from?.accountLabel ?? "-"}
          subValue={from?.rib ?? ""}
        />

        <DetailRow
          icon={
            recipientLabelKey === "transactionSummary.beneficiary"
              ? User
              : Wallet
          }
          label={t(recipientLabelKey)}
          value={recipientName}
          subValue={recipientRib}
        />

        {permanent && (
          <DetailRow
            icon={RefreshCw}
            label={t("transactionSummary.frequency")}
            value={
              d.frequency
                ? t(`transactionSummary.frequencyValue.${d.frequency}`)
                : "-"
            }
          />
        )}

        {deferred && !permanent && (
          <DetailRow
            icon={Calendar}
            label={t("transactionSummary.creationDate")}
            value={formatTodayFR()}
          />
        )}
        {permanent && (
          <DetailRow
            icon={Calendar}
            label={t("transactionSummary.creationDate")}
            value={d.createdAt ? formatDateFR(d.createdAt) : formatTodayFR()}
          />
        )}
        <DetailRow
          icon={Calendar}
          label={t(executionLabelKey)}
          value={formatDateFR(d.executionDate)}
        />

        {shouldShowEnd && (
          <DetailRow
            icon={Calendar}
            label={t("etransfer.endExecutionDate")}
            value={d.endDate ? formatDateFR(d.endDate) : "-"}
          />
        )}

        {!!d.description && (
          <DetailRow
            icon={FileText}
            label={t("transactionSummary.description")}
            value={d.description}
          />
        )}
      </>
    );
  };

  const renderAddBeneficiaryDetails = () => {
    const d = transactionData as AddBeneficiaryData;
    return (
      <>
        <DetailRow
          icon={User}
          label={t("transactionSummary.beneficiaryName")}
          value={d.fullName ?? ""}
        />
        <DetailRow
          icon={CreditCard}
          label={t("transactionSummary.beneficiaryRib")}
          value={d.rib}
          highlighted
        />
      </>
    );
  };

  const renderCardActionDetails = () => {
    const d = transactionData as CardActionData;

    const getActionIcon = () => {
      switch (d.action) {
        case "resetPin":
          return RotateCw;
        case "modifyLimit":
          return Edit3;
        case "disableSecured":
          return Shield;
        case "replaceCard":
          return CreditCard;
        default:
          return CreditCard;
      }
    };

    const getActionLabel = () => {
      switch (d.action) {
        case "resetPin":
          return t("cards.recalculatePin");
        case "modifyLimit":
          return t("cards.modifyLimit");
        case "disableSecured":
          return t("cards.disableSecured");
        case "replaceCard":
          return t("cards.replaceCard");
        default:
          return t("cards.cardAction");
      }
    };

    return (
      <>
        <DetailRow
          icon={CreditCard}
          label={t("transactionSummary.card")}
          value={d.cardName || "-"}
          highlighted
        />
        <DetailRow
          icon={getActionIcon()}
          label={t("transactionSummary.action")}
          value={getActionLabel()}
        />

        {d.action === "modifyLimit" && d.newLimit && (
          <DetailRow
            icon={Banknote}
            label={t("transactionSummary.newLimit")}
            value={formatBalance(d.newLimit, "TND")}
          />
        )}

        {d.action === "disableSecured" && d.endDate && (
          <DetailRow
            icon={Calendar}
            label={t("transactionSummary.reactivationDate")}
            value={formatDateFR(d.endDate)}
          />
        )}
      </>
    );
  };

  const renderConfirmChequebookDetails = () => {
    const d = transactionData as ConfirmChequebookData;
    return (
      <>
        <DetailRow
          icon={BookOpen}
          label={t("transactionSummary.chequebookRequest")}
          value={t("transactionSummary.chequebookRequestDesc")}
        />
        {!!d.accountLabel && (
          <DetailRow
            icon={Wallet}
            label={t("transactionSummary.associatedAccount")}
            value={d.accountLabel}
            subValue={d.rib || d.accountNumber}
          />
        )}
      </>
    );
  };

  // ✅ FIXED: Saving plans details (real labels)
  const renderSavingPlansDetails = () => {
    const d = transactionData as SavingPlansData | SavingPlansResignData;
    const normalize = (v: unknown) => {
      if (v == null) return null;
      if (typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed === "" || trimmed.toLowerCase() === "null") return null;
        return trimmed;
      }
      return v;
    };

    const amount = normalize(d.savingsAmount);
    const percentage = normalize(d.savingsPercentage);

    return (
      <>
        <DetailRow
          icon={CreditCard}
          label={t("transactionSummary.sourceCard")}
          value={d.sourceCardLabel}
          subValue={d.sourceCardNumber}
          highlighted
        />
        <DetailRow
          icon={CreditCard}
          label={t("transactionSummary.savingAccount")}
          value={d.savingsAccountLabel}
          subValue={d.savingsAccountRib ?? "-"}
          highlighted
        />
        <DetailRow
          icon={Wallet}
          label={t("savingPlans.savingsTypeLabel")}
          value={
            d?.savingsType === "MNT"
              ? "Montant fixe"
              : d?.savingsType === "PRC"
                ? "Pourcentage"
                : "-"
          }
        />
        {/* ✅ show ONLY if not null/undefined */}
        {amount !== null && (
          <DetailRow
            icon={Banknote}
            label={t("savingPlans.savingsAmount")}
            value={String(amount) + " " + "TND"}
          />
        )}
        {percentage !== null && (
          <DetailRow
            icon={Banknote}
            label={t("savingPlans.savingsPercentage")}
            value={String(percentage) + " " + "%"}
          />
        )}
        <DetailRow
          icon={Banknote}
          label={t("savingPlans.maxSavingsAmount")}
          value={d.maxSavingsAmount != null ? `${d.maxSavingsAmount} TND` : "-"}
        />
        <DetailRow
          icon={Calendar}
          label={t("savingPlans.souscriptionDate")}
          value={d.subscriptionDate ?? "-"}
        />
        <DetailRow
          icon={Calendar}
          label={t("savingPlans.dueDate")}
          value={d.dueDate ?? "-"}
        />
      </>
    );
  };

  const renderInstallmentDetails = () => {
    const d = transactionData as InstallmentData;
    return (
      <>
        {!!d.merchantName && (
          <DetailRow
            icon={CreditCard}
            label={t("transactionSummary.installmentMerchant")}
            value={d.merchantName}
            highlighted
          />
        )}
        {!!d.transactionAmount && (
          <DetailRow
            icon={Banknote}
            label={t("transactionSummary.amount")}
            value={formatBalance(d.transactionAmount, "TND")}
          />
        )}
        <DetailRow
          icon={Calendar}
          label={t("transactionSummary.installmentNumber")}
          value={`${d.installmentNumber} ${t("installments.months")}`}
        />
        <DetailRow
          icon={Calendar}
          label={t("transactionSummary.installmentDay")}
          value={String(d.installmentDay)}
        />
      </>
    );
  };

  const renderTransactionDetails = () => {
    switch (transactionType) {
      case "reload":
        return renderReloadDetails();
      case "schooling":
        return renderSchoolingDetails();
      case "bill":
      case "bill-recharge":
        return renderBillDetails();
      case "transfer":
        return renderTransferDetails();
      case "add-beneficiary":
        return renderAddBeneficiaryDetails();
      case "cardAction":
        return renderCardActionDetails();
      case "confirm-chequebook":
        return renderConfirmChequebookDetails();
      case "installment":
        return renderInstallmentDetails();
      case "savingPlansResign":
      case "savingPlans":
        return renderSavingPlansDetails();
      default:
        return null;
    }
  };

  const activeMethod = useMemo<"passcode" | "biometric" | "otp">(() => {
    if (selectedMethod) return selectedMethod;

    if (preferred === "biometric" && hasBiometricMethod) return "biometric";
    if (preferred === "passcode" && hasPasscodeMethod) return "passcode";

    if (hasPasscodeMethod) return "passcode";
    if (hasBiometricMethod) return "biometric";
    return "otp";
  }, [selectedMethod, preferred, hasPasscodeMethod, hasBiometricMethod]);

  const alternativeMethods = useMemo(() => {
    if (!isDeviceOwned) return [];

    const methods: {
      key: "passcode" | "biometric" | "otp";
      tKey: string;
      icon: any;
    }[] = [];

    if (activeMethod !== "passcode" && hasPasscodeMethod) {
      methods.push({
        key: "passcode",
        tKey: "transactionSummary.confirmWithPIN",
        icon: KeyRound,
      });
    }
    if (activeMethod !== "biometric" && hasBiometricMethod) {
      methods.push({
        key: "biometric",
        tKey: "transactionSummary.confirmWithBiometric",
        icon: biometricType === "faceId" ? ScanFace : Fingerprint,
      });
    }
    if (activeMethod !== "otp") {
      methods.push({
        key: "otp",
        tKey: "transactionSummary.confirmWithOTP",
        icon: Smartphone,
      });
    }

    return methods;
  }, [
    activeMethod,
    isDeviceOwned,
    hasPasscodeMethod,
    hasBiometricMethod,
    biometricType,
  ]);

  const canChangeMethod = isDeviceOwned && alternativeMethods.length > 0;

  const handleSelectMethod = (method: "passcode" | "biometric" | "otp") => {
    setSelectedMethod(method);
    setShowMethodModal(false);
  };

  const renderConfirmationButtons = () => {
    if (!isDeviceOwned) {
      return (
        <ConfirmationButton
          tKey="transactionSummary.confirmWithOTP"
          icon={Smartphone}
          onPress={handleConfirmWithOTP}
          disabled={otpDisabled}
          isLoading={isLoading && pressedMethod === "otp"}
        />
      );
    }

    if (pressedMethod) {
      const btnMap = {
        passcode: (
          <ConfirmationButton
            tKey="transactionSummary.confirmWithPIN"
            icon={KeyRound}
            onPress={handleConfirmWithPasscode}
            disabled={passcodeDisabled}
            isLoading={isLoading && pressedMethod === "passcode"}
          />
        ),
        biometric: (
          <ConfirmationButton
            tKey="transactionSummary.confirmWithBiometric"
            icon={biometricType === "faceId" ? ScanFace : Fingerprint}
            onPress={handleConfirmWithBiometric}
            disabled={biometricDisabled}
            isLoading={isLoading && pressedMethod === "biometric"}
          />
        ),
        otp: (
          <ConfirmationButton
            tKey="transactionSummary.confirmWithOTP"
            icon={Smartphone}
            onPress={handleConfirmWithOTP}
            disabled={otpDisabled}
            isLoading={isLoading && pressedMethod === "otp"}
          />
        ),
      };
      return btnMap[pressedMethod] ?? null;
    }

    const activeButton = (() => {
      switch (activeMethod) {
        case "passcode":
          return (
            <ConfirmationButton
              tKey="transactionSummary.confirmWithPIN"
              icon={KeyRound}
              onPress={handleConfirmWithPasscode}
              disabled={passcodeDisabled}
              isLoading={false}
            />
          );
        case "biometric":
          return (
            <ConfirmationButton
              tKey="transactionSummary.confirmWithBiometric"
              icon={biometricType === "faceId" ? ScanFace : Fingerprint}
              onPress={handleConfirmWithBiometric}
              disabled={biometricDisabled}
              isLoading={false}
            />
          );
        case "otp":
        default:
          return (
            <ConfirmationButton
              tKey="transactionSummary.confirmWithOTP"
              icon={Smartphone}
              onPress={handleConfirmWithOTP}
              disabled={otpDisabled}
              isLoading={false}
            />
          );
      }
    })();

    return (
      <>
        {activeButton}

        {canChangeMethod && (
          <TouchableOpacity
            style={styles.changeMethodButton}
            onPress={() => setShowMethodModal(true)}
            disabled={isLoading}
          >
            <ArrowDownUp size={16} color={BankingColors.primary} />
            <TText style={styles.changeMethodText}>
              {t("transactionSummary.changeMethod")}
            </TText>
          </TouchableOpacity>
        )}
      </>
    );
  };

  const renderMethodModal = () => (
    <Modal
      visible={showMethodModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMethodModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowMethodModal(false)}
      >
        <View style={styles.modalContent}>
          <TText style={styles.modalTitle}>
            {t("transactionSummary.selectMethod")}
          </TText>

          <View style={styles.modalOptions}>
            {alternativeMethods.map((method) => {
              const Icon = method.icon;
              return (
                <TouchableOpacity
                  key={method.key}
                  style={styles.modalOption}
                  onPress={() => handleSelectMethod(method.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalOptionIcon}>
                    <Icon size={24} color={BankingColors.primary} />
                  </View>
                  <TText style={styles.modalOptionText} tKey={method.tKey} />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowMethodModal(false)}
          >
            <TText style={styles.modalCancelText}>{t("common.cancel")}</TText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey={getHeaderTitleKey()}
            />
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isLarge && contentMaxWidth
            ? { alignSelf: "center", width: "100%", maxWidth: contentMaxWidth }
            : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <TText
            style={styles.sectionTitle}
            tKey="transactionSummary.details"
          />
          <View style={styles.detailsSection}>
            {renderTransactionDetails()}
          </View>
        </View>

        <View
          style={[
            styles.signingMethodsContainer,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
        >
          {renderConfirmationButtons()}
        </View>
      </ScrollView>

      {renderMethodModal()}
    </View>
  );
}

/** -------------------- DetailRow -------------------- */
interface DetailRowProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  subValue?: string;
  highlighted?: boolean;
}

function DetailRow({
  icon: Icon,
  label,
  value,
  subValue,
  highlighted,
}: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Icon size={20} color={BankingColors.primary} />
      </View>

      <View style={styles.detailContent}>
        <TText style={styles.detailLabel}>{label}</TText>
        <TText
          style={[
            styles.detailValue,
            highlighted && styles.detailValueHighlighted,
          ]}
        >
          {value}
        </TText>
        {!!subValue && <TText style={styles.detailSubValue}>{subValue}</TText>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.white },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg },

  errorText: {
    fontSize: FontSize.md,
    color: BankingColors.error,
    textAlign: "center",
    marginTop: Spacing.xxxl,
  },

  summaryCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.lg,
  },

  detailsSection: { gap: Spacing.lg },

  detailRow: { flexDirection: "row", gap: Spacing.md },

  detailIcon: {
    width: IconSize.xl,
    height: IconSize.xl,
    borderRadius: IconSize.md,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  detailContent: { flex: 1 },

  detailLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs,
  },

  detailValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },

  detailValueHighlighted: {
    fontSize: FontSize.lg,
    color: BankingColors.primary,
    fontFamily: FontFamily.bold,
  },

  detailSubValue: {
    fontSize: FontSize.sm,
    color: BankingColors.textLight,
    marginTop: 2,
  },

  signingMethodsContainer: {
    paddingHorizontal: Spacing.lg,
    backgroundColor: BankingColors.white,
    borderTopColor: BankingColors.border,
    gap: Spacing.md,
  },

  changeMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },

  changeMethodText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: BankingColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },

  modalTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },

  modalOptions: { gap: Spacing.md },

  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.surface,
  },

  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  modalOptionText: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },

  modalCancelButton: {
    marginTop: Spacing.lg,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },

  modalCancelText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
  },
});
