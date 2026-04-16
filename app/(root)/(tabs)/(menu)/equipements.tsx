import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { getProductSubscriptions } from "@/services/account.api";
import { ProductEquipment } from "@/types/account.type";
import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  FontFamily,
} from "@/constants";

import EquipmentListSkeleton from "@/components/menu/equipment/EquipmentListSkeleton";
import EquipmentListHeader from "@/components/menu/equipment/EquipmentListHeader";
import EquipmentCard from "@/components/menu/equipment/EquipmentCard";
import ApiErrorState from "@/components/Apierrorstate";
import ScreenState from "@/components/ScreenState";
import TText from "@/components/TText";

import EquipmentFilterSheet, {
  EquipmentSubscriptionType,
} from "@/components/menu/equipment/EquipmentFilterSheet";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

type Filters = {
  type: EquipmentSubscriptionType; // PRODUCT | PACK | null
  startSubscription: Date | null;
  endSubscription: Date | null;
};

const safeParseDate = (raw?: string | null): Date | null => {
  if (!raw || raw === "null") return null;

  // handle weird years like "0013-01-09"
  // new Date("0013-01-09") is valid in JS but some engines can be picky.
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d;

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw).trim());
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const dt = new Date(y, mo, day);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

// subscription date = any subscription startDate inside range
const equipmentHasSubscriptionInRange = (
  equipment: any,
  start: Date | null,
  end: Date | null,
) => {
  const subs = equipment?.subscriptions;
  if (!Array.isArray(subs) || subs.length === 0) return false;

  for (const s of subs) {
    const dt = safeParseDate(s?.startDate);
    if (!dt) continue;

    if (start && dt < start) continue;
    if (end && dt > end) continue;

    return true;
  }
  return false;
};
const EQUIPEMENTS_URL =
  "https://www.attijaribank.com.tn/fr/particulier/offre-packagee";

