import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { BankingColors, FontFamily } from "@/constants";
import { useTranslation } from "react-i18next";

export type TransferStatus =
  | "all"
  | "INIT"
  | "EXECUTING"
  | "EXECUTED"
  | "REJECTED";

type Month = { key: string; label: string };

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;

  months: Month[];

  tempSelectedMonth: string;
  setTempSelectedMonth: (v: string) => void;

  tempMinAmount: string;
  setTempMinAmount: (v: string) => void;

  tempMaxAmount: string;
  setTempMaxAmount: (v: string) => void;

  tempSelectedStatus: TransferStatus;
  setTempSelectedStatus: (v: TransferStatus) => void;

  onApply: () => void;
  onClear: () => void;
};

export default function SchoolingTransferFilterSheet({
  sheetRef,
  months,
  tempSelectedMonth,
  setTempSelectedMonth,
  tempMinAmount,
  setTempMinAmount,
  tempMaxAmount,
  setTempMaxAmount,
  tempSelectedStatus,
  setTempSelectedStatus,
  onApply,
  onClear }: Props) {
  const { t } = useTranslation();
  const snapPoints = useMemo(() => ["50%", "95%"], []);

  const expand = () => sheetRef.current?.snapToIndex(1);
  const collapse = () => sheetRef.current?.snapToIndex(0);

  const statusOptions: { value: TransferStatus; label: string }[] = [
    { value: "all", label: t("common.all") },
    { value: "INIT", label: t("schoolingHistory.status.INIT") },
    { value: "EXECUTING", label: t("schoolingHistory.status.EXECUTING") },
    { value: "EXECUTED", label: t("schoolingHistory.status.EXECUTED") },
    { value: "REJECTED", label: t("schoolingHistory.status.REJECTED") },
  ];

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="fillParent"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={{ flex: 1 }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {t("schoolingHistory.filterTitle")}
          </Text>
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
          <Text style={styles.filterSectionTitle}>
            {t("schoolingHistory.filterStatus")}
          </Text>

          <View style={styles.statusChipsContainer}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusChip,
                  tempSelectedStatus === status.value &&
                    styles.statusChipActive,
                ]}
                onPress={() => setTempSelectedStatus(status.value)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    tempSelectedStatus === status.value &&
                      styles.statusChipTextActive,
                  ]}
                >
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>
            {t("schoolingHistory.filterMonth")}
          </Text>

          <View style={styles.monthChipsContainer}>
            {months.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.monthChip,
                  tempSelectedMonth === m.key && styles.monthChipActive,
                ]}
                onPress={() => setTempSelectedMonth(m.key)}
              >
                <Text
                  style={[
                    styles.monthChipText,
                    tempSelectedMonth === m.key && styles.monthChipTextActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>
            {t("schoolingHistory.filterAmount")}
          </Text>

          <View style={styles.amountRangeContainer}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.amountInputLabel}>
                {t("schoolingHistory.minimum")}
              </Text>
              <BottomSheetTextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={tempMinAmount}
                onChangeText={setTempMinAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={BankingColors.textLight}
                onFocus={expand}
                onBlur={collapse}
              />
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.amountInputLabel}>
                {t("schoolingHistory.maximum")}
              </Text>
              <BottomSheetTextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={tempMaxAmount}
                onChangeText={setTempMaxAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={BankingColors.textLight}
                onFocus={expand}
                onBlur={collapse}
              />
            </View>
          </View>
        </BottomSheetScrollView>

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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  modalTitle: { fontSize: 18, fontFamily: FontFamily.bold, color: BankingColors.text },
  modalBody: { padding: 20 },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 12,
    marginTop: 8 },
  statusChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24 },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.border },
  statusChipActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary },
  statusChipText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  statusChipTextActive: { color: "#FFFFFF" },

  monthChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24 },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.border },
  monthChipActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary },
  monthChipText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  monthChipTextActive: { color: "#FFFFFF" },

  amountRangeContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  amountInputContainer: { flex: 1 },
  amountInputLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
    marginBottom: 8 },
  amountInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.surface,
    fontSize: 16,
    color: BankingColors.text },

  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center" },
  clearButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: BankingColors.primary,
    alignItems: "center" },
  applyButtonText: { fontSize: 16, fontFamily: FontFamily.semibold, color: "#FFFFFF" } });
