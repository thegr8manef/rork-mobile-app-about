import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert } from "react-native";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import { Fingerprint, ScanFace, X, ArrowRight } from "lucide-react-native";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize, ButtonHeight } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";
import {
  SECURE_ACCESS_TOKEN_KEY,
  SECURE_REFRESH_TOKEN_KEY } from "@/constants/base-url";
import { useAuth } from "@/hooks/auth-store";
import * as SecureStore from "expo-secure-store";
import {
  trustDeviceApi,
  createDeviceChallengeApi,
  verifyDeviceChallengeApi } from "@/services/auth.api";
import { generateKeyPair, signChallenge } from "@/native/SecureSignModule";
import { getDeviceMetaData } from "@/utils/device-info";
import useShowMessage from "@/hooks/useShowMessage";

export default function SetupBiometricScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showMessageError } = useShowMessage();

  const {
    enableBiometric,
    completeLogin,
    authState,
    deviceId,
    setDeviceTrusted } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("biométrique");
  const [biometricType, setBiometricType] = useState("biométrique");

  // Detect biometric type (Face ID vs Fingerprint)
  useEffect(() => {
    if (Platform.OS === "web") {
      console.log("🌐 Web detected — skipping biometric setup");
      // don't call handleSkip here (it uses tokens and navigation); just mark as unavailable
      return;
    }

    (async () => {
      try {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          setBiometricLabel("Face ID");
          setBiometricType(t("biometric.setup.faceId"));
          return;
        }

        if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          const label = t("biometric.setup.fingerprint");
          setBiometricLabel(label);
          setBiometricType(label);
          return;
        }
      } catch (e) {
        console.log("❌ supportedAuthenticationTypesAsync error:", e);
      }
    })();
  }, [t]);

  const finalizeLogin = useCallback(
    async (biometricEnabled: boolean) => {
      console.log("🔁 Finalizing login. biometric =", biometricEnabled);

      const accessToken =
        (await SecureStore.getItemAsync(SECURE_ACCESS_TOKEN_KEY)) ?? "";
      const refreshToken =
        (await SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY)) ?? "";

      if (!accessToken || !refreshToken) {
        console.log("❌ Missing tokens — back to login");
        router.replace("/(auth)/login");
        return;
      }

      await completeLogin(accessToken, refreshToken, biometricEnabled);

      console.log("✅ completeLogin done — going home");
      router.replace("/(root)/(tabs)/(home)");
    },
    [completeLogin, router],
  );

  const handleSkip = useCallback(async () => {
    console.log("⏭️ Biometric skipped");
    await enableBiometric(false);
    await finalizeLogin(false);
  }, [enableBiometric, finalizeLogin]);

  const handleEnableBiometric = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    console.log("👉 Biometric enable flow start");

    try {
      if (Platform.OS === "web") {
        await handleSkip();
        return;
      }

      // ✅ check if device supports biometrics and is enrolled
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        showMessageError(
          t("common.error"),
          t("biometric.notAvailable.description"),
        );
        await enableBiometric(false);
        await finalizeLogin(false);
        return;
      }

      if (!deviceId) {
        showMessageError(t("common.error"), "DEVICE_ID_MISSING");
        await enableBiometric(false);
        await finalizeLogin(false);
        return;
      }

      // ✅ 1) If device is NOT trusted yet, trust it now (same backend as DeviceConfidenceScreen)
      if (!authState.hasTrustedDevice) {
        console.log("🔐 Device not trusted yet — trusting device now");

        const base64PublicKey = await generateKeyPair(deviceId);
        const meta = await getDeviceMetaData();

        await trustDeviceApi(deviceId, base64PublicKey, meta);
        await setDeviceTrusted(true);
      }

      // ✅ 2) Create challenge ONLY when user pressed enable
      console.log("🧩 Creating challenge...");
      const challenge = await createDeviceChallengeApi(deviceId);

      // ✅ 3) Sign challenge (native) — require biometric inside SecureSignModule
      console.log("✍️ Signing challenge with biometric...");
      const proof = await signChallenge(
        challenge.challengeId,
        challenge.challenge,
        deviceId,
        { requireBiometric: true },
      );

      // ✅ 4) Verify challenge
      console.log("✅ Verifying challenge...");
      const res = await verifyDeviceChallengeApi(
        deviceId,
        challenge.challengeId,
        proof,
      );

      if (
        !res ||
        (res.loginStatus !== "LOGIN_COMPLETE" &&
          res.loginStatus !== "MFA_REQUIRED")
      ) {
        throw new Error("VERIFY_FAILED");
      }

      // ✅ 5) Enable biometric flag in your app
      await enableBiometric(true);

      console.log("✅ Biometric enabled (app flag)");
      await finalizeLogin(true);
    } catch (e: any) {
      console.log("❌ Biometric setup error:", e);
      showMessageError(t("common.error"), t("settings.biometricSetup.error"));
      await enableBiometric(false);
      await finalizeLogin(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    t,
    handleSkip,
    deviceId,
    authState.hasTrustedDevice,
    enableBiometric,
    finalizeLogin,
    setDeviceTrusted,
  ]);

  const getIcon = () => {
    if (biometricLabel === "Face ID") {
      return (
        <ScanFace size={IconSize.huge * 1.67} color={BankingColors.primary} />
      );
    }
    return (
      <Fingerprint size={IconSize.huge * 1.67} color={BankingColors.primary} />
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getIcon()}</View>

        <TText style={styles.title} tKey="biometric.setup.title" />

        <TText style={styles.description}>
          {t("biometric.setup.description", { biometricType })}
        </TText>

        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <View style={styles.bulletPoint} />
            <TText style={styles.benefitText} tKey="biometric.setup.benefit1" />
          </View>
          <View style={styles.benefit}>
            <View style={styles.bulletPoint} />
            <TText style={styles.benefitText} tKey="biometric.setup.benefit2" />
          </View>
          <View style={styles.benefit}>
            <View style={styles.bulletPoint} />
            <TText style={styles.benefitText} tKey="biometric.setup.benefit3" />
          </View>
        </View>

        <TouchableOpacity
          style={styles.enableButton}
          onPress={handleEnableBiometric}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={BankingColors.white} />
          ) : (
            <TText style={styles.enableButtonText}>
              {t("biometric.setup.enable", { biometricLabel })}
            </TText>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <TText style={styles.skipButtonText} tKey="biometric.setup.later" />
          <ArrowRight size={IconSize.sm} color={BankingColors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  closeButton: {
    position: "absolute",
    top: Spacing.vertical.massive,
    right: Spacing.xl,
    zIndex: 10,
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    alignItems: "center",
    justifyContent: "center" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxxl },
  iconContainer: { marginBottom: Spacing.xxxl },
  title: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    marginBottom: Spacing.lg },
  description: {
    fontSize: FontSize.md,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
    lineHeight: FontSize.md * LineHeight.relaxed },
  benefits: {
    alignSelf: "stretch",
    marginBottom: Spacing.huge,
    gap: Spacing.lg },
  benefit: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  bulletPoint: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: BorderRadius.xs,
    backgroundColor: BankingColors.primary },
  benefitText: { fontSize: FontSize.base, fontFamily: FontFamily.medium },
  enableButton: {
    alignSelf: "stretch",
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    height: ButtonHeight.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadow.button },
  enableButtonText: {
    color: BankingColors.white,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold },
  skipButton: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm },
  skipButtonText: {
    color: BankingColors.primary,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold } });