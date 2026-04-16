// app/(root)/transaction-passcode-confirm.tsx
// ✅ REFACTORED: Uses shared tx-confirm-helpers (no more duplicated logger/utils)
// ✅ REFACTORED: Passes full response + errorCode + transferStatus to result screen
// ✅ REFACTORED: Uses api-error-mapper for error handling

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  BackHandler,
  AccessibilityInfo,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { useTranslation } from "react-i18next";

import PinPad from "@/components/PinPad";
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

import { BankingColors } from "@/constants";
import { PASSCODE_HASH_KEY, PASSCODE_SALT_KEY } from "@/constants/base-url";

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

export default function TransactionPasscodeConfirmScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data?: string }>();

  const { deviceId, authState } = useAuth();
  const { showMessageError, showMessageInfo } = useShowMessage();

  const [resetKey, setResetKey] = useState(0);
  const [isLocalBusy, setIsLocalBusy] = useState(false);
  const resetOtp = () => setResetKey((k) => k + 1);

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
    (data as any)?.savingPlanId,
    (data as any)?.accountId,
  );
  const savingPlansResignConfirm = useSavingPlansResignConfirm(
    (data as any)?.savingPlanId,
  );
  const cardActionConfirm = useConfirmCardAction(data?.cardId || "");

  const isLoading =
    isLocalBusy ||
    billConfirm.isPending ||
    reloadConfirm.isPending ||
    transferConfirm.isPending ||
    schoolingConfirm.isPending ||
    beneficiaryConfirm.isPending ||
    chequebookConfirm.isPending ||
    savingPlansConfirm.isPending ||
    savingPlansResignConfirm.isPending ||
    cardActionConfirm.isPending;

  const fallbackRoute = useMemo(() => getSmartFallback(data), [data]);

  const goFail = useCallback(async () => {
    await delay(150);
    router.replace(fallbackRoute as any);
  }, [fallbackRoute, router]);

  const goResult = useCallback(
    async (payload: ResultPayload) => {
      await delay(150);
      router.replace({
        pathname: "/transaction-result" as any,
        params: serializeResultParams(payload),
      } as any);
    },
    [router],
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
    [goResult, cardAction],
  );

  const handleErrorAndRedirect = useCallback(
    (error: any) => {
      const errorCode = extractErrorCode(error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "";
      console.log(
        `❌ PASSCODE CONFIRM ERROR - ${data?.transactionType} - errorCode: ${errorCode}`,
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

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      () => isLoading,
    );
    return () => sub.remove();
  }, [isLoading]);

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
    if (!authState?.hasPasscode) {
      showMessageError("common.error", "passcode.notConfigured");
      goFail();
      return;
    }
    if (!authState?.hasTrustedDevice) {
      showMessageError("common.error", "device.notTrusted");
      goFail();
    }
  }, [
    authState?.hasPasscode,
    authState?.hasTrustedDevice,
    data?.requestId,
    data?.transactionType,
    deviceId,
    goFail,
    showMessageError,
  ]);

  const verifyPasscodeLocal = useCallback(async (passcode: string) => {
    if (Platform.OS === "web") return false;
    const salt = await SecureStore.getItemAsync(PASSCODE_SALT_KEY);
    const storedHash = await SecureStore.getItemAsync(PASSCODE_HASH_KEY);
    if (!salt || !storedHash) return false;
    const inputHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${passcode}`,
    );
    return inputHash === storedHash;
  }, []);

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
        { requireBiometric: false },
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
            d?.paymentAmount ?? data.amount,
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
          console.log(
            "==============================================================",
          );
          console.log(
            "🔍 TRANSFER FULL RESPONSE:",
            JSON.stringify(res, null, 2),
          );
          console.log(
            "==============================================================",
          );

          console.log(
            "🔍 TRANSFER EXTRACTED DATA:",
            JSON.stringify(d, null, 2),
          );
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
      chequebookConfirm,
      savingPlansConfirm,
      savingPlansResignConfirm,
      cardActionConfirm,
      data,
      goSuccess,
      goBeneficiarySuccess,
    ],
  );

  const confirmWithChallenge = useCallback(async () => {
    if (!data?.requestId || !data?.transactionType || !deviceId) {
      showMessageError("common.error", "common.missingData");
      goFail();
      return;
    }
    if (isLoading) return;
    setIsLocalBusy(true);
    const log = createTxLogger("TxPasscodeConfirm", {
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
      resetOtp();
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

  const handlePasscodeSubmit = useCallback(
    async (passcode: string) => {
      if (!passcode || passcode.length !== 6 || isLoading) return;
      const log = createTxLogger("TxPasscodeConfirm:passcode", {
        requestId: data?.requestId,
        txType: data?.transactionType,
      });
      try {
        const ok = await verifyPasscodeLocal(passcode);
        if (!ok) {
          log.warn("passcode.invalid");
          showMessageError("common.error", "passcode.login.incorrect");
          resetOtp();
          return;
        }
        log.info("passcode.ok");
        await confirmWithChallenge();
      } catch (e: any) {
        log.error("passcode.submit.failed", safeError(e));
        showMessageError("common.error", "common.tryAgainLater");
        resetOtp();
      }
    },
    [
      confirmWithChallenge,
      data?.requestId,
      data?.transactionType,
      isLoading,
      showMessageError,
      verifyPasscodeLocal,
    ],
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <PinPad
        title={t("passcode.confirm.title")}
        subtitle={t("passcode.confirm.desc")}
        digits={6}
        isLoading={isLoading}
        disabled={isLoading}
        onComplete={handlePasscodeSubmit}
        resetKey={resetKey}
        footerText={t("common.verifying_secure") ?? undefined}
        iconColor={BankingColors.primary}
        onBack={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
});
