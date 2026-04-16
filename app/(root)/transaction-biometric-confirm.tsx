// app/(root)/transaction-biometric-confirm.tsx
// ✅ REFACTORED: Uses shared tx-confirm-helpers (no more duplicated logger/utils)
// ✅ REFACTORED: Passes full response + errorCode + transferStatus to result screen
// ✅ REFACTORED: Uses api-error-mapper for error handling

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  BackHandler,
  AccessibilityInfo,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fingerprint } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import TText from "@/components/TText";
import { useAuth } from "@/hooks/auth-store";
import useShowMessage from "@/hooks/useShowMessage";

import {
  initTransactionChallengeApiV2,
  type InitTransactionChallengeBody,
} from "@/services/auth.api";
import { signTransferChallenge } from "@/native/SecureSignModule";

import { useConfirmBillPayment } from "@/hooks/use-billers";
import { useReloadCardConfirm, useConfirmCardAction } from "@/hooks/use-card";
import { useTransferConfirm } from "@/hooks/useTransfer";
import { useSchoolingTransferConfirm } from "@/hooks/use-schooling";
import { useConfirmBeneficiary } from "@/hooks/use-accounts-api";
import { useConfirmChequeBookRequest } from "@/hooks/use-cheques";
import {
  useSavingPlansGlobalConfirm,
  useSavingPlansResignConfirm,
} from "@/hooks/use-saving-plans";

import {
  BankingColors,
  Spacing,
  FontSize,
  FontWeight,
  LineHeight,
  BorderRadius,
  IconSize,
  Shadow,
  FontFamily,
} from "@/constants";

import {
  createTxLogger,
  safeError,
  delay,
  extractData,
  extractBeneficiaryFields,
  maskRib,
  getSmartFallback,
  mapCardActionToResultType,
  getErrorKeysFromCode,
  extractErrorCode,
  serializeResultParams,
  type TransactionConfirmNavData,
  type TransactionType,
  type CardActionType,
  type TxLogger,
  type ResultPayload,
} from "@/utils/tx-confirm-helpers";

const ADD_BENEFICIARY_ROUTE = "/(root)/(tabs)/(home)/add-beneficiary" as any;

export default function TransactionBiometricConfirmScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data?: string }>();

  const { showMessageError, showMessageInfo } = useShowMessage();
  const { deviceId, authState } = useAuth();

  const [isLocalBusy, setIsLocalBusy] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const data = useMemo<TransactionConfirmNavData | null>(() => {
    if (!params.data) return null;
    try {
      const raw = Array.isArray(params.data) ? params.data[0] : params.data;
      return JSON.parse(String(raw));
    } catch {
      return null;
    }
  }, [params.data]);

  const cardAction = data?.action as CardActionType | undefined;

  const billConfirm = useConfirmBillPayment();
  const reloadConfirm = useReloadCardConfirm();
  const transferConfirm = useTransferConfirm();
  const schoolingConfirm = useSchoolingTransferConfirm();
  const beneficiaryConfirm = useConfirmBeneficiary();
  const chequebookConfirm = useConfirmChequeBookRequest();
  const savingPlansCallType =
    data?.transactionType === "savingPlans" &&
    (data as any)?.callType === "UPDATING"
      ? ("UPDATING" as const)
      : ("CREATING" as const);
  const savingPlansConfirm = useSavingPlansGlobalConfirm(
    savingPlansCallType,
    (data as any)?.savingPlanId ?? "",
    (data as any)?.accountId ?? "",
  );
  const savingPlansResignConfirm = useSavingPlansResignConfirm(
    (data as any)?.savingPlanId ?? "",
  );
  const cardActionConfirm = useConfirmCardAction(data?.cardId || "");

  const isLoading =
    isLocalBusy ||
    billConfirm.isPending ||
    reloadConfirm.isPending ||
    transferConfirm.isPending ||
    schoolingConfirm.isPending ||
    beneficiaryConfirm.isPending ||
    cardActionConfirm.isPending ||
    chequebookConfirm.isPending ||
    savingPlansConfirm.isPending ||
    savingPlansResignConfirm.isPending;

  const fallbackRoute = useMemo(() => getSmartFallback(data), [data]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      () => isLoading,
    );
    return () => sub.remove();
  }, [isLoading]);

  const safeReplace = useCallback(
    (to: any) => {
      if (!isLoading) router.replace(to);
    },
    [isLoading, router],
  );

  const goFail = useCallback(async () => {
    await delay(250);
    safeReplace(fallbackRoute as any);
  }, [fallbackRoute, safeReplace]);

  const goResult = useCallback(
    async (payload: ResultPayload) => {
      await delay(250);
      safeReplace({
        pathname: "/transaction-result" as any,
        params: serializeResultParams(payload),
      } as any);
    },
    [safeReplace],
  );

  const goSuccess = useCallback(
    async (
      txType: TransactionType,
      txId: string,
      amount?: string | number,
      responseData?: any,
    ) => {
      if (txType === "cardAction") {
        await goResult({
          success: true,
          actionType: mapCardActionToResultType(cardAction),
          transactionId: txId,
          amount,
          data: responseData,
        });
        return;
      }
      if (txType === "add-beneficiary") {
        await goResult({
          success: true,
          actionType: "beneficiary",
          transactionId: txId,
          message: t("otp_success_add_beneficiary_description"),
          data: responseData,
        });
        return;
      }
      if (txType === "confirm-chequebook") {
        await goResult({
          success: true,
          actionType: "confirm-chequebook",
          transactionId: txId,
          data: {
            ...responseData,
            hideAmount: true,
            hideReceipt: true,
            historyRoute: "/(root)/(tabs)/(menu)/chequebook-requests-history",
          },
        });
        return;
      }
      await goResult({
        success: true,
        actionType: txType,
        transactionId: txId,
        amount,
        transferStatus: responseData?.status,
        data: responseData,
      });
    },
    [goResult, t, cardAction],
  );

  const handleErrorAndRedirect = useCallback(
    (error: any) => {
      const errorCode = extractErrorCode(error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "";
      console.log(
        `❌ BIOMETRIC CONFIRM ERROR - ${data?.transactionType} - errorCode: ${errorCode}`,
      );

      // Special handling for beneficiary already exists - show info and navigate back
      if (
        errorCode === "BENEFICIARY_ALREADY_EXISTS" &&
        data?.transactionType === "add-beneficiary"
      ) {
        showMessageInfo(
          "apiErrors.beneficiaryAlreadyExists.title",
          "apiErrors.beneficiaryAlreadyExists.desc",
        );
        router.replace(ADD_BENEFICIARY_ROUTE);
        return;
      }

      const actionType =
        data?.transactionType === "cardAction"
          ? mapCardActionToResultType(cardAction)
          : (data?.transactionType ?? "transfer");

      goResult({
        success: false,
        actionType,
        errorCode,
        errorMessage,
        transactionId: data?.transactionId ?? data?.requestId ?? "",
        amount: data?.amount,
      });
    },
    [data, cardAction, goResult, showMessageInfo, router],
  );

  const goBeneficiarySuccess = useCallback(
    async (res: any) => {
      const extracted = extractBeneficiaryFields(res);
      if (!extracted.beneficiaryId) throw new Error("Missing beneficiaryId");
      await goResult({
        success: true,
        actionType: "beneficiary",
        message: t("otp_success_add_beneficiary_description"),
        transactionId: extracted.beneficiaryId,
        data: {
          beneficiaryId: extracted.beneficiaryId,
          beneficiaryName: extracted.fullName ?? "",
          beneficiaryRib: extracted.rib ?? "",
        },
      });
    },
    [goResult, t],
  );

  // guards
  useEffect(() => {
    if (!data?.transactionType || !data?.requestId) {
      showMessageError("common.error", "common.missingData");
      goFail();
      return;
    }
    if (Platform.OS === "web") {
      showMessageError("common.error", "common.webNotSupported");
      goFail();
      return;
    }
    if (!deviceId) {
      showMessageError("common.error", "common.missingData");
      goFail();
      return;
    }
    if (!authState?.biometricEnabled) {
      showMessageError("common.error", "biometric.notConfigured");
      goFail();
      return;
    }
    if (!authState?.hasTrustedDevice) {
      showMessageError("common.error", "device.notTrusted");
      goFail();
    }
  }, [
    authState?.biometricEnabled,
    authState?.hasTrustedDevice,
    data?.requestId,
    data?.transactionType,
    deviceId,
    goFail,
    showMessageError,
  ]);

  const buildConfirmPayload = useCallback(
    async (log: TxLogger) => {
      if (!data?.requestId || !deviceId)
        throw new Error("Missing requestId/deviceId");
      const initRes = await initTransactionChallengeApiV2({
        deviceId,
        requestId: data.requestId,
        challengeType: "CHALLENGE",
      });
      if (!initRes?.challengeId || !initRes?.challenge) {
        log.error("challenge.init.invalidResponse", { initRes });
        throw new Error("Invalid challenge init response");
      }
      log.info("challenge.init.ok", { challengeId: initRes.challengeId });
      const proof = await signTransferChallenge(
        data.requestId,
        initRes.challengeId,
        initRes.challenge,
        deviceId,
        { requireBiometric: true },
      );
      if (!proof) {
        log.error("challenge.sign.failed");
        throw new Error("Challenge signing failed");
      }
      log.info("challenge.sign.ok");
      return {
        requestId: data.requestId,
        confirmationMethod: "CHALLENGE" as const,
        challengeConfirmationValue: {
          deviceId,
          challengeId: initRes.challengeId,
          proof,
        },
      };
    },
    [data?.requestId, deviceId],
  );

  const confirmByType = useCallback(
    async (confirmPayload: any, log: TxLogger) => {
      if (!data?.transactionType) throw new Error("Missing transactionType");

      switch (data.transactionType) {
        case "bill":
        case "bill-recharge": {
          const res = await billConfirm.mutateAsync(confirmPayload);
          const d = extractData(res);
          log.info("confirm.success");
          await goSuccess(
            data.transactionType,
            data.transactionId ?? data.requestId,
            d?.paymentAmount ?? data.paymentAmount ?? data.amount,
            d,
          );
          return;
        }
        case "reload": {
          const res = await reloadConfirm.mutateAsync(confirmPayload);
          log.info("confirm.success");
          await goSuccess(
            "reload",
            data.transactionId ?? data.requestId,
            data.amount,
            extractData(res),
          );
          return;
        }
        case "transfer": {
          const res = await transferConfirm.mutateAsync(confirmPayload);
          const d = extractData(res);
          log.info("confirm.success", {
            response: { id: d?.id, status: d?.status },
          });
          await goSuccess(
            "transfer",
            d?.id ?? d?.requestId ?? data.transactionId ?? data.requestId,
            d?.amount ?? data.amount,
            d,
          );
          return;
        }
        case "schooling": {
          const res = await schoolingConfirm.mutateAsync(confirmPayload);
          log.info("confirm.success");
          await goSuccess(
            "schooling",
            data.transactionId ?? data.requestId,
            data.amount,
            extractData(res),
          );
          return;
        }
        case "add-beneficiary": {
          const res = await beneficiaryConfirm.mutateAsync(confirmPayload);
          log.info("confirm.success", {
            response: {
              beneficiaryId: (res as any)?.id,
              rib: maskRib((res as any)?.rib),
            },
          });
          await goBeneficiarySuccess(res);
          return;
        }
        case "cardAction": {
          if (!data.cardId) throw new Error("Missing cardId");
          const res = await cardActionConfirm.mutateAsync(confirmPayload);
          log.info("confirm.success");
          await goSuccess(
            "cardAction",
            data.transactionId ?? data.requestId,
            data.amount,
            extractData(res),
          );
          return;
        }
        case "installment": {
          if (!data.cardId) throw new Error("Missing cardId for installment");
          const res = await cardActionConfirm.mutateAsync(confirmPayload);
          log.info("confirm.success");
          await goSuccess(
            "installment",
            data.transactionId ?? data.requestId,
            data.amount,
            extractData(res),
          );
          return;
        }
        case "confirm-chequebook": {
          const res = await chequebookConfirm.mutateAsync(confirmPayload);
          const d = extractData(res);
          log.info("confirm.success");
          await goSuccess(
            "confirm-chequebook",
            d?.requestId ?? data.transactionId ?? data.requestId,
            data.amount,
            d,
          );
          return;
        }
        case "savingPlans": {
          const res = await savingPlansConfirm.mutateAsync(
            confirmPayload as any,
          );
          const d = extractData(res);
          log.info("confirm.success");
          await goSuccess(
            "savingPlans",
            d?.requestId ?? data.transactionId ?? data.requestId,
            data.amount,
            d,
          );
          return;
        }
        case "savingPlansResign": {
          if (!(data as any).savingPlanId)
            throw new Error("Missing savingPlanId");
          const res = await savingPlansResignConfirm.mutateAsync(
            confirmPayload as any,
          );
          const d = extractData(res);
          log.info("confirm.success");
          await goSuccess(
            "savingPlansResign",
            d?.requestId ?? data.transactionId ?? data.requestId,
            data.amount,
            d,
          );
          return;
        }
        default:
          throw new Error(
            `Unknown transactionType: ${String(data.transactionType)}`,
          );
      }
    },
    [
      billConfirm,
      reloadConfirm,
      transferConfirm,
      schoolingConfirm,
      beneficiaryConfirm,
      cardActionConfirm,
      chequebookConfirm,
      savingPlansConfirm,
      savingPlansResignConfirm,
      data,
      goSuccess,
      goBeneficiarySuccess,
    ],
  );

  const confirmWithBiometric = useCallback(async () => {
    if (!data?.requestId || !data?.transactionType || !deviceId) {
      showMessageError("common.error", "common.missingData");
      goFail();
      return;
    }
    if (isLoading) return;
    setIsLocalBusy(true);
    const log = createTxLogger("TxBiometricConfirm", {
      txType: data.transactionType,
      requestId: data.requestId,
    });
    log.info("confirm.start");

    try {
      const confirmPayload = await buildConfirmPayload(log);
      await confirmByType(confirmPayload, log);
      AccessibilityInfo.announceForAccessibility(t("common.success"));
    } catch (e: any) {
      log.error("confirm.failed", safeError(e));
      const msg = String(e?.message || "");
      if (msg.includes("BIOMETRIC_CANCELLED")) {
        showMessageError("common.error", "biometric.cancelled");
        return;
      }
      handleErrorAndRedirect(e);
    } finally {
      setIsLocalBusy(false);
    }
  }, [
    buildConfirmPayload,
    confirmByType,
    data,
    deviceId,
    goFail,
    isLoading,
    showMessageError,
    handleErrorAndRedirect,
    t,
  ]);

  useEffect(() => {
    if (!data?.requestId || !data?.transactionType) return;
    if (!deviceId) return;
    if (!authState?.biometricEnabled || !authState?.hasTrustedDevice) return;
    if (hasTriggered) return;
    setHasTriggered(true);
    confirmWithBiometric();
  }, [
    authState?.biometricEnabled,
    authState?.hasTrustedDevice,
    confirmWithBiometric,
    data?.requestId,
    data?.transactionType,
    deviceId,
    hasTriggered,
  ]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.topSection}>
        <View style={styles.orbContainer}>
          <View style={styles.orbOuter}>
            <View style={styles.orbMiddle}>
              <View style={styles.orbInner}>
                <Fingerprint
                  size={IconSize.huge * 1.4}
                  color={BankingColors.primary}
                />
              </View>
            </View>
          </View>
        </View>
        <TText style={styles.title} tKey="biometric.confirm.title" />
        <TText style={styles.description} tKey="biometric.confirm.desc" />
      </View>

      <View style={styles.bottomSection}>
        {/* <View style={styles.statusCard}>
          <View style={styles.statusDot}>
            {isLoading ? (
              <ActivityIndicator size="small" color={BankingColors.primary} />
            ) : (
              <View style={styles.statusDotInner} />
            )}
          </View>
          <TText
            style={styles.statusText}
            tKey={isLoading ? "common.verifying" : "biometric.confirm.desc"}
          />
        </View> */}

        <TouchableOpacity
          onPress={confirmWithBiometric}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[BankingColors.primary, BankingColors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.primaryButton, isLoading && { opacity: 0.5 }]}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={BankingColors.white} />
                <TText
                  style={styles.primaryButtonText}
                  tKey="common.verifying"
                />
              </View>
            ) : (
              <TText
                style={styles.primaryButtonText}
                tKey="biometric.confirm"
              />
            )}
          </LinearGradient>
        </TouchableOpacity>

        {!isLoading && (
          <TText
            style={styles.retryText}
            onPress={confirmWithBiometric as any}
            tKey="common.retry"
          />
        )}
      </View>
    </View>
  );
}

