import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert } from "react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck, ArrowRight } from "lucide-react-native";

import { BankingColors } from "../../constants/banking-colors";
import { Spacing } from "../../constants/spacing";
import { FontSize, LineHeight } from "../../constants/typography";
import { BorderRadius, IconSize, ButtonHeight } from "../../constants/sizes";
import { Shadow } from "../../constants/shadows";

import { useAuth } from "../../hooks/auth-store";
import { useMutation } from "@tanstack/react-query";
import { trustDeviceApi } from "@/services/auth.api";
import { generateKeyPair } from "@/native/SecureSignModule";
import { getDeviceId, getDeviceMetaData } from "@/utils/device-info";
import * as Application from "expo-application";
import useShowMessage from "@/hooks/useShowMessage";
import { FontFamily } from "@/constants";

export default function DeviceConfidenceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showMessageError } = useShowMessage();

  const { setDeviceTrusted, deviceId, enablePasskey } = useAuth();

  // ✅ If trust fails for ANY reason, send the user to Home — they're already
  // authenticated, so device-trust is optional. Going to setup-passcode/biometric
  // would be a dead-end on a device we couldn't trust.
  const goHome = () => {
    router.replace("/(root)/(tabs)/(home)");
  };

  const goNext = () => {
    router.replace("/(auth)/setup-passcode");
  };

  const mutation = useMutation({
    mutationFn: async (trusted: boolean) => {
      if (!trusted) return false;

      // ✅ Always resolve a deviceId at action time — the store hydrates it in
      // a background task during init(), so it can still be null when the user
      // reaches this screen quickly.
      let resolvedDeviceId = deviceId;
      if (!resolvedDeviceId) {
        try {
          resolvedDeviceId = await getDeviceId();
        } catch (e: any) {
          console.log("⚠️ getDeviceId failed:", e?.message || e);
        }
      }

      if (!resolvedDeviceId) {
        console.log("❌ No deviceId — cannot trust device");
        throw new Error("DEVICE_ID_MISSING");
      }

      console.log("########## TRUST DEVICE START ##########");

      const appId = Application.applicationId;
      console.log("========== DEBUG KEY GENERATION ==========");
      console.log("APP PACKAGE:", appId);
      console.log("DEVICE ID:", resolvedDeviceId);
      console.log("==========================================");

      let base64PublicKey: string;

      try {
        base64PublicKey = await generateKeyPair(resolvedDeviceId);
      } catch (e: any) {
        console.log("⚠️ generateKeyPair failed:", e?.message || e);
        throw new Error("KEYPAIR_FAILED");
      }

      console.log("========== DEBUG PUBLIC KEY RESULT ==========");
      console.log("APP PACKAGE:", appId);
      console.log("DEVICE ID:", resolvedDeviceId);
      console.log("PUBLIC KEY:", base64PublicKey);
      console.log("==============================================");

      const meta = await getDeviceMetaData();
      await trustDeviceApi(resolvedDeviceId, base64PublicKey, meta);

      console.log("########## TRUST DEVICE DONE ##########");

      await setDeviceTrusted(true);
      await enablePasskey(true);
      return true;
    },

    onSuccess: async () => {
      console.log("########## TRUST SUCCESS ##########");
      goNext();
    },

    onError: (err: any) => {
      const msg = String(err?.message || err);

      console.log(`
############### 🔥 TRUST DEVICE — ERROR ####################
${msg}
###########################################################
`);

      if (msg.includes("DEVICE_ID_MISSING")) {
        showMessageError(t("common.error"), t("deviceConfidence.genericError"));
        goHome();
        return;
      }

      if (msg.includes("401")) {
        showMessageError(
          t("deviceConfidence.trustError"),
          t("deviceConfidence.trustErrorMessage"),
        );
        goHome();
        return;
      }

      if (msg.includes("KEYPAIR_FAILED")) {
        showMessageError(
          t("deviceConfidence.configIncomplete"),
          t("deviceConfidence.configIncompleteMessage"),
        );
        goHome();
        return;
      }

      showMessageError(t("common.error"), t("deviceConfidence.genericError"));
      goHome();
    } });

  const handleTrust = () => {
    if (!mutation.isPending) mutation.mutate(true);
  };

  const handleSkip = () => {
    router.navigate("/(auth)/setup-biometric");
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ShieldCheck
            size={IconSize.huge * 1.67}
            color={BankingColors.primary}
          />
        </View>

        <TText style={styles.title} tKey="deviceConfidence.title" />
        <TText style={styles.description} tKey="deviceConfidence.description" />

        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <View style={styles.bulletPoint} />
            <TText
              style={styles.benefitText}
              tKey="deviceConfidence.benefit1"
            />
          </View>

          <View style={styles.benefit}>
            <View style={styles.bulletPoint} />
            <TText
              style={styles.benefitText}
              tKey="deviceConfidence.benefit2"
            />
          </View>

          <View style={styles.benefit}>
            <View style={styles.bulletPoint} />
            <TText
              style={styles.benefitText}
              tKey="deviceConfidence.benefit3"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.trustButton}
          onPress={handleTrust}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={BankingColors.white} />
          ) : (
            <TText
              style={styles.trustButtonText}
              tKey="deviceConfidence.trust"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={mutation.isPending}
          activeOpacity={0.7}
        >
          <TText style={styles.skipButtonText} tKey="deviceConfidence.skip" />
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
    marginBottom: Spacing.lg,
    color: BankingColors.textPrimary },
  description: {
    fontSize: FontSize.md,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
    color: BankingColors.textSecondary,
    lineHeight: FontSize.md * LineHeight.relaxed },
  benefits: {
    alignSelf: "stretch",
    marginBottom: Spacing.huge,
    gap: Spacing.lg },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md },
  bulletPoint: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: BorderRadius.xs,
    backgroundColor: BankingColors.primary },
  benefitText: {
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
    fontFamily: FontFamily.medium },
  trustButton: {
    alignSelf: "stretch",
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    height: ButtonHeight.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadow.button },
  trustButtonText: {
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
