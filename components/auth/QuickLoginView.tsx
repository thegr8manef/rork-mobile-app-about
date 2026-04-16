import React, { useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform } from "react-native";
import { Animated as RNAnimated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Fingerprint, ScanFace, KeyRound } from "lucide-react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing } from "react-native-reanimated";
import TText from "@/components/TText";
import { BankingColors,
  FontSize,
  Shadow,
  Spacing, FontFamily } from "@/constants";

type Props = {
  displayName: string;
  biometricType?: string | null;
  canUseBiometric: boolean;
  canUsePasscode: boolean;
  loading: boolean;
  biometricLoading: boolean;

  float1: any;
  float2: any;
  float3: any;
  fadeAnim: any;
  scaleAnim: any;
  screenHeight: number;

  onBiometricPress: () => void;
  onPasscodePress: () => void;
  onOtherAccountPress: () => void;

  t: (k: string, opts?: any) => string;
};

// ─── Animated Biometric Button ──────────────────────────────
function BiometricButton({
  isFace,
  biometricLoading,
  loading,
  onPress }: {
  isFace: boolean;
  biometricLoading: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const contentOpacity = useSharedValue(1);
  const contentTranslateY = useSharedValue(0);
  const spinnerOpacity = useSharedValue(0);
  const spinnerScale = useSharedValue(0.5);

  useEffect(() => {
    if (biometricLoading) {
      // Content slides down + fades out
      contentOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease) });
      contentTranslateY.value = withTiming(8, {
        duration: 200,
        easing: Easing.out(Easing.ease) });
      // Spinner fades in + bounces to full scale
      spinnerOpacity.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.ease) });
      spinnerScale.value = withSequence(
        withTiming(0.5, { duration: 0 }),
        withSpring(1, { damping: 12, stiffness: 150 }),
      );
    } else {
      // Reverse: spinner out, content back in
      spinnerOpacity.value = withTiming(0, { duration: 150 });
      spinnerScale.value = withTiming(0.5, { duration: 150 });
      contentOpacity.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.ease) });
      contentTranslateY.value = withSpring(0, {
        damping: 14,
        stiffness: 120 });
    }
  }, [biometricLoading]);

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }] }));

  const spinnerAnimStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
    transform: [{ scale: spinnerScale.value }] }));

  return (
    <TouchableOpacity
      style={styles.quickLoginPrimaryBtn}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.9}
    >
      {/* Content: icon + text — fades out when loading */}
      <ReAnimated.View style={[styles.btnContentRow, contentAnimStyle]}>
        <View style={styles.iconBoxLeft}>
          {isFace ? (
            <ScanFace size={24} color={BankingColors.primary} />
          ) : (
            <Fingerprint size={24} color={BankingColors.primary} />
          )}
        </View>
        <TText
          tKey={
            isFace
              ? "quickLogin.continueWithFaceId"
              : "quickLogin.continueWithBiometric"
          }
          style={styles.quickLoginPrimaryBtnText}
        />
      </ReAnimated.View>

      {/* Spinner: absolute centered, fades in when loading */}
      <ReAnimated.View style={[styles.spinnerOverlay, spinnerAnimStyle]}>
        <ActivityIndicator color={BankingColors.primary} size="small" />
      </ReAnimated.View>
    </TouchableOpacity>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function QuickLoginView({
  displayName,
  biometricType,
  canUseBiometric,
  canUsePasscode,
  loading,
  biometricLoading,
  float1,
  float2,
  float3,
  fadeAnim,
  scaleAnim,
  onBiometricPress,
  onPasscodePress,
  onOtherAccountPress }: Props) {
  const isFace = biometricType === "faceId";

  return (
    <View style={styles.quickLoginWrapper}>
      <LinearGradient
        colors={[BankingColors.primary, BankingColors.primaryDark, "#c42d15"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickLoginGradient}
      />

      {/* Floating Elements */}
      <RNAnimated.View
        style={[
          styles.floatingCircle,
          styles.circle1,
          { transform: [{ translateY: float1 }] },
        ]}
      />
      <RNAnimated.View
        style={[
          styles.floatingCircle,
          styles.circle2,
          { transform: [{ translateY: float2 }] },
        ]}
      />
      <RNAnimated.View
        style={[
          styles.floatingCircle,
          styles.circle3,
          { transform: [{ translateY: float3 }] },
        ]}
      />
      <RNAnimated.View
        style={[
          styles.floatingShape,
          styles.shape1,
          { transform: [{ translateY: float2 }, { rotate: "45deg" }] },
        ]}
      />
      <RNAnimated.View
        style={[
          styles.floatingShape,
          styles.shape2,
          { transform: [{ translateY: float1 }, { rotate: "-15deg" }] },
        ]}
      />

      <RNAnimated.View
        style={[
          styles.quickLoginContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.quickLoginHeader}>
          <TText
            style={styles.quickLoginWelcomeText}
            tKey="quickLogin.hello"
          />
          <TText style={styles.quickLoginTitle}>{displayName}</TText>
          <TText
            style={styles.quickLoginSubtitle}
            tKey="quickLogin.secureMessage"
          />
        </View>

        {/* Buttons */}
        <View style={styles.quickLoginButtonsContainer}>
          {canUseBiometric && (
            <BiometricButton
              isFace={isFace}
              biometricLoading={biometricLoading}
              loading={loading}
              onPress={onBiometricPress}
            />
          )}

          {canUsePasscode && (
            <TouchableOpacity
              style={styles.quickLoginSecondaryBtn}
              onPress={onPasscodePress}
              disabled={loading}
              activeOpacity={0.9}
            >
              <View style={styles.iconBoxLeft}>
                <KeyRound size={24} color={BankingColors.white} />
              </View>
              <TText
                tKey="quickLogin.loginWithPasscode"
                style={styles.quickLoginSecondaryBtnText}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.quickLoginTertiaryBtn}
            onPress={onOtherAccountPress}
            activeOpacity={0.9}
          >
            <TText
              tKey="quickLogin.connectOtherAccount"
              style={styles.quickLoginTertiaryBtnText}
            />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickLoginWrapper: { flex: 1 },
  quickLoginGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0 },

  floatingCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: BankingColors.whiteTransparent10 },
  circle1: { width: 200, height: 200, top: -50, right: -60 },
  circle2: { width: 140, height: 140, top: 220, left: -40 },
  circle3: {
    width: 80,
    height: 80,
    top: 140,
    right: 40,
    backgroundColor: BankingColors.whiteTransparent15 },

  floatingShape: {
    position: "absolute",
    backgroundColor: BankingColors.whiteTransparent10,
    borderRadius: 20 },
  shape1: { width: 60, height: 60, top: 380, right: -10 },
  shape2: { width: 100, height: 40, top: 520, left: -30, borderRadius: 10 },

  quickLoginContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: 100,
    paddingBottom: Spacing.xxl },

  quickLoginHeader: { marginTop: 40 },

  quickLoginWelcomeText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.medium,
    color: BankingColors.whiteTransparent80,
    marginBottom: Spacing.sm },

  quickLoginTitle: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
    marginBottom: Spacing.md,
    lineHeight: 44 },

  quickLoginSubtitle: {
    fontSize: FontSize.md,
    color: BankingColors.whiteTransparent80,
    lineHeight: 24,
    maxWidth: "85%" },

  quickLoginButtonsContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl },

  // ── Primary button (biometric) — relative container ───────
  quickLoginPrimaryBtn: {
    position: "relative",
    backgroundColor: BankingColors.white,
    borderRadius: 16,
    minHeight: 60,
    justifyContent: "center",
    overflow: "hidden",
    ...Shadow.md },

  // Icon + text row inside primary button
  btnContentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md },

  // Spinner sits on top, absolute centered
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center" },

  // ── Secondary button (passcode) ───────────────────────────
  quickLoginSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.textDark,
    paddingVertical: 18,
    paddingHorizontal: Spacing.lg,
    borderRadius: 16,
    minHeight: 60,
    gap: Spacing.md,
    ...Shadow.md },

  // ── Shared icon box ───────────────────────────────────────
  iconBoxLeft: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0 },

  // ── Text styles ───────────────────────────────────────────
  quickLoginPrimaryBtnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    textAlign: "center",
    flexShrink: 1,
    ...(Platform.OS === "android"
      ? { includeFontPadding: false as any }
      : null) },

  quickLoginSecondaryBtnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    textAlign: "center",
    flexShrink: 1,
    ...(Platform.OS === "android"
      ? { includeFontPadding: false as any }
      : null) },

  quickLoginTertiaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm },

  quickLoginTertiaryBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.whiteTransparent80 } });