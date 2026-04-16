import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard } from "react-native";
import { router } from "expo-router";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

import { claimQueryKeys, useClaims } from "@/hooks/use-claims";
import { useCustomerAccounts } from "@/hooks/use-accounts-api";

import ClaimCard from "@/components/ClaimCard";
import ClaimSkeleton from "@/components/ClaimSkeleton";
import TText from "@/components/TText";
import ScreenState from "@/components/ScreenState";

import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize, FontFamily } from "@/constants";

import { Claim } from "@/types/claim.type";
import ClaimsFilterSheet from "@/components/home/Notification/ClaimsFilterSheet";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";

/** ---------------------------------------------
 * Helpers
 * --------------------------------------------- */
type FilterStatus = "all" | Claim["status"];

type Filters = {
  accountId: string | null;
  startDate: Date | null;
  endDate: Date | null;
};

const norm = (v: unknown) =>
  String(v ?? "")
    .toLowerCase()
    .trim();

const safeParseDate = (iso?: string | null): Date | null => {
  if (!iso || iso === "null") return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export default function ClaimsScreen() {
  const { t } = useTranslation();

  // search
  const [searchQuery, setSearchQuery] = useState("");

  // status chip (optional)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // applied filters
  const [filters, setFilters] = useState<Filters>({
    accountId: null,
    startDate: null,
    endDate: null });

  // bottom sheet temp filters
  const sheetRef = useRef<BottomSheetModal | null>(null);
  const [tempAccountId, setTempAccountId] = useState<string | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  /** ---------------------------------------------
   * Accounts
   * --------------------------------------------- */
  const { data: accountsResponse } = useCustomerAccounts();
  const accounts = accountsResponse?.data ?? [];

  const accountNumberById = useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of accounts) {
      if (acc?.id) map.set(acc.id, acc.accountNumber ?? "-");
    }
    return map;
  }, [accounts]);

  const accountOptions = useMemo(() => {
    // used in the filter sheet UI
    return accounts
      .filter((a) => a?.id)
      .map((a) => ({
        id: a.id,
        title: a.accountTitle ?? "-",
        number: a.accountNumber ?? "-" }));
  }, [accounts]);

  /** ---------------------------------------------
   * Claims
   * --------------------------------------------- */
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useClaims({
      status: filterStatus === "all" ? undefined : filterStatus,
      limit: 100 });

  useRefetchOnFocus([
    { queryKey: claimQueryKeys.claims({
        status: filterStatus === "all" ? undefined : filterStatus,
        limit: 100 }) },
    ]);

  const claims = useMemo(() => {
    return (data?.pages.flatMap((page) => page.data) || []).filter(Boolean);
  }, [data]);

  // attach account number to each claim
  const claimsWithAccount = useMemo(() => {
    return claims.map((c) => ({
      ...c,
      _accountNumber: accountNumberById.get(c.accountId) ?? "-" }));
  }, [claims, accountNumberById]);

  /** ---------------------------------------------
   * Filters
   * --------------------------------------------- */
  const hasActiveFilters = useMemo(() => {
    return Boolean(filters.accountId || filters.startDate || filters.endDate);
  }, [filters]);

  useEffect(() => {
    // keep endDate >= startDate
    if (
      filters.startDate &&
      filters.endDate &&
      filters.endDate < filters.startDate
    ) {
      setFilters((f) => ({ ...f, endDate: f.startDate }));
    }
  }, [filters.startDate, filters.endDate]);

  const openFilters = useCallback(() => {
    setTempAccountId(filters.accountId);
    setTempStartDate(filters.startDate);
    setTempEndDate(filters.endDate);
    Keyboard.dismiss();
    sheetRef.current?.present();
  }, [filters]);

  const onApplyFilters = useCallback(() => {
    let nextStart = tempStartDate;
    let nextEnd = tempEndDate;

    if (nextStart && nextEnd && nextEnd < nextStart) nextEnd = nextStart;

    setFilters({
      accountId: tempAccountId,
      startDate: nextStart,
      endDate: nextEnd });
  }, [tempAccountId, tempStartDate, tempEndDate]);

  const onClearFilters = useCallback(() => {
    setTempAccountId(null);
    setTempStartDate(null);
    setTempEndDate(null);
    setFilters({ accountId: null, startDate: null, endDate: null });
  }, []);

  const resetAll = useCallback(() => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilters({ accountId: null, startDate: null, endDate: null });
    setTempAccountId(null);
    setTempStartDate(null);
    setTempEndDate(null);
    Keyboard.dismiss();
  }, []);

  const filteredClaims = useMemo(() => {
    const list = claimsWithAccount ?? [];

    const start = filters.startDate
      ? new Date(
          filters.startDate.getFullYear(),
          filters.startDate.getMonth(),
          filters.startDate.getDate(),
          0,
          0,
          0,
          0,
        )
      : null;

    const end = filters.endDate
      ? new Date(
          filters.endDate.getFullYear(),
          filters.endDate.getMonth(),
          filters.endDate.getDate(),
          23,
          59,
          59,
          999,
        )
      : null;

    const q = searchQuery.trim().toLowerCase();

    const filtered = list.filter((c) => {
      // account
      if (filters.accountId) {
        if (String(c.accountId ?? "") !== filters.accountId) return false;
      }

      // date range (choose creationDate; you can replace with incidentDate)
      if (start || end) {
        const dt = safeParseDate(String(c.creationDate ?? ""));
        if (!dt) return false;
        if (start && dt < start) return false;
        if (end && dt > end) return false;
      }

      // reference/subject search
      if (q) {
        const haystack = [
          c.claimSubject,
          c.reference,
          c.description,
          c.categoryLabel,
          c.subCategoryLabel,
          c._accountNumber,
        ]
          .filter(Boolean)
          .map(norm)
          .join(" ");

        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    // newest -> oldest
    return [...filtered].sort((a, b) => {
      const aTime = Date.parse(String(a?.creationDate ?? ""));
      const bTime = Date.parse(String(b?.creationDate ?? ""));
      const aValid = Number.isFinite(aTime);
      const bValid = Number.isFinite(bTime);
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;
      return bTime - aTime;
    });
  }, [
    claimsWithAccount,
    filters.accountId,
    filters.startDate,
    filters.endDate,
    searchQuery,
  ]);

  const noResults = claimsWithAccount.length > 0 && filteredClaims.length === 0;
  const queryTrimmed = searchQuery.trim();

  /** ---------------------------------------------
   * Counts
   * --------------------------------------------- */
  const totalCount = data?.pages?.[0]?.count || 0;

  const statusCounts = useMemo(() => {
    return {
      all: totalCount,
      PENDING: claimsWithAccount.filter((c) => c?.status === "PENDING").length,
      EXECUTED: claimsWithAccount.filter((c) => c?.status === "EXECUTED")
        .length,
      REJECTED: claimsWithAccount.filter((c) => c?.status === "REJECTED")
        .length };
  }, [claimsWithAccount, totalCount]);

  /** ---------------------------------------------
   * Nav
   * --------------------------------------------- */
  const handleClaimPress = useCallback(
    (claimId: string, accountNumber: string) => {
      router.navigate({
        pathname: "/claim-details",
        params: { claimId, accountNumber } } as any);
    },
    [],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={BankingColors.primary} />
      </View>
    );
  };

  /** ---------------------------------------------
   * Render
   * --------------------------------------------- */
  return (
    <View style={styles.container}>
      {/* FILTER SHEET */}
      <ClaimsFilterSheet
        sheetRef={sheetRef}
        accountOptions={accountOptions}
        tempAccountId={tempAccountId}
        setTempAccountId={setTempAccountId}
        tempStartDate={tempStartDate}
        setTempStartDate={setTempStartDate}
        tempEndDate={tempEndDate}
        setTempEndDate={setTempEndDate}
        onApply={onApplyFilters}
        onClear={onClearFilters}
      />

      {/* HEADER: Search + filter */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={IconSize.md} color={BankingColors.textSlate} />
            <TextInput
              style={styles.searchInput}
              placeholder={t("claims.filter.searchPlaceholder")}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={BankingColors.textSlate}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            onPress={openFilters}
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

        <View style={styles.actionsRow}>
          {/* <TouchableOpacity
            onPress={resetAll}
            disabled={
              !hasActiveFilters && !searchQuery && filterStatus === "all"
            }
            activeOpacity={0.85}
            style={[
              styles.resetPill,
              !hasActiveFilters &&
                !searchQuery &&
                filterStatus === "all" && { opacity: 0.45 },
            ]}
          >
            <RotateCcw size={18} color={BankingColors.primary} />
            <TText style={styles.resetText} tKey="claims.filter.reset" />
          </TouchableOpacity> */}

          <TText style={styles.resultsText}>
            {filteredClaims.length} {t("placements.results") || "résultats"}
          </TText>
        </View>

        {/* STATUS CHIPS 
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
          data={[
            { key: "all", tKey: "claims.all", count: statusCounts.all },
            {
              key: "PENDING",
              tKey: "claims.pending",
              count: statusCounts.PENDING },
            {
              key: "EXECUTED",
              tKey: "claims.executed",
              count: statusCounts.EXECUTED },
            {
              key: "REJECTED",
              tKey: "claims.rejected",
              count: statusCounts.REJECTED },
          ]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStatus === item.key && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(item.key as FilterStatus)}
              activeOpacity={0.85}
            >
              <TText
                tKey={item.tKey}
                style={[
                  styles.filterChipText,
                  filterStatus === item.key && styles.filterChipTextActive,
                ]}
              >
                {` (${item.count})`}
              </TText>
            </TouchableOpacity>
          )}
        /> */}

        {/* NO RESULTS BOX */}
        {noResults && (
          <View style={styles.noResultsBox}>
            <TText style={styles.noResultsTitle} tKey="claims.noResultsTitle" />
            <TText style={styles.noResultsDesc}>
              {t("claims.noResultsDesc", { query: queryTrimmed })}
            </TText>
          </View>
        )}
      </View>

      {/* LIST */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <ClaimSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredClaims}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          renderItem={({ item }) => (
            <ClaimCard
              claim={item}
              accountNumber={item._accountNumber}
              onPress={() => handleClaimPress(item.id, item._accountNumber)}
            />
          )}
          ListEmptyComponent={
            claimsWithAccount.length === 0 ? (
              <ScreenState
                variant="empty"
                titleKey="claims.noClaims"
                descriptionKey="claims.noClaimsYet"
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },

  skeletonContainer: {
    flex: 1,
    backgroundColor: BankingColors.background,
    paddingTop: 16 },

  header: {
    backgroundColor: BankingColors.white,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md },

  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: FontSize.md,
    color: BankingColors.text },

  filterIconBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary },

  filterIconBtnActive: {
    backgroundColor: BankingColors.primary },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md },

  resetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.background,
    borderWidth: 1,
    borderColor: BankingColors.border },

  resetText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary },

  resultsText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium },

  filterContainer: { paddingEnd: Spacing.lg, marginTop: Spacing.md },
  filterContent: { gap: Spacing.sm, paddingHorizontal: Spacing.lg },

  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: BankingColors.background,
    borderWidth: 1,
    borderColor: BankingColors.border },

  filterChipActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary },

  filterChipText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.text },

  filterChipTextActive: { color: BankingColors.white },

  contentContainer: { padding: Spacing.lg },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.massive },

  emptyTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm },

  emptyText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center" },

  footerLoader: { paddingVertical: Spacing.lg, alignItems: "center" },

  noResultsBox: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.white,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.sm },

  noResultsTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 4 },

  noResultsDesc: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary } });
