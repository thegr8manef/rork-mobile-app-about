import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  AvatarSize, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { height } from "@/utils/scale";
import * as Haptics from "expo-haptics";

// ✅ Same minHeight as AccountCard so layout doesn't shift
const CARD_MIN_HEIGHT = height / 6;

interface AccountErrorCardProps {
  onRetry: () => void;
}

export default function AccountErrorCard({ onRetry }: AccountErrorCardProps) {
  const handleRetry = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onRetry();
  };

  return (
    <View style={styles.container}>
      {/* ✅ Same design as RecentTransactions error state */}
      <View style={styles.iconContainer}>
        <AlertCircle
          size={AvatarSize.md}
          color={BankingColors.error}
          strokeWidth={1.5}
        />
      </View>

      <TText tKey="common.errorTitle" style={styles.title} />
      <TText tKey="common.errorDescription" style={styles.description} />

      <TouchableOpacity
        onPress={handleRetry}
        style={styles.ctaButton}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <RefreshCw
            size={16}
            color={BankingColors.surface}
            style={{ marginRight: 8 }}
          />
          <TText tKey="common.retry" style={styles.ctaButtonText} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ✅ Matches RecentTransactions emptyState + errorIconContainer design
  // Also has minHeight matching AccountCard so nothing shifts
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
    minHeight: CARD_MIN_HEIGHT },
  iconContainer: {
    width: AvatarSize.xl,
    height: AvatarSize.xl,
    borderRadius: AvatarSize.xl / 2,
    backgroundColor: `${BankingColors.error}10`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    textAlign: "center" },
  description: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl },
  ctaButton: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
    minWidth: 200 },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center" },
  ctaButtonText: {
    color: BankingColors.surface,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    textAlign: "center" } });