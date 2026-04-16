// app/(auth)/forgot-password-contact.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  FlatList,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Search,
  Check,
  Phone,
  Mail,
  Info,
} from "lucide-react-native";

import TText from "@/components/TText";
import FlashMessage from "react-native-flash-message";

import { useAuth } from "@/hooks/auth-store";
import { generateResetPasswordInitApi } from "@/services/auth.api";
import { getDeviceId } from "@/utils/device-info";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize, ButtonHeight } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";
import {
  DEFAULT_COUNTRY,
  CountryCode,
  COUNTRY_CODES,
} from "@/constants/countries";
import { getPhoneRule, isPhoneValid } from "@/constants/phone-rules";

/* ───────────────────────── Phone formatting ───────────────────────── */

function formatPhoneByPlaceholder(
  rawDigits: string,
  placeholder: string,
): string {
  const digits = rawDigits.replace(/\D/g, "");
  let result = "";
  let digitIndex = 0;

  for (let i = 0; i < placeholder.length && digitIndex < digits.length; i++) {
    if (placeholder[i] === " ") {
      result += " ";
    } else {
      result += digits[digitIndex];
      digitIndex++;
    }
  }

  return result;
}

function stripDigits(text: string): string {
  return text.replace(/\D/g, "");
}

const handleCall = () => {
  Linking.openURL("tel:71111345");
};

/* ───────────────────────────── Validation ───────────────────────────── */

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const contactSchema = z.object({
  phone: z.string().trim().min(1),
  email: z
    .string()
    .trim()
    .min(1, "forgotPassword.emailRequired")
    .regex(EMAIL_REGEX, "forgotPassword.emailInvalid"),
});

type ContactFormValues = z.infer<typeof contactSchema>;
type Step = "contact" | "success" | "info";

/* ───────────────────────────── Screen ───────────────────────────── */

