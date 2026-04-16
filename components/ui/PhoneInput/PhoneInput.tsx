import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput } from "@gorhom/bottom-sheet";
import {
  Phone,
  ChevronDown,
  Check,
  Search,
  AlertCircleIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import TText from "@/components/TText";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText } from "@/components/ui/form-control";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";
import { COUNTRY_CODES, CountryCode } from "@/constants/countries";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;

  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;

  labelTKey?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number; // ✅ added
  disabled?: boolean;

  touched?: boolean;
  hasError?: boolean;
  errorTKey?: string;

  onOpenCountryPicker?: () => void;
  disableInternalSheet?: boolean;
  showLabel?: boolean;
}

export default function PhoneInput({
  value,
  onChangeText,
  onBlur,
  onFocus,

  selectedCountry,
  onCountryChange,

  labelTKey = "contactValidation.phoneLabel",
  placeholder = "XX XXX XXX",
  maxLength, // ✅ added
  required = true,
  disabled = false,

  onOpenCountryPicker,
  disableInternalSheet = false,

  hasError = false,
  errorTKey,
  touched = false,

  showLabel = true }: PhoneInputProps) {
  const { t } = useTranslation();
  const [countrySearch, setCountrySearch] = useState("");
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["70%", "90%"], []);

  const openPicker = useCallback(() => {
    if (disabled) return;
    if (onOpenCountryPicker) onOpenCountryPicker();
    else bottomSheetRef.current?.expand();
  }, [disabled, onOpenCountryPicker]);

  const closePicker = useCallback(() => {
    bottomSheetRef.current?.close();
    setCountrySearch("");
  }, []);

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

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const renderCountryItem = useCallback(
    ({ item }: { item: CountryCode }) => (
      <TouchableOpacity
        style={[
          styles.countryItem,
          selectedCountry.code === item.code && styles.countryItemSelected,
        ]}
        onPress={() => {
          onCountryChange(item);
          closePicker();
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
    [selectedCountry.code, onCountryChange, closePicker],
  );

  const showError = !!touched && !!hasError && !!errorTKey;

  return (
    <>
      <FormControl isInvalid={showError}>
        {showLabel && (
          <FormControlLabel>
            <FormControlLabelText>
              <View style={styles.labelRow}>
                <Phone size={18} color={BankingColors.primary} />
                <TText style={styles.label} tKey={labelTKey} />
                {required && <TText style={styles.requiredAsterisk}>*</TText>}
              </View>
            </FormControlLabelText>
          </FormControlLabel>
        )}

        <View style={styles.phoneInputContainer}>
          <TouchableOpacity
            style={[styles.countrySelector, disabled && styles.disabled]}
            onPress={openPicker}
            disabled={disabled}
          >
            <TText style={styles.countryFlag}>{selectedCountry.flag}</TText>
            <TText style={styles.countryDial}>{selectedCountry.dial}</TText>
            <ChevronDown size={16} color={BankingColors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.phoneInput,
              disabled && styles.disabled,
              showError && styles.inputError,
            ]}
            value={value}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^\d\s]/g, "");
              onChangeText(cleaned);
            }}
            onBlur={onBlur}
            onFocus={onFocus}
            placeholder={placeholder}
            placeholderTextColor={BankingColors.textTertiary}
            keyboardType="number-pad"
            maxLength={maxLength} // ✅ passed to TextInput
            editable={!disabled}
          />
        </View>

        {showError && (
          <FormControlError style={styles.errorRow}>
            <FormControlErrorIcon as={AlertCircleIcon} style={styles.errorIcon} />
            <FormControlErrorText style={styles.errorText}>
              {t(errorTKey)}
            </FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {!disableInternalSheet && (
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={styles.handleIndicator}
          backgroundStyle={styles.bottomSheetBackground}
          onChange={(index) => {
            if (index === -1) setCountrySearch("");
          }}
        >
          <View style={styles.bottomSheetContent}>
            <View style={styles.modalHeader}>
              <TText style={styles.modalTitle} tKey="forgotPassword.selectCountry" />
              <TouchableOpacity style={styles.modalCloseButton} onPress={closePicker}>
                <TText style={styles.modalCloseText} tKey="common.done" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={BankingColors.textTertiary} />
              <BottomSheetTextInput
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
    </>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary },
  requiredAsterisk: {
    fontSize: FontSize.base,
    color: BankingColors.error,
    fontFamily: FontFamily.bold },

  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm },

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
    ...Shadow.xs },
  countryFlag: { fontSize: 20 },
  countryDial: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.textPrimary },

  phoneInput: {
    flex: 1,
    backgroundColor: BankingColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
    ...Shadow.xs },
  inputError: { borderColor: BankingColors.error },

  disabled: { opacity: 0.6 },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm },
  errorIcon: { color: BankingColors.error ?? "#E53935" },
  errorText: {
    color: BankingColors.error ?? "#E53935",
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium },

  handleIndicator: { backgroundColor: BankingColors.borderMedium, width: 40 },
  bottomSheetBackground: {
    backgroundColor: BankingColors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl },
  bottomSheetContent: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary },
  modalCloseButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  modalCloseText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary },
  countryList: { paddingHorizontal: Spacing.xl },

  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs },
  countryItemSelected: { backgroundColor: BankingColors.primaryLight },
  countryItemFlag: { fontSize: 28, marginRight: Spacing.md },
  countryItemInfo: { flex: 1 },
  countryItemName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.textPrimary },
  countryItemDial: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: 2 } });