import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CreditCard,
  Wallet,
  Banknote,
  FileText,
  Smartphone,
  KeyRound,
  Fingerprint,
  RefreshCw } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  IconSize, FontFamily } from "@/constants";

import { useAuth } from "@/hooks/auth-store";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import TText from "@/components/TText";
import ConfirmationButton from "@/components/ConfirmationButton";

/**
 * ✅ Compatible with your TransactionSummaryScreen navigation:
 * router.push({
 *   pathname: "/(root)/reload-card-summary",
 *   params: { data: JSON.stringify(reloadData) }
 * })
 */
type ReloadSummaryNavData = {
  reloadId: string;
  cardId: string;
  cardNumber: string;
  cardHolder?: string;
  accountId: string;
  accountLabel?: string;
  accountNumber?: string;
  rib?: string;
  amount: number;
  currency?: string;
  motif?: string;
};

const toAmountString = (v: string | number) => {
  if (typeof v === "number") return v.toString();
  return String(v).replace(",", ".").trim();
};

const maskCardNumber = (full?: string) => {
  if (!full) return "-";
  const s = String(full).replace(/\s+/g, "");
  if (s.length < 4) return s;
  return `**** **** **** ${s.slice(-4)}`;
};

export default function ReloadCardSummaryScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { authState, deviceId } = useAuth();

  const params = useLocalSearchParams<{ data?: string }>();
  const [isLoading, setIsLoading] = useState(false);

  // ✅ same as BillPaymentSummaryScreen
  const [pressedMethod, setPressedMethod] = useState<
    "passcode" | "biometric" | "otp" | null
  >(null);

  // If you have dedicated routes for reload confirm (optional)
  const RELOAD_BIOMETRIC_CONFIRM_ROUTE =
    "/(root)/(tabs)/(cartes)/reload-biometric-confirm";
  const RELOAD_PASSCODE_CONFIRM_ROUTE =
    "/(root)/(tabs)/(cartes)/reload-passcode-confirm";

  const reloadData = useMemo<ReloadSummaryNavData | null>(() => {
    if (!params.data) return null;
    try {
      console.log("====================================");
      console.log("biometricEnabled:", authState.biometricEnabled);
      console.log("hasPasscode:", authState.hasPasscode);
      console.log("hasTrustedDevice:", authState.hasTrustedDevice);
      console.log("deviceId:", deviceId);
      console.log("====================================");
      return JSON.parse(params.data);
    } catch {
      return null;
    }
  }, [
    params.data,
    authState.biometricEnabled,
    authState.hasPasscode,
    authState.hasTrustedDevice,
    deviceId,
  ]);

  useEffect(() => {
    console.log("=========== RELOAD SUMMARY FLAGS ===========");
    console.log("biometricEnabled:", authState.biometricEnabled);
    console.log("hasPasscode:", authState.hasPasscode);
    console.log("hasTrustedDevice:", authState.hasTrustedDevice);
    console.log("deviceId:", deviceId);
    console.log("=========== RELOAD SUMMARY DATA ============");
    console.log("params.data(raw):", params.data);
    console.log("parsed reloadData:", reloadData);
    console.log("===========================================");
  }, [
    authState.biometricEnabled,
    authState.hasPasscode,
    authState.hasTrustedDevice,
    deviceId,
    params.data,
    reloadData,
  ]);

  if (!reloadData?.reloadId || !reloadData?.cardId) {
    return (
      <View style={styles.container}>
        <TText style={styles.errorText} tKey="common.error" />
      </View>
    );
  }

  const {
    reloadId,
    cardId,
    cardNumber,
    cardHolder,
    accountId,
    accountLabel,
    accountNumber,
    rib,
    amount,
    currency,
    motif } = reloadData;

  const goBackAfterFail = () => {
    router.replace("/(root)/(tabs)/(cartes)");
  };

  const canUsePasscodeEntry =
    Platform.OS !== "web" &&
    !!deviceId &&
    !!reloadId &&
    authState.hasTrustedDevice;

  const canUseBiometricEntry =
    Platform.OS !== "web" &&
    !!deviceId &&
    !!reloadId &&
    authState.hasTrustedDevice &&
    authState.biometricEnabled;

  const passcodeDisabled = isLoading || !canUsePasscodeEntry;
  const biometricDisabled = isLoading || !canUseBiometricEntry;
  const otpDisabled = isLoading;

  /**
   * ✅ OTP FLOW
   * Goes to the SAME otp-verification screen and lets it decide which confirm API to call
   */
  const handleConfirmWithOTP = useCallback(async () => {
    if (!reloadId) {
      console.log("[ReloadSummary] ❌ Missing data for OTP", {
        reloadId,
        deviceId });
      goBackAfterFail();
      return;
    }

    setPressedMethod("otp");
    setIsLoading(true);

    try {
      console.log("[RCS]reloadId", reloadId);

      router.navigate({
        pathname: "/otp-verification",
        params: {
          actionType: "reload",
          data: JSON.stringify({
            requestId: reloadId,
            cardId,
            amount: amount != null ? toAmountString(amount) : "" }) } });
    } catch (e: any) {
      console.log("[ReloadSummary] ❌ OTP NAV FAILED", { message: e?.message });
      setPressedMethod(null);
      goBackAfterFail();
    } finally {
      setIsLoading(false);
    }
  }, [reloadId, cardId, amount]);

  /**
   * ✅ PASSCODE FLOW
   * If not available => fallback to OTP
   */
  const handleConfirmWithPasscode = useCallback(async () => {
    if (!canUsePasscodeEntry) {
      console.log("[ReloadSummary] ❌ Passcode entry not available", {
        deviceId,
        reloadId,
        hasTrustedDevice: authState.hasTrustedDevice });
      await handleConfirmWithOTP();
      return;
    }

    if (!authState.hasPasscode) {
      await handleConfirmWithOTP();
      return;
    }

    setPressedMethod("passcode");
    setIsLoading(true);

    try {
      router.navigate({
        pathname: RELOAD_PASSCODE_CONFIRM_ROUTE as any,
        params: {
          data: JSON.stringify({
            requestId: reloadId,
            cardId,
            accountId,
            amount,
            currency,
            motif }) } });
    } catch (e: any) {
      console.log("[ReloadSummary] ❌ PASSCODE NAV FAILED", {
        message: e?.message });
      setPressedMethod(null);
      goBackAfterFail();
    } finally {
      setIsLoading(false);
    }
  }, [
    RELOAD_PASSCODE_CONFIRM_ROUTE,
    canUsePasscodeEntry,
    authState.hasPasscode,
    authState.hasTrustedDevice,
    deviceId,
    reloadId,
    cardId,
    accountId,
    amount,
    currency,
    motif,
    handleConfirmWithOTP,
  ]);

  /**
   * ✅ BIOMETRIC FLOW
   * If not available => OTP
   */
  const handleConfirmWithBiometric = useCallback(async () => {
    if (!canUseBiometricEntry) {
      console.log("[ReloadSummary] ❌ Biometric entry not available", {
        deviceId,
        reloadId,
        biometricEnabled: authState.biometricEnabled,
        hasTrustedDevice: authState.hasTrustedDevice });
      await handleConfirmWithOTP();
      return;
    }

    setPressedMethod("biometric");
    setIsLoading(true);

    try {
      router.navigate({
        pathname: RELOAD_BIOMETRIC_CONFIRM_ROUTE as any,
        params: {
          data: JSON.stringify({
            requestId: reloadId,
            cardId,
            accountId,
            amount,
            currency,
            motif }) } });
    } catch (e: any) {
      console.log("[ReloadSummary] ❌ BIOMETRIC NAV FAILED", {
        message: e?.message });
      setPressedMethod(null);
      goBackAfterFail();
    } finally {
      setIsLoading(false);
    }
  }, [
    RELOAD_BIOMETRIC_CONFIRM_ROUTE,
    canUseBiometricEntry,
    authState.biometricEnabled,
    authState.hasTrustedDevice,
    deviceId,
    reloadId,
    cardId,
    accountId,
    amount,
    currency,
    motif,
    handleConfirmWithOTP,
  ]);

  // ✅ same “show only pressed method” UI helper
  const showPasscodeBtn =
    authState.hasTrustedDevice &&
    authState.hasPasscode &&
    (!pressedMethod || pressedMethod === "passcode");

  const showBiometricBtn =
    authState.hasTrustedDevice &&
    authState.biometricEnabled &&
    (!pressedMethod || pressedMethod === "biometric");

  const showOtpBtn = !pressedMethod || pressedMethod === "otp";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cards.reloadSummary.title"
            />
          ) }}
      />

      <SafeAreaView style={styles.scrollView}>
        <View style={styles.summaryCard}>
          <TText
            style={styles.sectionTitle}
            tKey="cards.reloadSummary.details"
          />

          <View style={styles.detailsSection}>
            {/* Type */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <RefreshCw size={20} color={BankingColors.primary} />
              </View>
              <View style={styles.detailContent}>
                <TText
                  style={styles.detailLabel}
                  tKey="cards.reloadSummary.operation"
                />
                <TText
                  style={styles.detailValue}
                  tKey="cards.reloadSummary.reload"
                />
              </View>
            </View>

            {/* Account (RIB) */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Wallet size={20} color={BankingColors.primary} />
              </View>
              <View style={styles.detailContent}>
                <TText
                  style={styles.detailLabel}
                  tKey="transactionSummary.reloadAccount"
                />
                <TText style={styles.detailValue}>{rib || accountNumber || "-"}</TText>
                {!!accountLabel && (
                  <TText style={styles.detailSubValue}>{accountLabel}</TText>
                )}
              </View>
            </View>

            {/* Recharged Card Number */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <CreditCard size={20} color={BankingColors.primary} />
              </View>
              <View style={styles.detailContent}>
                <TText
                  style={styles.detailLabel}
                  tKey="transactionSummary.rechargedCard"
                />
                <TText style={styles.detailValue}>
                  {maskCardNumber(cardNumber)}
                </TText>
                {!!cardHolder && (
                  <TText style={styles.detailSubValue}>{cardHolder}</TText>
                )}
              </View>
            </View>

            {/* Amount */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Banknote size={20} color={BankingColors.primary} />
              </View>
              <View style={styles.detailContent}>
                <TText
                  style={styles.detailLabel}
                  tKey="transferSummary.amount"
                />
                <TText style={styles.detailValue}>
                  {amount != null ? toAmountString(amount) : "-"}{" "}
                  {currency ?? ""}
                </TText>
              </View>
            </View>

            {/* Motif */}
            {!!motif && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <FileText size={20} color={BankingColors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <TText
                    style={styles.detailLabel}
                    tKey="transactionSummary.motif"
                  />
                  <TText style={styles.detailValue}>{motif}</TText>
                </View>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* FOOTER */}
      <View
        style={[
          styles.signingMethodsContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {/* PASSCODE */}
        {showPasscodeBtn && (
          <ConfirmationButton
            tKey="cards.reloadSummary.confirmWithPasscode"
            icon={KeyRound}
            onPress={handleConfirmWithPasscode}
            disabled={passcodeDisabled}
            isLoading={isLoading && pressedMethod === "passcode"}
          />
        )}

        {/* BIOMETRIC */}
        {showBiometricBtn && (
          <ConfirmationButton
            tKey="transferSummary.confirmWithBiometric"
            icon={Fingerprint}
            onPress={handleConfirmWithBiometric}
            disabled={biometricDisabled}
            isLoading={isLoading && pressedMethod === "biometric"}
          />
        )}

        {/* OTP */}
        {showOtpBtn && (
          <ConfirmationButton
            tKey="transferSummary.confirmWithOTP"
            icon={Smartphone}
            onPress={handleConfirmWithOTP}
            disabled={otpDisabled}
            isLoading={isLoading && pressedMethod === "otp"}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  scrollView: { flex: 1 },
  errorText: {
    fontSize: FontSize.md,
    color: BankingColors.primaryDark,
    textAlign: "center",
    marginTop: Spacing.xxxl },
  summaryCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4 },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.lg },
  detailsSection: { gap: Spacing.xl },
  detailRow: { flexDirection: "row", gap: Spacing.md },
  detailIcon: {
    width: IconSize.xl,
    height: IconSize.xl,
    borderRadius: IconSize.md,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center" },
  detailContent: { flex: 1 },
  detailLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs },
  detailValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },
  detailSubValue: {
    fontSize: FontSize.sm,
    color: BankingColors.textLight },
  signingMethodsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: BankingColors.surface,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    gap: Spacing.md } });
