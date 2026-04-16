import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  FontFamily,
} from "@/constants";
import { mockPlacementTypes } from "@/mocks/banking-data";
import { useTermDeposits } from "@/hooks/use-deposite";
import { PlacementType } from "@/types/banking";

import TText from "@/components/TText";
import EmptyState from "@/components/factures/EmptyState";
import DepositCard from "@/components/menu/placement/DepositCard";
import DepositSkeleton from "@/components/DepositSkeleton";
import PlacementTypeCard from "@/components/menu/placement/PlacementTypeCard";
import { horizontalScale } from "@/utils/scale";
import PlacementFilterSheet from "@/components/menu/placement/PlacementFilterSheet";
import ApiErrorState from "@/components/Apierrorstate";
import { router } from "expo-router";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

type Filters = {
  product: string | null;
  startExecution: Date | null;
  endExecution: Date | null;
};

const safeParseDate = (iso?: string | null): Date | null => {
  if (!iso || iso === "null") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const PLACEMENTS_URL =
  "https://www.attijaribank.com.tn/fr/particulier/epargne-et-placement";

export default function PlacementsScreen() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useTermDeposits();

  const deposits = data?.data ?? [];

  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState<Filters>({
    product: null,
    startExecution: null,
    endExecution: null,
  });

  const sheetRef = useRef<BottomSheetModal | null>(null);
  const [tempProduct, setTempProduct] = useState<string | null>(null);
  const [tempStartExecution, setTempStartExecution] = useState<Date | null>(
    null,
  );
  const [tempEndExecution, setTempEndExecution] = useState<Date | null>(null);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDateChip = (d: Date) =>
    d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const handleRetry = useCallback(() => refetch(), [refetch]);

  const resetFilters = useCallback(() => {
    setFilters({ product: null, startExecution: null, endExecution: null });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.product || filters.startExecution || filters.endExecution,
    );
  }, [filters]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (filters.product) {
      chips.push({
        key: "product",
        label: `${t("placements.filterType")}: ${filters.product}`,
      });
    }
    if (filters.startExecution) {
      chips.push({
        key: "start",
        label: `${t("placements.filterStart")}: ${formatDateChip(filters.startExecution)}`,
      });
    }
    if (filters.endExecution) {
      chips.push({
        key: "end",
        label: `${t("placements.filterEnd")}: ${formatDateChip(filters.endExecution)}`,
      });
    }
    return chips;
  }, [filters, t]);

  useEffect(() => {
    if (filters.startExecution && filters.endExecution) {
      if (filters.endExecution < filters.startExecution) {
        setFilters((f) => ({ ...f, endExecution: f.startExecution }));
      }
    }
  }, [filters.startExecution, filters.endExecution]);

  const productOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of deposits) {
      if (d?.productName) set.add(String(d.productName));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [deposits]);

  const openFilters = useCallback(() => {
    setTempProduct(filters.product);
    setTempStartExecution(filters.startExecution);
    setTempEndExecution(filters.endExecution);
    sheetRef.current?.present();
  }, [filters]);

  /**
   * ✅ FIX:
   * Open external browser directly.
   * No router navigation to "/webview".
   * When user cancels/closes: do nothing (stay on screen).
   */
  const handleNavigation = useCallback(async () => {
    router.push({
      pathname: "/(root)/(tabs)/(menu)/webview",
      params: {
        url: PLACEMENTS_URL,
        title: t("menu.placements"), // ✅ instead of "webview"
        showHeader: "1", // "0" = no header
        closeBehavior: "back", // ✅ do nothing after close => go back
        loadingTextKey: "common.loading",
      },
    });
  }, []);

  const onApply = useCallback(() => {
    let nextStart = tempStartExecution;
    let nextEnd = tempEndExecution;

    if (nextStart && nextEnd && nextEnd < nextStart) nextEnd = nextStart;

    setFilters({
      product: tempProduct,
      startExecution: nextStart,
      endExecution: nextEnd,
    });
  }, [tempProduct, tempStartExecution, tempEndExecution]);

  const onClear = useCallback(() => {
    setTempProduct(null);
    setTempStartExecution(null);
    setTempEndExecution(null);
    setFilters({ product: null, startExecution: null, endExecution: null });
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === "product") next.product = null;
      if (key === "start") next.startExecution = null;
      if (key === "end") next.endExecution = null;
      return next;
    });
  }, []);

  const filteredDeposits = useMemo(() => {
    const list = deposits ?? [];

    const start = filters.startExecution
      ? new Date(
          filters.startExecution.getFullYear(),
          filters.startExecution.getMonth(),
          filters.startExecution.getDate(),
          0,
          0,
          0,
          0,
        )
      : null;

    const end = filters.endExecution
      ? new Date(
          filters.endExecution.getFullYear(),
          filters.endExecution.getMonth(),
          filters.endExecution.getDate(),
          23,
          59,
          59,
          999,
        )
      : null;

    const q = searchQuery.trim().toLowerCase();

    return list.filter((d: any) => {
      if (filters.product) {
        const productName = String(d?.productName ?? "");
        if (productName !== filters.product) return false;
      }

      if (start || end) {
        const execDate = safeParseDate(d?.executionDate);
        if (!execDate) return false;
        if (start && execDate < start) return false;
        if (end && execDate > end) return false;
      }

      if (q) {
        const collateralText =
          d?.isCollateralized === true
            ? t("placements.collateral.positive").toLowerCase()
            : d?.isCollateralized === false
              ? t("placements.collateral.negative").toLowerCase()
              : "";

        const haystack = [
          d?.productName,
          d?.id,
          d?.reference,
          d?.executionDate,
          collateralText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    deposits,
    filters.product,
    filters.startExecution,
    filters.endExecution,
    searchQuery,
  ]);

  const noResults = deposits.length > 0 && filteredDeposits.length === 0;
  const queryTrimmed = searchQuery.trim();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonContainer}>
          {[...Array(3)].map((_, index) => (
            <DepositSkeleton key={index} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ApiErrorState
          description={t("apiErrors.generic.desc")}
          onRetry={() => handleRetry()}
          isRetrying={isLoading}
        />
      </View>
    );
  }

  if (!deposits.length) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <EmptyState
            titleKey="placements.noPlacementsTitle"
            descriptionKey="placements.noPlacementsDescription"
          />
        </View>
        <View style={styles.section}>
          <TText tKey="placements.discover" style={styles.discoverTitle} />
          <FlatList
            data={mockPlacementTypes}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: Spacing.sm }}
            renderItem={({ item }) => (
              <PlacementTypeCard
                placement={item as PlacementType}
                onPress={handleNavigation}
              />
            )}
          />
        </View>
      </View>
    );
  }

  return (
    <>
      <PlacementFilterSheet
        sheetRef={sheetRef}
        productOptions={productOptions}
        tempProduct={tempProduct}
        setTempProduct={setTempProduct}
        tempStartExecution={tempStartExecution}
        setTempStartExecution={setTempStartExecution}
        tempEndExecution={tempEndExecution}
        setTempEndExecution={setTempEndExecution}
        onApply={onApply}
        onClear={onClear}
      />

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={BankingColors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("placements.searchPlaceholder") || "Rechercher..."}
              placeholderTextColor={BankingColors.textLight}
              returnKeyType="search"
              blurOnSubmit={false}
              autoCorrect={false}
              autoCapitalize="none"
            />
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
                {t("placements.filtersCount", {
                  count: activeFilterChips.length,
                })}
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
          {filteredDeposits.length} {t("placements.results") || "résultat(s)"}
        </TText>

        {noResults && (
          <View style={styles.noResultsBox}>
            <TText
              style={styles.noResultsTitle}
              tKey="placements.noResultsTitle"
            />
            <TText style={styles.noResultsDesc}>
              {t("placements.noResultsDesc", { query: queryTrimmed })}
            </TText>
          </View>
        )}
      </View>

      <FlashList
        data={filteredDeposits}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{
          paddingBottom: Spacing.xxl,
          paddingHorizontal: horizontalScale(Spacing.md),
        }}
        renderItem={({ item, index }) => (
          <DepositCard
            deposit={item}
            onPress={() => console.log(item.id)}
            index={index}
          />
        )}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        ListFooterComponent={() => (
          <View style={styles.section}>
            <TText tKey="placements.discover" style={styles.discoverTitle} />
            <FlatList
              data={mockPlacementTypes}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: Spacing.sm }}
              renderItem={({ item }) => (
                <PlacementTypeCard
                  placement={item as PlacementType}
                  onPress={handleNavigation}
                />
              )}
            />
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },

  section: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },

  searchSection: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },

  discoverTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.lg,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: horizontalScale(Spacing.md),
  },

  skeletonContainer: {
    paddingHorizontal: horizontalScale(Spacing.md),
    paddingTop: Spacing.lg,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
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
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: BankingColors.text,
    fontSize: FontSize.base,
  },

  filterIconBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary,
  },
  filterIconBtnActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary,
  },

  appliedFiltersRow: {
    marginBottom: Spacing.md,
  },

  appliedFiltersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },

  appliedFiltersLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },

  appliedFiltersCount: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },

  chipsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surfaceSecondary,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },

  activeChipText: {
    fontSize: FontSize.sm,
    color: BankingColors.text,
    fontFamily: FontFamily.medium,
  },

  resultsText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.sm,
  },

  noResultsBox: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  noResultsTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 4,
  },
  noResultsDesc: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
});
