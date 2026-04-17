// app/(auth)/contact-data-validation.tsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
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
} from "react-native";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  CreditCard,
  Check,
  Search,
  Info,
} from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TText from "@/components/TText";
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
import useShowMessage from "@/hooks/useShowMessage";
import {
  contactDetailsInitApi,
  contactDetailsConfirmApi,
  getProfileWithTokenApi,
  ApiContactError,
} from "@/services/auth.api";

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

/* ───────────────────────────── Validation ───────────────────────────── */

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/* ───────────────────────────── Screen ───────────────────────────── */

export default function ContactDataValidationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { accessToken, refreshToken } = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
  }>();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  const didNavigateRef = useRef(false);
  const didAutoSubmitRef = useRef(false);
  const didProfileCheckRef = useRef(false);

  const [step, setStep] = useState<"loading" | "form" | "otp">("loading");
  const [cin, setCin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState("");

  // Country picker
  const [selectedCountry, setSelectedCountry] =
    useState<CountryCode>(DEFAULT_COUNTRY);
  const [countrySearch, setCountrySearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const countrySheetRef = useRef<BottomSheet>(null);
  const countrySnapPoints = useMemo(() => ["70%", "90%"], []);

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Phone rules
  const phoneRule = useMemo(
    () => getPhoneRule(selectedCountry.code),
    [selectedCountry.code],
  );

  const isOtpByMail = selectedCountry.dial !== "+216";

  const phoneDigits = useMemo(() => stripDigits(phone ?? ""), [phone]);
  const fullPhoneNumber = `${selectedCountry.dial}${phoneDigits}`;

  // Clear phone when country changes
  const prevCountryRef = useRef(selectedCountry.code);
  useEffect(() => {
    if (prevCountryRef.current !== selectedCountry.code) {
      setPhone("");
      prevCountryRef.current = selectedCountry.code;
    }
  }, [selectedCountry.code]);

  const phoneValid = useMemo(
    () => isPhoneValid(phoneDigits, selectedCountry.code),
    [phoneDigits, selectedCountry.code],
  );

  const emailValid = useMemo(() => {
    return EMAIL_REGEX.test((email ?? "").trim());
  }, [email]);

  const isFormValid = useMemo(() => {
    const cinOk = cin.trim().length === 8;
    return cinOk && phoneValid && emailValid;
  }, [cin, phoneValid, emailValid]);

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

  /* ───────────────────── Bottom sheet helpers ───────────────────── */

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
        enableTouchThrough={true}
      />
    ),
    [],
  );

  const openCountryPicker = useCallback(() => {
    Keyboard.dismiss();
    setSheetOpen(true);
    setTimeout(() => countrySheetRef.current?.expand(), 50);
  }, []);

  const closeCountryPicker = useCallback(() => {
    countrySheetRef.current?.close();
    setCountrySearch("");
  }, []);

  /* ───────────────────────── Auth check + Profile check ───────────────────────── */

  useEffect(() => {
    if (!accessToken) {
      console.log("No access token provided, redirecting to login");
      showMessageError(
        "contactValidation.error",
        "contactValidation.errorDescription",
      );
      if (!didNavigateRef.current) {
        didNavigateRef.current = true;
        router.replace("/(auth)/login");
      }
      return;
    }

    if (didProfileCheckRef.current) return;
    didProfileCheckRef.current = true;

    void (async () => {
      try {
        console.log("Fetching profile to check contact data...");
        const profileData = await getProfileWithTokenApi(accessToken);
        const primaryUser = profileData?.users?.[0];

        if (
          primaryUser?.contact != null &&
          primaryUser?.contact?.telNumber != null
        ) {
          console.log(
            "User has contact data, redirecting to mandatory-reset-password",
          );
          if (!didNavigateRef.current) {
            didNavigateRef.current = true;
            router.replace({
              pathname: "/(auth)/mandatory-reset-password",
              params: {
                accessToken,
                ...(refreshToken ? { refreshToken } : {}),
              },
            });
          }
          return;
        }

        console.log("User has no contact data, showing contact form");
        setStep("form");
      } catch (error: any) {
        console.log("Profile check failed:", error);
        if (error instanceof ApiContactError && error.status >= 400) {
          showMessageError(
            "contactValidation.profileError",
            error.message || "contactValidation.profileErrorDescription",
          );
        }
        setStep("form");
      }
    })();
  }, [accessToken, refreshToken, router, showMessageError]);

  /* ───────────────────────── Mutations ───────────────────────── */

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("TOKEN_MISSING");

      const payload: {
        identificationType: string;
        identificationNumber: string;
        phoneNumber: string;
        email?: string;
      } = {
        identificationType: "CIN",
        identificationNumber: cin,
        phoneNumber: fullPhoneNumber,
      };

      if (email.trim()) {
        payload.email = email.trim();
      }

      return contactDetailsInitApi(payload, accessToken);
    },
    onSuccess: (res) => {
      console.log("Contact details init success:", res);
      setRequestId(res.requestId);
      setStep("otp");
      didAutoSubmitRef.current = false;
    },
    onError: (error: any) => {
      console.log("Contact details init error:", error);
      if (error instanceof ApiContactError && error.status >= 400) {
        showMessageError(
          "contactValidation.initError",
          "contactValidation.initErrorDescription",
        );
      } else {
        showMessageError(
          "contactValidation.error",
          "contactValidation.errorDescription",
        );
      }
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("TOKEN_MISSING");
      const code = otp.join("");
      if (code.length !== 6) throw new Error("OTP_INCOMPLETE");
      return contactDetailsConfirmApi({ requestId, otp: code }, accessToken);
    },
    onSuccess: async (res) => {
      console.log("Contact details confirm success:", res);

      if (res.noContent) {
        console.log("204 No Content - redirecting to mandatory-reset-password");
        if (!didNavigateRef.current) {
          didNavigateRef.current = true;
          router.replace({
            pathname: "/(auth)/mandatory-reset-password",
            params: {
              accessToken: accessToken ?? "",
              ...(refreshToken ? { refreshToken } : {}),
            },
          });
        }
        return;
      }

      showMessageSuccess(
        "contactValidation.success",
        "contactValidation.successDescription",
      );

      if (!didNavigateRef.current) {
        didNavigateRef.current = true;
        router.replace({
          pathname: "/(auth)/mandatory-reset-password",
          params: {
            accessToken: accessToken ?? "",
            ...(refreshToken ? { refreshToken } : {}),
          },
        });
      }
    },
    onError: (error: any) => {
      console.log("Contact details confirm error:", error);
      if (error instanceof ApiContactError && error.status >= 400) {
        showMessageError(
          "contactValidation.otpError",
          "contactValidation.otpErrorDescription",
        );
      } else {
        showMessageError(
          "contactValidation.otpError",
          "contactValidation.otpErrorDescription",
        );
      }
      setOtp(["", "", "", "", "", ""]);
      didAutoSubmitRef.current = false;
      inputRefs.current[0]?.focus();
    },
  });

  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSubmit = useCallback(() => {
    if (!isFormValid) {
      showMessageError(
        "contactValidation.error",
        "contactValidation.errorDescription",
      );
      return;
    }
    validateMutation.mutate();
  }, [isFormValid, validateMutation, showMessageError]);

  /* ───────────────────────── OTP handlers ───────────────────────── */

  const tryAutoSubmitOtp = useCallback(
    (nextOtp: string[]) => {
      const code = nextOtp.join("");
      if (
        code.length === 6 &&
        !nextOtp.includes("") &&
        !confirmMutation.isPending
      ) {
        if (!didAutoSubmitRef.current) {
          didAutoSubmitRef.current = true;
          confirmMutation.mutate();
        }
      }
    },
    [confirmMutation],
  );

  const handleOtpChange = useCallback(
    (text: string, index: number) => {
      const cleaned = text.replace(/[^\d]/g, "");

      if (cleaned.length > 1) {
        const chars = cleaned.slice(0, 6 - index).split("");
        const next = [...otp];
        chars.forEach((ch, i) => {
          next[index + i] = ch;
        });
        setOtp(next);

        const focusIndex = Math.min(index + chars.length, 5);
        inputRefs.current[focusIndex]?.focus();

        tryAutoSubmitOtp(next);
        return;
      }

      if (cleaned.length === 0 || cleaned.length === 1) {
        const next = [...otp];
        next[index] = cleaned;
        setOtp(next);

        if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();

        tryAutoSubmitOtp(next);
      }
    },
    [otp, tryAutoSubmitOtp],
  );

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      if (e?.nativeEvent?.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp],
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

  /* ───────────────────────── Render: Loading ───────────────────────── */

  const renderLoadingStep = () => (
    <View style={styles.loadingFullContainer}>
      <ActivityIndicator size="large" color={BankingColors.primary} />
      <TText
        style={styles.loadingFullText}
        tKey="contactValidation.checkingProfile"
      />
    </View>
  );

  /* ───────────────────────── Render: Form ───────────────────────── */

  const renderFormStep = () => (
    <>
      <View style={styles.header}>
        <TText style={styles.title} tKey="contactValidation.title" />
        <TText style={styles.subtitle} tKey="contactValidation.subtitle" />
      </View>

      {isOtpByMail && (
        <View style={styles.otpByMailBanner}>
          <Info size={18} color={BankingColors.info} />
          <TText
            style={styles.otpByMailText}
            tKey="contactValidation.otpByMailHint"
          />
        </View>
      )}

      <View style={styles.form}>
        {/* CIN */}
        <View>
          <View style={styles.labelRow}>
            <CreditCard size={18} color={BankingColors.primary} />
            <TText style={styles.label} tKey="contactValidation.cinLabel" />
            <TText style={styles.requiredAsterisk}>*</TText>
          </View>
          <TextInput
            style={styles.input}
            value={cin}
            onChangeText={(text) => setCin(text.replace(/[^\d]/g, ""))}
            placeholder="12345678"
            placeholderTextColor={BankingColors.textTertiary}
            keyboardType="number-pad"
            maxLength={8}
            editable={!validateMutation.isPending}
          />
        </View>

        {/* Phone */}
        <View>
          <View style={styles.labelRow}>
            <Phone size={18} color={BankingColors.primary} />
            <TText style={styles.label} tKey="contactValidation.phoneLabel" />
            <TText style={styles.requiredAsterisk}>*</TText>
          </View>

          <View style={styles.phoneInputContainer}>
            <TouchableOpacity
              style={[
                styles.countrySelector,
                validateMutation.isPending && styles.disabled,
              ]}
              onPress={openCountryPicker}
              disabled={validateMutation.isPending}
            >
              <TText style={styles.countryFlag}>{selectedCountry.flag}</TText>
              <TText style={styles.countryDial}>{selectedCountry.dial}</TText>
            </TouchableOpacity>

            <TextInput
              style={[
                styles.phoneInput,
                validateMutation.isPending && styles.disabled,
              ]}
              value={phone}
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
                setPhone(formatted);
              }}
              placeholder={phoneRule.placeholder}
              placeholderTextColor={BankingColors.textTertiary}
              keyboardType="number-pad"
              editable={!validateMutation.isPending}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Email - always required */}
        <View>
          <View style={styles.labelRow}>
            <Mail size={18} color={BankingColors.primary} />
            <TText style={styles.label} tKey="contactValidation.emailLabel" />
            <TText style={styles.requiredAsterisk}>*</TText>
          </View>

          <TextInput
            style={[
              styles.input,
              styles.inputMarginTop,
              validateMutation.isPending && styles.disabled,
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="exemple@email.com"
            placeholderTextColor={BankingColors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!validateMutation.isPending}
            returnKeyType="done"
          />
        </View>
      </View>
    </>
  );

  /* ───────────────────────── Render: OTP ───────────────────────── */

  const renderOtpStep = () => (
    <>
      <View style={styles.header}>
        <TText style={styles.title} tKey="contactValidation.otpTitle" />
        <TText
          style={styles.subtitle}
          tKey={
            isOtpByMail
              ? "contactValidation.otpSubtitleMail"
              : "contactValidation.otpSubtitle"
          }
        />
      </View>

      <View style={styles.phoneDisplay}>
        {isOtpByMail ? (
          <>
            <Mail size={20} color={BankingColors.primary} />
            <TText style={styles.phoneText}>{email}</TText>
          </>
        ) : (
          <>
            <Phone size={20} color={BankingColors.primary} />
            <TText style={styles.phoneText}>{fullPhoneNumber}</TText>
          </>
        )}
      </View>

      <View style={styles.form}>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(tx) => handleOtpChange(tx, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!confirmMutation.isPending}
            />
          ))}
        </View>

        {confirmMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={BankingColors.primary} />
            <TText
              style={styles.loadingText}
              tKey="contactValidation.verifying"
            />
          </View>
        )}
      </View>
    </>
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
            {step === "otp" && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setStep("form");
                  setOtp(["", "", "", "", "", ""]);
                  didAutoSubmitRef.current = false;
                }}
                disabled={confirmMutation.isPending}
              >
                <ArrowLeft size={IconSize.md} color={BankingColors.primary} />
              </TouchableOpacity>
            )}

            <View style={styles.iconContainer}>
              <Image
                source={require("@assets/images/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {step === "loading" && renderLoadingStep()}
            {step === "form" && renderFormStep()}
            {step === "otp" && renderOtpStep()}
          </View>
        </KeyboardAwareScrollView>

        {/* ─────────── Pinned submit button (form step only) ─────────── */}
        {step === "form" && (
          <View
            style={[
              styles.submitContainer,
              { paddingBottom: insets.bottom + Spacing.md },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid || validateMutation.isPending) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || validateMutation.isPending}
            >
              {validateMutation.isPending ? (
                <ActivityIndicator color={BankingColors.white} />
              ) : (
                <>
                  <TText
                    style={styles.submitButtonText}
                    tKey="contactValidation.continue"
                  />
                  <ArrowRight size={IconSize.md} color={BankingColors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Only mount when open — prevents touch blocking */}
        {sheetOpen && (
          <BottomSheet
            ref={countrySheetRef}
            index={-1}
            snapPoints={countrySnapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={styles.handleIndicator}
            backgroundStyle={styles.bottomSheetBackground}
            onChange={(index) => {
              if (index === -1) {
                setCountrySearch("");
                setSheetOpen(false);
              }
            }}
          >
            <View style={styles.bottomSheetContent}>
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

              <View style={styles.searchContainer}>
                <Search size={20} color={BankingColors.textTertiary} />
                <BottomSheetTextInput
                  allowFontScaling={false}
                  style={styles.searchInput}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  placeholder={t("forgotPassword.searchCountry")}
                  placeholderTextColor={BankingColors.textTertiary}
                />
              </View>

              <BottomSheetFlatList
                data={filteredCountries}
                keyExtractor={(item: CountryCode) => item.code}
                renderItem={renderCountryItem}
                contentContainerStyle={styles.countryList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </BottomSheet>
        )}
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
    marginBottom: Spacing.lg,
    ...Shadow.xs,
  },

  iconContainer: { alignItems: "center", marginBottom: Spacing.md },
  logo: { width: 200, height: 85 },

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
    paddingTop: Spacing.md,
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

  phoneDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: BankingColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  phoneText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: BankingColors.border,
    borderRadius: BorderRadius.lg,
    textAlign: "center",
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    backgroundColor: BankingColors.background,
  },
  otpInputFilled: {
    borderColor: BankingColors.primary,
    backgroundColor: BankingColors.primary + "05",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  demoText: {
    fontSize: FontSize.sm,
    color: BankingColors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xl,
    fontStyle: "italic",
  },

  loadingFullContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.lg,
  },
  loadingFullText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium,
    textAlign: "center",
  },

  otpByMailBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: BankingColors.infoLight ?? BankingColors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.info ?? BankingColors.primary + "30",
  },
  otpByMailText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.info ?? BankingColors.primary,
    fontFamily: FontFamily.medium,
    lineHeight: FontSize.sm * LineHeight.normal,
  },

  // Bottom Sheet
  handleIndicator: { backgroundColor: BankingColors.borderMedium, width: 40 },
  bottomSheetBackground: {
    backgroundColor: BankingColors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
  },
  bottomSheetContent: { flex: 1 },
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
