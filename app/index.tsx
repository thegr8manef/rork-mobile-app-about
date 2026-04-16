// app/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/auth-store";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";

import OnboardingStories from "@/components/OnboardingStories";
import { FontFamily } from "@/constants";

export default function Index() {
  const { authState, isBootstrapped, isLoading, markOnboardingSeen } =
    useAuth();

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Decide onboarding only after store is bootstrapped
    const shouldShow =
      isBootstrapped &&
      !authState.isAuthenticated &&
      !authState.hasSeenOnboarding;

    setShowOnboarding(shouldShow);
  }, [isBootstrapped, authState.isAuthenticated, authState.hasSeenOnboarding]);

  const handleOnboardingComplete = async () => {
    await markOnboardingSeen();
    setShowOnboarding(false);
  };

  const debugLines = useMemo(() => {
    return [
      `isBootstrapped: ${String(isBootstrapped)}`,
      `isLoading (actions): ${String(isLoading)}`,
      `isAuthenticated: ${String(authState.isAuthenticated)}`,
      `hasSeenOnboarding: ${String(authState.hasSeenOnboarding)}`,
      `hasPasscode: ${String(authState.hasPasscode)}`,
      `hasTrustedDevice: ${String(authState.hasTrustedDevice)}`,
      `biometricEnabled: ${String(authState.biometricEnabled)}`,
    ];
  }, [
    isBootstrapped,
    isLoading,
    authState.isAuthenticated,
    authState.hasSeenOnboarding,
    authState.hasPasscode,
    authState.hasTrustedDevice,
    authState.biometricEnabled,
  ]);

  // ✅ Boot screen (avoid blank screen during hydration/bootstrap)
  if (!isBootstrapped) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={BankingColors.primary} />
        <TText style={styles.title} tKey="app.starting" />
        <TText style={styles.subtitle} tKey="app.bootstrapping" />

    
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingStories onComplete={handleOnboardingComplete} />
    );
  }

  if (authState.isAuthenticated) {
    return <Redirect href="/(root)/(tabs)/(home)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24 },
  title: {
    marginTop: 14,
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: "#111" },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#666" },
  debugBox: {
    marginTop: 16,
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#f6f6f6",
    borderRadius: 12,
    padding: 12 },
  debugText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 4 } });