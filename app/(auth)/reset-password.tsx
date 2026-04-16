import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert } from "react-native";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  X } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import {
  verifyPasswordResetOtpApi,
  resetPasswordApi } from "@/services/auth.api";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize, ButtonHeight } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";
import useShowMessage from "@/hooks/useShowMessage";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  const { transactionId, token } = useLocalSearchParams<{
    transactionId: string;
    username: string;
    token: string;
  }>();

  const [step, setStep] = useState<"otp" | "password">("otp");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const verifyOtpMutation = useMutation({
    mutationFn: () =>
      verifyPasswordResetOtpApi(transactionId || "", otp.join("")),
    onSuccess: (res) => {
      setResetToken(res.resetToken);
      setStep("password");
    },
    onError: () => {
      //Alert.alert(t("common.error"), t("resetPassword.incorrectOtp"));
      showMessageError(t("common.error"), t("resetPassword.incorrectOtp"));
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } });

  const resetPasswordMutation = useMutation({
    mutationFn: () => resetPasswordApi(resetToken, newPassword),
    onSuccess: (res) => {
      Alert.alert(t("common.success"), t("resetPassword.success"), [
        {
          text: "OK",
          onPress: () => router.navigate("/(auth)/login") },
      ]);
    },
    onError: () => {
      showMessageError(t("common.error"), t("resetPassword.error"));
      //Alert.alert(t("common.error"), t("resetPassword.error"));
    } });

  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const passwordRules = useMemo(() => {
    return {
      minLength: newPassword.length >= 10,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) };
  }, [newPassword]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordRules).every((rule) => rule);
  }, [passwordRules]);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const otpArray = text.slice(0, 6).split("");
      const newOtp = [...otp];
      otpArray.forEach((char, i) => {
        if (index + i < 6 && /^\d*$/.test(char)) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);

      const lastIndex = Math.min(index + otpArray.length, 5);
      inputRefs.current[lastIndex]?.focus();

      if (newOtp.every((digit) => digit !== "")) {
        handleVerifyOtp(newOtp.join(""));
      }
      return;
    }

    if (/^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newOtp.every((digit) => digit !== "")) {
        handleVerifyOtp(newOtp.join(""));
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (otpValue: string) => {
    if (!otpValue || otpValue.length !== 6) {
      showMessageError(
        t("common.error"),
        t("resetPassword.verificationSubtitle"),
      );
      //Alert.alert(t("common.error"), t("resetPassword.verificationSubtitle"));
      return;
    }
    verifyOtpMutation.mutate();
  };

  const handleResetPassword = () => {
    if (!isPasswordValid) {
      showMessageError(t("common.error"), t("resetPassword.rulesError"));
      //Alert.alert(t("common.error"), t("resetPassword.rulesError"));
      return;
    }
    if (newPassword !== confirmPassword) {
      //Alert.alert(t("common.error"), t("resetPassword.mismatch"));
      showMessageError(t("common.error"), t("resetPassword.mismatch"));
      return;
    }
    resetPasswordMutation.mutate();
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
        keyboardShouldPersistTaps="always"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={IconSize.md} color={BankingColors.primary} />
          </TouchableOpacity>

          {step === "otp" ? (
            <>
              <View style={styles.header}>
                <TText
                  style={styles.title}
                  tKey="resetPassword.verificationTitle"
                />
                <TText
                  style={styles.subtitle}
                  tKey="resetPassword.verificationSubtitle"
                />
              </View>

              <View style={styles.form}>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[styles.otpInput, digit && styles.otpInputFilled]}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!verifyOtpMutation.isPending}
                    />
                  ))}
                </View>

                {verifyOtpMutation.isPending && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={BankingColors.primary} />
                    <TText
                      style={styles.loadingText}
                      tKey="resetPassword.verifying"
                    />
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <TText
                  style={styles.title}
                  tKey="resetPassword.newPasswordTitle"
                />
                <TText
                  style={styles.subtitle}
                  tKey="resetPassword.newPasswordSubtitle"
                />
              </View>

              <View style={styles.form}>
                <TText
                  style={styles.label}
                  tKey="resetPassword.newPasswordLabel"
                />
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    placeholder={t("resetPassword.newPasswordPlaceholder")}
                    placeholderTextColor={BankingColors.textSecondary}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeIcon}
                  >
                    {showNewPassword ? (
                      <EyeOff
                        size={IconSize.md}
                        color={BankingColors.textSecondary}
                      />
                    ) : (
                      <Eye
                        size={IconSize.md}
                        color={BankingColors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.rulesContainer}>
                  <TText
                    style={styles.rulesTitle}
                    tKey="resetPassword.rulesTitle"
                  />

                  <View style={styles.ruleItem}>
                    <View
                      style={[
                        styles.ruleIcon,
                        passwordRules.minLength && styles.ruleIconValid,
                      ]}
                    >
                      {passwordRules.minLength ? (
                        <Check size={14} color={BankingColors.white} />
                      ) : (
                        <X size={14} color={BankingColors.textTertiary} />
                      )}
                    </View>
                    <TText
                      style={[
                        styles.ruleText,
                        passwordRules.minLength && styles.ruleTextValid,
                      ]}
                      tKey="resetPassword.rule.minLength"
                    />
                  </View>

                  <View style={styles.ruleItem}>
                    <View
                      style={[
                        styles.ruleIcon,
                        passwordRules.hasUpperCase && styles.ruleIconValid,
                      ]}
                    >
                      {passwordRules.hasUpperCase ? (
                        <Check size={14} color={BankingColors.white} />
                      ) : (
                        <X size={14} color={BankingColors.textTertiary} />
                      )}
                    </View>
                    <TText
                      style={[
                        styles.ruleText,
                        passwordRules.hasUpperCase && styles.ruleTextValid,
                      ]}
                      tKey="resetPassword.rule.uppercase"
                    />
                  </View>

                  <View style={styles.ruleItem}>
                    <View
                      style={[
                        styles.ruleIcon,
                        passwordRules.hasLowerCase && styles.ruleIconValid,
                      ]}
                    >
                      {passwordRules.hasLowerCase ? (
                        <Check size={14} color={BankingColors.white} />
                      ) : (
                        <X size={14} color={BankingColors.textTertiary} />
                      )}
                    </View>
                    <TText
                      style={[
                        styles.ruleText,
                        passwordRules.hasLowerCase && styles.ruleTextValid,
                      ]}
                      tKey="resetPassword.rule.lowercase"
                    />
                  </View>

                  <View style={styles.ruleItem}>
                    <View
                      style={[
                        styles.ruleIcon,
                        passwordRules.hasNumber && styles.ruleIconValid,
                      ]}
                    >
                      {passwordRules.hasNumber ? (
                        <Check size={14} color={BankingColors.white} />
                      ) : (
                        <X size={14} color={BankingColors.textTertiary} />
                      )}
                    </View>
                    <TText
                      style={[
                        styles.ruleText,
                        passwordRules.hasNumber && styles.ruleTextValid,
                      ]}
                      tKey="resetPassword.rule.number"
                    />
                  </View>

                  <View style={styles.ruleItem}>
                    <View
                      style={[
                        styles.ruleIcon,
                        passwordRules.hasSpecialChar && styles.ruleIconValid,
                      ]}
                    >
                      {passwordRules.hasSpecialChar ? (
                        <Check size={14} color={BankingColors.white} />
                      ) : (
                        <X size={14} color={BankingColors.textTertiary} />
                      )}
                    </View>
                    <TText
                      style={[
                        styles.ruleText,
                        passwordRules.hasSpecialChar && styles.ruleTextValid,
                      ]}
                      tKey="resetPassword.rule.special"
                    />
                  </View>
                </View>

                <TText
                  style={styles.label}
                  tKey="resetPassword.confirmPasswordLabel"
                />
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                    placeholderTextColor={BankingColors.textSecondary}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    {showConfirmPassword ? (
                      <EyeOff
                        size={IconSize.md}
                        color={BankingColors.textSecondary}
                      />
                    ) : (
                      <Eye
                        size={IconSize.md}
                        color={BankingColors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!isPasswordValid ||
                      !confirmPassword ||
                      newPassword !== confirmPassword) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={
                    resetPasswordMutation.isPending ||
                    !isPasswordValid ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                >
                  {resetPasswordMutation.isPending ? (
                    <ActivityIndicator color={BankingColors.white} />
                  ) : (
                    <>
                      <TText
                        style={styles.submitButtonText}
                        tKey="resetPassword.modify"
                      />
                      <ArrowRight
                        size={IconSize.md}
                        color={BankingColors.white}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: BankingColors.background },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    ...Shadow.xs },
  header: {
    marginBottom: Spacing.huge },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.sm,
    color: BankingColors.textPrimary },
  subtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    lineHeight: FontSize.base * LineHeight.normal },
  form: {
    gap: Spacing.md },
  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary },
  input: {
    backgroundColor: BankingColors.background,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
    ...Shadow.xs },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.xs },
  passwordInput: {
    flex: 1,
    padding: Spacing.lg,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary },
  eyeIcon: { padding: Spacing.lg },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.xl },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: BankingColors.border,
    borderRadius: BorderRadius.lg,
    textAlign: "center",
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    backgroundColor: BankingColors.background },
  otpInputFilled: {
    borderColor: BankingColors.primary,
    backgroundColor: BankingColors.primary + "05" },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.md },
  loadingText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium },
  demoText: {
    fontSize: FontSize.sm,
    color: BankingColors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xl,
    fontStyle: "italic" as const },
  rulesContainer: {
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border },
  rulesTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm },
  ruleIcon: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.border,
    alignItems: "center",
    justifyContent: "center" },
  ruleIconValid: {
    backgroundColor: BankingColors.success },
  ruleText: {
    fontSize: FontSize.sm,
    color: BankingColors.textTertiary },
  ruleTextValid: {
    color: BankingColors.textPrimary,
    fontFamily: FontFamily.medium },
  submitButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    height: ButtonHeight.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    ...Shadow.button },
  submitButtonText: {
    color: BankingColors.white,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold },
  submitButtonDisabled: {
    backgroundColor: BankingColors.borderMedium,
    opacity: 0.6 } });
