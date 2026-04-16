import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Search, SlidersHorizontal, X, ChevronDown, Briefcase } from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

import TText from "@/components/TText";
import EmptyState from "@/components/factures/EmptyState";
import ScreenState from "@/components/ScreenState";
import { BankingColors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily } from "@/constants";
import { horizontalScale } from "@/utils/scale";

import { useAccountNumbers, useTitres } from "@/hooks/use-titres";
import AccountPickerSheet from "@/components/menu/PortfolioTitre/AccountPickerSheet";
import PortfolioFilterSheet from "@/components/menu/PortfolioTitre/PortfolioFilterSheet";
import TitreCard from "@/components/menu/PortfolioTitre/TitreCard";
import TitreSkeleton from "@/components/menu/PortfolioTitre/TitreSkeleton";
import ApiErrorState from "@/components/Apierrorstate";
import { router } from "expo-router";

function tempToNumber(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function PortfolioTitresScreen() {
  const { t } = useTranslation();

  const filterSheetRef = useRef<BottomSheetModal>(null);

  const [search, setSearch] = useState("");
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [filters, setFilters] = useState({
    onlyBlocked: false,
    onlyPositiveLatent: false,
    minQty: "" });

  const [tempOnlyBlocked, setTempOnlyBlocked] = useState(false);
  const [tempOnlyPositiveLatent, setTempOnlyPositiveLatent] = useState(false);
  const [tempMinQty, setTempMinQty] = useState("");

  const {
    data: accountsRes,
    isLoading: accountsLoading,
    isError: accountsError,
    refetch: refetchAccounts } = useAccountNumbers();

  const accountNumbers = useMemo(
    () => (accountsRes ?? []).map((x) => x.accountNumber).filter(Boolean),
    [accountsRes],
  );

  useEffect(() => {
    if (!accountNumber && accountNumbers.length > 0) {
      setAccountNumber(accountNumbers[0]);
    }
  }, [accountNumbers, accountNumber]);

  const {
    data: titresRes,
    isLoading: titresLoading,
    isError: titresError,
    refetch: refetchTitres } = useTitres(accountNumber);

  const rows = titresRes ?? [];

  const openFilters = useCallback(() => {
    setTempOnlyBlocked(filters.onlyBlocked);
    setTempOnlyPositiveLatent(filters.onlyPositiveLatent);
    setTempMinQty(filters.minQty);
    filterSheetRef.current?.present();
  }, [filters]);

  const applyFilters = useCallback(() => {
    setFilters({
      onlyBlocked: tempOnlyBlocked,
      onlyPositiveLatent: tempOnlyPositiveLatent,
      minQty: tempMinQty });
  }, [tempOnlyBlocked, tempOnlyPositiveLatent, tempMinQty]);

  const clearFilters = useCallback(() => {
    setTempOnlyBlocked(false);
    setTempOnlyPositiveLatent(false);
    setTempMinQty("");
    setFilters({ onlyBlocked: false, onlyPositiveLatent: false, minQty: "" });
  }, []);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minQty = tempToNumber(filters.minQty);

    return rows.filter((r) => {
      if (q) {
        const hay = [r.label, r.valueCode, r.securitiesAccount]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.onlyBlocked && (r.blockedQuantity ?? 0) <= 0) return false;
      if (minQty != null && (r.quantity ?? 0) < minQty) return false;
      if (filters.onlyPositiveLatent && (r.latentProfitLoss ?? 0) <= 0) return false;
      return true;
    });
  }, [rows, search, filters]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.onlyBlocked ||
      filters.onlyPositiveLatent ||
      filters.minQty.trim(),
    );
  }, [filters]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (filters.onlyBlocked) {
      chips.push({ key: "blocked", label: t("portfolio.blockedQuantityFilter") });
    }
    if (filters.onlyPositiveLatent) {
      chips.push({ key: "latent", label: t("portfolio.positiveLatentOnly") });
    }
    if (filters.minQty.trim()) {
      chips.push({ key: "minQty", label: `${t("portfolio.minimumQuantity")}: ${filters.minQty}` });
    }
    return chips;
  }, [filters, t]);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === "blocked") next.onlyBlocked = false;
      if (key === "latent") next.onlyPositiveLatent = false;
      if (key === "minQty") next.minQty = "";
      return next;
    });
  }, []);

  if (accountsLoading) {
    return (
      <View style={styles.container}>
        <TitreSkeleton count={3} />
      </View>
    );
  }

  if (accountsError) {
    return (
      <ApiErrorState
        title={t("common.error")}
        description={t("titres.errorFriendly")}
        onRetry={() => refetchAccounts()}
      />
    );
  }

  if (!accountNumbers.length) {
    return (
      <ScreenState
        variant="empty"
        title={t("portfolio.noAccounts")}
        description={t("portfolio.noAccountsDesc")}
      />
    );
  }

  return (
    <View style={styles.container}>
      <AccountPickerSheet
        visible={showAccountModal}
        accounts={accountNumbers}
        selected={accountNumber}
        onSelect={(v) => {
          setAccountNumber(v);
          setShowAccountModal(false);
        }}
        onClose={() => setShowAccountModal(false)}
      />

      <PortfolioFilterSheet
        sheetRef={filterSheetRef}
        tempOnlyBlocked={tempOnlyBlocked}
        setTempOnlyBlocked={setTempOnlyBlocked}
        tempOnlyPositiveLatent={tempOnlyPositiveLatent}
        setTempOnlyPositiveLatent={setTempOnlyPositiveLatent}
        tempMinQty={tempMinQty}
        setTempMinQty={setTempMinQty}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <View style={styles.headerSection}>
        <TouchableOpacity
          onPress={() => setShowAccountModal(true)}
          style={styles.accountSelector}
          activeOpacity={0.85}
        >
          <View style={styles.accountSelectorIcon}>
            <Briefcase size={20} color={BankingColors.primary} />
          </View>
          <View style={styles.accountSelectorText}>
            <TText style={styles.accountSelectorLabel}>
              {t("portfolio.securitiesAccount")}
            </TText>
            <TText style={styles.accountSelectorValue}>
              {accountNumber ?? "-"}
            </TText>
          </View>
          <ChevronDown size={20} color={BankingColors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={BankingColors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={t("portfolio.search") || "Rechercher..."}
              placeholderTextColor={BankingColors.textLight}
              returnKeyType="search"
              blurOnSubmit={false}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              openFilters();
            }}
            activeOpacity={0.85}
            style={[
              styles.filterIconBtn,
              hasActiveFilters && styles.filterIconBtnActive,
            ]}
          >
            <SlidersHorizontal
              size={20}
              color={hasActiveFilters ? BankingColors.white : BankingColors.primary}
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
                {activeFilterChips.length} {t("portfolio.filters")}
              </TText>
            </View>
            <View style={styles.chipsList}>
              {activeFilterChips.map((chip) => (
                <View key={chip.key} style={styles.activeChip}>
                  <TText style={styles.activeChipText}>{chip.label}</TText>
                  <TouchableOpacity
                    onPress={() => removeFilter(chip.key)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color={BankingColors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <TText style={styles.resultsText}>
          {filteredData.length} {t("placements.results") || "résultat(s)"}
        </TText>
      </View>

      {titresLoading ? (
        <TitreSkeleton count={3} />
      ) : titresError ? (
        <ApiErrorState
          title={t("common.error")}
          description={t("titres.errorFriendly")}
          onRetry={() => refetchTitres()}
        />
      ) : filteredData.length === 0 ? (
        <ScreenState
          variant="empty"
          titleKey="portfolio.noResults"
        />
      ) : (
        <FlashList
          data={filteredData}
          keyExtractor={(item, idx) => `${item.valueCode}-${idx}`}
          contentContainerStyle={{
            paddingBottom: Spacing.xxl,
            paddingHorizontal: horizontalScale(Spacing.md) }}
          renderItem={({ item }) => <TitreCard item={item} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"

        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },
  headerSection: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm },
  accountSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    marginBottom: Spacing.md,
    gap: Spacing.md },
  accountSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center" },
  accountSelectorText: {
    flex: 1 },
  accountSelectorLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: 2 },
  accountSelectorValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
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
    marginBottom: Spacing.sm },
  noResultsBox: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.border },
  noResultsTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.textSecondary } });
