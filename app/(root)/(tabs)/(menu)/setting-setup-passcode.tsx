import React, { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet } from "react-native";
import TText from "@/components/TText";
import PinPad from "@/components/PinPad";
import { useTranslation } from "react-i18next";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";

import { useAuth } from "@/hooks/auth-store";
import { useMutation } from "@tanstack/react-query";
import useShowMessage from "@/hooks/useShowMessage";

export default function SettingSetupPasscodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { savePasscode, setDeviceTrusted } = useAuth();
  const { showMessageError, showMessageSuccess } = useShowMessage();
  const { t } = useTranslation();

  const [step, setStep] = useState<"create" | "confirm">("create");
  const [passcode, setPasscode] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const savePasscodeMutation = useMutation({
    mutationFn: async (code: string) => {
      console.log("💾 Saving passcode...");
      const success = await savePasscode(code);
      if (!success) throw new Error("SAVE_PASSCODE_FAILED");

      console.log("✅ Passcode saved, setting device as trusted...");
      await setDeviceTrusted(true);
      console.log("✅ Device marked as trusted");

      return true;
    },
    onSuccess: () => {
      showMessageSuccess(
        "setupPasscode.success.title",
        "setupPasscode.success.description"
      );

      setTimeout(() => {
        router.dismissAll();
        if (params.nextStep === "biometric") {
          router.replace("/(root)/(tabs)/(menu)/menu-setup-biometric");
        } else {
          router.replace("/(root)/(tabs)/(menu)/biometry-settings");
        }
      }, 1500);
    },
    onError: () => {
      showMessageError("common.error", "setupPasscode.errors.saveFailed");
      setResetKey((k) => k + 1);
    } });

  const handleCreatePasscode = useCallback((value: string) => {
    setPasscode(value);
    setStep("confirm");
    setResetKey((k) => k + 1);
  }, []);

  const handleConfirmPasscode = useCallback(
    (value: string) => {
      if (value !== passcode) {
        showMessageError(
          "setupPasscode.errors.mismatch.title",
          "setupPasscode.errors.mismatch.description"
        );
        setStep("create");
        setPasscode("");
        setResetKey((k) => k + 1);
        return;
      }
      savePasscodeMutation.mutate(value);
    },
    [passcode, savePasscodeMutation, showMessageError],
  );

  const handleClose = () => {
    router.dismissAll();
    router.replace("/(root)/(tabs)/(menu)/biometry-settings");
  };

  const isBusy = savePasscodeMutation.isPending;

  const cancelFooter = (
    <TouchableOpacity
      style={styles.cancelButton}
      onPress={handleClose}
      disabled={isBusy}
    >
      <TText style={styles.cancelButtonText} tKey="common.cancel" />
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
      ]}
    >
      <PinPad
        title={t(
          step === "create"
            ? "setupPasscode.create.title"
            : "setupPasscode.confirm.title",
        )}
        subtitle={t(
          step === "create"
            ? "setupPasscode.create.description"
            : "setupPasscode.confirm.description",
        )}
        digits={6}
        isLoading={isBusy}
        disabled={isBusy}
        onComplete={step === "create" ? handleCreatePasscode : handleConfirmPasscode}
        resetKey={resetKey}
        footerComponent={cancelFooter}
        iconColor={step === "create" ? BankingColors.primary : BankingColors.success}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm },
  cancelButtonText: {
    color: BankingColors.textSecondary,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold } });
