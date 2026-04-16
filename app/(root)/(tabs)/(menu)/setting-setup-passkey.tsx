import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, KeyRound, Shield, Smartphone } from "lucide-react-native";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius } from "@/constants/sizes";

import { useAuth } from "@/hooks/auth-store";
import { trustDeviceApi } from "@/services/auth.api";
import { generateKeyPair } from "@/native/SecureSignModule";
import { getDeviceMetaData } from "@/utils/device-info";

import CustomButton from "@/components/CustomButton";
import TText from "@/components/TText";
import useShowMessage from "@/hooks/useShowMessage";

export default function SettingSetupPasskeyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ nextStep?: string }>();
  const { deviceId, setDeviceTrusted } = useAuth();
  const { showMessageError } = useShowMessage();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) {
        console.log("❌ No deviceId — cannot trust device");
        throw new Error("DEVICE_ID_MISSING");
      }

      console.log("########## TRUST DEVICE START (SETTINGS PASSKEY) ##########");

      let base64PublicKey: string;
      try {
        base64PublicKey = await generateKeyPair(deviceId);
      } catch (e: any) {
        console.log("⚠️ generateKeyPair failed:", e?.message || e);
        throw new Error("KEYPAIR_FAILED");
      }

      const meta = await getDeviceMetaData();
      await trustDeviceApi(deviceId, base64PublicKey, meta);

      console.log("########## TRUST DEVICE DONE (SETTINGS PASSKEY) ##########");

      // ✅ DON'T set device trusted here - wait until PIN is actually created
      // await setDeviceTrusted(true);
      return true;
    },

    onSuccess: () => {
      console.log("✅ TRUST OK — redirect to passcode");
      router.replace({
        pathname: "/(root)/(tabs)/(menu)/setting-setup-passcode",
        params: { fromSettings: "true", ...(params.nextStep ? { nextStep: params.nextStep } : {}) }
      });
    },

    onError: (err: any) => {
      const msg = String(err?.message || err);

      if (msg.includes("401")) {
        showMessageError(
          "setupPasskey.errors.sessionExpired",
          "setupPasskey.errors.pleaseReconnect",
        );
        return;
      }

      if (msg.includes("KEYPAIR_FAILED")) {
        showMessageError(
          "setupPasskey.errors.configIncomplete",
          "setupPasskey.errors.keyGenFailed",
        );
        return;
      }

      if (msg.includes("DEVICE_ID_MISSING")) {
        showMessageError(
          "common.error",
          "setupPasskey.errors.deviceIdMissing",
        );
        return;
      }

      showMessageError("common.error", "setupPasskey.errors.configFailed");
    } });

  // ✅ Handle back navigation with reset
  const handleBack = () => {
    router.dismissAll();
    router.replace("/(root)/(tabs)/(menu)/biometry-settings");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
   
      <View
        style={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <KeyRound size={30} color={BankingColors.primary} />
          </View>
        </View>

        {/* Title & Description */}
        <TText style={styles.title} tKey="setupPasskey.title" />
        <TText style={styles.description} tKey="setupPasskey.description" />

        {/* Features List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Shield size={20} color={BankingColors.primary} />
            </View>
            <View style={styles.featureText}>
              <TText style={styles.featureTitle} tKey="setupPasskey.features.secure.title" />
              <TText style={styles.featureDesc} tKey="setupPasskey.features.secure.description" />
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Smartphone size={20} color={BankingColors.primary} />
            </View>
            <View style={styles.featureText}>
              <TText style={styles.featureTitle} tKey="setupPasskey.features.quick.title" />
              <TText style={styles.featureDesc} tKey="setupPasskey.features.quick.description" />
            </View>
          </View>
        </View>

        {/* Warning if no deviceId */}
        {!deviceId && (
          <View style={styles.warningCard}>
            <TText style={styles.warningText} tKey="setupPasskey.warnings.deviceIdMissing" />
          </View>
        )}

        {/* Action Button */}
        <CustomButton
          disabled={!deviceId || mutation.isPending}
          onPress={() => mutation.mutate()}
          style={[
            styles.primaryButton,
            (!deviceId || mutation.isPending) && styles.disabledButton,
          ]}
          tKey="setupPasskey.configure"
          loading={mutation.isPending}
        />

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBack}
          disabled={mutation.isPending}
        >
          <TText style={styles.cancelButtonText} tKey="common.cancel" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center" },
  headerTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  headerSpacer: {
    width: 40 },

  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl },

  iconContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 60,
    backgroundColor: BankingColors.primaryLight + "30",
    alignItems: "center",
    justifyContent: "center" },

  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
    marginBottom: Spacing.md },
  description: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl },

  featuresList: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.lg },
  featureItem: {
    flexDirection: "row",
    gap: Spacing.md },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BankingColors.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center" },
  featureText: {
    flex: 1 },
  featureTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 4 },
  featureDesc: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20 },

  warningCard: {
    backgroundColor: BankingColors.warningLighter,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.warning },
  warningText: {
    fontSize: FontSize.sm,
    color: BankingColors.text,
    textAlign: "center" },

  primaryButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md },
  disabledButton: {
    opacity: 0.5 },

  cancelButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.backgroundLight },
  cancelButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary } });