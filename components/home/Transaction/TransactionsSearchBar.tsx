import React, { useMemo } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";

type FilterChip = { key: string; label: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  onOpenFilters: () => void;
  hasActiveFilters?: boolean;
  activeFilterChips?: FilterChip[];
  onRemoveFilter?: (key: string) => void;
  resultsCount?: number;
};

export default function TransactionsSearchBar({
  value,
  onChange,
  onOpenFilters,
  hasActiveFilters = false,
  activeFilterChips = [],
  onRemoveFilter,
  resultsCount }: Props) {
  const { t } = useTranslation();
  const hasSearchQuery = useMemo(() => value.trim().length > 0, [value]);

  const handleClearSearch = () => onChange("");

  return (
    <View style={styles.searchSection}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={BankingColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("common.search") || "Rechercher..."}
            value={value}
            onChangeText={onChange}
            placeholderTextColor={BankingColors.textLight}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {hasSearchQuery && (
            <TouchableOpacity
              onPress={handleClearSearch}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={BankingColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={onOpenFilters}
          activeOpacity={0.85}
          style={[
            styles.filterIconBtn,
            hasActiveFilters && styles.filterIconBtnActive,
          ]}
        >
          <SlidersHorizontal
            size={20}
            color={
              hasActiveFilters ? BankingColors.white : BankingColors.primary
            }
          />
        </TouchableOpacity>
      </View>

      {activeFilterChips.length > 0 && (
        <View style={styles.appliedFiltersRow}>
          <View style={styles.appliedFiltersHeader}>
            <TText style={styles.appliedFiltersLabel}>
              {t("common.filter") || "Filtres"}
            </TText>
            <TText style={styles.appliedFiltersCount}>
              {activeFilterChips.length} {t("common.active") || "actif(s)"}
            </TText>
          </View>
          <View style={styles.chipsList}>
            {activeFilterChips.map((chip) => (
              <View key={chip.key} style={styles.activeChip}>
                <TText style={styles.activeChipText}>{chip.label}</TText>
                <TouchableOpacity
                  onPress={() => onRemoveFilter?.(chip.key)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={BankingColors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {resultsCount !== undefined && (
        <TText style={styles.resultsText}>
          {resultsCount} {t("placements.results") || "résultat(s)"}
        </TText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchSection: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    height: 48 },
  searchInput: {
    flex: 1,
    color: BankingColors.text,
    fontSize: FontSize.base },
  filterIconBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary },
  filterIconBtnActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary },
  appliedFiltersRow: {
    marginBottom: Spacing.md },
  appliedFiltersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm },
  appliedFiltersLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  appliedFiltersCount: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary },
  chipsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surfaceSecondary,
    borderWidth: 1,
    borderColor: BankingColors.border },
  activeChipText: {
    fontSize: FontSize.sm,
    color: BankingColors.text,
    fontFamily: FontFamily.medium },
  resultsText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.sm } });
