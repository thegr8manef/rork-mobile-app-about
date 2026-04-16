import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import PinPad from "@/components/PinPad";
import { RefreshCw, MessageSquareCode } from "lucide-react-native";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { IconSize } from "@/constants/sizes";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { loginApiConfirm, resendAuthOtpApi } from "@/services/auth.api";
import { useAuth } from "@/hooks/auth-store";
import * as SecureStore from "expo-secure-store";
import useShowMessage from "@/hooks/useShowMessage";
import type { LoginCompleteResponse } from "@/types/auth.type";
import { SECURE_ACCESS_TOKEN_KEY, SECURE_REFRESH_TOKEN_KEY } from "@/constants/base-url";

export default function VerifyMFA() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showMessageError, showMessageSuccess } = useShowMessage();
  const requestId =
    typeof params.requestId === "string" ? params.requestId : null;

  const {
    deviceId,
    getPendingCredentials,
    completeLogin,
    authState,
    setDeviceOwnership,
    setPreferredLoginMethod } = useAuth();

  const [resetKey, setResetKey] = useState(0);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!requestId) {
      router.navigate("/(auth)/login");
    }
  }, [requestId, router]);

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const i = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [timer]);

  const resendMutation = useMutation({
    mutationFn: async () => {
      if (!requestId) throw new Error("MISSING_REQUEST_ID");
      return resendAuthOtpApi(requestId);
    },
    onSuccess: () => {
      setTimer(60);
      setCanResend(false);
      setResetKey((k) => k + 1);
      showMessageSuccess(t("common.success"), t("verifymfa.otpSent"));
    },
    onError: () => {
      showMessageError(t("common.error"), t("verifymfa.otpSendError"));
    } });

  const navigateAfterLogin = async (res: LoginCompleteResponse) => {
    const isDeviceUsedByAnother = res.isDeviceUsedByAnotherAccount === true;

    if (isDeviceUsedByAnother) {
      await setDeviceOwnership(false);
      await setPreferredLoginMethod("otp");
      router.navigate("/(root)/(tabs)/(home)");
      return;
    }

    await setDeviceOwnership(true);
    await setPreferredLoginMethod("otp");

    const alreadySetUp =
      authState.hasTrustedDevice &&
      (authState.hasPasscode || authState.biometricEnabled);

    if (alreadySetUp) {
      router.navigate("/(root)/(tabs)/(home)");
    } else {
      router.navigate("/(auth)/device-confidence");
    }
  };

  const otpMutation = useMutation({
    mutationFn: async (code: string) => {
 const creds = await getPendingCredentials();
    if (!creds || !requestId) throw new Error("MISSING_CREDS");

    const body = {
      username: creds.username,
      password: creds.password,
      deviceId,
      requestId,
      confirmationType: "totp",
      confirmationValue: code };

    console.log("🔐 /confirm MFA body:", JSON.stringify(body, null, 2));

    return loginApiConfirm(body);
    },
    onSuccess: async (res) => {
      if (res.loginStatus !== "LOGIN_COMPLETE") {
        showMessageError(t("common.error"), t("verifymfa.otpInvalid"));
        setResetKey((k) => k + 1);
        return;
      }

      await SecureStore.setItemAsync(SECURE_ACCESS_TOKEN_KEY, res.token.accessToken);
      await SecureStore.setItemAsync(
        SECURE_REFRESH_TOKEN_KEY,
        res.token.refreshToken,
      );

      await completeLogin(
        res.token.accessToken,
        res.token.refreshToken,
        authState.biometricEnabled,
      );

      await navigateAfterLogin(res as LoginCompleteResponse);
    },
    onError: () => {
      showMessageError(t("common.error"), t("verifymfa.otpInvalid"));
      setResetKey((k) => k + 1);
    } });

  const handleVerify = useCallback(
    (value: string) => {
      if (otpMutation.isPending || value.length !== 6) return;
      otpMutation.mutate(value);
    },
    [otpMutation],
  );

  const handleResend = () => {
    if (!canResend || resendMutation.isPending) return;
    resendMutation.mutate();
  };

  const resendFooter = (
    <View style={styles.resendSection}>
      <TText style={styles.resendText}>
        {canResend
          ? t("verifymfa.resendReady")
          : t("verifymfa.resendTimer", { timer })}
      </TText>

      {canResend && (
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resendMutation.isPending}
        >
          <RefreshCw size={IconSize.sm} color={BankingColors.primary} />
          <TText style={styles.resendButtonText} tKey="verifymfa.resend" />
        </TouchableOpacity>
      )}
    </View>
  );

  const handleBack = useCallback(() => {
    if(router.canGoBack()) {
    router.back();

    }else {
      router.replace('/(auth)/login')
    }
  }, [router]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <PinPad
        title={t("verifymfa.title")}
        subtitle={t("verifymfa.description")}
        digits={6}
        isLoading={otpMutation.isPending}
        disabled={otpMutation.isPending}
        onComplete={handleVerify}
        resetKey={resetKey}
        footerComponent={resendFooter}
        onBack={handleBack}
        iconColor={BankingColors.primary}
        icon={MessageSquareCode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },
  resendSection: {
    alignItems: "center",
    marginBottom: Spacing.sm },
  resendText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    padding: Spacing.sm },
  resendButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary } });
