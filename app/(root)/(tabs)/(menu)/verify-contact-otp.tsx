import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { BankingColors, Spacing, FontSize, BorderRadius, FontFamily } from "@/constants";
import { Mail, Phone } from "lucide-react-native";
import i18next from "@/features/i18next";
import TText from "@/components/TText";
import { OtpInput, type OtpInputRef } from "react-native-otp-entry";

import {
  verifyContactOtpApi,
  updateEmailApi,
  updatePhoneApi } from "@/services/auth.api";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import useShowMessage from "@/hooks/useShowMessage";
import { BlockingPopup } from "@/components/BlockingPopup";

export default function VerifyContactOtpScreen() {
  const params = useLocalSearchParams<{
    transactionId: string;
    otpType: "email" | "phone";
    newEmail: string;
    newPhone: string;
    verificationTarget: string;
  }>();

  const { showMessageError } = useShowMessage();
  const otpRef = useRef<OtpInputRef>(null);

  const [otpValue, setOtpValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ success popup state
  const [successOpen, setSuccessOpen] = useState(false);

  const isPhone = params.otpType === "phone";

  const handleVerify = async (value: string) => {
    if (isLoading) return;

    const otp = value || otpValue;

    if (otp.length !== 6) {
      showMessageError(
        i18next.t("common.error"),
        i18next.t("contactInfo.errorOtpIncomplete"),
      );
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const verifyResponse = await verifyContactOtpApi(
        params.transactionId,
        otp,
      );

      if (!verifyResponse.verified) {
        showMessageError(
          i18next.t("common.error"),
          i18next.t("contactInfo.errorOtpInvalid"),
        );
        setIsLoading(false);
        return;
      }

      if (params.otpType === "email") {
        await updateEmailApi(params.newEmail, params.transactionId);
      } else {
        await updatePhoneApi(params.newPhone, params.transactionId);
      }

      setSuccessOpen(true);
    } catch (err) {
      console.log("OTP VERIFY ERROR:", err);
      showMessageError(
        i18next.t("common.error"),
        i18next.t("contactInfo.errorVerifyOtp"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessOk = () => {
    setSuccessOpen(false);
    router.back();
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="contactInfo.verifyOtpTitle"
            />
          ) }}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {isPhone ? (
            <Phone size={48} color={BankingColors.text} />
          ) : (
            <Mail size={48} color={BankingColors.primary} />
          )}
        </View>

        <TText tKey="contactInfo.otpSentTo" style={styles.title} />
        <TText style={styles.targetText}>{params.verificationTarget}</TText>

        <View style={styles.infoBox}>
          <TText style={styles.infoText}>
            {isPhone
              ? i18next.t("contactInfo.otpInfoPhone")
              : i18next.t("contactInfo.otpInfoEmail")}
          </TText>
        </View>

        <OtpInput
          ref={otpRef}
          numberOfDigits={6}
          type="numeric"
          blurOnFilled={false}
          autoFocus
          onTextChange={setOtpValue}
          onFilled={handleVerify}
          focusColor={BankingColors.primary}
          theme={{
            containerStyle: styles.otpContainer,
            pinCodeContainerStyle: styles.pinBox,
            focusedPinCodeContainerStyle: styles.pinFocused,
            filledPinCodeContainerStyle: styles.pinFilled,
            pinCodeTextStyle: styles.pinText }}
        />

        <TouchableOpacity
          style={[styles.verifyButton, isLoading && { opacity: 0.6 }]}
          onPress={() => handleVerify(otpValue)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <TText tKey="contactInfo.verify" style={styles.verifyButtonText} />
          )}
        </TouchableOpacity>
      </View>

      {/* ✅ Render popup here (not inside handleVerify) */}
      <BlockingPopup
        visible={successOpen}
        title={i18next.t("common.success")}
        message={i18next.t("contactInfo.successContactUpdated")}
        onRequestClose={handleSuccessOk}
        allowBackdropClose={false}
        allowAndroidBackClose={false}
        showCloseX={false}
        theme={{
          surface: BankingColors.white,
          text: BankingColors.text,
          mutedText: BankingColors.textSecondary,
          border: BankingColors.border,
          primary: BankingColors.primary,
          radius: 16 }}
        actions={[
          {
            label: i18next.t("common.ok"),
            variant: "primary",
            onPress: handleSuccessOk },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },

  iconContainer: { alignItems: "center", marginBottom: Spacing.xl },

  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    textAlign: "center",
    marginBottom: Spacing.sm },
  targetText: {
    textAlign: "center",
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xl },

  infoBox: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#FFD966",
    marginBottom: Spacing.xl },
  infoText: { textAlign: "center" },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.xs },
  pinBox: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BankingColors.border },
  pinFocused: { borderColor: BankingColors.primary },
  pinFilled: { backgroundColor: "#F2F4F7" },
  pinText: { fontSize: FontSize.xxl, fontFamily: FontFamily.bold },

  verifyButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: "center" },
  verifyButtonText: { color: "#fff", fontFamily: FontFamily.semibold } });
