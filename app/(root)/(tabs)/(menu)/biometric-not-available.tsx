import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import TText from "@/components/TText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Info } from "lucide-react-native";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight, FontFamily } from "@/constants/typography";
import { IconSize, ButtonHeight, BorderRadius } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

export default function BiometricNotAvailableScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const descKey =
    Platform.OS === "web"
      ? "settings.biometricNotAvailable.webDesc"
      : "settings.biometricNotAvailable.mobileDesc";

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <Info
          size={IconSize.huge * 1.67}
          color={BankingColors.warning}
          style={{ marginBottom: Spacing.xxxl }}
        />

        <TText style={styles.title} tKey="settings.biometricNotAvailable.title" />
        <TText style={styles.description} tKey={descKey} />

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <TText style={styles.primaryButtonText} tKey="common.back" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxxl },
  title: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    marginBottom: Spacing.lg,
    color: BankingColors.textPrimary },
  description: {
    fontSize: FontSize.md,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
    color: BankingColors.textSecondary,
    lineHeight: FontSize.md * LineHeight.relaxed },
  primaryButton: {
    alignSelf: "stretch",
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    height: ButtonHeight.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadow.button },
  primaryButtonText: {
    color: BankingColors.white,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold } });
