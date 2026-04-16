import React, { useState, useMemo } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  X } from "lucide-react-native";

import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize, ButtonHeight } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

interface PasswordResetFormProps {
  onSubmit: (password: string, confirmPassword: string) => void;
  isPending: boolean;
  submitTKey?: string;
  onSkip?: () => void;
  skipTKey?: string;
}

export default function PasswordResetForm({
  onSubmit,
  isPending,
  submitTKey = "resetPassword.modify",
  onSkip,
  skipTKey = "resetPasswordConfirm.skip" }: PasswordResetFormProps) {
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = useMemo(() => ({
    minLength: newPassword.length >= 10,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) }), [newPassword]);

  const isPasswordValid = useMemo(
    () => Object.values(passwordRules).every(Boolean),
    [passwordRules]
  );

  const canSubmit = useMemo(
    () => isPasswordValid && confirmPassword.length > 0 && newPassword === confirmPassword,
    [isPasswordValid, confirmPassword, newPassword]
  );

  const handleSubmit = () => {
    if (canSubmit && !isPending) {
      onSubmit(newPassword, confirmPassword);
    }
  };

  return (
    <View style={styles.form}>
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
          onPress={() => setShowNewPassword((v) => !v)}
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
        <RuleRow ok={passwordRules.minLength} tKey="resetPassword.rule.minLength" />
        <RuleRow ok={passwordRules.hasUpperCase} tKey="resetPassword.rule.uppercase" />
        <RuleRow ok={passwordRules.hasLowerCase} tKey="resetPassword.rule.lowercase" />
        <RuleRow ok={passwordRules.hasNumber} tKey="resetPassword.rule.number" />
        <RuleRow ok={passwordRules.hasSpecialChar} tKey="resetPassword.rule.special" />
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
          onPress={() => setShowConfirmPassword((v) => !v)}
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
          (!canSubmit || isPending) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit || isPending}
      >
        {isPending ? (
          <ActivityIndicator color={BankingColors.white} />
        ) : (
          <>
            <TText style={styles.submitButtonText} tKey={submitTKey} />
            <ArrowRight size={IconSize.md} color={BankingColors.white} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function RuleRow({ ok, tKey }: { ok: boolean; tKey: string }) {
  return (
    <View style={styles.ruleItem}>
      <View style={[styles.ruleIcon, ok && styles.ruleIconValid]}>
        {ok ? (
          <Check size={14} color={BankingColors.white} />
        ) : (
          <X size={14} color={BankingColors.textTertiary} />
        )}
      </View>
      <TText style={[styles.ruleText, ok && styles.ruleTextValid]} tKey={tKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.md },
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
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border },
  rulesTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs },
  ruleItem: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  ruleIcon: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.border,
    alignItems: "center",
    justifyContent: "center" },
  ruleIconValid: { backgroundColor: BankingColors.success },
  ruleText: { fontSize: FontSize.sm, color: BankingColors.textTertiary },
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
    opacity: 0.6 },
  skipButton: {
    alignSelf: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm },
  skipButtonText: {
    color: BankingColors.textSecondary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold } });
