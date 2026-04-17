import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
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
import { BillStatus } from "@/types/bill-of-exchange.type";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  tempSelectedStatus: BillStatus;
  setTempSelectedStatus: (v: BillStatus) => void;
  tempStartDate: Date | null;
  setTempStartDate: (v: Date | null) => void;
  tempEndDate: Date | null;
  setTempEndDate: (v: Date | null) => void;
  tempMinAmount: string;
  setTempMinAmount: (v: string) => void;
  tempMaxAmount: string;
  setTempMaxAmount: (v: string) => void;

  tempPaymentType: string;
  setTempPaymentType: (v: string) => void;

  onApply: () => void;
  onClear: () => void;
};

export default function BillFilterSheet({
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
  tempPaymentType,
  setTempPaymentType,
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
    tempMaxAmount ||
    tempPaymentType !== "all",
  );

  const handleClearLocal = () => {
    setTempSelectedStatus("all");
    setTempStartDate(null);
    setTempEndDate(null);
    setTempMinAmount("");
    setTempMaxAmount("");
    setTempPaymentType("all");
  };

  const statusOptions: { key: BillStatus; labelKey: string }[] = [
    { key: "all", labelKey: "bills.filter.allStatuses" },
    { key: "PAID", labelKey: "bills.filter.status.paid" },
    { key: "IMPAID", labelKey: "bills.filter.status.unpaid" },
    { key: "PENDING", labelKey: "bills.filter.status.pending" },
  ];

  // ✅ Only these two (NO NORMALISE)
  const paymentTypeOptions: { key: string; labelKey: string }[] = [
    { key: "all", labelKey: "bills.filter.allTypes" },
    { key: "ENCAISSEMENT", labelKey: "bills.filter.type.encaissement" },
    { key: "ESCOMPTE", labelKey: "bills.filter.type.escompte" },
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleMinAmountChange = (text: string) => {
    const normalized = text.replace(",", ".");
    setTempMinAmount(normalized);
  };

  const handleMaxAmountChange = (text: string) => {
    const normalized = text.replace(",", ".");
    setTempMaxAmount(normalized);
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
          <Text style={styles.modalTitle}>{t("bills.filter.title")}</Text>
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
            {t("bills.filter.status")}
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
            {t("bills.filter.billType")}
          </Text>
          <View style={styles.statusChipsContainer}>
            {paymentTypeOptions.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.statusChip,
                  tempPaymentType === type.key && styles.statusChipActive,
                ]}
                onPress={() => setTempPaymentType(type.key)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    tempPaymentType === type.key && styles.statusChipTextActive,
                  ]}
                >
                  {t(type.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>
            {t("bills.filter.period")}
          </Text>
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("bills.filter.startDate")}
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
                    : t("bills.filter.selectDate")}
                </Text>
                <Calendar size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("bills.filter.endDate")}
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
                    : t("bills.filter.selectDate")}
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
            title={t("bills.filter.startDate")}
            confirmText={t("common.validate")}
            cancelText={t("common.cancel")}
            maximumDate={tempEndDate || new Date()}
            onConfirm={(date) => {
              setShowStartPicker(false);
              setTempStartDate(date);
            }}
            onCancel={() => setShowStartPicker(false)}
          />

          <DatePicker
            modal
            open={showEndPicker}
            date={tempEndDate || new Date()}
            mode="date"
            locale={selectedLanguage ?? undefined}
            title={t("bills.filter.endDate")}
            confirmText={t("common.validate")}
            cancelText={t("common.cancel")}
            minimumDate={tempStartDate || undefined}
            maximumDate={new Date()}
            onConfirm={(date) => {
              setShowEndPicker(false);
              setTempEndDate(date);
            }}
            onCancel={() => setShowEndPicker(false)}
          />

          <Text style={styles.filterSectionTitle}>
            {t("bills.filter.amount")}
          </Text>
          <View style={styles.amountRangeContainer}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.amountInputLabel}>{t("common.minimum")}</Text>
              <BottomSheetTextInput
                allowFontScaling={false}
                style={styles.amountInput}
                placeholder="0.00"
                value={tempMinAmount}
                onChangeText={handleMinAmountChange}
                keyboardType="decimal-pad"
                placeholderTextColor={BankingColors.textLight}
              />
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.amountInputLabel}>{t("common.maximum")}</Text>
              <BottomSheetTextInput
                allowFontScaling={false}
                style={styles.amountInput}
                placeholder="0.00"
                value={tempMaxAmount}
                onChangeText={handleMaxAmountChange}
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
              {t("common.reset") || "Réinitialiser"}
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
  handleIndicator: { backgroundColor: BankingColors.borderMedium, width: 40 },
  sheetContent: { paddingBottom: 34 },
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
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
  dateInputContainer: { flex: 1 },
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
  dateInputText: { fontSize: FontSize.sm, color: BankingColors.text },
  placeholder: { color: BankingColors.textLight },
  amountRangeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  amountInputContainer: { flex: 1 },
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
  clearButtonDisabled: { opacity: 0.5 },
  clearButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  clearButtonTextDisabled: { color: BankingColors.disabled },
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