const ORB_SIZE = IconSize.huge * 3;
const ORB_MID = ORB_SIZE * 0.72;
const ORB_INNER = ORB_SIZE * 0.48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.surface,
  },
  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxxl,
  },
  orbContainer: {
    marginBottom: Spacing.xxxl,
  },
  orbOuter: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: BankingColors.primary + "0A",
    alignItems: "center",
    justifyContent: "center",
  },
  orbMiddle: {
    width: ORB_MID,
    height: ORB_MID,
    borderRadius: ORB_MID / 2,
    backgroundColor: BankingColors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  orbInner: {
    width: ORB_INNER,
    height: ORB_INNER,
    borderRadius: ORB_INNER / 2,
    backgroundColor: BankingColors.primary + "1F",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    marginBottom: Spacing.sm,
    color: BankingColors.textPrimary,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: FontSize.base,
    textAlign: "center",
    color: BankingColors.textSecondary,
    lineHeight: FontSize.base * LineHeight.relaxed,
    paddingHorizontal: Spacing.lg,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  statusDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BankingColors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BankingColors.primary,
  },
  statusText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },
  primaryButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
    letterSpacing: 0.2,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  retryText: {
    textAlign: "center",
    color: BankingColors.primary,
    fontSize: FontSize.md, // was FontSize.base
    fontFamily: FontFamily.bold, // was FontWeight.semibold
    paddingVertical: Spacing.lg, // was Spacing.xs
    paddingHorizontal: Spacing.xl, // add horizontal padding
  },
});
