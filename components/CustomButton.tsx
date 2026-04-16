import React from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle } from "react-native";
import { Download } from "lucide-react-native";

import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { useHaptic } from "@/utils/useHaptic";

type CustomButtonProps = {
  tKey: string;
  onPress?: () => void;
  valid?: boolean;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  icon?: React.ElementType;

  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  /** ✅ Optional: force text color (default = BankingColors.surface) */
  textColor?: string;

  accessibilityLabel?: string;
  marginVertical?: number;
};

export default function CustomButton({
  tKey,
  onPress,
  valid = true,
  loading = false,
  disabled = false,
  variant = "primary",
  marginVertical = 0,
  icon,
  style,
  textStyle,
  textColor = BankingColors.surface, // ✅ default
  accessibilityLabel }: CustomButtonProps) {
  const isDisabled = disabled || !valid || loading || !onPress;
  const { triggerMediumHaptic } = useHaptic();

  const Icon = variant === "secondary" ? (icon ?? Download) : null;

  const handlePress = () => {
    triggerMediumHaptic();
    if (isDisabled || !onPress) return;
    onPress();
  };

  const spinnerColor =
    variant === "secondary" ? BankingColors.primary : BankingColors.surface;

  const baseTextStyle =
    variant === "secondary"
      ? styles.downloadText
      : [styles.submitButtonText, { color: textColor }];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel}
      style={[
        variant === "secondary" ? styles.downloadButton : styles.submitButton,
        isDisabled && styles.disabled,
        { marginVertical },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {Icon && <Icon size={IconSize.md} color={BankingColors.primary} />}
          <TText
            tKey={tKey}
            style={[baseTextStyle as any, textStyle]}
          />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadow.lg },
  submitButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.surface },

  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.primary },
  downloadText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary },

  disabled: { opacity: 0.6 } });
