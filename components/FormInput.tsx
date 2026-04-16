import React from 'react';
import { StyleSheet, View, Text, TextInput, KeyboardTypeOptions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BankingColors, Spacing, FontSize, BorderRadius, InputHeight, Shadow, FontFamily } from "@/constants";

interface FormInputProps {
  label?: string;
  value: string;
  placeholder?: string;
  topLabel?: string;
  secureTextEntry?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  keyboardType?: KeyboardTypeOptions;
  disabled?: boolean;
  errorValidation?: string | null | undefined;
  backgroundColor?: string;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  testID?: string;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  placeholder,
  topLabel,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  keyboardType = 'default',
  disabled = false,
  errorValidation,
  backgroundColor = BankingColors.surface,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  editable = true,
  testID,
  required = false }) => {
  const { t } = useTranslation();
  const hasError = !!errorValidation;
  const displayLabel = topLabel || label;

  return (
    <View style={styles.container}>
      {displayLabel && (
        <View style={styles.labelContainer}>
          {leftIcon && <View style={styles.labelIcon}>{leftIcon}</View>}
          <Text style={styles.label}>
            {t(displayLabel)}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <View style={[
        styles.inputWrapper,
        hasError && styles.inputWrapperError,
        disabled && styles.inputWrapperDisabled,
        { backgroundColor },
      ]}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
          ]}
          value={value}
          placeholder={placeholder ? t(placeholder) : undefined}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable && !disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          placeholderTextColor={BankingColors.textLight}
          testID={testID}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
      
      {hasError && (
        <Text style={styles.errorText}>
          {t(errorValidation)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm },
  labelIcon: {
    justifyContent: 'center',
    alignItems: 'center' },
  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  required: {
    color: BankingColors.error,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    paddingHorizontal: Spacing.lg,
    minHeight: InputHeight.md,
    ...Shadow.xs },
  inputWrapperError: {
    borderColor: BankingColors.error,
    borderWidth: 1 },
  inputWrapperDisabled: {
    backgroundColor: BankingColors.backgroundGray,
    opacity: 0.6 },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: BankingColors.text,
    paddingVertical: Spacing.md },
  inputMultiline: {
    minHeight: InputHeight.lg * 2,
    textAlignVertical: 'top',
    paddingTop: Spacing.md },
  rightIconContainer: {
    marginLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center' },
  errorText: {
    fontSize: FontSize.sm,
    color: BankingColors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
    fontFamily: FontFamily.medium } });
