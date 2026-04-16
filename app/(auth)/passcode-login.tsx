import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, Delete, ArrowLeft } from "lucide-react-native";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { BankingColors,
  Spacing,
  FontSize,
  FontFamily } from "@/constants";

import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/auth-store";
import useShowMessage from "@/hooks/useShowMessage";

const DIGITS = 6;
const DOT_SIZE = 14;
const DOT_SPACING = 16;
const KEY_SIZE = 68;
const KEY_GAP = 18;

export default function PasscodeLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginWithPasscode, authState } = useAuth();
  const { t } = useTranslation();
  const { showMessageError } = useShowMessage();

  const [pin, setPin] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotScales = useRef(
    Array.from({ length: DIGITS }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true }).start();

    const createFloat = (anim: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: -12, duration: dur, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 12, duration: dur, useNativeDriver: true }),
        ])
      );
    createFloat(float1, 3000).start();
    createFloat(float2, 3800).start();
    createFloat(float3, 2600).start();
  }, []);

 useEffect(() => {
  setPin("");
  dotScales.forEach((s) =>
    Animated.timing(s, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true }).start()
  );
}, [resetKey, dotScales]);

  useEffect(() => {
    if (authState.isAuthenticated) {
      router.replace("/(root)/(tabs)/(home)");
    }
  }, [authState.isAuthenticated, router]);

  const passcodeLoginMutation = useMutation({
    mutationFn: async (code: string) => {
      return await loginWithPasscode(code);
    },
    onSuccess: (result) => {
      if (!result) {
        showMessageError(t("common.error"), t("passcode.login.incorrect"));
        setResetKey((k) => k + 1);
        return;
      }

      if (result.status === "SERVICE_UNAVAILABLE") {
        showMessageError(t("common.serviceUnavailableTitle"), t("common.serviceUnavailableDesc"));
        setResetKey((k) => k + 1);
        return;
      }

      if (result.status === "MFA_REQUIRED") {
        router.navigate({
          pathname: "/(auth)/verifymfa",
          params: { transactionId: result.transactionId } });
        return;
      }
    },
    onError: () => {
      showMessageError(t("common.error"), t("passcode.login.error"));
      setResetKey((k) => k + 1);
    } });

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const animateDot = useCallback(
    (index: number, filled: boolean) => {
      Animated.spring(dotScales[index], {
        toValue: filled ? 1 : 0,
        friction: 5,
        tension: 300,
        useNativeDriver: true }).start();
    },
    [dotScales]
  );

  const handlePress = useCallback(
    (key: string) => {
      if (passcodeLoginMutation.isPending) return;
      triggerHaptic();

      if (key === "delete") {
        setPin((prev) => {
          if (prev.length === 0) return prev;
          const newPin = prev.slice(0, -1);
          animateDot(prev.length - 1, false);
          return newPin;
        });
        return;
      }

      setPin((prev) => {
        if (prev.length >= DIGITS) return prev;
        const newPin = prev + key;
        animateDot(prev.length, true);

        if (newPin.length === DIGITS) {
          setTimeout(() => passcodeLoginMutation.mutate(newPin), 150);
        }
        return newPin;
      });
    },
    [passcodeLoginMutation, triggerHaptic, animateDot]
  );

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "delete"],
  ];

  const isLoading = passcodeLoginMutation.isPending;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[BankingColors.primary, BankingColors.primaryDark, "#c42d15"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.floatingCircle, styles.circle1, { transform: [{ translateY: float1 }] }]} />
      <Animated.View style={[styles.floatingCircle, styles.circle2, { transform: [{ translateY: float2 }] }]} />
      <Animated.View style={[styles.floatingCircle, styles.circle3, { transform: [{ translateY: float3 }] }]} />
      <Animated.View style={[styles.floatingShape, styles.shape1, { transform: [{ translateY: float2 }, { rotate: "45deg" }] }]} />
      <Animated.View style={[styles.floatingShape, styles.shape2, { transform: [{ translateY: float1 }, { rotate: "-15deg" }] }]} />

      <Animated.View
        style={[
          styles.container,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.md, opacity: fadeAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.navigate("/(auth)/login")}
          disabled={isLoading}
          activeOpacity={0.6}
          testID="pin-back"
        >
          <ArrowLeft size={22} color={BankingColors.white} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.lockIconWrap}>
            <Lock size={28} color={BankingColors.white} strokeWidth={2.2} />
          </View>

          <TText style={styles.title}>{t("passcode.login.title")}</TText>
          <TText style={styles.subtitle}>{t("passcode.login.description")}</TText>

          <View style={styles.dotsRow}>
            {Array.from({ length: DIGITS }).map((_, i) => {
              const scale = dotScales[i].interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1] });
              return (
                <View key={i} style={styles.dotOuter}>
                  <Animated.View
                    style={[
                      styles.dotFilled,
                      { transform: [{ scale }] },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={BankingColors.white} />
          </View>
        ) : (
          <View style={styles.keypadContainer}>
            {keys.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keyRow}>
                {row.map((key, keyIndex) => {
                  if (key === "") {
                    return <View key={keyIndex} style={styles.keyEmpty} />;
                  }

                  if (key === "delete") {
                    return (
                      <TouchableOpacity
                        key={keyIndex}
                        style={styles.keyButton}
                        onPress={() => handlePress("delete")}
                        disabled={isLoading || pin.length === 0}
                        activeOpacity={0.6}
                        testID="pin-delete"
                      >
                        <Delete
                          size={24}
                          color={
                            pin.length === 0
                              ? BankingColors.whiteTransparent20
                              : BankingColors.white
                          }
                          strokeWidth={1.8}
                        />
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={keyIndex}
                      style={styles.keyButton}
                      onPress={() => handlePress(key)}
                      disabled={isLoading}
                      activeOpacity={0.6}
                      testID={`pin-key-${key}`}
                    >
                      <TText style={styles.keyText}>{key}</TText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.navigate("/(auth)/forgot-password")}
            disabled={isLoading}
          >
            <TText style={styles.forgotButtonText} tKey="passcode.login.forgotPassword" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1 },
  floatingCircle: {
    position: "absolute" as const,
    borderRadius: 999,
    backgroundColor: BankingColors.whiteTransparent10 },
  circle1: { width: 200, height: 200, top: -50, right: -60 },
  circle2: { width: 140, height: 140, top: 220, left: -40 },
  circle3: { width: 80, height: 80, top: 140, right: 40, backgroundColor: BankingColors.whiteTransparent15 },
  floatingShape: {
    position: "absolute" as const,
    backgroundColor: BankingColors.whiteTransparent10,
    borderRadius: 20 },
  shape1: { width: 60, height: 60, top: 380, right: -10 },
  shape2: { width: 100, height: 40, top: 520, left: -30, borderRadius: 10 },
  container: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "space-between" as const },
  backButton: {
    alignSelf: "flex-start" as const,
    marginLeft: Spacing.md,
    marginBottom: -40,
    width: 40,
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    zIndex: 10 },
  header: {
    alignItems: "center" as const,
    paddingTop: Spacing.xxl + Spacing.md },
  lockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BankingColors.whiteTransparent15,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
    textAlign: "center" as const,
    marginBottom: Spacing.sm },
  subtitle: {
    fontSize: FontSize.sm,
    color: BankingColors.whiteTransparent80,
    textAlign: "center" as const,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xxl },
  dotsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: DOT_SPACING,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg },
  dotOuter: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    borderColor: BankingColors.whiteTransparent80,
    alignItems: "center" as const,
    justifyContent: "center" as const },
  dotFilled: {
    width: DOT_SIZE - 3,
    height: DOT_SIZE - 3,
    borderRadius: (DOT_SIZE - 3) / 2,
    backgroundColor: BankingColors.white },
  loadingWrap: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const },
  keypadContainer: {
    alignItems: "center" as const,
    gap: KEY_GAP },
  keyRow: {
    flexDirection: "row" as const,
    gap: KEY_GAP },
  keyButton: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    borderWidth: 1,
    borderColor: BankingColors.whiteTransparent20,
    backgroundColor: BankingColors.whiteTransparent05,
    alignItems: "center" as const,
    justifyContent: "center" as const },
  keyEmpty: {
    width: KEY_SIZE,
    height: KEY_SIZE },
  keyText: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.medium,
    color: BankingColors.white },
  footer: {
    alignItems: "center" as const,
    paddingTop: Spacing.sm },
  forgotButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg },
  forgotButtonText: {
    color: BankingColors.whiteTransparent80,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold } });
