import React, { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Calendar } from "lucide-react-native";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  FontFamily,
} from "@/constants";
import DatePicker from "react-native-date-picker";
import { useTranslation } from "react-i18next";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

interface DateCardPickerProps {
  label: string;
  date: Date | null;
  onDateChange: (date: Date) => void;
  pickerTitle?: string;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

function DateCardPicker({
  label,
  date,
  onDateChange,
  pickerTitle,
  placeholder,
  maximumDate,
  minimumDate,
}: DateCardPickerProps) {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  function formatFrDate(date: Date) {
    return date.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const handleConfirm = useCallback(
    (selectedDate: Date) => {
      setShowPicker(false);
      onDateChange(selectedDate);
    },
    [onDateChange],
  );

  const handleCancel = useCallback(() => {
    setShowPicker(false);
  }, []);

  return (
    <>
      <TouchableOpacity
        style={styles.dateCard}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dateCardHeader}>
          <Text style={styles.dateCardLabel}>{label}</Text>
          <Calendar size={18} color={BankingColors.primary} />
        </View>
        <View style={styles.dateCardDivider} />
        <Text
          style={[styles.dateCardValue, !date && styles.dateCardPlaceholder]}
        >
          {date ? formatFrDate(date) : (placeholder ?? t("common.selectDate"))}
        </Text>
      </TouchableOpacity>

      <DatePicker
        modal
        open={showPicker}
        date={date ?? new Date()}
        mode="date"
        locale={selectedLanguage ?? undefined}
        title={pickerTitle ?? label}
        confirmText={t("datePicker.confirmText")}
        cancelText={t("datePicker.cancelText")}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}

export default React.memo(DateCardPicker);

const styles = StyleSheet.create({
  dateCard: {
    flex: 1,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    overflow: "hidden" as const,
  },
  dateCardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  dateCardLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },
  dateCardDivider: {
    height: 1,
    backgroundColor: BankingColors.border,
    marginHorizontal: Spacing.md,
  },
  dateCardValue: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    textAlign: "center" as const,
  },
  dateCardPlaceholder: {
    color: BankingColors.textLight,
  },
});
