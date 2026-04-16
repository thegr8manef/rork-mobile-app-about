import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TText from "@/components/TText";
import PasswordResetForm from "@/components/auth/PasswordResetForm";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight, FontFamily } from "@/constants/typography";
import useShowMessage from "@/hooks/useShowMessage";
import { useAuth } from "@/hooks/auth-store";
import { generateResetPasswordConfirmApi } from "@/services/auth.api";

export default function ResetPasswordConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showMessageError, showMessageSuccess } = useShowMessage();
  const { deviceId } = useAuth();
  const didNavigateRef = useRef(false);

  const { token, accessToken, refreshToken } = useLocalSearchParams<{
    token: string;
    accessToken?: string;
    refreshToken?: string;
  }>();

  useEffect(() => {
    console.log("ResetPasswordConfirmScreen mounted with token:", token);
    if (!token) {
      console.log("No token provided for reset-password-confirm");
      showMessageError(
        "resetPasswordConfirm.error",
        "resetPasswordConfirm.errorDescription"
      );
      if (!didNavigateRef.current) {

        console.log("Navigating back to login due to missing token");
        didNavigateRef.current = true;
        router.replace("/(auth)/login");
      }
    }
  }, [token, router, showMessageError]);

  const resetMutation = useMutation({
    mutationFn: async ({ password, confirmPassword }: { password: string; confirmPassword: string }) => {
      if (!token) throw new Error("TOKEN_MISSING");
      if (!deviceId) throw new Error("DEVICE_ID_MISSING");

      return generateResetPasswordConfirmApi({
        deviceId,
        token,
        password,
        confirmPassword });
    },
    onSuccess: () => {
      console.log("Reset password confirm success");
      showMessageSuccess(
        "resetPasswordConfirm.success",
        "resetPasswordConfirm.successDescription"
      );
      if (!didNavigateRef.current) {
        didNavigateRef.current = true;
        router.replace({
          pathname: "/(auth)/login"
        });
      }
    },
    onError: (error: any) => {
      console.log('error:', error)
      const errorCode = error?.errorCode ?? error?.response?.data?.errorCode ?? "";
      if (errorCode === "TOKEN_EXPIRED") {
        router.replace("/(auth)/token-expired");
        return;
      }
      showMessageError(
        "resetPasswordConfirm.error",
        "resetPasswordConfirm.errorDescription"
      );
    } });

  const handleSubmit = (password: string, confirmPassword: string) => {
    if (!resetMutation.isPending) {
      resetMutation.mutate({ password, confirmPassword });
    }
  };

  const handleSkip = () => {
    if (!didNavigateRef.current) {
      didNavigateRef.current = true;
      router.replace({
        pathname: "/(auth)/device-confidence",
        params: {
          ...(accessToken ? { accessToken } : {}),
          ...(refreshToken ? { refreshToken } : {}) } });
    }
  };

  return (
    <View style={styles.background}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Image
              source={require("@assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.header}>
            <TText style={styles.title} tKey="resetPasswordConfirm.title" />
            <TText style={styles.subtitle} tKey="resetPasswordConfirm.subtitle" />
          </View>

          <PasswordResetForm
            onSubmit={handleSubmit}
            isPending={resetMutation.isPending}
            submitTKey="resetPasswordConfirm.submit"
            onSkip={handleSkip}
            skipTKey="resetPasswordConfirm.skip"
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: BankingColors.background },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md },
  iconContainer: { alignItems: "center", marginBottom: Spacing.xl },
  logo: { width: 160, height: 45 },
  header: { marginBottom: Spacing.lg, alignItems: "center" },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.sm,
    color: BankingColors.textPrimary,
    textAlign: "center" },
  subtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    lineHeight: FontSize.base * LineHeight.normal,
    textAlign: "center" } });