export default function ForgotPasswordContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { deviceId } = useAuth();
  const { cin } = useLocalSearchParams<{ cin: string }>();

  const [step, setStep] = useState<Step>("contact");

  // Country picker
  const [selectedCountry, setSelectedCountry] =
    useState<CountryCode>(DEFAULT_COUNTRY);
  const [countrySearch, setCountrySearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Phone rules
  const phoneRule = useMemo(
    () => getPhoneRule(selectedCountry.code),
    [selectedCountry.code],
  );

  const { control, handleSubmit, watch, setValue } = useForm<ContactFormValues>(
    {
      resolver: zodResolver(contactSchema),
      defaultValues: {
        phone: "",
        email: "",
      },
      mode: "onBlur",
      reValidateMode: "onChange",
    },
  );

  const phone = watch("phone");
  const email = watch("email");

  // Clear phone when country changes
  const prevCountryRef = useRef(selectedCountry.code);
  useEffect(() => {
    if (prevCountryRef.current !== selectedCountry.code) {
      setValue("phone", "", { shouldValidate: false });
      prevCountryRef.current = selectedCountry.code;
    }
  }, [selectedCountry.code, setValue]);

  const phoneDigits = useMemo(() => stripDigits(phone ?? ""), [phone]);

  const phoneValid = useMemo(
    () => isPhoneValid(phoneDigits, selectedCountry.code),
    [phoneDigits, selectedCountry.code],
  );

  const emailValid = useMemo(
    () => EMAIL_REGEX.test((email ?? "").trim()),
    [email],
  );

  const contactValid = phoneValid && emailValid;

  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.includes(q),
    );
  }, [countrySearch]);

  /* ───────────────────── Country modal helpers ───────────────────── */

  const openCountryPicker = useCallback(() => {
    Keyboard.dismiss();
    setModalVisible(true);
  }, []);

  const closeCountryPicker = useCallback(() => {
    setModalVisible(false);
    setCountrySearch("");
  }, []);

  /* ───────────────────────── Mutation ───────────────────────── */

  const initMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      // ✅ Always resolve the real device ID — the store may not have hydrated
      // it yet if the user navigates here quickly after app start.
      // Sending a wrong/null ID would mismatch what the backend sees at login.
      let resolvedDeviceId = deviceId;
      if (!resolvedDeviceId) {
        try {
          resolvedDeviceId = await getDeviceId();
        } catch (e) {
          console.warn("[forgot-password] getDeviceId failed:", e);
        }
      }

      const rawPhone = stripDigits(values.phone);
      return generateResetPasswordInitApi({
        deviceId: resolvedDeviceId ?? "",
        identificationNumber: cin ?? "",
        identificationType: "CIN",
        phoneNumber: `${selectedCountry.dial}${rawPhone}`,
        mail: values.email.trim(),
      });
    },
    onSuccess: () => setStep("success"),
    onError: (error: any) => {
      console.log("❌ [forgot-password] API error:", error?.message ?? error, "errorCode:", error?.errorCode);
      const isInternalError =
        error?.errorCode === "BAD_REQUEST" ||
        error?.message === "BAD_REQUEST" ||
        String(error?.message ?? "").includes("BAD_REQUEST") ||
        String(error?.message ?? "").includes("contact info error");
      if (isInternalError) {
        setStep("info");
        return;
      }
      // All other errors: show the same success screen (security — don't reveal details)
      setStep("success");
    },
  });

  /* ───────────────────────── Navigation ───────────────────────── */

  const handleGoBack = () => {
    router.replace("/(auth)/login");
  };

  const handleContactSubmit = handleSubmit((values) => {
    initMutation.mutate(values);
  });

  /* ───────────────────────── Render: Contact step ───────────────────────── */

  const renderContactStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Image
          source={require("@assets/images/newlogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.header}>
        <TText style={styles.title} tKey="forgotPassword.contactTitle" />
        {selectedCountry.code === "TN" && (
          <View style={styles.contactHintBox}>
            <Info
              size={16}
              color={BankingColors.info}
              style={styles.contactHintIcon}
            />
            <TText style={styles.contactHint} tKey="forgotPassword.contactHint" />
          </View>
        )}
      </View>

      <View style={styles.form}>
        {/* Phone */}
        <View>
          <View style={styles.labelRow}>
            <Phone size={18} color={BankingColors.primary} />
            <TText style={styles.label} tKey="forgotPassword.phoneLabel" />
            <TText style={styles.requiredAsterisk}>*</TText>
          </View>

          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity
                  style={[
                    styles.countrySelector,
                    initMutation.isPending && styles.disabled,
                  ]}
                  onPress={openCountryPicker}
                  disabled={initMutation.isPending}
                >
                  <TText style={styles.countryFlag}>
                    {selectedCountry.flag}
                  </TText>
                  <TText style={styles.countryDial}>
                    {selectedCountry.dial}
                  </TText>
                </TouchableOpacity>

                <TextInput
                  style={[
                    styles.phoneInput,
                    initMutation.isPending && styles.disabled,
                  ]}
                  value={value}
                  onChangeText={(text) => {
                    const digits = stripDigits(text);
                    const maxDigits = phoneRule.placeholder.replace(
                      /\s/g,
                      "",
                    ).length;
                    const limited = digits.slice(0, maxDigits);
                    const formatted = formatPhoneByPlaceholder(
                      limited,
                      phoneRule.placeholder,
                    );
                    onChange(formatted);
                  }}
                  onBlur={onBlur}
                  placeholder={phoneRule.placeholder}
                  placeholderTextColor={BankingColors.textTertiary}
                  keyboardType="number-pad"
                  editable={!initMutation.isPending}
                  returnKeyType="done"
                />
              </View>
            )}
          />
        </View>

        {/* Email */}
        <View>
          <View style={styles.labelRow}>
            <Mail size={18} color={BankingColors.primary} />
            <TText style={styles.label} tKey="forgotPassword.emailLabel" />
            <TText style={styles.requiredAsterisk}>*</TText>
          </View>

          <Controller
            control={control}
            name="email"
            render={({
              field: { value, onChange, onBlur },
              fieldState: { error },
            }) => (
              <>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputMarginTop,
                    error && styles.inputError,
                    initMutation.isPending && styles.disabled,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("forgotPassword.emailPlaceholder")}
                  placeholderTextColor={BankingColors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!initMutation.isPending}
                  returnKeyType="done"
                />
                {error?.message && (
                  <TText style={styles.errorText} tKey={error.message} />
                )}
              </>
            )}
          />
        </View>
      </View>
    </View>
  );

  /* ───────────────────────── Render: Success step ───────────────────────── */

  const renderSuccessStep = () => (
    <>
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircle size={48} color={BankingColors.success} />
          </View>
        </View>

        <View style={styles.successContent}>
          <TText
            style={styles.successMessage}
            tKey="forgotPassword.successMessage"
          />
        </View>

        <View style={styles.successHint}>
          <TText
            style={styles.successHintText}
            tKey="forgotPassword.successHint"
          />
        </View>
      </View>
      <View style={[styles.submitContainer]}>
        <TouchableOpacity
          style={[styles.submitButton]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <TText
            style={styles.returnButtonText}
            tKey="forgotPassword.returnToLogin"
          />
        </TouchableOpacity>
        <View style={styles.agencyHelpRow}>
          <TText
            style={styles.agencyHelpText}
            tKey="forgotPassword.successAgencyHelp"
          />
          <TouchableOpacity onPress={handleCall}>
            <TText
              style={styles.agencyHelpPhone}
              tKey={"forgotPassword.successAgencyHelp.prefix"}
            >
              {" " + t("forgotPassword.phoneNumber")}
            </TText>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  /* ───────────────────────── Render: Info step (BAD_REQUEST) ───────────────────────── */

  const renderInfoStep = () => (
    <>
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <View style={styles.infoIconCircle}>
            <Info size={48} color={BankingColors.info} />
          </View>
        </View>

        <View style={styles.successContent}>
          <TText
            style={styles.successMessage}
            tKey="forgotPassword.infoMessage"
          />
        </View>

        <View style={styles.infoHintBox}>
          <TText
            style={styles.infoHintText}
            tKey="forgotPassword.infoHint"
          />
        </View>
      </View>
      <View style={[styles.submitContainer]}>
        <TouchableOpacity
          style={[styles.submitButton]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <TText
            style={styles.returnButtonText}
            tKey="forgotPassword.returnToLogin"
          />
        </TouchableOpacity>
        <View style={styles.agencyHelpRow}>
          <TText
            style={styles.agencyHelpText}
            tKey="forgotPassword.successAgencyHelp"
          />
          <TouchableOpacity onPress={handleCall}>
            <TText
              style={styles.agencyHelpPhone}
              tKey={"forgotPassword.successAgencyHelp.prefix"}
            >
              {" " + t("forgotPassword.phoneNumber")}
            </TText>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  /* ───────────────────────── Country item ───────────────────────── */

  const renderCountryItem = useCallback(
    ({ item }: { item: CountryCode }) => (
      <TouchableOpacity
        style={[
          styles.countryItem,
          selectedCountry.code === item.code && styles.countryItemSelected,
        ]}
        onPress={() => {
          setSelectedCountry(item);
          closeCountryPicker();
        }}
      >
        <TText style={styles.countryItemFlag}>{item.flag}</TText>
        <View style={styles.countryItemInfo}>
          <TText style={styles.countryItemName}>{item.name}</TText>
          <TText style={styles.countryItemDial}>{item.dial}</TText>
        </View>
        {selectedCountry.code === item.code && (
          <Check size={20} color={BankingColors.primary} />
        )}
      </TouchableOpacity>
    ),
    [selectedCountry.code, closeCountryPicker],
  );

  /* ───────────────────────── Main render ───────────────────────── */

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.background}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top,
            paddingBottom: Spacing.md,
          },
        ]}
        keyboardShouldPersistTaps="always"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <View style={styles.content}>
          {step !== "success" && step !== "info" && (
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={IconSize.md} color={BankingColors.primary} />
            </TouchableOpacity>
          )}

          {step === "contact" && renderContactStep()}
          {step === "success" && renderSuccessStep()}
          {step === "info" && renderInfoStep()}
        </View>
      </KeyboardAwareScrollView>

      {/* ─────────── Pinned submit button + agency help ─────────── */}
      {step === "contact" && (
        <View
          style={[
            styles.submitContainer,
            { paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!contactValid || initMutation.isPending) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleContactSubmit}
            disabled={!contactValid || initMutation.isPending}
          >
            {initMutation.isPending ? (
              <ActivityIndicator color={BankingColors.white} />
            ) : (
              <>
                <TText
                  style={styles.submitButtonText}
                  tKey="forgotPassword.sendRequest"
                />
                <ArrowRight size={IconSize.md} color={BankingColors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ─────────── Country Picker Modal ─────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCountryPicker}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TText
              style={styles.modalTitle}
              tKey="forgotPassword.selectCountry"
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeCountryPicker}
            >
              <TText style={styles.modalCloseText} tKey="common.done" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Search size={20} color={BankingColors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholder={t("forgotPassword.searchCountry")}
              placeholderTextColor={BankingColors.textTertiary}
              autoCorrect={false}
            />
          </View>

          {/* Country list */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item: CountryCode) => item.code}
            renderItem={renderCountryItem}
            contentContainerStyle={[
              styles.countryList,
              { paddingBottom: insets.bottom + Spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>

      <FlashMessage position="top" />
    </View>
    </TouchableWithoutFeedback>
  );
}

/* ───────────────────────── Styles ───────────────────────── */

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: BankingColors.background },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xs,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.xs,
  },

  stepContainer: { flex: 1 },
  iconContainer: { alignItems: "center", marginBottom: Spacing.md },
  logo: { width: 280, height: 90 },

  header: { marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.sm,
    color: BankingColors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    lineHeight: FontSize.base * LineHeight.normal,
    textAlign: "center",
  },
  contactHintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: BankingColors.info + "12",
    borderWidth: 1,
    borderColor: BankingColors.info + "40",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  contactHintIcon: { marginTop: 2 },
  contactHint: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.info,
    lineHeight: FontSize.sm * LineHeight.relaxed,
  },

  form: { gap: Spacing.lg },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
  },
  requiredAsterisk: {
    fontSize: FontSize.base,
    color: BankingColors.error,
    fontFamily: FontFamily.bold,
  },

  input: {
    backgroundColor: BankingColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
    ...Shadow.xs,
  },
  inputMarginTop: { marginTop: Spacing.sm },
  inputError: {
    borderColor: BankingColors.error,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: BankingColors.error,
    marginTop: Spacing.xs,
  },

  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    gap: Spacing.xs,
    ...Shadow.xs,
  },
  countryFlag: { fontSize: 20 },
  countryDial: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: BankingColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
    letterSpacing: 1,
    ...Shadow.xs,
  },

  disabled: { opacity: 0.6 },

  submitContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 80,
    backgroundColor: BankingColors.background,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
  },
  submitButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    height: ButtonHeight.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadow.button,
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: BankingColors.borderMedium,
    opacity: 0.6,
  },
  submitButtonText: {
    color: BankingColors.white,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },

  // ── Agency help row below submit button ──
  agencyHelpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  agencyHelpText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "center",
  },
  agencyHelpPhone: {
    fontSize: FontSize.sm,
    color: BankingColors.primary,
    fontFamily: FontFamily.semibold,
    textDecorationLine: "underline",
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing.xxl,
  },
  successIconContainer: { marginBottom: Spacing.xl },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BankingColors.success + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  successContent: { alignItems: "center", marginBottom: Spacing.xl },
  successMessage: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: FontSize.md * LineHeight.relaxed,
    paddingHorizontal: Spacing.md,
  },
  successHint: {
    backgroundColor: BankingColors.info + "12",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  successHintText: {
    fontSize: FontSize.md,
    color: BankingColors.info,
    textAlign: "center",
  },
  successAgencyHelpBox: {
    backgroundColor: BankingColors.info + "12",
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
  },
  successAgencyHelpText: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: "center",
    fontFamily: FontFamily.medium,
  },

  infoIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BankingColors.info + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  infoHintBox: {
    backgroundColor: BankingColors.info + "12",
    borderWidth: 1,
    borderColor: BankingColors.info + "40",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  infoHintText: {
    fontSize: FontSize.md,
    color: BankingColors.info,
    textAlign: "center",
    lineHeight: FontSize.md * LineHeight.relaxed,
  },

  returnButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: 50,
    height: ButtonHeight.lg,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    ...Shadow.button,
  },
  returnButtonText: {
    color: BankingColors.white,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },

  // Country Modal
  modalContainer: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
  },
  modalCloseButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  modalCloseText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
  },
  countryList: { paddingHorizontal: Spacing.xl },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
  },
  countryItemSelected: { backgroundColor: BankingColors.primaryLight },
  countryItemFlag: { fontSize: 28, marginRight: Spacing.md },
  countryItemInfo: { flex: 1 },
  countryItemName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.textPrimary,
  },
  countryItemDial: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: 2,
  },
});
