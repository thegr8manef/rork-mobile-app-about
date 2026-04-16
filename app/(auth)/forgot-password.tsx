// app/(auth)/forgot-password.tsx
import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  Keyboard,
  InteractionManager,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react-native";

import TText from "@/components/TText";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize, ButtonHeight } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

const CIN_REGEX = /^[A-Za-z0-9]{6,20}$/;

const cinSchema = z.object({
  cin: z
    .string()
    .trim()
    .min(6, "forgotPassword.cinRequired")
    .max(20, "forgotPassword.cinRequired")
    .regex(CIN_REGEX, "forgotPassword.cinRequired"),
});

type CinFormValues = z.infer<typeof cinSchema>;

const forceKeyboardOpen = (inputRef: React.RefObject<TextInput | null>) => {
  if (!inputRef.current) return;
  inputRef.current.focus();
  if (Platform.OS === "ios") return;
  setTimeout(() => {
    const isVisible =
      typeof (Keyboard as any).isVisible === "function"
        ? (Keyboard as any).isVisible()
        : true;
    if (!isVisible && inputRef.current) {
      inputRef.current.blur();
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    }
  }, 350);
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const cinInputRef = useRef<TextInput | null>(null);

  const {
    control,
    trigger,
    watch,
    formState: { errors, touchedFields },
  } = useForm<CinFormValues>({
    resolver: zodResolver(cinSchema),
    defaultValues: { cin: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const cin = watch("cin");
  const cinValid = useMemo(() => CIN_REGEX.test((cin ?? "").trim()), [cin]);

  const handleCinSubmit = async () => {
    const ok = await trigger(["cin"]);
    if (!ok) return;
    router.navigate({
      pathname: "/(auth)/forgot-password-contact",
      params: { cin: cin.trim() },
    });
  };

  const onCinFocus = useCallback(() => {
    forceKeyboardOpen(cinInputRef);
  }, []);

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={IconSize.md} color={BankingColors.primary} />
          </TouchableOpacity>

          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Image
                source={require("@assets/images/newlogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.header}>
              <TText style={styles.title} tKey="forgotPassword.title" />
              <TText
                style={styles.subtitle}
                tKey="forgotPassword.cinSubtitle"
              />
            </View>

            <View style={styles.form}>
              <TText style={styles.label} tKey="forgotPassword.cinLabel" />

              <Controller
                control={control}
                name="cin"
                render={({ field: { value, onChange, onBlur } }) => (
                  <>
                    <TextInput
                      ref={cinInputRef}
                      style={[
                        styles.input,
                        touchedFields.cin && errors.cin
                          ? { borderColor: BankingColors.error }
                          : null,
                      ]}
                      value={value}
                      onChangeText={(tx) =>
                        onChange(tx.replace(/[^a-zA-Z0-9]/g, ""))
                      }
                      onBlur={onBlur}
                      onFocus={onCinFocus}
                      placeholder="AB123456"
                      placeholderTextColor={BankingColors.textTertiary}
                      keyboardType="default"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={20}
                      returnKeyType="done"
                      onSubmitEditing={handleCinSubmit}
                    />
                    {!!(touchedFields.cin && errors.cin) && (
                      <View style={styles.errorRow}>
                        <AlertCircle size={14} color={BankingColors.error} />
                        <TText style={styles.errorText}>
                          {t(
                            (errors.cin?.message as string) ||
                              "forgotPassword.cinRequired",
                          )}
                        </TText>
                      </View>
                    )}
                  </>
                )}
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* ─────────── Pinned submit button ─────────── */}
      <View
        style={[
          styles.submitContainer,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.submitButton,
            !cinValid && styles.submitButtonDisabled,
          ]}
          onPress={handleCinSubmit}
          disabled={!cinValid}
        >
          <TText
            style={styles.submitButtonText}
            tKey="forgotPassword.continue"
          />
          <ArrowRight size={IconSize.md} color={BankingColors.white} />
        </TouchableOpacity>
      </View>
    </View>
    </TouchableWithoutFeedback>
  );
}

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
  form: { gap: Spacing.lg },
  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
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
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  errorText: {
    color: BankingColors.error,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
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
});
