import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform } from "react-native";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import { Fingerprint, ScanFace, ArrowRight } from "lucide-react-native";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize, ButtonHeight } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

import { useAuth } from "@/hooks/auth-store";
import {
  trustDeviceApi,
  createDeviceChallengeApi,
  verifyDeviceChallengeApi } from "@/services/auth.api";
import { generateKeyPair, signChallenge } from "@/native/SecureSignModule";
import { getDeviceMetaData } from "@/utils/device-info";
import useShowMessage from "@/hooks/useShowMessage";

export default function MenuSetupBiometricScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showMessageError } = useShowMessage();

  const {
    enableBiometric,
    enablePasskey,
    authState,
    deviceId,
    setDeviceTrusted } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("biométrique");
  const [biometricType, setBiometricType] = useState("biométrique");

  useEffect(() => {
    if (Platform.OS === "web") return;

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
        }
      } catch (e) {
        console.log("❌ supportedAuthenticationTypesAsync error:", e);
      }
    })();
  }, [t]);

  // Phase A: Trust device — same logic as device-confidence.tsx
  const trustDeviceIfNeeded = useCallback(async () => {
    if (authState.hasTrustedDevice) return;

    if (!deviceId) {
      console.log("❌ No deviceId — cannot trust device");
      throw new Error("DEVICE_ID_MISSING");
    }

    console.log("########## TRUST DEVICE START ##########");

    let base64PublicKey: string;

    try {
      base64PublicKey = await generateKeyPair(deviceId);
    } catch (e: any) {
      console.log("⚠️ generateKeyPair failed:", e?.message || e);
      throw new Error("KEYPAIR_FAILED");
    }

    const meta = await getDeviceMetaData();
    await trustDeviceApi(deviceId, base64PublicKey, meta);

    console.log("########## TRUST DEVICE DONE ##########");

    await setDeviceTrusted(true);
    await enablePasskey(true);
  }, [authState.hasTrustedDevice, deviceId, setDeviceTrusted, enablePasskey]);

  const handleEnableBiometric = useCallback(async () => {
    if (isLoading) return;

    // Passcode + device de confiance doivent être configurés avant la biométrie
    if (!authState.hasPasscode || !authState.hasTrustedDevice) {
      showMessageError(
        t("biometric.setup.requirePasscode"),
        t("biometric.setup.requirePasscode.desc"),
      );
      router.replace("/(root)/(tabs)/(menu)/setting-setup-passcode");
      return;
    }

    setIsLoading(true);
    console.log("👉 Menu biometric enable flow start");

    try {
      if (Platform.OS === "web") {
        router.back();
        return;
      }

      // Phase A — Device trust (mirrors device-confidence.tsx)
      try {
        await trustDeviceIfNeeded();
      } catch (e: any) {
        const msg = String(e?.message || e);
        console.log("⚠️ Trust device error (continuing):", msg);

        if (msg.includes("401")) {
          showMessageError(
            t("deviceConfidence.trustError"),
            t("deviceConfidence.trustErrorMessage"),
          );
        } else if (msg.includes("KEYPAIR_FAILED")) {
          showMessageError(
            t("deviceConfidence.configIncomplete"),
            t("deviceConfidence.configIncompleteMessage"),
          );
        } else if (!msg.includes("DEVICE_ID_MISSING")) {
          showMessageError(t("common.error"), t("deviceConfidence.genericError"));
        }
        // Continue anyway — same behavior as device-confidence.tsx
      }

      // Phase B — Biometric enrollment (mirrors setup-biometric.tsx auth flow)
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        showMessageError(
          t("common.error"),
          t("biometric.notAvailable.description"),
        );
        router.back();
        return;
      }

      if (!deviceId) {
        showMessageError(t("common.error"), "DEVICE_ID_MISSING");
        router.back();
        return;
      }

      console.log("🧩 Creating challenge...");
      const challenge = await createDeviceChallengeApi(deviceId);

      console.log("✍️ Signing challenge with biometric...");
      const proof = await signChallenge(
        challenge.challengeId,
        challenge.challenge,
        deviceId,
        { requireBiometric: true },
      );

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

      await enableBiometric(true);
      console.log("✅ Biometric enabled");
      router.back();
    } catch (e: any) {
      console.log("❌ Biometric setup error:", e);
      showMessageError(t("common.error"), t("settings.biometricSetup.error"));
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    t,
    deviceId,
    trustDeviceIfNeeded,
    enableBiometric,
    showMessageError,
    router,
  ]);

  const handleSkip = useCallback(() => {
    console.log("⏭️ Biometric skipped from menu");
    router.back();
  }, [router]);

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

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <TText style={styles.skipButtonText} tKey="biometric.setup.later" />
          <ArrowRight size={IconSize.sm} color={BankingColors.primary} />
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
