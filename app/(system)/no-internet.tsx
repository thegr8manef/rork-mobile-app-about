import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator } from "react-native";
import { WifiOff } from "lucide-react-native";
import NetInfo from "@react-native-community/netinfo";
import { router, useLocalSearchParams } from "expo-router";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import TText from "@/components/TText";

export default function NoInternetScreen() {
  const { proxySuspected } = useLocalSearchParams<{
    reason?: string;
    proxySuspected?: string;
  }>();

  const isProxySuspected = proxySuspected === "true";
  const [checking, setChecking] = useState(false);

  const onRetry = async () => {
    if (checking) return;

    setChecking(true);

    try {
      const state = await NetInfo.fetch();

      // Treat only explicit false as offline.
      const definitelyOffline =
        state.isConnected === false || state.isInternetReachable === false;

      if (!definitelyOffline) {
        router.replace("/(auth)/login");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <WifiOff size={64} color={BankingColors.primary} />

      <TText tKey="system.noInternetTitle" style={styles.title} />

      <TText
        tKey={
          isProxySuspected ? "system.proxyWarning" : "system.noInternetSubtitle"
        }
        style={styles.subtitle}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={onRetry}
        disabled={checking}
        activeOpacity={0.8}
      >
        {checking ? (
          <ActivityIndicator color={BankingColors.white} />
        ) : (
          <TText tKey="system.tryAgain" style={styles.buttonText} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    gap: Spacing.lg },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    textAlign: "center" },
  subtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 22 },
  button: {
    marginTop: Spacing.lg,
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    minWidth: 160,
    alignItems: "center" },
  buttonText: {
    color: BankingColors.white,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base } });
