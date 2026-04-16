import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, X, RotateCcw } from "lucide-react-native";
import DatePicker from "react-native-date-picker";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing, BorderRadius, FontSize, FontFamily } from "@/constants";

import type { FiltersDraft } from "../types";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

type Chip = { key: string; label: string };

type Props = {
  visible: boolean;
  locale: string;
  title: string;

  statusChips: Chip[];
  sortChips: Chip[];
  orderChips: Chip[];

  draftFilters: FiltersDraft;
  setDraftFilters: React.Dispatch<React.SetStateAction<FiltersDraft>>;

  onClose: () => void;
  onReset: () => void;
  onApply: () => void;

  t: (k: string, fallback?: any) => string;
};

const startOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const yearsAgo = (years: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
};

const maxDate = (a: Date, b: Date) => (a > b ? a : b);

export default function TransferHistoryFilterModal({
  visible,
  locale,
  title,
  statusChips,
  sortChips,
  orderChips,
  draftFilters,
  setDraftFilters,
  onClose,
  onReset,
  onApply,
  t,
}: Props) {
  const insets = useSafeAreaInsets();
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollRef = useRef<any>(null);
  const minAmountRef = useRef<TextInput>(null);
  const maxAmountRef = useRef<TextInput>(null);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDateFR = (d?: Date | null) => {
    if (!d) return "";
    return d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  // ──────────────────────────────────────────────────────────────────────────
  // KEYBOARD LISTENER: track height + scroll to inputs
  // ──────────────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd?.({ animated: true });
      }, 150);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // SHEET CHANGES
  // ──────────────────────────────────────────────────────────────────────────
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        Keyboard.dismiss();
        onClose();
      }
    },
    [onClose],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // AMOUNT FOCUS: scroll to inputs
  // ──────────────────────────────────────────────────────────────────────────
  const handleAmountFocus = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 300);
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // OPEN / CLOSE
  // ──────────────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (visible)
      bottomSheetRef.current?.snapToIndex(0); // 85%
    else bottomSheetRef.current?.close();
  }, [visible]);

  // ✅ global allowed range: [30 years ago .. 2 years from now]
  const minSelectableDate = useMemo(() => startOfDay(yearsAgo(30)), []);
  const today = useMemo(() => new Date(), []);
  const maxSelectableDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d;
  }, []);

  const hasAnyTemp = Boolean(
    draftFilters.status ||
    draftFilters.startDate ||
    draftFilters.endDate ||
    (draftFilters.minAmount && draftFilters.minAmount.trim()) ||
    (draftFilters.maxAmount && draftFilters.maxAmount.trim()),
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["85%", "100%"]}
      enablePanDownToClose
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView
        ref={scrollRef}
        style={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <View style={styles.modalHeader}>
          <TText style={styles.modalTitle}>{title}</TText>
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        {/* ── BODY ──────────────────────────────────────────────────────── */}
        <View style={styles.modalBody}>
          {/* STATUS */}
          <TText style={styles.sectionTitle}>
            {t("transferHistory.filters.status", "Statut")}
          </TText>

          <View style={styles.chipsContainer}>
            <TouchableOpacity
              style={[styles.chip, !draftFilters.status && styles.chipActive]}
              onPress={() =>
                setDraftFilters((p) => ({ ...p, status: undefined }))
              }
              activeOpacity={0.85}
            >
              <TText
                style={[
                  styles.chipText,
                  !draftFilters.status && styles.chipTextActive,
                ]}
              >
                {t("common.all", "Tous")}
              </TText>
            </TouchableOpacity>

            {statusChips.map((s, idx) => (
              <TouchableOpacity
                key={`status-${s.key}-${idx}`}
                style={[
                  styles.chip,
                  draftFilters.status === s.key && styles.chipActive,
                ]}
                onPress={() =>
                  setDraftFilters((p) => ({ ...p, status: s.key }))
                }
                activeOpacity={0.85}
              >
                <TText
                  style={[
                    styles.chipText,
                    draftFilters.status === s.key && styles.chipTextActive,
                  ]}
                >
                  {s.label}
                </TText>
              </TouchableOpacity>
            ))}
          </View>

          {/* PERIOD */}
          <TText style={styles.sectionTitle}>
            {t("transferHistory.filters.period", "Période")}
          </TText>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <TText style={styles.dateInputLabel}>
                {t("transferHistory.filters.startDate", "Date de début")}
              </TText>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setStartPickerOpen(true)}
                activeOpacity={0.85}
              >
                <TText
                  style={[
                    styles.dateInputText,
                    !draftFilters.startDate && styles.placeholder,
                  ]}
                >
                  {draftFilters.startDate
                    ? formatDateFR(draftFilters.startDate)
                    : t("cheques.filter.selectDate", "Sélectionner")}
                </TText>
                <Calendar size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <TText style={styles.dateInputLabel}>
                {t("transferHistory.filters.endDate", "Date de fin")}
              </TText>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setEndPickerOpen(true)}
                activeOpacity={0.85}
              >
                <TText
                  style={[
                    styles.dateInputText,
                    !draftFilters.endDate && styles.placeholder,
                  ]}
                >
                  {draftFilters.endDate
                    ? formatDateFR(draftFilters.endDate)
                    : t("cheques.filter.selectDate", "Sélectionner")}
                </TText>
                <Calendar size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ✅ START DATE PICKER */}
          <DatePicker
            modal
            open={startPickerOpen}
            date={draftFilters.startDate ?? today}
            mode="date"
            locale={selectedLanguage ?? undefined}
            title={t("transferHistory.filters.startDate", "Date de début")}
            confirmText={t("common.validate", "OK")}
            cancelText={t("common.cancel", "Annuler")}
            minimumDate={minSelectableDate}
            maximumDate={
              draftFilters.endDate
                ? endOfDay(draftFilters.endDate)
                : maxSelectableDate
            }
            onConfirm={(date) => {
              setStartPickerOpen(false);

              const maxStart = draftFilters.endDate
                ? endOfDay(draftFilters.endDate)
                : maxSelectableDate;
              const clamped =
                date < minSelectableDate
                  ? minSelectableDate
                  : date > maxStart
                    ? maxStart
                    : date;

              setDraftFilters((p) => ({ ...p, startDate: clamped }));

              if (draftFilters.endDate && clamped > draftFilters.endDate) {
                setDraftFilters((p) => ({ ...p, endDate: clamped }));
              }
            }}
            onCancel={() => setStartPickerOpen(false)}
          />

          {/* ✅ END DATE PICKER */}
          <DatePicker
            modal
            open={endPickerOpen}
            date={draftFilters.endDate ?? today}
            mode="date"
            locale={selectedLanguage ?? undefined}
            title={t("transferHistory.filters.endDate", "Date de fin")}
            confirmText={t("common.validate", "OK")}
            cancelText={t("common.cancel", "Annuler")}
            minimumDate={
              draftFilters.startDate
                ? maxDate(minSelectableDate, startOfDay(draftFilters.startDate))
                : minSelectableDate
            }
            maximumDate={maxSelectableDate}
            onConfirm={(date) => {
              setEndPickerOpen(false);

              const minEnd = draftFilters.startDate
                ? maxDate(minSelectableDate, startOfDay(draftFilters.startDate))
                : minSelectableDate;

              const clamped =
                date < minEnd
                  ? minEnd
                  : date > maxSelectableDate
                    ? maxSelectableDate
                    : date;

              setDraftFilters((p) => ({ ...p, endDate: clamped }));
            }}
            onCancel={() => setEndPickerOpen(false)}
          />

          {/* AMOUNT */}
          <TText style={styles.sectionTitle}>
            {t("transferHistory.filters.amount", "Montant")}
          </TText>

          <View style={styles.amountRangeContainer}>
            <View style={styles.amountInputContainer}>
              <TText style={styles.amountInputLabel}>
                {t("transferHistory.filters.min", "Minimum")}
              </TText>
              <TextInput
                ref={minAmountRef}
                style={styles.amountInput}
                placeholder="0,00"
                value={draftFilters.minAmount.replace(/\./g, ",")}
                onChangeText={(v) => {
                  const sanitized = v
                    .replace(/,/g, ".")
                    .replace(/[^0-9.]/g, "")
                    .replace(/(\..*)\./g, "$1");
                  const parts = sanitized.split(".");
                  const clamped =
                    parts.length > 1
                      ? `${parts[0]}.${parts[1].slice(0, 3)}`
                      : sanitized;
                  setDraftFilters((p) => ({ ...p, minAmount: clamped }));
                }}
                onFocus={handleAmountFocus}
                keyboardType="decimal-pad"
                placeholderTextColor={BankingColors.textLight}
              />
            </View>

            <View style={styles.amountInputContainer}>
              <TText style={styles.amountInputLabel}>
                {t("transferHistory.filters.max", "Maximum")}
              </TText>
              <TextInput
                ref={maxAmountRef}
                style={styles.amountInput}
                placeholder="0,00"
                value={draftFilters.maxAmount.replace(/\./g, ",")}
                onChangeText={(v) => {
                  const sanitized = v
                    .replace(/,/g, ".")
                    .replace(/[^0-9.]/g, "")
                    .replace(/(\..*)\./g, "$1");
                  const parts = sanitized.split(".");
                  const clamped =
                    parts.length > 1
                      ? `${parts[0]}.${parts[1].slice(0, 3)}`
                      : sanitized;
                  setDraftFilters((p) => ({ ...p, maxAmount: clamped }));
                }}
                onFocus={handleAmountFocus}
                keyboardType="decimal-pad"
                placeholderTextColor={BankingColors.textLight}
              />
            </View>
          </View>
        </View>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.clearButton,
              !hasAnyTemp && styles.clearButtonDisabled,
            ]}
            onPress={onReset}
            activeOpacity={0.85}
            disabled={!hasAnyTemp}
          >
            <RotateCcw
              size={16}
              color={hasAnyTemp ? BankingColors.text : BankingColors.disabled}
            />
            <TText
              style={[
                styles.clearButtonText,
                !hasAnyTemp && styles.clearButtonTextDisabled,
              ]}
            >
              {t("common.reset", "Réinitialiser")}
            </TText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={onApply}
            activeOpacity={0.85}
          >
            <TText style={styles.applyButtonText}>
              {t("common.apply", "Appliquer")}
            </TText>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
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
