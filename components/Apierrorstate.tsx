import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react-native";

import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight, FontFamily } from "@/constants/typography";
import { BorderRadius, ButtonHeight } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

interface ApiErrorStateProps {
  /** Main title – defaults to a generic French error */
  title?: string;
  titleTKey?: string;
  /** Description shown below the title */
  description?: string;
  descriptionTKey?: string;
  /** Retry callback – if omitted the retry button is hidden */
  onRetry?: () => void;
  /** Label on the retry button */
  retryLabel?: string;
  retryLabelTKey?: string;
  /** Choose between "network" (wifi-off) or "generic" (alert triangle) icon */
  variant?: "network" | "generic";
  /** Optional loading state for the retry button */
  isRetrying?: boolean;
}

export default function ApiErrorState({
  title,
  titleTKey,
  description,
  descriptionTKey = "apiErrors.generic.desc",
  onRetry,
  retryLabel,
  retryLabelTKey = "common.retry",
  variant = "generic",
  isRetrying = false,
}: ApiErrorStateProps) {
  const IconComponent = variant === "network" ? WifiOff : AlertTriangle;

  return (
    <View style={styles.container}>
      {/* Icon circle */}
      <View style={styles.iconCircleOuter}>
        <View style={styles.iconCircleInner}>
          <IconComponent
            size={32}
            color={BankingColors.primary}
            strokeWidth={1.8}
          />
        </View>
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        {(title || titleTKey) && (
          <TText style={styles.title} tKey={titleTKey}>
            {title}
          </TText>
        )}

        <TText style={styles.description} tKey={descriptionTKey}>
          {description}
        </TText>
      </View>

      {/* Retry button */}
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          onPress={onRetry}
          disabled={isRetrying}
          activeOpacity={0.75}
        >
          <RefreshCw
            size={18}
            color={BankingColors.white}
            style={isRetrying ? styles.spinning : undefined}
          />
          <TText style={styles.retryButtonText} tKey={retryLabelTKey}>
            {retryLabel}
          </TText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },

  /* ── Icon ─────────────────────────────────── */
  iconCircleOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BankingColors.primary + "0A", // 4 % tint
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BankingColors.primary + "15", // 8 % tint
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── Text ─────────────────────────────────── */
  textBlock: {
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    textAlign: "center",
  },
  description: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular ?? "400",
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: FontSize.base * (LineHeight.normal ?? 1.5),
    maxWidth: 280,
  },

  /* ── Retry button ─────────────────────────── */
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    height: ButtonHeight.md ?? 48,
    paddingHorizontal: Spacing.xxl,
    ...Shadow.button,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },

  spinning: {
    // RN doesn't support CSS keyframes natively — you can replace this with
    // a Reanimated rotating animation if desired. This is a placeholder.
    opacity: 0.7,
  },
});
