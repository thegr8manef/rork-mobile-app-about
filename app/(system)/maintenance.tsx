import React, { useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Construction, RefreshCw } from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import TText from "@/components/TText";
import { useAuth } from "@/hooks/auth-store";

export default function MaintenanceScreen() {
  const { useLogout, authState } = useAuth(); // Assume authState gives us the current status
  const logout = useLogout();
  const hasLoggedOut = useRef(false); // Guard to prevent infinite loops
  useFocusEffect(
    useCallback(() => {
      const performLogout = async () => {
        // Only run if we haven't already logged out in this session
        // and if the user is actually authenticated
        if (!hasLoggedOut.current && authState.isAuthenticated) {
          try {
            hasLoggedOut.current = true;
            await logout();
            console.log("Logout successful");
          } catch (err) {
            console.error("Logout failed", err);
            // Reset guard if you want to allow retry on failure
            hasLoggedOut.current = false;
          }
        }
      };

      performLogout();
    }, [logout, authState.isAuthenticated]),
  );

  const onRetry = useCallback(() => {
    router.replace("/(auth)/login");
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Construction
          size={80}
          color={BankingColors.primary}
          strokeWidth={1.5}
        />
      </View>

      <TText tKey="system.maintenanceTitle" style={styles.title} />
      <TText tKey="system.maintenanceSubtitle" style={styles.subtitle} />

      <View style={styles.messageContainer}>
        <TText tKey="system.maintenanceMessage" style={styles.message} />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={onRetry}
        activeOpacity={0.7}
      >
        <RefreshCw size={20} color={BankingColors.white} />
        <TText tKey="system.tryAgain" style={styles.buttonText} />
      </TouchableOpacity>

      <TText tKey="system.thankYou" style={styles.thankYou} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: BankingColors.primaryLight + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl },
  title: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md },
  subtitle: {
    fontSize: FontSize.lg,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl },
  messageContainer: {
    backgroundColor: BankingColors.primaryLight + "08",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.xxl,
    borderLeftWidth: 3,
    borderLeftColor: BankingColors.primary },
  message: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20 },
  button: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minWidth: 180,
    justifyContent: "center" },
  buttonText: {
    color: BankingColors.white,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base },
  thankYou: {
    fontSize: FontSize.md,
    color: BankingColors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xl,
    fontStyle: "italic" as const } });
