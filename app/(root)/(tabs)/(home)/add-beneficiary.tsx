import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import TText from "@/components/TText";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize,
  FontFamily,
} from "@/constants";
import {
  User,
  Check,
  AlertCircle as AlertCircleIcon,
  Info,
  X,
} from "lucide-react-native";

import {
  useAddBeneficiaryInit,
  useBeneficiaries,
} from "@/hooks/use-accounts-api";
import {
  AddBeneficiaryFormValues,
  addBeneficiarySchema,
} from "@/validation/beneficiaryScheme";

import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import useShowMessage from "@/hooks/useShowMessage";
import { extractErrorCode } from "@/utils/tx-confirm-helpers";

// ✅ custom button (local, simple, reusable)
function PrimaryButton({
  title,
  onPress,
  disabled,
  isLoading,
  leftIcon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}) {
  const isDisabled = !!disabled || !!isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.btn, isDisabled && styles.btnDisabled]}
    >
      {isLoading ? (
        <ActivityIndicator color={BankingColors.surface} />
      ) : (
        <>
          {leftIcon}
          <TText style={styles.btnText}>{title}</TText>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function AddBeneficiaryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const addInitMutation = useAddBeneficiaryInit();
  const { showMessageError, showMessageSystem } = useShowMessage();
  const { data: beneficiariesData } = useBeneficiaries();
  const [existingBeneficiaryName, setExistingBeneficiaryName] = useState<
    string | null
  >(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<AddBeneficiaryFormValues>({
    resolver: zodResolver(addBeneficiarySchema),
    defaultValues: { fullName: "", rib: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // ✅ translate zod error keys
  const fullNameErr = useMemo(() => {
    const k = String(errors.fullName?.message ?? "").trim();
    return k ? t(k) : "";
  }, [errors.fullName?.message, t]);

  const ribErr = useMemo(() => {
    const k = String(errors.rib?.message ?? "").trim();
    return k ? t(k) : "";
  }, [errors.rib?.message, t]);

  const isLoading = addInitMutation.isPending || isSubmitting;
  const canSubmit = isValid && !isLoading;

  const onSubmit = async (values: AddBeneficiaryFormValues) => {
    setExistingBeneficiaryName(null);
    try {
      const initResponse = await addInitMutation.mutateAsync({
        fullName: values.fullName.trim(),
        rib: values.rib.trim(),
      });

      router.push({
        pathname: "/(root)/transaction-summary",
        params: {
          transactionType: "add-beneficiary",
          data: JSON.stringify({
            requestId: initResponse.id,
            fullName: values.fullName.trim(),
            rib: values.rib.trim(),
          }),
        },
      });
    } catch (error: any) {
      const errorCode = extractErrorCode(error);
      if (errorCode === "BENEFICIARY_ALREADY_EXISTS") {
        const existingBeneficiary = beneficiariesData?.data?.find(
          (b) => b.rib === values.rib.trim(),
        );
        setExistingBeneficiaryName(existingBeneficiary?.fullName ?? "");
      } else if (errorCode === "ACCOUNT_BELONGS_TO_SAME_CLIENT") {
        showMessageError(
          t("apiErrors.accountBelongsToSameClient.title"),
          t("apiErrors.accountBelongsToSameClient.desc"),
        );
      } else if (errorCode === "ACCOUNT_CLOSED") {
        showMessageError(
          t("apiErrors.accountClosed.title"),
          t("apiErrors.accountClosed.desc"),
        );
      } else if (errorCode === "INVALID_INPUT") {
        showMessageError(
          t("apiErrors.invalidInput.title"),
          t("apiErrors.invalidInput.desc"),
        );
      } else {
        showMessageError("common.error", "apiErrors.generic.desc");
      }
    }
  };

  return (
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={Spacing.xxxl}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.form}>
          <View style={styles.formHeader}>
            <View style={styles.iconContainer}>
              <User size={IconSize.xxl} color={BankingColors.primary} />
            </View>

            <TText tKey="beneficiaries.addTitle" style={styles.formTitle} />
            <TText
              tKey="beneficiaries.addSubtitle"
              style={styles.formSubtitle}
            />
          </View>

          <View style={styles.card}>
            {/* FULL NAME */}
            <FormControl isInvalid={!!fullNameErr}>
              <FormControlLabel>
                <FormControlLabelText style={styles.label}>
                  {t("beneficiaries.fullName")}
                </FormControlLabelText>
              </FormControlLabel>

              <Controller
                control={control}
                name="fullName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, !!fullNameErr && styles.inputError]}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(v) => {
                      const normalized = v.normalize("NFC");
                      onChange(normalized.replace(/[^\p{L}\p{M}\s\-’']/gu, ""));
                    }}
                    editable={!isLoading}
                    placeholder={t("beneficiaries.fullName")}
                    placeholderTextColor={BankingColors.textLight}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                )}
              />

              <FormControlError style={styles.errorRow}>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  style={styles.errorIcon}
                />
                <FormControlErrorText style={styles.errorText}>
                  {fullNameErr}
                </FormControlErrorText>
              </FormControlError>
            </FormControl>

            {/* RIB */}
            <FormControl isInvalid={!!ribErr}>
              <FormControlLabel>
                <FormControlLabelText style={styles.label}>
                  {t("beneficiaries.rib20")}
                </FormControlLabelText>
              </FormControlLabel>

              <Controller
                control={control}
                name="rib"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, !!ribErr && styles.inputError]}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ""))}
                    keyboardType="numeric"
                    editable={!isLoading}
                    maxLength={20}
                    placeholder={t("beneficiaries.rib20")}
                    placeholderTextColor={BankingColors.textLight}
                    returnKeyType="done"
                  />
                )}
              />

              <FormControlError style={styles.errorRow}>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  style={styles.errorIcon}
                />
                <FormControlErrorText style={styles.errorText}>
                  {ribErr}
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          </View>
        </View>
        {existingBeneficiaryName === null && (
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
            ]}
          >
            <PrimaryButton
              title={t("beneficiaries.add")}
              onPress={handleSubmit(onSubmit)}
              disabled={!canSubmit}
              isLoading={isLoading}
              leftIcon={
                <Check size={IconSize.md} color={BankingColors.surface} />
              }
            />
          </View>
        )}
        {existingBeneficiaryName !== null && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Info size={IconSize.lg} color={BankingColors.primary} />
              <TText style={styles.infoTitle}>
                {t("apiErrors.beneficiaryAlreadyExists.title")}
              </TText>
              <TouchableOpacity
                onPress={() => setExistingBeneficiaryName(null)}
                style={styles.closeButton}
              >
                <X size={IconSize.md} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TText style={styles.infoText}>
              {t("apiErrors.beneficiaryAlreadyExists.desc", { name: existingBeneficiaryName })}
            </TText>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => {
                setExistingBeneficiaryName(null);
                router.replace({
                  pathname: "/(root)/(tabs)/(home)/beneficiaries",
                  params: { search: existingBeneficiaryName },
                } as any);
              }}
            >
              <TText style={styles.viewButtonText} tKey="beneficiaries.viewBeneficiary" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareScrollView>

  
 
  );
}

const DANGER =
  (BankingColors as any).danger ?? (BankingColors as any).error ?? "#E53935";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  form: { padding: Spacing.md },

  formHeader: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 43,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: FontSize.xl,
    paddingHorizontal: Spacing.xl,
  },

  // ✅ Card container for fields
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.md,
  },

  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
  },

  input: {
    marginTop: Spacing.xs,
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
    ...Shadow.xs,
  },

  // ✅ red border when invalid
  inputError: {
    borderColor: DANGER,
  },

  // ✅ error row under input (icon + text) both red
  errorRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorIcon: {
    color: DANGER,
  },
  errorText: {
    color: DANGER,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  // Info card
  infoCard: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: BankingColors.primaryLight,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  infoText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    lineHeight: FontSize.xl,
  },
  viewButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: "center",
    ...Shadow.xs,
  },
  viewButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.surface,
  },

  // ✅ custom button
  btn: {
    height: 56,
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadow.lg,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.surface,
  },
});
