import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { X, Calendar, CreditCard } from "lucide-react-native";
import DatePicker from "react-native-date-picker";
import { useTranslation } from "react-i18next";

import {
  BankingColors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
} from "@/constants";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

type AccountOption = {
  id: string;
  title: string;
  number: string;
};

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;

  accountOptions: AccountOption[];

  tempAccountId: string | null;
  setTempAccountId: (v: string | null) => void;

  tempStartDate: Date | null;
  setTempStartDate: (v: Date | null) => void;

  tempEndDate: Date | null;
  setTempEndDate: (v: Date | null) => void;

  onApply: () => void;
  onClear: () => void;
};

export default function ClaimsFilterSheet({
  sheetRef,
  accountOptions,
  tempAccountId,
  setTempAccountId,
  tempStartDate,
  setTempStartDate,
  tempEndDate,
  setTempEndDate,
  onApply,
  onClear,
}: Props) {
  const { t, i18n } = useTranslation();
  const snapPoints = useMemo(() => ["20%", "90%"], []);
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDateFR = (d?: Date | null) => {
    if (!d) return "";
    return d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  // "__ALL__" + accounts
  const accountChips = useMemo(() => {
    return [
      { id: "__ALL__", title: t("claims.filter.all"), number: "" },
      ...accountOptions,
    ];
  }, [accountOptions, t]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={1}
      enablePanDownToClose
      keyboardBehavior="fillParent"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t("claims.filter.title")}</Text>
          <TouchableOpacity onPress={() => sheetRef.current?.dismiss()}>
            <X size={24} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView
          style={styles.modalBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Account */}
          <Text style={styles.sectionTitle}>{t("claims.filter.account")}</Text>

          <View style={styles.chipsContainer}>
            {accountChips.map((acc) => {
              const active =
                acc.id === "__ALL__"
                  ? tempAccountId === null
                  : tempAccountId === acc.id;

              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setTempAccountId(acc.id === "__ALL__" ? null : acc.id)
                  }
                  activeOpacity={0.85}
                >
                  <CreditCard
                    size={16}
                    color={active ? "#FFFFFF" : BankingColors.textSecondary}
                  />
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {acc.id === "__ALL__" ? acc.title : `${acc.number}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dates */}
          <Text style={styles.sectionTitle}>{t("claims.filter.period")}</Text>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("claims.filter.startDate")}
              </Text>

              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !tempStartDate && styles.placeholder,
                  ]}
                >
                  {tempStartDate
                    ? formatDateFR(tempStartDate)
                    : t("cheques.filter.selectDate")}
                </Text>
                <Calendar size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("claims.filter.endDate")}
              </Text>

              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndPicker(true)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !tempEndDate && styles.placeholder,
                  ]}
                >
                  {tempEndDate
                    ? formatDateFR(tempEndDate)
                    : t("cheques.filter.selectDate")}
                </Text>
                <Calendar size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Pickers */}
          <DatePicker
            modal
            open={showStartPicker}
            date={tempStartDate || new Date()}
            mode="date"
            locale={selectedLanguage ?? undefined}
            title={t("claims.filter.startDate")}
            confirmText={t("common.validate")}
            cancelText={t("common.cancel")}
            maximumDate={tempEndDate || new Date()}
            onConfirm={(d) => {
              setShowStartPicker(false);
              setTempStartDate(d);
              if (tempEndDate && d > tempEndDate) setTempEndDate(d);
            }}
            onCancel={() => setShowStartPicker(false)}
          />

          <DatePicker
            modal
            open={showEndPicker}
            date={tempEndDate || new Date()}
            mode="date"
            locale={selectedLanguage ?? undefined}
            title={t("claims.filter.endDate")}
            confirmText={t("common.validate")}
            cancelText={t("common.cancel")}
            minimumDate={tempStartDate || undefined}
            maximumDate={new Date()}
            onConfirm={(d) => {
              setShowEndPicker(false);
              setTempEndDate(d);
            }}
            onCancel={() => setShowEndPicker(false)}
          />
        </BottomSheetScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onClear();
              sheetRef.current?.dismiss();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.clearButtonText}>{t("common.reset")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              onApply();
              sheetRef.current?.dismiss();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.applyButtonText}>{t("common.apply")}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
  },
  chipTextActive: { color: "#FFFFFF" },

  dateRangeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dateInputContainer: { flex: 1 },
  dateInputLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.surface,
  },
  dateInputText: { fontSize: FontSize.base, color: BankingColors.text },
  placeholder: { color: BankingColors.textLight },

  modalFooter: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF",
  },
});
