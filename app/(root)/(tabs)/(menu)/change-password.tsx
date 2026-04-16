import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ArrowRight, Eye, EyeOff, Check, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUpdatePassword } from "@/hooks/use-resetpassword";
import { useAuth } from "@/hooks/auth-store";
import { AxiosError } from "axios";
import useShowMessage from "@/hooks/useShowMessage";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize, ButtonHeight } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

type RuleKey = "minLength" | "hasUpperCase" | "hasLowerCase" | "hasNumber" | "hasSpecialChar";

const RULE_KEYS: { key: RuleKey; tKey: string }[] = [
  { key: "minLength", tKey: "resetPassword.rule.minLength" },
  { key: "hasUpperCase", tKey: "resetPassword.rule.uppercase" },
  { key: "hasLowerCase", tKey: "resetPassword.rule.lowercase" },
  { key: "hasNumber", tKey: "resetPassword.rule.number" },
  { key: "hasSpecialChar", tKey: "resetPassword.rule.special" },
];

function AnimatedRuleItem({
  isValid,
  tKey,
}: {
  isValid: boolean;
  tKey: string;
}) {
  const iconScale = useRef(new Animated.Value(1)).current;
  const wasValid = useRef(false);

  useEffect(() => {
    if (isValid && !wasValid.current) {
      // Just became valid — bounce the check icon only
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    wasValid.current = isValid;
  }, [isValid]);

  return (
    <View style={styles.ruleItem}>
      <Animated.View
        style={[
          styles.ruleIcon,
          isValid && styles.ruleIconValid,
          { transform: [{ scale: iconScale }] },
        ]}
      >
        {isValid ? (
          <Check size={14} color={BankingColors.white} />
        ) : (
          <X size={14} color={BankingColors.textTertiary} />
        )}
      </Animated.View>
      <TText
        style={[styles.ruleText, isValid && styles.ruleTextValid]}
        tKey={tKey}
      />
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { deviceId } = useAuth();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const isDifferentFromCurrent = useMemo(() => {
    return currentPassword && newPassword && currentPassword !== newPassword;
  }, [currentPassword, newPassword]);

  const changePasswordMutation = useUpdatePassword({
    onSuccess: () => {
      showMessageSuccess("common.success", "changePassword.success");
      router.back();
    },
    onError: (error: AxiosError) => {
      const errorCode = (error.response?.data as any)?.errorCode ?? "";
      if (errorCode === "NOT_TRUSTED_DEVICE") {
        showMessageError("common.error", "changePassword.notTrustedDevice");
      } else if (errorCode === "INVALID_INPUT") {
        showMessageError("common.error", "changePassword.incorrectPassword");
      } else {
        showMessageError("common.error", "changePassword.error");
      }
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword) {
      showMessageError("common.error", "changePassword.currentRequired");
      return;
    }
    if (!isPasswordValid) {
      showMessageError("common.error", "resetPassword.rulesError");
      return;
    }
    if (!isDifferentFromCurrent) {
      showMessageError("common.error", "changePassword.mustBeDifferent");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessageError("common.error", "resetPassword.mismatch");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
      deviceId: deviceId ?? "",
    });
  };

  const canSubmit = currentPassword && isPasswordValid && isDifferentFromCurrent && newPassword === confirmPassword;

  return (
    <View style={styles.background}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TText style={styles.title} tKey="changePassword.title" />
            <TText style={styles.subtitle} tKey="changePassword.subtitle" />
          </View>

          <View style={styles.form}>
            <TText style={styles.label} tKey="changePassword.currentLabel" />
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                placeholder={t("changePassword.currentPlaceholder")}
                placeholderTextColor={BankingColors.textSecondary}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeIcon}
              >
                {showCurrentPassword ? (
                  <EyeOff size={IconSize.md} color={BankingColors.textSecondary} />
                ) : (
                  <Eye size={IconSize.md} color={BankingColors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <TText style={styles.label} tKey="resetPassword.newPasswordLabel" />
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
                  <EyeOff size={IconSize.md} color={BankingColors.textSecondary} />
                ) : (
                  <Eye size={IconSize.md} color={BankingColors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.rulesContainer}>
              <TText style={styles.rulesTitle} tKey="resetPassword.rulesTitle" />
              {RULE_KEYS.map(({ key, tKey }) => (
                <AnimatedRuleItem
                  key={key}
                  isValid={passwordRules[key]}
                  tKey={tKey}
                />
              ))}
            </View>

            <TText style={styles.label} tKey="resetPassword.confirmPasswordLabel" />
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
                  <EyeOff size={IconSize.md} color={BankingColors.textSecondary} />
                ) : (
                  <Eye size={IconSize.md} color={BankingColors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={changePasswordMutation.isPending || !canSubmit}
            >
              {changePasswordMutation.isPending ? (
                <ActivityIndicator color={BankingColors.white} />
              ) : (
                <>
                  <TText style={styles.submitButtonText} tKey="resetPassword.modify" />
                  <ArrowRight size={IconSize.md} color={BankingColors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl },
  header: {
    marginBottom: Spacing.xl },
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
  rulesContainer: {
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
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
    gap: Spacing.sm,
    height: 28 },
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
