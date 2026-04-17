import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { X, RotateCcw } from "lucide-react-native";
import {
  BankingColors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
} from "@/constants";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";

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

  onApply: () => void;
  onClear: () => void;
};

const getCurrencyDecimals = (alpha?: string) => {
  const c = String(alpha ?? "")
    .trim()
    .toUpperCase();
  if (!c) return 2;
  if (c === "JPY") return 0;
  return 2;
};

/**
 * Output rules:
 * - Keep only digits and separators
 * - Allow only 1 separator
 * - Clamp decimals length
 * - Normalize separator to "." for storage
 * - Keep trailing "." while typing (e.g. "12.")
 */
const sanitizeAmountInput = (raw: string, decimals: number) => {
  let s = raw.replace(/[^\d.,]/g, "").replace(/,/g, "."); // ✅ keep only digits, normalize , -> .

  if (!s) return "";

  // prefix 0 if starts with separator
  if (s.startsWith(".")) s = `0${s}`;

  // find first separator
  const firstSepIndex = s.indexOf(".");

  // helper: remove extra separators
  const stripSeps = (x: string) => x.replace(/[.]/g, "");

  // normalize leading zeros for integer part: "00012" => "12" but keep "0" if all zeros
  const normalizeInt = (intPart: string) => {
    const trimmed = intPart.replace(/^0+(?=\d)/, "");
    return trimmed === "" ? "0" : trimmed;
  };

  if (firstSepIndex === -1) {
    return normalizeInt(stripSeps(s));
  }

  const beforeRaw = s.slice(0, firstSepIndex);
  const afterRaw = s.slice(firstSepIndex + 1);

  const before = normalizeInt(stripSeps(beforeRaw));
  const afterDigits = stripSeps(afterRaw);

  if (decimals === 0) {
    return before;
  }

  const hasTrailingSeparator = raw.endsWith(".") || raw.endsWith(",");

  const after = afterDigits.slice(0, decimals);

  // store separator as "."
  if (hasTrailingSeparator && afterDigits.length === 0) return `${before}.`;
  if (!after) return before;

  return `${before}.${after}`;
};

const parseAmount = (v: string): number | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  // allow trailing dot while typing -> not a valid number yet
  if (s.endsWith(".")) return null;

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export default function TransactionsFilterSheet({
  sheetRef,
  months,
  tempSelectedMonth,
  setTempSelectedMonth,
  tempMinAmount,
  setTempMinAmount,
  tempMaxAmount,
  setTempMaxAmount,
  onApply,
  onClear,
}: Props) {
  const { t } = useTranslation();
  const [minBlurred, setMinBlurred] = useState(false);
  const [maxBlurred, setMaxBlurred] = useState(false);

  // ✅ if you want dynamic decimals by currency later, pass currencyAlphaCode as prop
  const decimals = getCurrencyDecimals("TND");

  const hasAnyTemp = Boolean(
    (tempSelectedMonth && tempSelectedMonth !== "all") ||
    tempMinAmount ||
    tempMaxAmount,
  );

  const handleClearLocal = () => {
    setTempSelectedMonth("all");
    setTempMinAmount("");
    setTempMaxAmount("");
    setMinBlurred(false);
    setMaxBlurred(false);
  };

  // ✅ validate min/max relationship (min <= max) only when both are real numbers
  const minNum = parseAmount(tempMinAmount);
  const maxNum = parseAmount(tempMaxAmount);
  const rangeInvalid = minNum !== null && maxNum !== null && minNum > maxNum;
  const showRangeError = rangeInvalid && (minBlurred || maxBlurred);

  const canApply = !rangeInvalid; // block apply even before blur

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
          <Text style={styles.modalTitle}>
            {t("common.filter") || "Filtrer"}
          </Text>
          <TouchableOpacity
            onPress={() => sheetRef.current?.dismiss()}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.sectionTitle}>{t("common.month") || "Mois"}</Text>
          <View style={styles.chipsContainer}>
            {months.map((m) => {
              const active = tempSelectedMonth === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setTempSelectedMonth(m.key)}
                  activeOpacity={0.85}
                >
                  <TText
                    style={[styles.chipText, active && styles.chipTextActive]}
                    tKey={m.label}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>
            {t("transferHistory.details.amount") || "Montant"}
          </Text>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("common.minimum") || "Minimum"}
              </Text>
              <BottomSheetTextInput
                allowFontScaling={false}
                style={[
                  styles.amountInput,
                  showRangeError && styles.amountInputError,
                ]}
                placeholder="0.00"
                value={tempMinAmount}
                onChangeText={(raw) => {
                  setMinBlurred(false);
                  setTempMinAmount(sanitizeAmountInput(raw, decimals));
                }}
                onBlur={() => setMinBlurred(true)}
                keyboardType="decimal-pad"
                inputMode="decimal"
                placeholderTextColor={BankingColors.textLight}
                maxLength={16}
              />
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("common.maximum") || "Maximum"}
              </Text>
              <BottomSheetTextInput
                allowFontScaling={false}
                style={[
                  styles.amountInput,
                  showRangeError && styles.amountInputError,
                ]}
                placeholder="0.00"
                value={tempMaxAmount}
                onChangeText={(raw) => {
                  setMaxBlurred(false);
                  setTempMaxAmount(sanitizeAmountInput(raw, decimals));
                }}
                onBlur={() => setMaxBlurred(true)}
                keyboardType="decimal-pad"
                inputMode="decimal"
                placeholderTextColor={BankingColors.textLight}
                maxLength={16}
              />
            </View>
          </View>

          {/* ✅ inline error — only visible after blur */}
          {showRangeError && (
            <TText
              style={styles.errorText}
              tKey={"transaction.filters.amountRangeInvalid"}
            />
          )}
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
            style={[
              styles.applyButton,
              !canApply && styles.applyButtonDisabled,
            ]}
            onPress={() => {
              onApply();
              sheetRef.current?.dismiss();
            }}
            activeOpacity={0.85}
            disabled={!canApply}
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
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  chipActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
  },
  chipTextActive: {
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
  amountInputError: {
    borderColor: BankingColors.error ?? "#E53935",
  },
  errorText: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    color: BankingColors.error ?? "#E53935",
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
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
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
});
