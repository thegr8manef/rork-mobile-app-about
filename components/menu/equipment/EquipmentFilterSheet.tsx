import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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

export type EquipmentSubscriptionType = "PRODUCT" | "PACK" | null;

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;

  tempType: EquipmentSubscriptionType;
  setTempType: (v: EquipmentSubscriptionType) => void;

  tempStartSubscription: Date | null;
  setTempStartSubscription: (v: Date | null) => void;

  tempEndSubscription: Date | null;
  setTempEndSubscription: (v: Date | null) => void;

  onApply: () => void;
  onClear: () => void;
};

export default function EquipmentFilterSheet({
  sheetRef,
  tempType,
  setTempType,
  tempStartSubscription,
  setTempStartSubscription,
  tempEndSubscription,
  setTempEndSubscription,
  onApply,
  onClear,
}: Props) {
  const { t, i18n } = useTranslation();

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
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const typeChips = useMemo(() => ["__ALL__", "PRODUCT", "PACK"] as const, []);

  const hasAnyTemp = Boolean(
    tempType || tempStartSubscription || tempEndSubscription,
  );

  const handleClearLocal = () => {
    setTempType(null);
    setTempStartSubscription(null);
    setTempEndSubscription(null);
  };

  const typeLabel = (v: (typeof typeChips)[number]) => {
    if (v === "__ALL__") return t("placements.all") || "Tous";
    if (v === "PRODUCT") return t("equipments.typeProduct") || "Produit";
    return t("equipments.typePack") || "Pack";
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
          <Text style={styles.sectionTitle}>
            {t("equipments.subscriptionType") || "Type de l’abonnement"}
          </Text>

          <View style={styles.chipsContainer}>
            {typeChips.map((v) => {
              const active =
                v === "__ALL__" ? tempType === null : tempType === v;
              return (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setTempType(v === "__ALL__" ? null : v)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {typeLabel(v)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>
            {t("equipments.subscriptionPeriod") || "Date de souscription"}
          </Text>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("placements.filterStart") || "Du"}
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !tempStartSubscription && styles.placeholder,
                  ]}
                >
                  {tempStartSubscription
                    ? formatDateFR(tempStartSubscription)
                    : t("cheques.filter.selectDate") || "Sélectionner"}
                </Text>
                <Calendar size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>
                {t("placements.filterEnd") || "Au"}
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndPicker(true)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !tempEndSubscription && styles.placeholder,
                  ]}
                >
                  {tempEndSubscription
                    ? formatDateFR(tempEndSubscription)
                    : t("cheques.filter.selectDate") || "Sélectionner"}
                </Text>
                <Calendar size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <DatePicker
            modal
            open={showStartPicker}
            date={tempStartSubscription || new Date()}
            mode="date"
            locale={selectedLanguage ?? undefined}
            title={t("placements.filterStart") || "Du"}
            confirmText={t("common.validate")}
            cancelText={t("common.cancel")}
            maximumDate={tempEndSubscription || new Date()}
            onConfirm={(d) => {
              setShowStartPicker(false);
              setTempStartSubscription(d);
              if (tempEndSubscription && d > tempEndSubscription) {
                setTempEndSubscription(d);
              }
            }}
            onCancel={() => setShowStartPicker(false)}
          />

          <DatePicker
            modal
            open={showEndPicker}
            date={tempEndSubscription || new Date()}
            mode="date"
            locale={selectedLanguage ?? undefined}
            title={t("placements.filterEnd") || "Au"}
            confirmText={t("common.validate")}
            cancelText={t("common.cancel")}
            minimumDate={tempStartSubscription || undefined}
            maximumDate={new Date()}
            onConfirm={(d) => {
              setShowEndPicker(false);
              setTempEndSubscription(d);
            }}
            onCancel={() => setShowEndPicker(false)}
          />
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
  handleIndicator: {
    backgroundColor: BankingColors.borderMedium,
    width: 40,
  },
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
  dateInputText: { fontSize: FontSize.sm, color: BankingColors.text },
  placeholder: { color: BankingColors.textLight },

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
