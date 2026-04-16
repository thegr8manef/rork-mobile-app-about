import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LucideIcon } from "lucide-react-native";
import TText from "./TText";
import { BankingColors,
  BorderRadius,
  FontSize,
  Spacing, FontFamily } from "@/constants";

interface ConfirmationButtonProps {
  tKey: string;
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function ConfirmationButton({
  tKey,
  icon: Icon,
  onPress,
  disabled = false,
  isLoading = false }: ConfirmationButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={BankingColors.primary} />
      ) : (
        <>
          <Icon size={20}/>
          <TText style={styles.buttonText} tKey={tKey} />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.primary,
    backgroundColor: BankingColors.surface,
    minHeight: 50 },
  buttonDisabled: {
    opacity: 0.5 },
  buttonText: {
    color: BankingColors.primary,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold } });