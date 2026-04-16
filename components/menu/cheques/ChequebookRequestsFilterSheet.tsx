import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { X, Calendar } from "lucide-react-native";
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

export type ChequeStatus =
  | "all"
  | "REJECTED"
  | "COMPLETED"
  | "PENDING"
  | "EXECUTED";

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;

  tempSelectedStatus: ChequeStatus;
  setTempSelectedStatus: (v: ChequeStatus) => void;

  tempStartDate: Date | null;
  setTempStartDate: (v: Date | null) => void;

  tempEndDate: Date | null;
  setTempEndDate: (v: Date | null) => void;

  onApply: () => void;
  onClear: () => void;
};

export default function ChequeHistoryFilterSheet({
  sheetRef,
  tempSelectedStatus,
  setTempSelectedStatus,
  tempStartDate,
  setTempStartDate,
  tempEndDate,
  setTempEndDate,
  onApply,
  onClear,
}: Props) {
  const { t, i18n } = useTranslation();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  const statusOptions: { key: ChequeStatus; labelKey: string }[] = [
    { key: "all", labelKey: "cheques.filter.allStatuses" },
    { key: "REJECTED", labelKey: "cheques.filter.status.notAccepted" },
    { key: "EXECUTED", labelKey: "cheques.filter.status.accepted" },
    { key: "PENDING", labelKey: "cheques.filter.status.pending" },
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleStartDateConfirm = (date: Date) => {
    setShowStartPicker(false);
    setTempStartDate(date);
    // if end < start, clear end
    if (tempEndDate && date > tempEndDate) setTempEndDate(null);
  };

  const handleEndDateConfirm = (date: Date) => {
    setShowEndPicker(false);
    setTempEndDate(date);
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      keyboardBehavior="fillParent"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.sheetContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t("cheques.filter.title")}</Text>
          <TouchableOpacity
            onPress={() => sheetRef.current?.dismiss()}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          {/* STATUS */}
          <Text style={styles.filterSectionTitle}>
            {t("cheques.filter.status")}
          </Text>

          <View style={styles.statusChipsContainer}>
            {statusOptions.map((status) => {
              const active = tempSelectedStatus === status.key;
              return (
                <TouchableOpacity
                  key={status.key}
                  style={[styles.statusChip, active && styles.statusChipActive]}
                  onPress={() => setTempSelectedStatus(status.key)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      active && styles.statusChipTextActive,
                    ]}
                  >
                    {t(status.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* DATES */}
          <Text style={styles.filterSectionTitle}>
            {t("cheques.filter.period")}
          </Text>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("cheques.filter.startDate")}
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !tempStartDate && styles.placeholder,
                  ]}
                >
                  {tempStartDate
                    ? formatDate(tempStartDate)
                    : t("cheques.filter.selectDate")}
                </Text>
                <Calendar size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("cheques.filter.endDate")}
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndPicker(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !tempEndDate && styles.placeholder,
                  ]}
                >
                  {tempEndDate
                    ? formatDate(tempEndDate)
                    : t("cheques.filter.selectDate")}
                </Text>
                <Calendar size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <DatePicker
            modal
            open={showStartPicker}
            date={tempStartDate || new Date()}
            mode="date"
            locale={selectedLanguage ?? undefined}
            title={t("cheques.filter.startDate")}
            confirmText={t("common.validate")}
            cancelText={t("common.cancel")}
            maximumDate={tempEndDate || new Date()}
            onConfirm={handleStartDateConfirm}
            onCancel={() => setShowStartPicker(false)}
          />

          <DatePicker
            modal
            open={showEndPicker}
            date={tempEndDate || new Date()}
            mode="date"
            locale={selectedLanguage ?? undefined}
            title={t("cheques.filter.endDate")}
            confirmText={t("common.validate")}
            cancelText={t("common.cancel")}
            minimumDate={tempStartDate || undefined}
            maximumDate={new Date()}
            onConfirm={handleEndDateConfirm}
            onCancel={() => setShowEndPicker(false)}
          />
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onClear();
              sheetRef.current?.dismiss();
            }}
          >
            <Text style={styles.clearButtonText}>{t("common.reset")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              onApply();
              sheetRef.current?.dismiss();
            }}
          >
            <Text style={styles.applyButtonText}>{t("common.apply")}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    backgroundColor: BankingColors.white,
  },
  handleIndicator: {
    backgroundColor: BankingColors.textLight,
    width: 40,
  },
  sheetContent: {
    paddingBottom: Spacing.lg,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
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
  modalBody: { padding: Spacing.lg },

  filterSectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },

  statusChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  statusChipActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary,
  },
  statusChipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
  },
  statusChipTextActive: { color: "#FFFFFF" },

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

  amountRangeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  amountInputContainer: { flex: 1 },
  amountInputLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  amountInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.surface,
    fontSize: FontSize.base,
    color: BankingColors.text,
  },

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
    backgroundColor: BankingColors.white,
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