export default function EquipementsScreen() {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["product-subscriptions"],
    queryFn: getProductSubscriptions,
  });

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDateChip = (d: Date) =>
    d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const equipments: ProductEquipment[] = useMemo(
    () => data?.data ?? [],
    [data?.data],
  );

  const handleNavigation = useCallback(() => {
    router.replace({
      pathname: "/(root)/(tabs)/(menu)/webview",
      params: {
        url: EQUIPEMENTS_URL,
        redirectTo: "/(root)/(tabs)/(menu)/equipements",
        loadingTextKey: "equipements.redirectingMessage",
        title: "Equipements",
        showHeader: "1",
        closeBehavior: "replace",
        returnTo: "/(root)/(tabs)/(menu)/equipements",
      },
    });
  }, []);

  // ---- Search ----
  const [searchQuery, setSearchQuery] = useState("");

  // ---- Filters applied ----
  const [filters, setFilters] = useState<Filters>({
    type: null,
    startSubscription: null,
    endSubscription: null,
  });

  // ---- Filters temp (sheet) ----
  const sheetRef = useRef<BottomSheetModal | null>(null);
  const [tempType, setTempType] = useState<EquipmentSubscriptionType>(null);
  const [tempStartSubscription, setTempStartSubscription] =
    useState<Date | null>(null);
  const [tempEndSubscription, setTempEndSubscription] = useState<Date | null>(
    null,
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.type || filters.startSubscription || filters.endSubscription,
      ),
    [filters],
  );

  const openFilters = useCallback(() => {
    setTempType(filters.type);
    setTempStartSubscription(filters.startSubscription);
    setTempEndSubscription(filters.endSubscription);
    sheetRef.current?.present();
  }, [filters]);

  const onApply = useCallback(() => {
    let nextStart = tempStartSubscription;
    let nextEnd = tempEndSubscription;

    if (nextStart && nextEnd && nextEnd < nextStart) nextEnd = nextStart;

    setFilters({
      type: tempType,
      startSubscription: nextStart,
      endSubscription: nextEnd,
    });
  }, [tempType, tempStartSubscription, tempEndSubscription]);

  const onClear = useCallback(() => {
    setTempType(null);
    setTempStartSubscription(null);
    setTempEndSubscription(null);
    setFilters({ type: null, startSubscription: null, endSubscription: null });
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === "type") next.type = null;
      if (key === "start") next.startSubscription = null;
      if (key === "end") next.endSubscription = null;
      return next;
    });
  }, []);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];

    if (filters.type) {
      chips.push({
        key: "type",
        label: `${t("equipments.subscriptionType") || "Type"}: ${
          filters.type === "PACK"
            ? t("equipments.typePack") || "Pack"
            : t("equipments.typeProduct") || "Produit"
        }`,
      });
    }

    if (filters.startSubscription) {
      chips.push({
        key: "start",
        label: `${t("placements.filterStart") || "Du"}: ${formatDateChip(
          filters.startSubscription,
        )}`,
      });
    }

    if (filters.endSubscription) {
      chips.push({
        key: "end",
        label: `${t("placements.filterEnd") || "Au"}: ${formatDateChip(
          filters.endSubscription,
        )}`,
      });
    }

    return chips;
  }, [filters, t]);

  const filteredEquipments = useMemo(() => {
    const list = equipments ?? [];

    // normalize date bounds (same as placements)
    const start = filters.startSubscription
      ? new Date(
          filters.startSubscription.getFullYear(),
          filters.startSubscription.getMonth(),
          filters.startSubscription.getDate(),
          0,
          0,
          0,
          0,
        )
      : null;

    const end = filters.endSubscription
      ? new Date(
          filters.endSubscription.getFullYear(),
          filters.endSubscription.getMonth(),
          filters.endSubscription.getDate(),
          23,
          59,
          59,
          999,
        )
      : null;

    const q = searchQuery.trim().toLowerCase();

    return (list as any[]).filter((eq) => {
      // filter by type (Produit/Pack)
      if (filters.type) {
        const currentType: EquipmentSubscriptionType = eq?.isPack
          ? "PACK"
          : "PRODUCT";
        if (currentType !== filters.type) return false;
      }

      // filter by subscription date range
      if (start || end) {
        if (!equipmentHasSubscriptionInRange(eq, start, end)) return false;
      }

      // search
      if (q) {
        const subs = Array.isArray(eq?.subscriptions) ? eq.subscriptions : [];
        const subRefs = subs
          .map((s: any) => s?.reference)
          .filter(Boolean)
          .join(" ");
        const subDates = subs
          .map((s: any) => s?.startDate)
          .filter(Boolean)
          .join(" ");

        const haystack = [eq?.designation, eq?.code, eq?.id, subRefs, subDates]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    equipments,
    filters.type,
    filters.startSubscription,
    filters.endSubscription,
    searchQuery,
  ]);

  const noResults = equipments.length > 0 && filteredEquipments.length === 0;
  const queryTrimmed = searchQuery.trim();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <EquipmentListSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <ApiErrorState
        title={t("common.error")}
        description={t("equipments.loadingError")}
        onRetry={() => refetch()}
      />
    );
  }

  if (!equipments.length) {
    return (
      <ScreenState
        variant="empty"
        title={t("equipments.noEquipmentsTitle")}
        description={t("equipments.noEquipmentsDesc")}
      />
    );
  }

  return (
    <>
      <EquipmentFilterSheet
        sheetRef={sheetRef}
        tempType={tempType}
        setTempType={setTempType}
        tempStartSubscription={tempStartSubscription}
        setTempStartSubscription={setTempStartSubscription}
        tempEndSubscription={tempEndSubscription}
        setTempEndSubscription={setTempEndSubscription}
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
              placeholder={t("equipments.searchPlaceholder") || "Rechercher..."}
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
          {filteredEquipments.length}{" "}
          {t("equipments.count.title") || "Équipements(s)"}{" "}
        </TText>

        {noResults && (
          <View style={styles.noResultsBox}>
            <TText style={styles.noResultsTitle}>
              {t("placements.noResultsTitle") || "Aucun résultat"}
            </TText>
            <TText style={styles.noResultsDesc}>
              {t("placements.noResultsDesc", { query: queryTrimmed })}
            </TText>
          </View>
        )}
      </View>

      <FlashList
        data={filteredEquipments}
        keyExtractor={(item: any, index) => `${item?.id ?? "eq"}-${index}`}
        contentContainerStyle={styles.listContent}
        // ListHeaderComponent={
        //   <EquipmentListHeader count={filteredEquipments.length} />
        // }
        renderItem={({ item }) => (
          <EquipmentCard equipment={item} onPress={handleNavigation} />
        )}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },

  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: BankingColors.background,
  },

  // --- Search + filters area (same pattern as placements) ---
  searchSection: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: BankingColors.background,
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
