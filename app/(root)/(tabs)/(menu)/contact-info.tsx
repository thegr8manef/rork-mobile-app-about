import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { BankingColors, Spacing, FontSize, FontFamily } from "@/constants";
import { Mail, Phone, Check, Info, AlertCircle } from "lucide-react-native";
import TText from "@/components/TText";
import i18next from "@/features/i18next";
import { COUNTRY_CODES } from "@/constants/countries";
import { requestEmailOtpApi, requestPhoneOtpApi } from "@/services/auth.api";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { useProfile } from "@/hooks/use-accounts-api";

export default function ContactInfoScreen() {
  const { data: profile } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [generalError, setGeneralError] = useState("");

  // const handleStartEdit = () => {
  //   setIsEditing(true);
  //   setNewEmail(email);
  //   setNewPhone(phone);
  //   setEmailError("");
  //   setPhoneError("");
  //   setGeneralError("");
  // };

  // const handleCancelEdit = () => {
  //   setIsEditing(false);
  //   setNewEmail("");
  //   setNewPhone("");
  //   setEmailError("");
  //   setPhoneError("");
  //   setGeneralError("");
  // };

  const getFlagForPhone = (phone: string): string => {
    const clean = phone.replace(/\s/g, "");
    const sorted = [...COUNTRY_CODES].sort(
      (a, b) => b.dial.length - a.dial.length,
    );
    const match = sorted.find((c) => clean.startsWith(c.dial));
    return match?.flag ?? "";
  };

  const isTunisianPhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\s/g, "");
    return cleanPhone.startsWith("+216") || cleanPhone.startsWith("00216");
  };

  // const validateEmail = (email: string): boolean => {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   return emailRegex.test(email);
  // };

  // const validatePhone = (phone: string): boolean => {
  //   const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  //   return phoneRegex.test(phone.replace(/\s/g, ""));
  // };

  // const handleConfirmChanges = async (): Promise<void> => {
  //   setEmailError("");
  //   setPhoneError("");
  //   setGeneralError("");

  //   let hasError = false;

  //   if (!validateEmail(newEmail)) {
  //     setEmailError(i18next.t("contactInfo.errorInvalidEmail"));
  //     hasError = true;
  //   }

  //   const cleanPhone = newPhone.replace(/\s/g, "");
  //   if (!validatePhone(cleanPhone)) {
  //     setPhoneError(i18next.t("contactInfo.errorInvalidPhone"));
  //     hasError = true;
  //   }

  //   if (!hasError && newEmail === email && newPhone === phone) {
  //     setGeneralError(i18next.t("contactInfo.errorNoChanges"));
  //     hasError = true;
  //   }

  //   if (hasError) {
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     const isTunisian = isTunisianPhone(newPhone);
  //     let transactionId = "";

  //     if (isTunisian) {
  //       const response = await requestPhoneOtpApi(cleanPhone);
  //       transactionId = response.transactionId;
  //     } else {
  //       const response = await requestEmailOtpApi(newEmail);
  //       transactionId = response.transactionId;
  //     }

  //     router.navigate({
  //       pathname: "/(root)/(tabs)/(menu)/verify-contact-otp",
  //       params: {
  //         transactionId,
  //         otpType: isTunisian ? "phone" : "email",
  //         newEmail,
  //         newPhone,
  //         verificationTarget: isTunisian ? newPhone : newEmail,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error sending OTP:", error);
  //     setGeneralError(i18next.t("contactInfo.errorSendOtp"));
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const getOtpChannelInfo = (): string => {
    if (!isEditing) {
      return isTunisianPhone(profile?.users[0]?.contact?.telNumber || "")
        ? i18next.t("contactInfo.infoTunisianPhone")
        : i18next.t("contactInfo.infoNonTunisianPhone");
    }
    return isTunisianPhone(newPhone)
      ? i18next.t("contactInfo.infoTunisianPhoneEdit")
      : i18next.t("contactInfo.infoNonTunisianPhoneEdit");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="contactInfo.title"
            />
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ================= EMAIL ================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color={BankingColors.primary} strokeWidth={2} />
            <TText
              tKey="contactInfo.emailSection"
              style={styles.sectionTitle}
            />
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TText
                tKey="contactInfo.currentEmail"
                style={styles.currentLabel}
              />
              <TText style={styles.currentValue}>
                {profile?.users[0]?.contact?.mail}
              </TText>

              <FormControl isInvalid={!!emailError}>
                <TText tKey="contactInfo.newEmail" style={styles.inputLabel} />

                <Input
                  variant="outline"
                  size="md"
                  isDisabled={isLoading}
                  isInvalid={!!emailError}
                  style={styles.inputWrapper}
                >
                  <InputField
                    value={newEmail}
                    onChangeText={(text) => {
                      setNewEmail(text);
                      if (emailError) setEmailError("");
                    }}
                    placeholder={i18next.t("contactInfo.emailPlaceholder")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.inputField}
                  />
                </Input>

                <FormControlError>
                  <FormControlErrorIcon as={AlertCircle} />
                  <FormControlErrorText>{emailError}</FormControlErrorText>
                </FormControlError>
              </FormControl>
            </View>
          ) : (
            <View style={styles.infoContainer}>
              <TText style={styles.infoValue}>
                {profile?.users[0]?.contact?.mail ?? "-"}
              </TText>
            </View>
          )}
        </View>

        {/* ================= PHONE ================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Phone size={20} color={BankingColors.primary} strokeWidth={2} />
            <TText
              tKey="contactInfo.phoneSection"
              style={styles.sectionTitle}
            />
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TText
                tKey="contactInfo.currentPhone"
                style={styles.currentLabel}
              />
              <TText style={styles.currentValue}>
                {profile?.users[0]?.contact?.telNumber}
              </TText>

              <FormControl isInvalid={!!phoneError}>
                <TText tKey="contactInfo.newPhone" style={styles.inputLabel} />

                <Input
                  variant="outline"
                  size="md"
                  isDisabled={isLoading}
                  isInvalid={!!phoneError}
                  style={styles.inputWrapper}
                >
                  <InputField
                    value={newPhone}
                    onChangeText={(text) => {
                      setNewPhone(text);
                      if (phoneError) setPhoneError("");
                    }}
                    placeholder={i18next.t("contactInfo.phonePlaceholder")}
                    keyboardType="phone-pad"
                    style={styles.inputField}
                  />
                </Input>

                <FormControlError>
                  <FormControlErrorIcon as={AlertCircle} />
                  <FormControlErrorText>{phoneError}</FormControlErrorText>
                </FormControlError>
              </FormControl>
            </View>
          ) : (
            <View style={styles.infoContainer}>
              <View style={styles.phoneRow}>
                <TText style={styles.flagEmoji}>
                  {getFlagForPhone(profile?.users[0]?.contact?.telNumber || "")}
                </TText>
                <TText style={styles.infoValue}>
                  {profile?.users[0]?.contact?.telNumber ?? "-"}
                </TText>
              </View>
            </View>
          )}
        </View>

        {/* ================= INFO BOX ================= */}
        <View style={styles.infoBox}>
          <View style={styles.infoBoxHeader}>
            <Info size={20} color="#FF9800" strokeWidth={2} />
            <TText tKey="contactInfo.infoTitle" style={styles.infoBoxTitle} />
          </View>
          <TText style={styles.infoBoxText}>{getOtpChannelInfo()}</TText>
        </View>

        {/* ================= GLOBAL ERROR ================= */}
        {generalError ? (
          <View style={styles.generalErrorContainer}>
            <TText style={styles.generalErrorText}>{generalError}</TText>
          </View>
        ) : null}

        {/* ================= ACTION BUTTONS ================= */}
        {/* {isEditing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelEdit}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <TText
                tKey="contactInfo.cancel"
                style={styles.cancelButtonText}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirmChanges}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" strokeWidth={2} />
                  <TText
                    tKey="contactInfo.confirm"
                    style={styles.confirmButtonText}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editMainButton}
            onPress={handleStartEdit}
            activeOpacity={0.8}
          >
            <TText
              tKey="contactInfo.modifyContacts"
              style={styles.editMainButtonText}
            />
          </TouchableOpacity>
        )} */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  backButton: {
    marginLeft: Spacing.md,
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: "#000000",
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoValue: {
    fontSize: FontSize.base,
    color: BankingColors.text,
    flex: 1,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  flagEmoji: {
    fontSize: 22,
  },
  editContainer: {
    gap: Spacing.md,
  },
  currentLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  currentValue: {
    fontSize: FontSize.base,
    color: BankingColors.text,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BankingColors.border,
    minHeight: 48,
  },
  inputField: {
    fontSize: FontSize.base,
    color: BankingColors.text,
    paddingHorizontal: Spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  confirmButton: {
    backgroundColor: BankingColors.primary,
  },
  cancelButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  confirmButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF",
  },
  infoBox: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#FFD966",
  },
  infoBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoBoxTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: "#000000",
  },
  infoBoxText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20,
  },
  editMainButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  editMainButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF",
  },
  generalErrorContainer: {
    backgroundColor: "#FEE",
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#FCC",
  },
  generalErrorText: {
    fontSize: FontSize.sm,
  },
});
