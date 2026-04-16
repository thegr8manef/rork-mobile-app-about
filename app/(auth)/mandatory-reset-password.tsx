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
import { passwordArtApi, ApiContactError } from "@/services/auth.api";

export default function MandatoryResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accessToken, refreshToken: _refreshToken } = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
  }>();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  const didNavigateRef = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      console.log("No access token for mandatory-reset-password, redirecting to login");
      showMessageError(
        "mandatoryResetPassword.error",
        "mandatoryResetPassword.errorDescription",
      );
      if (!didNavigateRef.current) {
        didNavigateRef.current = true;
        router.replace("/(auth)/login");
      }
    }
  }, [accessToken, router, showMessageError]);

  const resetMutation = useMutation({
    mutationFn: async ({ password, confirmPassword }: { password: string; confirmPassword: string }) => {
      if (!accessToken) throw new Error("TOKEN_MISSING");
      return passwordArtApi(accessToken, password, confirmPassword);
    },
    onSuccess: () => {
      console.log("Password ART reset success");
      showMessageSuccess(
        "mandatoryResetPassword.success",
        "mandatoryResetPassword.successDescription",
      );
      if (!didNavigateRef.current) {
        didNavigateRef.current = true;
        router.replace("/(auth)/login");
      }
    },
    onError: (error: any) => {
      console.log("Password ART reset error:", error);
      if (error instanceof ApiContactError && error.status >= 400) {
        showMessageError(
          "mandatoryResetPassword.error",
          error.message || "mandatoryResetPassword.errorDescription",
        );
      } else {
        showMessageError(
          "mandatoryResetPassword.error",
          "mandatoryResetPassword.errorDescription",
        );
      }
    } });

  const handleSubmit = (password: string, confirmPassword: string) => {
    if (!resetMutation.isPending) {
      resetMutation.mutate({ password, confirmPassword });
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
            <TText style={styles.title} tKey="mandatoryResetPassword.title" />
            <TText
              style={styles.subtitle}
              tKey="mandatoryResetPassword.subtitle"
            />
          </View>

          <PasswordResetForm
            onSubmit={handleSubmit}
            isPending={resetMutation.isPending}
            submitTKey="mandatoryResetPassword.submit"
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