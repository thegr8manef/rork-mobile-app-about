import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { X, Calendar, RotateCcw } from "lucide-react-native";
import DatePicker from "react-native-date-picker";
import {
  BankingColors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
} from "@/constants";
import { useTranslation } from "react-i18next";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

export type ChequeStatus = "all" | "PR" | "PAP" | "CNP" | "PAID" | "PENDING";

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  tempSelectedStatus: ChequeStatus;
  setTempSelectedStatus: (v: ChequeStatus) => void;
  tempStartDate: Date | null;
  setTempStartDate: (v: Date | null) => void;
  tempEndDate: Date | null;
  setTempEndDate: (v: Date | null) => void;
  tempMinAmount: string;
  setTempMinAmount: (v: string) => void;
  tempMaxAmount: string;
  setTempMaxAmount: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
};

export default function ChequeFilterSheet({
  sheetRef,
  tempSelectedStatus,
  setTempSelectedStatus,
  tempStartDate,
  setTempStartDate,
  tempEndDate,
  setTempEndDate,
  tempMinAmount,
  setTempMinAmount,
  tempMaxAmount,
  setTempMaxAmount,
  onApply,
  onClear,
}: Props) {
  const { t, i18n } = useTranslation();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  const hasAnyTemp = Boolean(
    tempSelectedStatus !== "all" ||
    tempStartDate ||
    tempEndDate ||
    tempMinAmount ||
    tempMaxAmount,
  );

  const handleClearLocal = () => {
    setTempSelectedStatus("all");
    setTempStartDate(null);
    setTempEndDate(null);
    setTempMinAmount("");
    setTempMaxAmount("");
  };

  const statusOptions: { key: ChequeStatus; labelKey: string }[] = [
    { key: "all", labelKey: "cheques.filter.allStatuses" },
    { key: "PR", labelKey: "cheques.filter.status.preavis" },
    { key: "PAP", labelKey: "cheques.filter.status.papillon" },
    { key: "CNP", labelKey: "cheques.filter.status.cnp" },
    { key: "PAID", labelKey: "cheques.filter.status.paid" },
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
          <Text style={styles.filterSectionTitle}>
            {t("cheques.filter.status")}
          </Text>
          <View style={styles.statusChipsContainer}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.statusChip,
                  tempSelectedStatus === status.key && styles.statusChipActive,
                ]}
                onPress={() => setTempSelectedStatus(status.key)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    tempSelectedStatus === status.key &&
                      styles.statusChipTextActive,
                  ]}
                >
                  {t(status.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          <Text style={styles.filterSectionTitle}>
            {t("cheques.filter.amount")}
          </Text>
          <View style={styles.amountRangeContainer}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.amountInputLabel}>{t("common.minimum")}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={tempMinAmount}
                onChangeText={setTempMinAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={BankingColors.textLight}
              />
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.amountInputLabel}>{t("common.maximum")}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={tempMaxAmount}
                onChangeText={setTempMaxAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={BankingColors.textLight}
              />
            </View>
          </View>
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.clearButton,
              !hasAnyTemp && styles.clearButtonDisabled,
            ]}
            onPress={() => {
              handleClearLocal();
              onClear();
              sheetRef.current?.dismiss();
            }}
            activeOpacity={0.85}
            disabled={!hasAnyTemp}
          >
            <RotateCcw
              size={16}
              color={hasAnyTemp ? BankingColors.text : BankingColors.disabled}
            />
            <Text
              style={[
                styles.clearButtonText,
                !hasAnyTemp && styles.clearButtonTextDisabled,
              ]}
            >
              {t("common.reset") || "R\u00e9initialiser"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              onApply();
              sheetRef.current?.dismiss();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.applyButtonText}>
              {t("common.apply") || "Appliquer"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: BankingColors.surface,
  },
  handleIndicator: {
    backgroundColor: BankingColors.borderMedium,
    width: 40,
  },
  sheetContent: {
    paddingBottom: 34,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  filterSectionTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md,
  },
  statusChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statusChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
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
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
  },
  statusChipTextActive: {
    color: BankingColors.white,
    fontFamily: FontFamily.semibold,
  },
  dateRangeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textLabel,
    marginBottom: Spacing.sm,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.surface,
  },
  dateInputText: {
    fontSize: FontSize.sm,
    color: BankingColors.text,
  },
  placeholder: {
    color: BankingColors.textLight,
  },
  amountRangeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  amountInputContainer: {
    flex: 1,
  },
  amountInputLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textLabel,
    marginBottom: Spacing.sm,
  },
  amountInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.surface,
    fontSize: FontSize.sm,
    color: BankingColors.text,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  clearButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.surface,
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  clearButtonTextDisabled: {
    color: BankingColors.disabled,
  },
  applyButton: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
});
