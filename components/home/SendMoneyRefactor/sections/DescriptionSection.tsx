import React from "react";
import { View, Text, TextInput } from "react-native";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { FileText } from "lucide-react-native";

import { BankingColors, IconSize, Spacing } from "@/constants";
import type { FormValues } from "../types";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import { t } from "i18next";

type Props = {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  styles: any;
};

export default function DescriptionSection({ control, errors, styles }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>{t("transactions.label.reason")}</Text>

      <View style={styles.descriptionInputContainer}>
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.descriptionInput}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("transactions.placeholder.reason")}
              placeholderTextColor={BankingColors.textSecondary}
              contextMenuHidden
              // keep single-line look like your other inputs
              multiline={false}
              numberOfLines={1}
              maxLength={100}
            />
          )}
        />

        {/* Right icon block (same idea as calendarIconContainer) */}
        {/* <View style={styles.descriptionIconContainer}>
          <FileText size={IconSize.lg ?? 20} color={BankingColors.primary} />
        </View> */}
      </View>

      {!!errors.description?.message && (
        <TText style={styles.errorText} tKey={errors.description.message} />
      )}
    </View>
  );
}
