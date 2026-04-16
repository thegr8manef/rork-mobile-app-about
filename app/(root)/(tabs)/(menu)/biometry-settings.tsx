// app/(root)/(tabs)/(menu)/biometry-settings.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  Fingerprint,
  Smartphone,
  Shield,
  Info,
  KeyRound,
  ScanFace,
} from "lucide-react-native";
import { router } from "expo-router";

import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  FontFamily,
} from "@/constants";
import { PASSCODE_HASH_KEY, PASSCODE_SALT_KEY } from "@/constants/base-url";
import { useAuth } from "@/hooks/auth-store";
import TText from "@/components/TText";
import ConfirmModal from "@/components/menu/confirmModal/ConfirmModal";
import { useTranslation } from "react-i18next";

type BiometricType = "faceId" | "touchId" | "fingerprint" | "iris";

export default function BiometrySettingsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();

  const { authState, enableBiometric, deviceId, setDeviceTrusted } = useAuth();

  const isDeviceOwned = authState.isDeviceOwnedByCurrentUser;

  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType | null>(
    null,
  );

  const [showPinDisableModal, setShowPinDisableModal] = useState(false);
  const [showBiometricDisableModal, setShowBiometricDisableModal] =
    useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS === "web") return;

      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsAvailable(compatible);
      if (!compatible) return;

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsEnrolled(enrolled);
      if (!enrolled) return;

      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (
        types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        )
      ) {
        setBiometricType("faceId");
      } else if (
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ) {
        setBiometricType(Platform.OS === "ios" ? "touchId" : "fingerprint");
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType("iris");
      } else {
        setBiometricType("fingerprint");
      }
    })();
  }, []);

  const canUseBiometrics = isAvailable && isEnrolled;

  const hasPinCode = useMemo(
    () => !!deviceId && authState.hasTrustedDevice && authState.hasPasscode,
    [deviceId, authState.hasTrustedDevice, authState.hasPasscode],
  );

  const goPinCodeSetup = (nextStep?: string) =>
    router.push({
      pathname: "/(root)/(tabs)/(menu)/setting-setup-passkey",
      params: nextStep ? { nextStep } : {},
    });
  const goBiometricSetup = () =>
    router.push("/(root)/(tabs)/(menu)/menu-setup-biometric");
  const goBiometricNotAvailable = () =>
    router.push("/(root)/(tabs)/(menu)/biometric-not-available");

  const handleTogglePinCode = async (value: boolean) => {
    if (value) {
      goPinCodeSetup();
      return;
    }
    setShowPinDisableModal(true);
  };

  // ✅ FIXED: also clear passcode hash + salt
  const handleConfirmPinDisable = async () => {
    await setDeviceTrusted(false);
    await enableBiometric(false);
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(PASSCODE_HASH_KEY);
      await SecureStore.deleteItemAsync(PASSCODE_SALT_KEY);
    }
  };

  const handleToggleBiometry = async (value: boolean) => {
    if (!value) {
      setShowBiometricDisableModal(true);
      return;
    }

    if (!isAvailable || !isEnrolled) {
      goBiometricNotAvailable();
      return;
    }

    // PIN (device de confiance + passcode) doit être configuré avant la biométrie
    if (!hasPinCode) {
      goPinCodeSetup("biometric");
      return;
    }

    goBiometricSetup();
  };

  const handleConfirmBiometricDisable = async () => {
    await enableBiometric(false);
  };

  const getBiometryIcon = () => {
    switch (biometricType) {
      case "faceId":
        return <ScanFace size={48} color={BankingColors.primary} />;
      case "touchId":
      case "fingerprint":
        return <Fingerprint size={48} color={BankingColors.primary} />;
      case "iris":
        return <Smartphone size={48} color={BankingColors.primary} />;
      default:
        return <Shield size={48} color={BankingColors.primary} />;
    }
  };

  const getBiometricTypeKey = (): string => {
    switch (biometricType) {
      case "faceId":
        return "biometrySettings.biometric.types.faceId";
      case "touchId":
        return "biometrySettings.biometric.types.touchId";
      case "fingerprint":
        return "biometrySettings.biometric.types.fingerprint";
      case "iris":
        return "biometrySettings.biometric.types.iris";
      default:
        return "biometrySettings.biometric.types.default";
    }
  };

  const contentMaxWidth = 560;
  const horizontalPadding = Math.max(
    16,
    Math.min(Spacing.xxxl, Math.round(width * 0.06)),
  );

  return (
    <>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
          paddingTop: Spacing.lg,
          paddingHorizontal: horizontalPadding,
          alignItems: "center",
        }}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View style={styles.iconContainer}>{getBiometryIcon()}</View>

          <TText style={styles.title} tKey="biometrySettings.title" />
          <TText
            style={styles.description}
            tKey="biometrySettings.description"
          />

          {!isDeviceOwned && (
            <View style={styles.notOwnedCard}>
              <Info size={20} color={BankingColors.warning} />
              <TText style={styles.notOwnedText}>
                {t("settings.deviceNotOwned")}
              </TText>
            </View>
          )}

          {/* PIN CODE CARD */}
          <View style={[styles.card, !isDeviceOwned && styles.cardDisabled]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <KeyRound
                  size={24}
                  color={
                    isDeviceOwned
                      ? BankingColors.primary
                      : BankingColors.textLight
                  }
                />
                <View style={styles.settingText}>
                  <TText
                    style={[
                      styles.settingTitle,
                      !isDeviceOwned && styles.textDisabled,
                    ]}
                    tKey="biometrySettings.pinCode.title"
                  />
                  <TText
                    style={[
                      styles.settingSubtitle,
                      !isDeviceOwned && styles.textDisabled,
                    ]}
                    tKey={
                      hasPinCode
                        ? "biometrySettings.pinCode.statusActive"
                        : "biometrySettings.pinCode.statusInactive"
                    }
                  />
                </View>
              </View>

              {!hasPinCode ? (
                isDeviceOwned ? (
                  <TouchableOpacity
                    style={styles.configureButton}
                    onPress={() => goPinCodeSetup()}
                  >
                    <TText
                      style={styles.configureButtonText}
                      tKey="biometrySettings.pinCode.configure"
                    />
                  </TouchableOpacity>
                ) : null
              ) : (
                <Switch
                  value={hasPinCode}
                  onValueChange={handleTogglePinCode}
                  disabled={!isDeviceOwned}
                  trackColor={{
                    false: "#CBD5E1",
                    true: BankingColors.primaryLight,
                  }}
                  thumbColor={
                    !isDeviceOwned
                      ? "#CBD5E1"
                      : hasPinCode
                        ? BankingColors.primary
                        : "#F1F5F9"
                  }
                />
              )}
            </View>

            {!deviceId && (
              <View style={styles.inlineInfo}>
                <Info size={16} color={BankingColors.warning} />
                <TText
                  style={styles.inlineInfoText}
                  tKey="biometrySettings.pinCode.deviceIdMissing"
                />
              </View>
            )}
          </View>

          {/* BIOMETRICS CARD */}
          <View style={[styles.card, !isDeviceOwned && styles.cardDisabled]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                {biometricType === "faceId" ? (
                  <ScanFace
                    size={24}
                    color={
                      isDeviceOwned
                        ? BankingColors.primary
                        : BankingColors.textLight
                    }
                  />
                ) : biometricType === "touchId" ||
                  biometricType === "fingerprint" ? (
                  <Fingerprint
                    size={24}
                    color={
                      isDeviceOwned
                        ? BankingColors.primary
                        : BankingColors.textLight
                    }
                  />
                ) : biometricType === "iris" ? (
                  <Smartphone
                    size={24}
                    color={
                      isDeviceOwned
                        ? BankingColors.primary
                        : BankingColors.textLight
                    }
                  />
                ) : (
                  <Shield
                    size={24}
                    color={
                      isDeviceOwned
                        ? BankingColors.primary
                        : BankingColors.textLight
                    }
                  />
                )}
                <View style={styles.settingText}>
                  <TText
                    style={[
                      styles.settingTitle,
                      !isDeviceOwned && styles.textDisabled,
                    ]}
                    tKey={getBiometricTypeKey()}
                  />
                  <TText
                    style={[
                      styles.settingSubtitle,
                      !isDeviceOwned && styles.textDisabled,
                    ]}
                    tKey={
                      authState.biometricEnabled
                        ? "biometrySettings.biometric.statusActive"
                        : "biometrySettings.biometric.statusInactive"
                    }
                  />
                </View>
              </View>

              <Switch
                value={authState.biometricEnabled}
                onValueChange={handleToggleBiometry}
                disabled={!canUseBiometrics || !isDeviceOwned}
                trackColor={{
                  false: "#CBD5E1",
                  true: BankingColors.primaryLight,
                }}
                thumbColor={
                  !canUseBiometrics || !isDeviceOwned
                    ? "#CBD5E1"
                    : authState.biometricEnabled
                      ? BankingColors.primary
                      : "#F1F5F9"
                }
              />
            </View>
          </View>

          {!isAvailable && (
            <View style={styles.infoCard}>
              <Info size={20} color={BankingColors.warning} />
              <TText
                style={styles.infoText}
                tKey="biometrySettings.warnings.notAvailable"
              />
            </View>
          )}

          {isAvailable && !isEnrolled && (
            <View style={styles.infoCard}>
              <Info size={20} color={BankingColors.warning} />
              <TText
                style={styles.infoText}
                tKey="biometrySettings.warnings.notEnrolled"
              />
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      <ConfirmModal
        visible={showPinDisableModal}
        onClose={() => setShowPinDisableModal(false)}
        onConfirm={handleConfirmPinDisable}
        titleKey="biometrySettings.modals.pinDisable.title"
        descriptionKey="biometrySettings.modals.pinDisable.description"
        confirmTextKey="biometrySettings.modals.pinDisable.confirm"
        type="danger"
      />

      <ConfirmModal
        visible={showBiometricDisableModal}
        onClose={() => setShowBiometricDisableModal(false)}
        onConfirm={handleConfirmBiometricDisable}
        titleKey="biometrySettings.modals.biometricDisable.title"
        descriptionKey="biometrySettings.modals.biometricDisable.description"
        confirmTextKey="biometrySettings.modals.biometricDisable.confirm"
        type="warning"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { width: "100%" },

  iconContainer: { alignItems: "center", marginVertical: Spacing.xxxl },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    marginBottom: Spacing.md,
    color: BankingColors.text,
  },
  description: {
    fontSize: FontSize.md,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
    color: BankingColors.textSecondary,
  },

  notOwnedCard: {
    flexDirection: "row",
    gap: Spacing.md,
    backgroundColor: BankingColors.warningLighter,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.warning + "40",
  },
  notOwnedText: {
    flex: 1,
    fontSize: FontSize.base,
    color: BankingColors.text,
    fontFamily: FontFamily.medium,
  },

  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    minHeight: 88,
  },
  cardDisabled: { opacity: 0.6 },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 56,
  },
  settingInfo: {
    flexDirection: "row",
    gap: Spacing.md,
    flex: 1,
    alignItems: "center",
  },
  settingText: { flex: 1 },
  settingTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  settingSubtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    marginTop: 2,
  },
  textDisabled: { color: BankingColors.textLight },

  configureButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    height: 36,
  },
  configureButtonText: {
    color: BankingColors.white,
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
  },

  infoCard: {
    flexDirection: "row",
    gap: Spacing.md,
    backgroundColor: BankingColors.warningLighter,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoText: { flex: 1, fontSize: FontSize.base, color: BankingColors.text },

  inlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  inlineInfoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
});
