import React from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import { Mail, AlertCircleIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import TText from "@/components/TText";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText } from "@/components/ui/form-control";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

interface EmailInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void; // ✅ added for keyboard force-open

  label?: string;
  labelTKey?: string;

  placeholder?: string;

  required?: boolean;
  optional?: boolean;
  optionalTKey?: string;

  showLabel?: boolean;
  disabled?: boolean;

  touched?: boolean;
  hasError?: boolean;
  errorTKey?: string;
  errorMessage?: string;

  inputProps?: Omit<TextInputProps, "value" | "onChangeText" | "onBlur">;
}

export default function EmailInput({
  value,
  onChangeText,
  onBlur,
  onFocus, // ✅ added

  label,
  labelTKey = "forgotPassword.emailLabel",
  placeholder,

  required = false,
  optional = false,
  optionalTKey = "notifications.optional",

  showLabel = true,
  disabled = false,

  touched = false,
  hasError = false,
  errorTKey,
  errorMessage,

  inputProps }: EmailInputProps) {
  const { t } = useTranslation();

  const placeholderText = placeholder || t("forgotPassword.emailPlaceholder");

  const showError = !!touched && !!hasError && (!!errorTKey || !!errorMessage);

  return (
    <FormControl isInvalid={showError}>
      {showLabel && (
        <FormControlLabel>
          <FormControlLabelText>
            <View style={styles.labelRow}>
              <Mail size={18} color={BankingColors.primary} />
              <TText style={styles.label} tKey={labelTKey}>
                {label}
              </TText>

              {required && <TText style={styles.requiredAsterisk}>*</TText>}

              {optional && !required && (
                <TText style={styles.optionalText}>({t(optionalTKey)})</TText>
              )}
            </View>
          </FormControlLabelText>
        </FormControlLabel>
      )}

      <TextInput
        style={[
          styles.input,
          showError && styles.inputError,
          disabled && styles.disabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onFocus={onFocus} // ✅ pass through
        placeholder={placeholderText}
        placeholderTextColor={BankingColors.textTertiary}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!disabled}
        {...inputProps}
      />

      {showError && (
        <FormControlError style={styles.errorRow}>
          <FormControlErrorIcon as={AlertCircleIcon} style={styles.errorIcon} />
          <FormControlErrorText style={styles.errorText}>
            {errorMessage ? errorMessage : t(errorTKey as string)}
          </FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm },
  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary },
  requiredAsterisk: {
    fontSize: FontSize.base,
    color: BankingColors.error,
    fontFamily: FontFamily.bold },
  optionalText: {
    fontSize: FontSize.sm,
    color: BankingColors.textTertiary },

  input: {
    backgroundColor: BankingColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
    ...Shadow.xs,
    marginTop: Spacing.sm },
  inputError: {
    borderColor: BankingColors.error },
  disabled: {
    opacity: 0.6 },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm },
  errorIcon: {
    color: BankingColors.error ?? "#E53935" },
  errorText: {
    color: BankingColors.error ?? "#E53935",
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium } });