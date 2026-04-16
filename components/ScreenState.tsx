import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  AlertCircle,
  Inbox,
  RefreshCcw,
  ArrowLeft,
  LucideIcon,
} from "lucide-react-native";
import TText from "@/components/TText";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  FontFamily,
} from "@/constants";

export type ScreenStateVariant = "error" | "empty";

interface ScreenStateProps {
  variant: ScreenStateVariant;
  /** i18n key for the title */
  titleKey?: string;
  /** raw string title (fallback if no i18n key) */
  title?: string;
  /** i18n key for description */
  descriptionKey?: string;
  /** raw string description */
  description?: string;
  onRetry?: () => void;
  onBack?: () => void;
  /** Override the default icon */
  icon?: LucideIcon;
  isRetrying?: boolean;
}

export default function ScreenState({
  variant,
  titleKey,
  title,
  descriptionKey,
  description,
  onRetry,
  onBack,
  icon,
  isRetrying = false,
}: ScreenStateProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 18,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isError = variant === "error";
  const DefaultIcon = isError ? AlertCircle : Inbox;
  const Icon = icon ?? DefaultIcon;

  const iconBg = isError ? "#FEF2F2" : BankingColors.surfaceSecondary ?? "#F1F5F9";
  const iconColor = isError ? BankingColors.error : BankingColors.textTertiary ?? "#9CA3AF";

  return (
    <Animated.View
      style={[
        styles.wrap,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.card}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Icon size={28} color={iconColor} strokeWidth={1.6} />
        </View>

        {titleKey ? (
          <TText style={styles.title} tKey={titleKey} />
        ) : title ? (
          <TText style={styles.title}>{title}</TText>
        ) : null}

        {descriptionKey ? (
          <TText style={styles.desc} tKey={descriptionKey} />
        ) : description ? (
          <TText style={styles.desc}>{description}</TText>
        ) : null}

        {(onBack || onRetry) && (
          <View style={styles.actions}>
            {onBack && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <ArrowLeft size={16} color={BankingColors.text} />
                <TText style={styles.secondaryText} tKey="common.back" />
              </TouchableOpacity>
            )}
            {onRetry && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onRetry}
                disabled={isRetrying}
                activeOpacity={0.85}
              >
                <RefreshCcw size={16} color={BankingColors.white} />
                <TText style={styles.primaryText} tKey="common.retry" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  desc: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: BankingColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  primaryText: {
    color: BankingColors.white,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#F1F5F9",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  secondaryText: {
    color: BankingColors.text,
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
  },
});
