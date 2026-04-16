// app/(root)/transaction-result.tsx


import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  FontFamily,
} from "@/constants";
import {
  Check,
  X,
  Home,
  CreditCard,
  ArrowRight,
  Download,
  Clock,
  Eye,
  Share2,
  RefreshCw,
  AlertCircle,
} from "lucide-react-native";
import { useHaptic } from "@/utils/useHaptic";
import { shareReceiptPdf } from "@/utils/receiptPdf";
import TText from "@/components/TText";
import { useFocusEffect } from "@react-navigation/native";

import { getTransferPdfBase64 } from "@/services/account.api";
import {
  savePdfToDownloads,
  savePdfBase64ToAppDir,
} from "@/utils/savePdfBase64";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import useShowMessage from "@/hooks/useShowMessage";
import * as Sharing from "expo-sharing";
import { requestStoragePermission } from "@/utils/mediaPermission";

import {
  getTransferStatusConfig,
  type TransferStatus,
  type TransferStatusConfig,
} from "@/utils/transfer-status";
import { getErrorMapping } from "@/utils/api-error-mapper";
import { formatBalance } from "@/utils/account-formatters";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./(tabs)/(menu)/language";

type ActionType =
  | "transfer"
  | "beneficiary"
  | "bill"
  | "bill-recharge"
  | "reload"
  | "schooling"
  | "installment"
  | "cardActivation"
  | "cardResetPin"
  | "cardModifyLimit"
  | "card3DSecure"
  | "confirm-chequebook"
  | "cardReplaceCard"
  | "savingPlansResign"
  | "savingPlans";

const ADD_BENEFICIARY_ROUTE = "/(root)/(tabs)/(home)/add-beneficiary" as any;

const asString = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v[0] != null ? String(v[0]) : undefined;
  return String(v);
};

const safeParse = (raw?: string) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const formatDate = () => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const year = now.getFullYear().toString().slice(-2);
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} • ${hours}:${minutes}`;
};

const CARD_ACTION_TYPES: ActionType[] = [
  "cardActivation",
  "cardResetPin",
  "cardModifyLimit",
  "card3DSecure",
  "cardReplaceCard",
  "installment",
];

const NO_SHARE_OR_VIEW = new Set<ActionType>([
  "reload",
  "installment",
  "cardActivation",
  "cardResetPin",
  "cardModifyLimit",
  "card3DSecure",
  "cardReplaceCard",
  "savingPlans",
  "bill",
]);

export default function TransactionResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  console.log("params:", JSON.stringify(params, null, 2));
  const { t } = useTranslation();
  const { triggerSuccessHaptic, triggerErrorHaptic, triggerMediumHaptic } =
    useHaptic();
  const { showComplete } = useDownloadNotification();
  const { showMessageSuccess, showMessageError } = useShowMessage();

  const [sharing, setSharing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [savedPdfUri, setSavedPdfUri] = useState<string | null>(null);

  const successRaw = asString(params.success) === "true";
  const actionType = asString(params.actionType) as ActionType | undefined;
  const errorMessage = asString(params.errorMessage);
  const errorCode = asString(params.errorCode);
  const rawTransactionId = asString(params.transactionId);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const amount = useMemo(() => {
    const raw = asString(params.amount);
    if (raw == null) return null;
    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }, [params.amount]);

  const rawData = asString(params.data);
  const parsedData = useMemo(() => safeParse(rawData), [rawData]);

  // ✅ Detect WAF/HTML/invalid responses passed as "success"
  const isInvalidResponse = useMemo(() => {
    if (!successRaw) return false;
    // parsedData is a string (HTML) instead of an object
    if (typeof parsedData === "string") return true;
    // rawData contains HTML
    if (rawData && rawData.includes("<html")) return true;
    return false;
  }, [successRaw, parsedData, rawData]);

  // ✅ Override success if response is invalid
  const success = successRaw && !isInvalidResponse;

  // ─── Transfer status from full response ───
  const transferStatus = useMemo<string | undefined>(() => {
    if (actionType !== "transfer") return undefined;
    // Prefer status from parsedData (full backend response)
    return parsedData?.status ?? asString(params.transferStatus);
  }, [actionType, parsedData?.status, params.transferStatus]);

  const statusConfig = useMemo<TransferStatusConfig>(
    () => getTransferStatusConfig(transferStatus),
    [transferStatus],
  );

  // ─── Error mapping from errorCode ───
  const mappedError = useMemo(() => {
    if (success) return null;
    return getErrorMapping(errorCode);
  }, [success, errorCode]);

  const isBeneficiary = actionType === "beneficiary";
  const isChequeRequest = actionType === "confirm-chequebook";
  const isSavingPlans =
    actionType === "savingPlansResign" || actionType === "savingPlans";
  const isSchooling = actionType === "schooling";
  const isCardAction = actionType
    ? CARD_ACTION_TYPES.includes(actionType)
    : false;
  const isResetPin = actionType === "cardResetPin";
  const showResetPinInfo = success && isResetPin;
  const isTransfer = actionType === "transfer";
  const showBeneficiaryExtra = success && isBeneficiary;
  const showCardDetails = success && isCardAction;
  const showAmount =
    success &&
    amount !== null &&
    !isBeneficiary &&
    !isCardAction &&
    !isChequeRequest &&
    !isSavingPlans;
  const canShare =
    success &&
    actionType != null &&
    !NO_SHARE_OR_VIEW.has(actionType) &&
    !isBeneficiary &&
    !isChequeRequest &&
    !isSavingPlans;
  const canView =
    success &&
    actionType !== "beneficiary" &&
    actionType !== "schooling" &&
    actionType != null &&
    !isSavingPlans &&
    !NO_SHARE_OR_VIEW.has(actionType);

  // Transfer PDF: can download if transfer succeeded and we have a transactionId
  const canDownloadTransferPdf =
    success && isTransfer && !!rawTransactionId && statusConfig.isSuccess;

  const getResetTarget = useCallback(() => {
    switch (actionType) {
      case "bill":
      case "bill-recharge":
        return "/(root)/(tabs)/(factures)";
      case "reload":
      case "installment":
      case "cardActivation":
      case "cardResetPin":
      case "cardModifyLimit":
      case "card3DSecure":
      case "cardReplaceCard":
        return "/(root)/(tabs)/(cartes)";
      case "schooling":
        return "/(root)/(tabs)/(menu)/schooling";
      case "transfer":
      case "beneficiary":
      case "savingPlansResign":
      case "savingPlans":
        return "/(root)/(tabs)/(menu)/saving-plans";
      default:
        return "/(root)/(tabs)/(home)";
    }
  }, [actionType]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace(getResetTarget() as any);
        return true;
      };

      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => sub.remove();
    }, [getResetTarget]),
  );

  useEffect(() => {
    if (success && statusConfig.isSuccess) triggerSuccessHaptic();
    else triggerErrorHaptic();
  }, [
    success,
    statusConfig.isSuccess,
    triggerSuccessHaptic,
    triggerErrorHaptic,
  ]);

  // ─── Title/Desc: use transfer status for transfers, else original logic ───
  const getSuccessTitle = useCallback(() => {
    if (isTransfer && transferStatus) {
      return t(statusConfig.titleKey);
    }
    if (!actionType) return t("transactionResult.successTitle.default");
    if (actionType === "bill") return t("transactionResult.successTitle.bill");
    const key = `transactionResult.successTitle.${actionType}`;
    const val = t(key);
    if (val !== key) return val;
    return t("transactionResult.successTitle.default");
  }, [actionType, isTransfer, transferStatus, statusConfig.titleKey, t]);

  const getSuccessDesc = useCallback(() => {
    if (isTransfer && transferStatus) {
      return t(statusConfig.descKey);
    }
    if (!actionType) return t("transactionResult.successDesc.default");
    if (isSavingPlans) return t("transactionResult.successDesc.savingPlans");
    if (isCardAction) return t("transactionResult.successDesc.card");
    if (actionType === "bill") return t("transactionResult.successDesc.bill");

    const key = `transactionResult.successDesc.${actionType}`;
    const val = t(key);
    if (val !== key) return val;
    return t("transactionResult.successDesc.default");
  }, [
    actionType,
    isCardAction,
    isTransfer,
    transferStatus,
    statusConfig.descKey,
    t,
  ]);

  // ─── Error title/desc: use mapped error from errorCode ───
  const getErrorTitle = useCallback(() => {
    if (isInvalidResponse)
      return t("transactionResult.errorTitle", "Échec du virement");
    if (mappedError) return t(mappedError.titleKey);
    return t("transactionResult.errorTitle");
  }, [isInvalidResponse, mappedError, t]);

  const getErrorDesc = useCallback(() => {
    if (isInvalidResponse)
      return t(
        "common.serverError",
        "Une erreur serveur est survenue. Veuillez réessayer ultérieurement.",
      );
    if (mappedError) return t(mappedError.descKey);
    return t("transactionResult.errorDesc");
  }, [isInvalidResponse, mappedError, t]);

  const handlePrimaryAction = useCallback(() => {
    triggerMediumHaptic();

    switch (actionType) {
      case "transfer":
        router.navigate("/(root)/(tabs)/(home)/send-money");
        break;
      case "beneficiary":
        router.navigate(ADD_BENEFICIARY_ROUTE);
        break;
      case "bill":
      case "bill-recharge":
        router.navigate("/(root)/(tabs)/(factures)");
        break;
      case "reload":
        router.navigate("/(root)/(tabs)/(cartes)/reload-card");
        break;
      case "schooling":
        router.navigate("/(root)/(tabs)/(menu)/schooling");
        break;
      case "confirm-chequebook":
        router.navigate("/(root)/(tabs)/(menu)/create-chequebook");
        break;
      case "savingPlansResign":
      case "savingPlans":
        router.navigate("/(root)/(tabs)/(menu)/saving-plans");
        break;
      case "installment":
      case "cardActivation":
      case "cardResetPin":
      case "cardModifyLimit":
      case "card3DSecure":
      case "cardReplaceCard":
        router.navigate("/(root)/(tabs)/(cartes)");
        break;
      default:
        router.navigate("/(root)/(tabs)/(home)");
    }
  }, [actionType, triggerMediumHaptic]);

  const getPrimaryActionLabel = useCallback(() => {
    switch (actionType) {
      case "transfer":
        return t("transactionResult.action.transfer");
      case "beneficiary":
        return t("transactionResult.action.addAnotherBeneficiary");
      case "bill":
        return t("transactionResult.action.bill");
      case "bill-recharge":
        return t("transactionResult.action.bill.recharge");
      case "reload":
        return t("transactionResult.action.reload");
      case "schooling":
        return t("transactionResult.action.schooling");
      case "savingPlansResign":
      case "savingPlans":
        return t("transactionResult.action.savingPlans");
      case "installment":
      case "cardActivation":
      case "cardResetPin":
      case "cardModifyLimit":
      case "card3DSecure":
      case "cardReplaceCard":
        return t("transactionResult.action.cards");
      default:
        return t("transactionResult.action.default");
    }
  }, [actionType, t]);

  const handleViewDetails = useCallback(() => {
    triggerMediumHaptic();
    switch (actionType) {
      case "transfer":
        router.navigate("/(root)/(tabs)/(home)/transfer-history");
        break;
      case "bill":
      case "bill-recharge":
        router.navigate("/(root)/(tabs)/(factures)/biller-payment-history");
        break;
      case "reload":
        router.navigate("/(root)/(tabs)/(cartes)/reload-card-history");
        break;
      case "schooling":
        router.navigate("/(root)/(tabs)/(menu)/schooling-transfer-history");
        break;
      case "confirm-chequebook":
        router.navigate("/(root)/(tabs)/(menu)/chequebook-requests-history");
        break;
      case "savingPlansResign":
      case "savingPlans":
        router.navigate("/(root)/(tabs)/(menu)/saving-plans");
        break;
      case "installment":
      case "cardActivation":
      case "cardResetPin":
      case "cardModifyLimit":
      case "card3DSecure":
      case "cardReplaceCard":
        router.navigate("/(root)/(tabs)/(cartes)");
        break;
      default:
        router.navigate("/(root)/(tabs)/(home)");
    }
  }, [actionType, triggerMediumHaptic]);

  const handleGoHome = useCallback(() => {
    triggerMediumHaptic();
    switch (actionType) {
      case "bill":
      case "bill-recharge":
        router.navigate("/(root)/(tabs)/(factures)");
        break;
      case "reload":
        router.navigate("/(root)/(tabs)/(cartes)");
        break;
      case "schooling":
        router.navigate("/(root)/(tabs)/(home)");
        break;
      case "confirm-chequebook":
        router.navigate("/(root)/(tabs)/(menu)/create-chequebook");
        break;
      case "savingPlansResign":
      case "savingPlans":
        router.navigate("/(root)/(tabs)/(home)");
        break;
      case "installment":
      case "cardActivation":
      case "cardResetPin":
      case "cardModifyLimit":
      case "card3DSecure":
      case "cardReplaceCard":
        router.navigate("/(root)/(tabs)/(cartes)");
        break;
      case "transfer":
      case "beneficiary":
      default:
        router.navigate("/(root)/(tabs)/(home)");
    }
  }, [actionType, triggerMediumHaptic]);

  const handleShareReceipt = useCallback(async () => {
    if (sharing) return;
    try {
      setSharing(true);
      triggerMediumHaptic();
      await shareReceiptPdf({
        title: getSuccessTitle(),
        status: success ? "success" : "error",
        message: success
          ? getSuccessTitle()
          : t("transactionResult.failed"),
        transactionId: "",
        amount,
        actionType: (actionType || "transfer") as any,
        date: new Date(),
      });
    } catch (e) {
      console.log(e);
      triggerErrorHaptic();
    } finally {
      setSharing(false);
    }
  }, [
    sharing,
    triggerMediumHaptic,
    getSuccessTitle,
    success,
    t,
    amount,
    actionType,
    triggerErrorHaptic,
  ]);

  // ─── Transfer PDF download ───
  const handleDownloadTransferPdf = useCallback(async () => {
    if (!rawTransactionId || isDownloadingPdf) return;

    const { granted } = await requestStoragePermission();
    if (!granted) {
      console.log("[TransferPDF] Storage permission denied, blocking download");
      return;
    }

    setIsDownloadingPdf(true);
    triggerMediumHaptic();

    try {
      const base64 = await getTransferPdfBase64(rawTransactionId, "PDF");

      // Save to public Downloads
      const downloadUri = await savePdfToDownloads(
        base64,
        `transfer_${rawTransactionId}.pdf`,
      );

      // Save to app dir for sharing
      const appUri = await savePdfBase64ToAppDir(
        base64,
        `transfer_${rawTransactionId}.pdf`,
      );

      setSavedPdfUri(appUri);

      showMessageSuccess("transferHistory.download.savedTitle");

      await showComplete(
        t("transferHistory.download.savedTitle", "Reçu de virement enregistré"),
        t(
          "transferHistory.download.savedDesc",
          "Le reçu a été enregistré dans vos téléchargements.",
        ),
        downloadUri,
        "application/pdf",
      );
    } catch (e) {
      console.log("[TransferPDF] download error:", e);
      showMessageError("common.tryAgainLater");
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [
    rawTransactionId,
    isDownloadingPdf,
    triggerMediumHaptic,
    showMessageSuccess,
    showMessageError,
    showComplete,
    t,
  ]);

  // ─── Transfer PDF share ───
  const handleShareTransferPdf = useCallback(async () => {
    if (!savedPdfUri) return;

    try {
      triggerMediumHaptic();
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showMessageError("cheques.share.notAvailable");
        return;
      }

      await Sharing.shareAsync(savedPdfUri, {
        mimeType: "application/pdf",
        dialogTitle: t("transferHistory.share.dialogTitle", "Partager le reçu"),
        UTI: "com.adobe.pdf",
      });
    } catch (e) {
      console.log("[TransferPDF] share error:", e);
      showMessageError("common.tryAgainLater");
    }
  }, [savedPdfUri, triggerMediumHaptic, showMessageError, t]);

  // ─── Transfer PDF view ───
  const handleViewTransferPdf = useCallback(() => {
    if (!rawTransactionId) return;
    console.log(
      "rawTransactionId in side transfer result =====> :",
      rawTransactionId,
    );
    triggerMediumHaptic();
    router.push({
      pathname: "/(root)/(tabs)/(home)/transfer-view-pdf" as any,
      params: { transferId: rawTransactionId },
    });
  }, [rawTransactionId, triggerMediumHaptic]);

  const handleStartFirstTransferToNewBeneficiary = useCallback(() => {
    triggerMediumHaptic();
    router.navigate({
      pathname: "/(root)/(tabs)/(home)/send-money" as any,
      params: {
        beneficiaryRib: parsedData?.beneficiaryRib,
      },
    } as any);
  }, [triggerMediumHaptic, parsedData?.beneficiaryRib]);

  const handleAddAnotherBeneficiary = useCallback(() => {
    triggerMediumHaptic();
    router.navigate(ADD_BENEFICIARY_ROUTE);
  }, [triggerMediumHaptic]);

  const handleCreateNewOnError = useCallback(() => {
    triggerMediumHaptic();
    if (actionType === "beneficiary") {
      router.navigate(ADD_BENEFICIARY_ROUTE);
      return;
    }
    if (actionType === "reload") {
      router.navigate("/(root)/(tabs)/(cartes)/reload-card");
      return;
    }
    if (isCardAction) {
      router.navigate("/(root)/(tabs)/(cartes)");
      return;
    }
    if (isSavingPlans) {
      router.navigate("/(root)/(tabs)/(menu)/saving-plans-create");
      return;
    }
    if (isSchooling) {
      router.navigate("/(root)/(tabs)/(menu)/schooling");
      return;
    }
    if (actionType === "bill" || actionType === "bill-recharge") {
      router.navigate("/(root)/(tabs)/(factures)");
      return;
    }
    router.navigate("/(root)/(tabs)/(home)/send-money" as any);
  }, [
    actionType,
    isCardAction,
    isSavingPlans,
    isSchooling,
    triggerMediumHaptic,
  ]);

  const getErrorPrimaryLabel = useCallback(() => {
    if (actionType === "beneficiary")
      return t("transactionResult.action.newBeneficiary");
    if (actionType === "savingPlans" || actionType === "savingPlansResign")
      return t("transactionResult.action.newSavingPlans");
    if (actionType === "reload") return t("transactionResult.action.reload");
    if (actionType === "bill") return t("transactionResult.action.bill");
    if (actionType === "bill-recharge")
      return t("transactionResult.action.bill.recharge");
    if (actionType === "schooling")
      return t(
        "transactionResult.action.retrySchooling",
        "Réessayer le virement",
      );
    if (isCardAction) return t("transactionResult.action.cards");
    if (isSchooling) return t("transactionResult.action.newTransferSchooling");

    return t("transactionResult.action.newTransfer");
  }, [actionType, isCardAction, t]);

  const dateStr = useMemo(() => formatDate(), []);

  // ─── Resolve the status icon for the circle ───
  const StatusIcon = useMemo(() => {
    if (!success) return X;
    if (isTransfer && transferStatus) return statusConfig.icon;
    return Check;
  }, [success, isTransfer, transferStatus, statusConfig.icon]);

  const statusColor = useMemo(() => {
    if (!success) return BankingColors.error;
    if (isTransfer && transferStatus) return statusConfig.color;
    return BankingColors.success;
  }, [success, isTransfer, transferStatus, statusConfig.color]);

  const circleOuterBg = useMemo(() => {
    if (!success) return BankingColors.errorLight;
    if (isTransfer && transferStatus) return statusConfig.bgColor;
    return BankingColors.success + "18";
  }, [success, isTransfer, transferStatus, statusConfig.bgColor]);

  const circleInnerBg = useMemo(() => {
    if (!success) return BankingColors.error + "20";
    if (isTransfer && transferStatus) return statusConfig.bgColorInner;
    return BankingColors.success + "25";
  }, [success, isTransfer, transferStatus, statusConfig.bgColorInner]);

  if (!actionType) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <TText style={{ textAlign: "center" as const, marginTop: 40 }}>
          {t("common.error")}
        </TText>
      </View>
    );
  }

  // ─── For transfer REJECTED/CANCELED: show as error-like UI ───
  const isTransferFailed =
    isTransfer && transferStatus && !statusConfig.isSuccess;

  if (success && !isTransferFailed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Status Icon Circle ─── */}
          <View style={styles.iconWrapper}>
            <View
              style={[styles.circleOuter, { backgroundColor: circleOuterBg }]}
            >
              <View
                style={[styles.circleInner, { backgroundColor: circleInnerBg }]}
              >
                <StatusIcon size={36} color={statusColor} strokeWidth={3} />
              </View>
            </View>
          </View>

          <TText style={styles.successTitle}>{getSuccessTitle()}</TText>
          <TText style={styles.successDesc}>{getSuccessDesc()}</TText>

          {/* ─── Transfer status badge ─── */}
          {isTransfer && transferStatus && transferStatus !== "EXECUTED" && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "15" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <TText style={[styles.statusBadgeText, { color: statusColor }]}>
                {t(`transferStatus.${transferStatus.toLowerCase()}.title`)}
              </TText>
            </View>
          )}

          {showAmount && (
            <View style={styles.detailsCard}>
              <View style={styles.amountSection}>
                <TText style={styles.totalAmountLabel}>
                  {t("transactionResult.totalAmount")}
                </TText>
                <TText style={styles.amountValue}>
                  {formatBalance(amount, "TND")}
                </TText>
              </View>

              <View style={styles.orangeDivider} />

              <View style={styles.detailRows}>
                <View style={styles.detailRow}>
                  <TText style={styles.detailLabel}>
                    {t("transactionResult.date")}
                  </TText>
                  <TText style={styles.detailValue}>{dateStr}</TText>
                </View>

                {/* Show motif from response */}
                {parsedData?.motif && (
                  <View style={styles.detailRow}>
                    <TText style={styles.detailLabel}>
                      {t("transactionResult.motif", "Motif")}
                    </TText>
                    <TText style={styles.detailValue}>{parsedData.motif}</TText>
                  </View>
                )}

                {parsedData?.debitAccount && (
                  <View style={styles.detailRow}>
                    <TText style={styles.detailLabel}>
                      {t("transactionResult.debitAccount")}
                    </TText>
                    <TText style={styles.detailValue}>
                      {parsedData.debitAccount}
                    </TText>
                  </View>
                )}
              </View>
            </View>
          )}

          {showCardDetails && parsedData?.cardName && (
            <View style={styles.detailsCard}>
              <View style={styles.cardIconRow}>
                <View style={styles.cardIconBg}>
                  <CreditCard size={20} color={BankingColors.primary} />
                </View>
                <TText style={styles.cardNameText}>{parsedData.cardName}</TText>
              </View>

              {actionType === "cardModifyLimit" && parsedData.newLimit && (
                <>
                  <View style={styles.orangeDivider} />
                  <View style={styles.detailRow}>
                    <TText style={styles.detailLabel}>
                      {t("transactionSummary.newLimit")}
                    </TText>
                    <TText style={styles.detailValue}>
                      {formatBalance(parsedData.newLimit, "TND")}
                    </TText>
                  </View>
                </>
              )}

              {actionType === "card3DSecure" && parsedData.endDate && (
                <>
                  <View style={styles.orangeDivider} />
                  <View style={styles.detailRow}>
                    <TText style={styles.detailLabel}>
                      {t("transactionSummary.reactivationDate")}
                    </TText>
                    <TText style={styles.detailValue}>
                      {new Date(parsedData.endDate).toLocaleDateString(
                        selectedLanguage ?? undefined,
                      )}
                    </TText>
                  </View>
                </>
              )}
            </View>
          )}

          {showBeneficiaryExtra && (
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <TText style={styles.detailLabel}>
                  {t("beneficiaries.fullName")}
                </TText>
                <TText style={styles.detailValue}>
                  {parsedData?.beneficiaryName ?? "-"}
                </TText>
              </View>
              <View style={styles.detailRow}>
                <TText style={styles.detailLabel}>
                  {t("beneficiaries.rib20")}
                </TText>
                <TText style={styles.detailValue}>
                  {parsedData?.beneficiaryRib ?? "-"}
                </TText>
              </View>
            </View>
          )}

          <View style={styles.actionsSection}>
            {/* ─── Primary action button ─── */}
            {!isChequeRequest && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handlePrimaryAction}
                activeOpacity={0.8}
                testID="primary-action-btn"
              >
                <TText style={styles.primaryBtnText}>
                  {getPrimaryActionLabel()}
                </TText>
                <ArrowRight
                  size={18}
                  color={BankingColors.white}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            )}
            {isSavingPlans && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  router.navigate("/(root)/(tabs)/(menu)/saving-plans-create")
                }
                activeOpacity={0.8}
                testID="secondary-action-btn"
              >
                <TText style={styles.secondaryBtnText}>
                  {t("transactionResult.secondAction.savingPlans")}
                </TText>
                <ArrowRight size={18} color={"black"} strokeWidth={2.5} />
              </TouchableOpacity>
            )}

            {/* ─── Beneficiary: start transfer to new beneficiary ─── */}
            {isBeneficiary && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleStartFirstTransferToNewBeneficiary}
                activeOpacity={0.8}
                testID="start-transfer-to-new-beneficiary-btn"
              >
                <TText
                  style={styles.primaryBtnText}
                  tKey="home.startMakingTransactions"
                />
                <ArrowRight
                  size={18}
                  color={BankingColors.white}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            )}

            {/* ─── Transfer PDF: Download / Share + View ─── */}
            {canDownloadTransferPdf && (
              <View style={styles.secondaryRow}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.secondaryBtnHalf]}
                  onPress={
                    savedPdfUri
                      ? handleShareTransferPdf
                      : handleDownloadTransferPdf
                  }
                  disabled={isDownloadingPdf}
                  activeOpacity={0.7}
                  testID="transfer-download-btn"
                >
                  {isDownloadingPdf ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color={BankingColors.primary}
                      />
                      <TText
                        style={[
                          styles.secondaryBtnText,
                          { color: BankingColors.textSecondary },
                        ]}
                      >
                        {t("transactionResult.downloading", "Téléchargement…")}
                      </TText>
                    </>
                  ) : savedPdfUri ? (
                    <>
                      <Share2
                        size={16}
                        color={BankingColors.text}
                        strokeWidth={2}
                      />
                      <TText style={styles.secondaryBtnText}>
                        {t("transactionResult.share", "Partager")}
                      </TText>
                    </>
                  ) : (
                    <>
                      <Download
                        size={16}
                        color={BankingColors.text}
                        strokeWidth={2}
                      />
                      <TText style={styles.secondaryBtnText}>
                        {t("transactionResult.downloadPdf", "Télécharger")}
                      </TText>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.secondaryBtnHalf]}
                  onPress={handleViewTransferPdf}
                  disabled={isDownloadingPdf}
                  activeOpacity={0.7}
                  testID="transfer-view-pdf-btn"
                >
                  <Eye size={16} color={BankingColors.text} strokeWidth={2} />
                  <TText style={styles.secondaryBtnText}>
                    {t("transactionResult.viewPdf", "Visualiser")}
                  </TText>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Receipt / History (non-transfer) ─── */}
            {(canShare || canView) && !canDownloadTransferPdf && (
              <View style={styles.secondaryRow}>
                {canShare && (
                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      canView
                        ? styles.secondaryBtnHalf
                        : styles.secondaryBtnFull,
                      sharing && { opacity: 0.6 },
                    ]}
                    onPress={handleShareReceipt}
                    disabled={sharing}
                    activeOpacity={0.7}
                    testID="receipt-btn"
                  >
                    <Download
                      size={16}
                      color={BankingColors.text}
                      strokeWidth={2}
                    />
                    <TText style={styles.secondaryBtnText}>
                      {t("transactionResult.receipt")}
                    </TText>
                  </TouchableOpacity>
                )}

                {canView && (
                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      canShare
                        ? styles.secondaryBtnHalf
                        : styles.secondaryBtnFull,
                    ]}
                    onPress={handleViewDetails}
                    activeOpacity={0.7}
                    testID="history-btn"
                  >
                    <Clock
                      size={16}
                      color={BankingColors.text}
                      strokeWidth={2}
                    />
                    <TText style={styles.secondaryBtnText}>
                      {t("transactionResult.history")}
                    </TText>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ─── Transfer: History link below PDF buttons ─── */}
            {canDownloadTransferPdf && (
              <TouchableOpacity
                style={[styles.secondaryBtn, styles.secondaryBtnFull]}
                onPress={handleViewDetails}
                activeOpacity={0.7}
                testID="transfer-history-btn"
              >
                <Clock size={16} color={BankingColors.text} strokeWidth={2} />
                <TText style={styles.secondaryBtnText}>
                  {t("transactionResult.history")}
                </TText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleGoHome}
              activeOpacity={0.6}
              style={styles.homeLinkBtn}
              testID="back-home-btn"
            >
              <TText style={styles.homeLinkText}>
                {t("transactionResult.backToHome")}
              </TText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ❌ ERROR UI (also used for transfer REJECTED/CANCELED and invalid responses)
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrapper}>
          <View
            style={[styles.circleOuter, { backgroundColor: circleOuterBg }]}
          >
            <View
              style={[styles.circleInner, { backgroundColor: circleInnerBg }]}
            >
              <StatusIcon size={36} color={statusColor} strokeWidth={3} />
            </View>
          </View>
        </View>

        <TText style={styles.errorTitle}>
          {isTransferFailed ? getSuccessTitle() : getErrorTitle()}
        </TText>
        {isTransferFailed && (
          <TText style={styles.errorDesc}>{getSuccessDesc()}</TText>
        )}

        {/* ─── Error detail card ─── */}
        {!isTransferFailed && (
          <View style={styles.errorDetailCard}>
            {/* What failed */}
            <TText style={styles.errorDetailActionValue}>
              {t(
                `transactionResult.actionName.${actionType ?? "default"}`,
                t("transactionResult.actionName.default"),
              )}
            </TText>

            <View style={styles.errorDetailDivider} />

            {/* Why it failed */}
            <TText style={styles.errorDetailValue}>
              {getErrorDesc()}
            </TText>
          </View>
        )}
      </ScrollView>

      {/* ─── Buttons pinned at bottom ─── */}
      <View style={[styles.errorActionsBottom, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleCreateNewOnError}
          activeOpacity={0.8}
          testID="error-create-new-btn"
        >
          <Home size={18} color={BankingColors.white} strokeWidth={2} />
          <TText style={styles.primaryBtnText}>
            {getErrorPrimaryLabel()}
          </TText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.6}
          style={styles.homeLinkBtn}
          testID="error-back-home-link"
        >
          <TText style={styles.homeLinkText}>
            {t("transactionResult.backToHome")}
          </TText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CIRCLE_OUTER = 88;
const CIRCLE_INNER = 64;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.huge + Spacing.lg,
    alignItems: "center",
  },

  iconWrapper: {
    marginBottom: Spacing.xxl,
  },
  circleOuter: {
    width: CIRCLE_OUTER,
    height: CIRCLE_OUTER,
    borderRadius: CIRCLE_OUTER / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  circleInner: {
    width: CIRCLE_INNER,
    height: CIRCLE_INNER,
    borderRadius: CIRCLE_INNER / 2,
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Status badge (for PENDING/INIT) ───
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },

  successTitle: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  successDesc: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxxl,
  },

  errorTitle: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  errorDesc: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  // ─── Error detail card ───
  errorDetailCard: {
    width: "100%",
    backgroundColor: BankingColors.error + "18",
    borderWidth: 1.5,
    borderColor: BankingColors.error + "60",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginVertical: 70,
    gap: Spacing.sm,
  },
  errorDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  errorDetailHeaderText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.error,
  },
  errorDetailDivider: {
    height: 1,
    backgroundColor: BankingColors.error + "20",
    marginVertical: Spacing.xs,
  },
  errorDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  errorDetailLabel: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium,
    flex: 0,
    minWidth: 70,
  },
  errorDetailActionValue: {
    fontSize: FontSize.sm,
    color: BankingColors.error,
    fontFamily: FontFamily.semibold,
    textAlign: "center",
  },
  errorDetailValue: {
    fontSize: FontSize.md,
    color: BankingColors.text,
    fontFamily: FontFamily.medium,
    textAlign: "center",
    lineHeight: 26,
  },
  errorCodeBadge: {
    backgroundColor: BankingColors.error + "15",
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  errorCodeText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: BankingColors.error,
  },
  errorDetailRef: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.regular,
    flex: 1,
    textAlign: "right",
  },

  // ─── Retry button (schooling error) ───
  retryBtn: {
    backgroundColor: BankingColors.primary,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    width: "100%",
  },
  retryBtnText: {
    color: BankingColors.white,
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
  },

  detailsCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    width: "100%",
    marginBottom: Spacing.xxl,
    ...Shadow.card,
  },

  amountSection: {
    alignItems: "center",
    paddingBottom: Spacing.lg,
  },
  totalAmountLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  amountValue: {
    fontSize: FontSize.huge,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary,
  },
  amountCurrency: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
  },

  orangeDivider: {
    height: 1.5,
    backgroundColor: BankingColors.primary + "30",
    marginBottom: Spacing.lg,
  },

  detailRows: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "right",
    flexShrink: 1,
  },

  cardIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  cardIconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  cardNameText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    flex: 1,
  },

  actionsSection: {
    width: "100%",
    gap: Spacing.md,
    alignItems: "center",
  },

  primaryBtn: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    width: "100%",
    ...Shadow.button,
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },

  secondaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  secondaryBtn: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg - 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    width: "100%",
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  secondaryBtnHalf: { flex: 1 },
  secondaryBtnFull: { width: "100%" },

  secondaryBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },

  errorActionsBottom: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
    alignItems: "center",
    backgroundColor: BankingColors.background,
    borderTopWidth: 1,
    borderTopColor: BankingColors.borderPale,
  },

  homeLinkBtn: {
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  homeLinkText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textDecorationLine: "underline",
  },

  homeBtn: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    width: "100%",
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  homeBtnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
});
