import React, { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert } from "react-native";
import TText from "@/components/TText";
import PinPad from "@/components/PinPad";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight } from "lucide-react-native";

import { BankingColors,
  Spacing,
  FontSize,
  IconSize, FontFamily } from "@/constants";

import { useAuth } from "../../hooks/auth-store";
import { useMutation } from "@tanstack/react-query";
import useShowMessage from "@/hooks/useShowMessage";

export default function SetupPasscodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savePasscode } = useAuth();
  const { t } = useTranslation();
  const { showMessageError } = useShowMessage();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [passcode, setPasscode] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const savePasscodeMutation = useMutation({
    mutationFn: async (code: string) => {
      console.log("🔐 Saving passcode...");
      const success = await savePasscode(code);
      if (!success) throw new Error("SAVE_PASSCODE_FAILED");
      return true;
    },
    onSuccess: () => {
      console.log("✅ Passcode saved — next: setup biometric");
      router.navigate("/(auth)/setup-biometric");
    },
    onError: (e) => {
      console.log("❌ Passcode save failed", e);
      showMessageError(t("common.error"), t("passcode.setup.error"));
      setResetKey((k) => k + 1);
    } });

  const handleCreatePasscode = useCallback((value: string) => {
    console.log("🔑 Passcode created — waiting confirmation");
    setPasscode(value);
    setStep("confirm");
    setResetKey((k) => k + 1);
  }, []);

  const handleConfirmPasscode = useCallback(
    (value: string) => {
      if (value !== passcode) {
        console.log("❌ Passcode mismatch");
        Alert.alert(t("common.error"), t("passcode.setup.mismatch"), [
          {
            text: t("passcode.setup.retry"),
            onPress: () => {
              setStep("create");
              setPasscode("");
              setResetKey((k) => k + 1);
            } },
        ]);
        return;
      }
      savePasscodeMutation.mutate(value);
    },
    [passcode, savePasscodeMutation, t],
  );

  const handleSkip = () => {
    console.log("⏭️ Passcode skipped — continue onboarding");
    router.navigate("/(auth)/setup-biometric");
  };

  const skipFooter = (
    <TouchableOpacity
      style={styles.skipButton}
      onPress={handleSkip}
      disabled={savePasscodeMutation.isPending}
      activeOpacity={0.7}
    >
      <TText style={styles.skipButtonText} tKey="passcode.setup.skip" />
      <ArrowRight size={IconSize.sm} color={BankingColors.primary} />
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <PinPad
        title={t(
          step === "create"
            ? "passcode.setup.title"
            : "passcode.setup.confirmTitle",
        )}
        subtitle={t(
          step === "create"
            ? "passcode.setup.description"
            : "passcode.setup.confirmDescription",
        )}
        digits={6}
        isLoading={savePasscodeMutation.isPending}
        disabled={savePasscodeMutation.isPending}
        onComplete={step === "create" ? handleCreatePasscode : handleConfirmPasscode}
        resetKey={resetKey}
        footerText={t("passcode.setup.secureNote") ?? undefined}
        footerComponent={skipFooter}
        iconColor={BankingColors.primary}
        onBack={() => {
          if (step === "confirm") {
            setStep("create");
            setPasscode("");
            setResetKey((k) => k + 1);
          } else {
            router.back();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm },
  skipButtonText: {
    color: BankingColors.primary,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold } });
