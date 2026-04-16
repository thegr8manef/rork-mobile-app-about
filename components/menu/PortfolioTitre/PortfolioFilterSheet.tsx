import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView } from "@gorhom/bottom-sheet";
import { X, RotateCcw } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BankingColors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily } from "@/constants";

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  tempOnlyBlocked: boolean;
  setTempOnlyBlocked: (v: boolean) => void;
  tempOnlyPositiveLatent: boolean;
  setTempOnlyPositiveLatent: (v: boolean) => void;
  tempMinQty: string;
  setTempMinQty: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
};

export default function PortfolioFilterSheet({
  sheetRef,
  tempOnlyBlocked,
  setTempOnlyBlocked,
  tempOnlyPositiveLatent,
  setTempOnlyPositiveLatent,
  tempMinQty,
  setTempMinQty,
  onApply,
  onClear }: Props) {
  const { t } = useTranslation();

  const hasAnyTemp = Boolean(tempOnlyBlocked || tempOnlyPositiveLatent || tempMinQty.trim());

  const handleClearLocal = () => {
    setTempOnlyBlocked(false);
    setTempOnlyPositiveLatent(false);
    setTempMinQty("");
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
          <Text style={styles.modalTitle}>{t("common.filter") || "Filtrer"}</Text>
          <TouchableOpacity
            onPress={() => sheetRef.current?.dismiss()}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.sectionTitle}>
            {t("portfolio.filters") || "Filtres"}
          </Text>

          <View style={styles.chipsContainer}>
            <TouchableOpacity
              style={[styles.chip, tempOnlyBlocked && styles.chipActive]}
              onPress={() => setTempOnlyBlocked(!tempOnlyBlocked)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, tempOnlyBlocked && styles.chipTextActive]}>
                {t("portfolio.blockedQuantityFilter")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, tempOnlyPositiveLatent && styles.chipActive]}
              onPress={() => setTempOnlyPositiveLatent(!tempOnlyPositiveLatent)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, tempOnlyPositiveLatent && styles.chipTextActive]}>
                {t("portfolio.positiveLatentOnly")}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>
            {t("portfolio.minimumQuantity") || "Quantité minimum"}
          </Text>

          <View style={styles.inputBox}>
            <TextInput
              value={tempMinQty}
              onChangeText={(v) => setTempMinQty(v.replace(/[^\d]/g, ""))}
              placeholder={t("portfolio.minQuantityPlaceholder") || "Ex: 100"}
              placeholderTextColor={BankingColors.textLight}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.clearButton, !hasAnyTemp && styles.clearButtonDisabled]}
            onPress={() => {
              handleClearLocal();
              onClear();
              sheetRef.current?.dismiss();
            }}
            activeOpacity={0.85}
            disabled={!hasAnyTemp}
          >
            <RotateCcw size={16} color={hasAnyTemp ? BankingColors.text : BankingColors.disabled} />
            <Text style={[styles.clearButtonText, !hasAnyTemp && styles.clearButtonTextDisabled]}>
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
    backgroundColor: BankingColors.surface },
  handleIndicator: {
    backgroundColor: BankingColors.borderMedium,
    width: 40 },
  sheetContent: {
    paddingBottom: 34 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center" },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.border },
  chipActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary },
  chipTextActive: {
    color: BankingColors.white,
    fontFamily: FontFamily.semibold },
  inputBox: {
    borderWidth: 1,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    justifyContent: "center",
    marginBottom: Spacing.lg },
  input: {
    color: BankingColors.text,
    fontSize: FontSize.base },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md },
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
    backgroundColor: BankingColors.surface },
  clearButtonDisabled: {
    opacity: 0.5 },
  clearButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  clearButtonTextDisabled: {
    color: BankingColors.disabled },
  applyButton: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.text,
    alignItems: "center",
    justifyContent: "center" },
  applyButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white } });
