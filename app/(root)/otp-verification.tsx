// app/(root)/otp-verification.tsx
// ✅ REFACTORED: Uses shared tx-confirm-helpers (no more duplicated logger/utils)
// ✅ REFACTORED: Passes full response + errorCode + transferStatus to result screen
// ✅ REFACTORED: Uses api-error-mapper for error handling
// ✅ FIXED: `if ((errorCode = "CREATE_CHEQUE_BOOK_ERROR"))` assignment bug → now uses mapper

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo } from "react-native";
import { RefreshCw, MessageSquareCode } from "lucide-react-native";
import { Stack, router, useGlobalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { BankingColors, Spacing, FontSize, FontFamily } from "@/constants";

import {
  useSavingPlansGlobalConfirm,
  useSavingPlansResignConfirm } from "@/hooks/use-saving-plans";

import { useConfirmBeneficiary } from "@/hooks/use-accounts-api";
import { useTransferConfirm } from "@/hooks/useTransfer";
import { useConfirmBillPayment } from "@/hooks/use-billers";
import { useSchoolingTransferConfirm } from "@/hooks/use-schooling";
import { useConfirmChequeBookRequest } from "@/hooks/use-cheques";
import { useConfirmCardAction, useReloadCardConfirm } from "@/hooks/use-card";

import { useHaptic } from "@/utils/useHaptic";
import TText from "@/components/TText";
import PinPad from "@/components/PinPad";
import useShowMessage from "@/hooks/useShowMessage";
import { resendOtpApi } from "@/services/auth.api";
import { getAccessToken } from "@/services/lib/getToken";

import {
  extractData,
  extractBeneficiaryFields,
  safeStr,
  safeParseJson,
  getDefaultFallback,
  mapCardActionToResultType,
  getErrorKeysFromCode,
  extractErrorCode,
  serializeResultParams,
  type ResultPayload,
  type CardActionType } from "@/utils/tx-confirm-helpers";

type ActionType =
  | "transfer"
  | "add-beneficiary"
  | "delete-beneficiary"
  | "bill"
  | "bill-recharge"
  | "reload"
  | "schooling"
  | "confirm-chequebook"
  | "cardAction"
  | "installment"
  | "savingPlans"
  | "savingPlansResign";

const OTP_TTL_SECONDS = 120;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 3;

const SUCCESS_TITLE: Record<ActionType, string> = {
  "add-beneficiary": "otp_success_add_beneficiary_title",
  "delete-beneficiary": "otp_success_delete_beneficiary_title",
  transfer: "otp_success_transfer_title",
  bill: "otp_success_bill_title",
  "bill-recharge": "otp_success_bill_title.recharge",
  reload: "otp_success_reload_title",
  schooling: "otp_success_schooling_title",
  "confirm-chequebook": "otp_success_chequebook_title",
  cardAction: "otp_success_card_action_title",
  installment: "otp_success_installment_title",
  savingPlans: "otp_success_savingPlans_title",
  savingPlansResign: "otp_success_savingPlans_title" };

const SUCCESS_DESC: Record<ActionType, string> = {
  "add-beneficiary": "otp_success_add_beneficiary_description",
  "delete-beneficiary": "otp_success_delete_beneficiary_description",
  transfer: "otp_success_transfer_description",
  bill: "otp_success_bill_description",
  "bill-recharge": "otp_success_bill_description_recharge",
  reload: "otp_success_reload_description",
  schooling: "otp_success_schooling_description",
  "confirm-chequebook": "otp_success_chequebook_description",
  cardAction: "otp_success_card_action_description",
  installment: "otp_success_installment_description",
  savingPlans: "otp_success_savingPlans_description",
  savingPlansResign: "otp_success_savingPlans_description" };

/** OTP-specific wrong code error codes */
const WRONG_OTP_CODES = new Set([
  "PAYMENT_CONFIRMATION_FAILED",
  "INVALID_OTP",
  "OTP_MISMATCH",
  "WRONG_OTP",
]);

export default function OTPVerificationScreen() {
  const insets = useSafeAreaInsets();
  const params = useGlobalSearchParams();
  const { t } = useTranslation();

  const verifyLockRef = useRef(false);

  const { triggerErrorHaptic, triggerMediumHaptic, triggerSuccessHaptic } =
    useHaptic();
  const { showMessageError } = useShowMessage();

  const actionType = params.actionType as ActionType | undefined;

  const actionData = useMemo(() => {
    if (!params.data) return null;
    try {
      const raw = Array.isArray(params.data) ? params.data[0] : params.data;
      return JSON.parse(String(raw));
    } catch {
      return null;
    }
  }, [params.data]);

  const returnParamsObj = useMemo(() => {
    const raw = safeStr(actionData?.returnParams);
    return raw ? safeParseJson(raw) : null;
  }, [actionData?.returnParams]);

  const cardAction = actionData?.action as CardActionType | undefined;

  const confirmBeneficiary = useConfirmBeneficiary();
  const transferConfirmMutation = useTransferConfirm();
  const confirmBillPaymentMutation = useConfirmBillPayment();
  const schoolingTransferConfirmMutation = useSchoolingTransferConfirm();
  const confirmChequeBookMutation = useConfirmChequeBookRequest();
  const confirmCardActionMutation = useConfirmCardAction(actionData?.cardId);
  const reloadCardConfirmMutation = useReloadCardConfirm();

  const savingPlansCallType =
    actionType === "savingPlans" && actionData?.callType === "UPDATING"
      ? ("UPDATING" as const)
      : ("CREATING" as const);
  const savingPlansConfirmMutation = useSavingPlansGlobalConfirm(
    savingPlansCallType,
    actionData?.savingPlanId,
    actionData?.accountId,
  );
  const savingPlansResignConfirmMutation = useSavingPlansResignConfirm(
    actionData?.savingPlanId,
  );

  const [timer, setTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const [otpTTL, setOtpTTL] = useState(OTP_TTL_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const isBusy =
    isVerifying ||
    confirmBeneficiary.isPending ||
    transferConfirmMutation.isPending ||
    confirmBillPaymentMutation.isPending ||
    schoolingTransferConfirmMutation.isPending ||
    confirmChequeBookMutation.isPending ||
    confirmCardActionMutation.isPending ||
    reloadCardConfirmMutation.isPending ||
    savingPlansConfirmMutation.isPending ||
    savingPlansResignConfirmMutation.isPending;

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const i = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [timer]);

  useEffect(() => {
    if (otpTTL <= 0) {
      triggerErrorHaptic();
      showMessageError("otp_expired_title", "otp_expired_description");
      setResetKey((k) => k + 1);
      setCanResend(true);
      return;
    }
    const i = setInterval(() => setOtpTTL((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [otpTTL, triggerErrorHaptic, showMessageError]);

  const restartTimer = () => {
    setTimer(RESEND_COOLDOWN_SECONDS);
    setOtpTTL(OTP_TTL_SECONDS);
    setCanResend(false);
  };

  const getRedirectPath = useCallback((): string => {
    return getDefaultFallback(actionType);
  }, [actionType]);

  const handleClose = useCallback(() => {
    // if (actionType === "transfer" || actionType === "add-beneficiary") {
    //   router.replace("/(root)/(tabs)/(home)/send-money" as any);
    //   return;
    // }
    router.back();
  }, [actionType]);

  const goResult = useCallback((payload: ResultPayload) => {
    router.replace({
      pathname: "/transaction-result" as any,
      params: serializeResultParams(payload) } as any);
  }, []);

  const goErrorResult = useCallback(
    (errorCode: string, errorMessage: string) => {
      const resultActionType =
        actionType === "cardAction"
          ? mapCardActionToResultType(cardAction)
          : actionType === "add-beneficiary"
            ? "beneficiary"
            : (actionType ?? "transfer");

      goResult({
        success: false,
        actionType: resultActionType,
        errorCode,
        errorMessage,
        transactionId: (actionData?.transactionId ??
          actionData?.requestId ??
          (params.requestId as string) ??
          "") as string,
        amount: actionData?.amount });
    },
    [actionType, cardAction, actionData, params.requestId, goResult],
  );

  // ─── Error handler using api-error-mapper + OTP-specific wrong-code logic ───
const handleErrorAndRedirect = useCallback(
    (error: any) => {
      const errorCode = extractErrorCode(error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "";

      console.log(`❌ OTP ERROR - ${actionType} - errorCode: ${errorCode}`);

      const isWrongOtpError = WRONG_OTP_CODES.has(errorCode);

      if (isWrongOtpError) {
        const newAttemptCount = failedAttempts + 1;
        setFailedAttempts(newAttemptCount);

        if (newAttemptCount >= MAX_ATTEMPTS) {
          showMessageError("otp_max_attempts_title", "otp_max_attempts_desc");
          setTimeout(() => {
            setIsVerifying(false);
            verifyLockRef.current = false;
            goErrorResult(errorCode, errorMessage);
          }, 1500);
        } else {
          const remaining = MAX_ATTEMPTS - newAttemptCount;
          showMessageError(
            "otp_incorrect_title",
            t("otp_incorrect_remaining", { count: remaining }),
          );
          // Reset pin + unlock AFTER a delay so keypad doesn't flash
          setTimeout(() => {
            setResetKey((k) => k + 1);
            setIsVerifying(false);
            verifyLockRef.current = false;
          }, 600);
        }
        return;
      }

      // Non-OTP error → navigate to error result, keep loading until gone
      setIsVerifying(false);
      verifyLockRef.current = false;
      goErrorResult(errorCode, errorMessage);
    },
    [actionType, failedAttempts, showMessageError, goErrorResult, t],
  );

  const handleVerify = useCallback(
    async (otpValue: string) => {
      if (!actionType) return;
      if (isBusy) return;
      if (otpTTL <= 0) return;

      const otp = otpValue.trim();
      if (otp.length !== 6) return;
      if (verifyLockRef.current) return;
      verifyLockRef.current = true;
      setIsVerifying(true);

      try {
        switch (actionType) {
          case "add-beneficiary": {
            const reqId = (actionData?.requestId || params.requestId) as string;
            if (!reqId) throw new Error("Missing requestId");

            const res = await confirmBeneficiary.mutateAsync({
              requestId: reqId,
              confirmationMethod: "TOTP",
              confirmationValue: otp } as any);

            const extracted = extractBeneficiaryFields(res);
            if (!extracted.beneficiaryId)
              throw new Error("Missing beneficiaryId");

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(
              t(SUCCESS_TITLE["add-beneficiary"]),
            );

            goResult({
              success: true,
              actionType: "beneficiary",
              message: t(SUCCESS_DESC["add-beneficiary"]),
              transactionId: extracted.beneficiaryId,
              data: {
                beneficiaryId: extracted.beneficiaryId,
                beneficiaryName: extracted.fullName ?? "",
                beneficiaryRib: extracted.rib ?? "" } });
            return;
          }

          case "delete-beneficiary":
            throw new Error("delete-beneficiary confirm not implemented here");

          case "transfer": {
            const requestId = (actionData?.requestId ||
              params.requestId) as string;
            if (!requestId) throw new Error("Missing requestId");

            const res = await transferConfirmMutation.mutateAsync({
              requestId,
              confirmationMethod: "TOTP",
              confirmationValue: otp });

            const resData = extractData(res);

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(
              t(SUCCESS_TITLE.transfer),
            );

            goResult({
              success: true,
              actionType: "transfer",
              message: t(SUCCESS_DESC.transfer),
              transactionId:
                resData?.id ??
                resData?.requestId ??
                actionData?.transactionId ??
                requestId,
              amount:
                resData?.amount?.toString?.() ??
                actionData?.amount?.toString?.() ??
                "",
              transferStatus: resData?.status,
              data: resData ?? returnParamsObj ?? undefined });
            return;
          }

          case "bill":
          case "bill-recharge": {
            const reqId = (actionData?.requestId || params.requestId) as string;
            if (!reqId) throw new Error("Missing requestId");

            const confirmResponse =
              await confirmBillPaymentMutation.mutateAsync({
                requestId: reqId,
                confirmationMethod: "TOTP",
                confirmationValue: otp } as any);

            const resData = extractData(confirmResponse);

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(
              t(SUCCESS_TITLE[actionType]),
            );

            goResult({
              success: true,
              actionType,
              message: t(SUCCESS_DESC[actionType]),
              transactionId:
                resData?.transactionId ?? actionData?.transactionId ?? reqId,
              amount:
                resData?.paymentAmount?.toString?.() ??
                actionData?.amount?.toString?.() ??
                "",
              data: resData });
            return;
          }

          case "reload": {
            const requestId = (actionData?.requestId ||
              actionData?.reloadId ||
              params.requestId) as string;
            if (!requestId) throw new Error("Missing requestId");

            const res = await reloadCardConfirmMutation.mutateAsync({
              requestId,
              confirmationMethod: "TOTP",
              confirmationValue: otp } as any);

            const resData = extractData(res);

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(t(SUCCESS_TITLE.reload));

            goResult({
              success: true,
              actionType: "reload",
              message: t(SUCCESS_DESC.reload),
              transactionId: requestId,
              amount: actionData?.amount?.toString?.() ?? "",
              data: resData });
            return;
          }

          case "schooling": {
            const reqId = (actionData?.requestId || params.requestId) as string;
            if (!reqId) throw new Error("Missing requestId");

            const res = await schoolingTransferConfirmMutation.mutateAsync({
              requestId: reqId,
              confirmationMethod: "TOTP",
              confirmationValue: otp } as any);

            const resData = extractData(res);

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(
              t(SUCCESS_TITLE.schooling),
            );

            goResult({
              success: true,
              actionType: "schooling",
              message: t(SUCCESS_DESC.schooling),
              transactionId: reqId,
              amount: actionData?.amount?.toString?.() ?? "",
              data: resData });
            return;
          }

          case "confirm-chequebook": {
            const requestId = (actionData?.requestId ||
              params.requestId) as string;
            if (!requestId) throw new Error("Missing requestId");

            const res = await confirmChequeBookMutation.mutateAsync({
              requestId,
              confirmationMethod: "TOTP",
              confirmationValue: otp } as any);

            const resData = extractData(res);

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(
              t(SUCCESS_TITLE["confirm-chequebook"]),
            );

            goResult({
              success: true,
              actionType: "confirm-chequebook",
              message: t(SUCCESS_DESC["confirm-chequebook"]),
              transactionId: requestId,
              data: {
                ...resData,
                hideAmount: true,
                hideReceipt: true,
                historyRoute:
                  "/(root)/(tabs)/(menu)/chequebook-requests-history" } });
            return;
          }

          case "cardAction": {
            const requestId = (actionData?.requestId ||
              params.requestId) as string;
            if (!requestId) throw new Error("Missing requestId");

            const res = await confirmCardActionMutation.mutateAsync({
              requestId,
              confirmationMethod: "TOTP",
              confirmationValue: otp } as any);

            const resData = extractData(res);

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(
              t(SUCCESS_TITLE.cardAction),
            );

            goResult({
              success: true,
              actionType: mapCardActionToResultType(cardAction),
              transactionId: requestId,
              data: {
                ...resData,
                cardName: actionData?.cardName,
                newLimit: actionData?.newLimit,
                endDate: actionData?.endDate } });
            return;
          }

          case "installment": {
            const requestId = (actionData?.requestId ||
              params.requestId) as string;
            if (!requestId) throw new Error("Missing requestId");

            const cardId = actionData?.cardId as string;
            if (!cardId) throw new Error("Missing cardId for installment");

            const res = await confirmCardActionMutation.mutateAsync({
              requestId,
              confirmationMethod: "TOTP",
              confirmationValue: otp } as any);

            const resData = extractData(res);

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(
              t(SUCCESS_TITLE.installment),
            );

            goResult({
              success: true,
              actionType: "installment",
              message: t(SUCCESS_DESC.installment),
              transactionId: requestId,
              data: resData });
            return;
          }

          case "savingPlans": {
            const reqId = (actionData?.requestId || params.requestId) as string;
            if (!reqId) throw new Error("Missing requestId");

            const res = await savingPlansConfirmMutation.mutateAsync({
              requestId: reqId,
              confirmationMethod: "TOTP",
              confirmationValue: otp } as any);

            const resData = extractData(res);

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(
              t(SUCCESS_TITLE.savingPlans),
            );

            goResult({
              success: true,
              actionType: "savingPlans",
              message: t(SUCCESS_DESC.savingPlans),
              transactionId: reqId,
              data: resData });
            return;
          }

          case "savingPlansResign": {
            const reqId = (actionData?.requestId || params.requestId) as string;
            const planId = (actionData?.savingPlanId ||
              params.savingPlanId) as string;
            if (!reqId) throw new Error("Missing requestId");
            if (!planId) throw new Error("Missing savingPlanId");

            const res = await savingPlansResignConfirmMutation.mutateAsync({
              savingPlanId: planId,
              requestId: reqId,
              confirmationMethod: "TOTP",
              confirmationValue: otp } as any);

            const resData = extractData(res);

            triggerSuccessHaptic();
            AccessibilityInfo.announceForAccessibility(
              t(SUCCESS_TITLE.savingPlansResign),
            );

            goResult({
              success: true,
              actionType: "savingPlansResign",
              message: t(SUCCESS_DESC.savingPlansResign),
              transactionId: reqId,
              data: resData });
            return;
          }

          default:
            throw new Error(`Unhandled actionType: ${String(actionType)}`);
        }
      } catch (e) {
         triggerErrorHaptic();
        handleErrorAndRedirect(e);
      }
    },
    [
      actionType,
      isBusy,
      otpTTL,
      actionData,
      params.requestId,
      confirmBeneficiary,
      transferConfirmMutation,
      confirmBillPaymentMutation,
      schoolingTransferConfirmMutation,
      confirmChequeBookMutation,
      confirmCardActionMutation,
      reloadCardConfirmMutation,
      savingPlansConfirmMutation,
      savingPlansResignConfirmMutation,
      triggerSuccessHaptic,
      triggerErrorHaptic,
      handleErrorAndRedirect,
      goResult,
      returnParamsObj,
      cardAction,
      t,
    ],
  );

  if (!actionType) {
    return (
      <View style={[styles.center, { flex: 1, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
      </View>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const resendFooter = (
    <View style={styles.resendSection}>
      {canResend ? (
        <TouchableOpacity
          style={styles.resendButton}
          onPress={async () => {
            if (isBusy) return;
            triggerMediumHaptic();
            try {
              const token = await getAccessToken();
              if (token) await resendOtpApi(token);
            } catch (e) {
              console.log("Resend OTP error:", e);
            }
            restartTimer();
            setResetKey((k) => k + 1);
            verifyLockRef.current = false;
            setFailedAttempts(0);
          }}
          disabled={isBusy}
        >
          <RefreshCw size={16} color={BankingColors.primary} />
          <TText style={styles.resendButtonText} tKey="otp_resend_button" />
        </TouchableOpacity>
      ) : (
        <TText style={styles.footerText}>
          {t("verifymfa.resendTimer", { timer })}
        </TText>
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          autoHideHomeIndicator: true }}
      />
      <View style={styles.pinPadWrapper}>
        <PinPad
          title={t("otp_title")}
          subtitle={t("otp_subtitle")}
          digits={6}
          isLoading={isBusy}
          disabled={isBusy}
          onComplete={handleVerify}
          resetKey={resetKey}
          onBack={handleClose}
          footerComponent={resendFooter}
          iconColor={BankingColors.primary}
          icon={MessageSquareCode}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  center: { justifyContent: "center", alignItems: "center" },
  resendSection: { alignItems: "center", marginBottom: Spacing.sm },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.sm },
  resendButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary },
  footerText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "center" as const },
  pinPadWrapper: {
    flex: 1,
    justifyContent: "center" } });
