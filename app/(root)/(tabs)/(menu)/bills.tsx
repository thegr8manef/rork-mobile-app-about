import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";

import {
  BankingColors,
  BorderRadius,
  FontSize,
  IconSize,
  Shadow,
  Spacing,
  FontFamily,
} from "@/constants";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { useBills, useBillImage, billQueryKeys } from "@/hooks/use-bills";

import AccountDetailsHeader from "@/components/home/AccountDetail/AccountDetailsHeader";
import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";

import BillsTabs from "@/components/menu/bills/BillsTabs";
import BillCard from "@/components/menu/bills/BillCard";
import BillFilterSheet from "@/components/menu/bills/BillFilterSheet";
import BillSkeleton from "@/components/menu/bills/BillSkeleton";
import BillsHeaderSkeleton from "@/components/menu/bills/BillsHeaderSkeleton";

import ApiErrorState from "@/components/Apierrorstate";
import ScreenState from "@/components/ScreenState";

import {
  SelectableAccount,
  toSelectableAccount,
} from "@/types/selectable-account";
import {
  BillFilterParams,
  BillOfExchangeRecord,
  BillStatus,
} from "@/types/bill-of-exchange.type";
import BillDetailModal from "@/components/menu/bills/Billdetailmodal";
import BillImageViewModal from "@/components/menu/bills/Billimageviewmodal";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import LoansListSkeleton from "@/components/menu/bills/BillSkeleton";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

// ✅ paymentType designation mapping (UI -> backend)
const PAYMENT_TYPE_TO_TYPE_CODE: Record<string, string | undefined> = {
  ENCAISSEMENT: "ENCAISSEMENT",
  ESCOMPTE: "ESCOMPTE",
};

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  /* =========================
   * Refs
   * ========================= */
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // prevent header/list skeleton from coming back on refetch / tab switch
  const hasLoadedOnceRef = useRef(false);

  // keep last list while refetching to avoid UI blinking (ONLY when no filters)
  const lastNonEmptyBillsRef = useRef<BillOfExchangeRecord[]>([]);

  /* =========================
   * UI state
   * ========================= */
  const [activeTab, setActiveTab] = useState<"payer" | "encaisser">("payer");
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImageViewModal, setShowImageViewModal] = useState(false);

  /* =========================
   * Search
   * ========================= */
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

  /* =========================
   * Filters (applied)
   * ========================= */
  const [selectedStatus, setSelectedStatus] = useState<BillStatus>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [paymentType, setPaymentType] = useState<string>("all");

  /* =========================
   * Filters (temp sheet)
   * ========================= */
  const [tempSelectedStatus, setTempSelectedStatus] =
    useState<BillStatus>("all");
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [tempMinAmount, setTempMinAmount] = useState("");
  const [tempMaxAmount, setTempMaxAmount] = useState("");
  const [tempPaymentType, setTempPaymentType] = useState<string>("all");

  /* =========================
   * Helpers
   * ========================= */
  const sens = activeTab === "payer" ? "D" : "C";

  const formatDateForApi = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split("T")[0];
  };

  const getOutcomeFilter = (status: BillStatus): string | undefined => {
    if (status === "all") return undefined;
    return status;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const amountStr = amount.toString();
    const parts = amountStr.split(".");
    const decimals = parts[1] ? parts[1].length : 3;

    return `${amount.toLocaleString("fr-TN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })} ${currency}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(selectedLanguage ?? undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  /* =========================
   * Accounts
   * ========================= */
  const {
    data: accountsResponse,
    isLoading: isAccountsLoading,
    isError: isAccountsError,
    refetch: refetchAccounts,
  } = useCustomerAccounts();

  const selectableAccounts: SelectableAccount[] = useMemo(() => {
    return (accountsResponse?.data ?? []).map(toSelectableAccount);
  }, [accountsResponse?.data]);

  const selectedAccount = useMemo(() => {
    return (
      selectableAccounts.find((a) => a.id === selectedAccountId) ||
      selectableAccounts[0]
    );
  }, [selectableAccounts, selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId && selectableAccounts.length > 0) {
      setSelectedAccountId(selectableAccounts[0].id);
    }
  }, [selectableAccounts, selectedAccountId]);

  /* =========================
   * Active filters flag
   * ========================= */
  const hasActiveFilters = useMemo(() => {
    return (
      selectedStatus !== "all" ||
      startDate !== null ||
      endDate !== null ||
      minAmount !== "" ||
      maxAmount !== "" ||
      paymentType !== "all" ||
      appliedSearchQuery.trim() !== ""
    );
  }, [
    selectedStatus,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    paymentType,
    appliedSearchQuery,
  ]);

  const formatDateChip = (d: Date) =>
    d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];

    if (selectedStatus !== "all") {
      const statusMap: Record<string, string> = {
        PAID: "paid",
        IMPAID: "unpaid",
        PENDING: "pending",
      };
      const statusLabel = t(
        `bills.filter.status.${statusMap[selectedStatus] ?? "pending"}`,
      );
      chips.push({
        key: "status",
        label: `${t("bills.filterStatus")}: ${statusLabel}`,
      });
    }

    if (paymentType !== "all") {
      const typeMap: Record<string, string> = {
        ENCAISSEMENT: "encaissement",
        ESCOMPTE: "escompte",
      };
      const typeLabel = t(
        `bills.filter.type.${typeMap[paymentType] ?? paymentType.toLowerCase()}`,
      );
      chips.push({
        key: "paymentType",
        label: `${t("bills.filterType")}: ${typeLabel}`,
      });
    }

    if (startDate) {
      chips.push({
        key: "start",
        label: `${t("bills.filterStart")}: ${formatDateChip(startDate)}`,
      });
    }
    if (endDate) {
      chips.push({
        key: "end",
        label: `${t("bills.filterEnd")}: ${formatDateChip(endDate)}`,
      });
    }
    if (minAmount) {
      chips.push({
        key: "min",
        label: `${t("bills.filterMin")}: ${minAmount}`,
      });
    }
    if (maxAmount) {
      chips.push({
        key: "max",
        label: `${t("bills.filterMax")}: ${maxAmount}`,
      });
    }

    return chips;
  }, [
    selectedStatus,
    paymentType,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    t,
  ]);

  const removeFilter = useCallback((key: string) => {
    switch (key) {
      case "status":
        setSelectedStatus("all");
        break;
      case "paymentType":
        setPaymentType("all");
        break;
      case "start":
        setStartDate(null);
        break;
      case "end":
        setEndDate(null);
        break;
      case "min":
        setMinAmount("");
        break;
      case "max":
        setMaxAmount("");
        break;
    }
  }, []);

  /* =========================
   * API filters
   * ========================= */
  const billFilters: Omit<BillFilterParams, "page" | "limit"> = useMemo(() => {
    const filters: any = {
      accountId: selectedAccount?.id,
      sens,
    };

    if (appliedSearchQuery.trim())
      filters.billNumber = appliedSearchQuery.trim();

    const outcomeFilter = getOutcomeFilter(selectedStatus);
    if (outcomeFilter) filters.outcome = outcomeFilter;

    const startDateStr = formatDateForApi(startDate);
    if (startDateStr) filters.startDate = startDateStr;

    const endDateStr = formatDateForApi(endDate);
    if (endDateStr) filters.endDate = endDateStr;

    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) filters.minAmount = min;
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) filters.maxAmount = max;
    }

    // backend expects typeEffet
    if (paymentType !== "all") {
      const typeEffet = PAYMENT_TYPE_TO_TYPE_CODE[paymentType];
      if (typeEffet) filters.typeEffet = typeEffet;
    }

    return filters;
  }, [
    selectedAccount?.id,
    sens,
    appliedSearchQuery,
    selectedStatus,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    paymentType,
  ]);

  // Reset cached list when filters meaningfully change (stable deps)
  useEffect(() => {
    lastNonEmptyBillsRef.current = [];
    hasLoadedOnceRef.current = false;
  }, [
    selectedAccount?.id,
    sens,
    appliedSearchQuery,
    selectedStatus,
    startDate?.toISOString(),
    endDate?.toISOString(),
    minAmount,
    maxAmount,
    paymentType,
  ]);

  /* =========================
   * Bills query (infinite pagination)
   * ========================= */
  const {
    data: billsData,
    isError: isBillsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useBills(billFilters);

  useRefetchOnFocus([
    {
      queryKey: billQueryKeys.bills(billFilters),
      enabled: !!billFilters.accountId,
    },
  ]);

  const bills: BillOfExchangeRecord[] = useMemo(() => {
    return billsData?.pages?.flatMap((p) => p.data ?? []) ?? [];
  }, [billsData]);

  // Keep last list ONLY when no filters
  useEffect(() => {
    if (!hasActiveFilters && bills.length > 0) {
      lastNonEmptyBillsRef.current = bills;
      hasLoadedOnceRef.current = true;
    }
  }, [bills, hasActiveFilters]);

  // Render list logic
  const billsForRender = useMemo(() => {
    if (hasActiveFilters) return bills;
    if (bills.length > 0) return bills;
    if (isFetching && hasLoadedOnceRef.current)
      return lastNonEmptyBillsRef.current;
    return bills;
  }, [bills, hasActiveFilters, isFetching]);

  // skeleton
  const showListSkeleton =
    isFetching && !isFetchingNextPage && billsForRender.length === 0;

  // ✅ Infinite scroll trigger
  const handleLoadMore = useCallback(() => {
    if (!hasNextPage) return;
    if (isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* =========================
   * Search debounce
   * ========================= */
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setAppliedSearchQuery(text);
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  /* =========================
   * Filter sheet
   * ========================= */
  const openFilterSheet = useCallback(() => {
    setTempSelectedStatus(selectedStatus);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempMinAmount(minAmount);
    setTempMaxAmount(maxAmount);
    setTempPaymentType(paymentType);
    filterSheetRef.current?.present();
  }, [selectedStatus, startDate, endDate, minAmount, maxAmount, paymentType]);

  const applyFilters = useCallback(() => {
    setSelectedStatus(tempSelectedStatus);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setMinAmount(tempMinAmount);
    setMaxAmount(tempMaxAmount);
    setPaymentType(tempPaymentType);
  }, [
    tempSelectedStatus,
    tempStartDate,
    tempEndDate,
    tempMinAmount,
    tempMaxAmount,
    tempPaymentType,
  ]);

  const clearFilters = useCallback(() => {
    // temp
    setTempSelectedStatus("all");
    setTempStartDate(null);
    setTempEndDate(null);
    setTempMinAmount("");
    setTempMaxAmount("");
    setTempPaymentType("all");

    // applied
    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);
    setMinAmount("");
    setMaxAmount("");
    setPaymentType("all");
    setSearchQuery("");
    setAppliedSearchQuery("");
  }, []);

  /* =========================
   * Bill modals
   * ========================= */
  const { data: billImageBase64, isLoading: isLoadingImage } = useBillImage(
    selectedBillId ?? "",
  );

  const selectedBill = useMemo(() => {
    return billsForRender.find((b) => b.id === selectedBillId) || null;
  }, [billsForRender, selectedBillId]);

  const handleOpenDetailModal = useCallback((billId: string) => {
    setSelectedBillId(billId);
    setShowDetailModal(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setTimeout(() => setSelectedBillId(null), 300);
  }, []);

  const handleOpenImageViewModal = useCallback(() => {
    setShowDetailModal(false);
    setTimeout(() => setShowImageViewModal(true), 300);
  }, []);

  const handleCloseImageViewModal = useCallback(() => {
    setShowImageViewModal(false);
    setTimeout(() => setShowDetailModal(true), 300);
  }, []);

  /* =========================
   * Tab change - reset filters
   * ========================= */
  const handleTabChange = useCallback((tab: "payer" | "encaisser") => {
    setActiveTab(tab);
    hasLoadedOnceRef.current = false;
    lastNonEmptyBillsRef.current = [];

    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);
    setMinAmount("");
    setMaxAmount("");
    setPaymentType("all");
    setSearchQuery("");
    setAppliedSearchQuery("");

    setTempSelectedStatus("all");
    setTempStartDate(null);
    setTempEndDate(null);
    setTempMinAmount("");
    setTempMaxAmount("");
    setTempPaymentType("all");
  }, []);

  /* =========================
   * Pagination Footer
   * ========================= */
  const ListFooter = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: Spacing.lg }}>
        <BillSkeleton count={1} />
      </View>
    );
  }, [isFetchingNextPage]);

  /* =========================
   * Friendly states
   * ========================= */
  if (isAccountsError) {
    return (
      <ApiErrorState
        title={t("common.error")}
        description={t("bills.accountsLoadingError")}
        onRetry={() => refetchAccounts()}
      />
    );
  }

  if (isBillsError) {
    return (
      <ApiErrorState
        title={t("common.error")}
        description={t("bills.loadingError")}
        onRetry={() => refetch()}
      />
    );
  }

  if (!isFetching && billsForRender.length === 0 && hasLoadedOnceRef.current) {
    return (
      <ScreenState
        variant="empty"
        title={t("bills.noBillsTitle")}
        description={t("bills.noBillsDescription")}
      />
    );
  }

  /* =========================
   * Render
   * ========================= */
  const showHeaderSkeleton = isAccountsLoading || !selectedAccount;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () =>
            showHeaderSkeleton ? (
              <BillsHeaderSkeleton insetsTop={insets.top} />
            ) : (
              <AccountDetailsHeader
                insetsTop={insets.top}
                account={selectedAccount}
                onBack={() => router.back()}
                onOpenPicker={() => setShowAccountModal(true)}
                styles={styles}
                showBalance={true}
                onToggleBalance={function (): void {
                  throw new Error("Function not implemented.");
                }}
              />
            ),
        }}
      />

      <View style={styles.body}>
        <BillsTabs
          activeTab={activeTab}
          onChange={handleTabChange}
          styles={styles}
        />

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search size={18} color={BankingColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={t("bills.searchPlaceholder")}
                placeholderTextColor={BankingColors.textLight}
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setAppliedSearchQuery("");
                  }}
                >
                  <X size={18} color={BankingColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                openFilterSheet();
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
                  {t("bills.filtersCount", { count: activeFilterChips.length })}
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
            {billsForRender.length} {t("bills.results") || "résultat(s)"}
          </TText>
        </View>

        {showListSkeleton ? (
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <LoansListSkeleton count={3} />
          </View>
        ) : (
          <FlashList
            data={billsForRender}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + Spacing.xl },
            ]}
            renderItem={({ item }) => (
              <BillCard
                bill={item}
                isPayer={activeTab === "payer"}
                styles={styles}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onPreview={() => handleOpenDetailModal(item.id)}
                isLoading={false}
              />
            )}
            ListFooterComponent={ListFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.6}
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
          />
        )}
      </View>

      <AccountSelectorBottomSheet
        visible={showAccountModal}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccount?.id}
        onSelect={(accountId) => {
          setSelectedAccountId(accountId);
          setShowAccountModal(false);
        }}
        onClose={() => setShowAccountModal(false)}
        title={t("bills.selectAccount")}
        unavailable={selectableAccounts.length === 0 && !isAccountsLoading}
      />

      <BillFilterSheet
        sheetRef={filterSheetRef}
        tempSelectedStatus={tempSelectedStatus}
        setTempSelectedStatus={setTempSelectedStatus}
        tempStartDate={tempStartDate}
        setTempStartDate={setTempStartDate}
        tempEndDate={tempEndDate}
        setTempEndDate={setTempEndDate}
        tempMinAmount={tempMinAmount}
        setTempMinAmount={setTempMinAmount}
        tempMaxAmount={tempMaxAmount}
        setTempMaxAmount={setTempMaxAmount}
        tempPaymentType={tempPaymentType}
        setTempPaymentType={setTempPaymentType}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <BillDetailModal
        visible={showDetailModal}
        bill={selectedBill}
        isPayer={activeTab === "payer"}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onClose={handleCloseDetailModal}
        onViewImage={handleOpenImageViewModal}
        billImageBase64={billImageBase64}
        isLoadingImage={isLoadingImage}
      />

      <BillImageViewModal
        visible={showImageViewModal}
        billNumber={selectedBill?.billNumber}
        imageBase64={billImageBase64}
        onClose={handleCloseImageViewModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  body: { flex: 1, backgroundColor: BankingColors.background },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: BankingColors.primary },
  tabText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
  },
  tabTextActive: { color: BankingColors.primary },

  customHeader: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerInner: { width: "100%", alignSelf: "center" },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backButton: {
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAccountCard: {
    flex: 1,
    backgroundColor: BankingColors.whiteTransparent15,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BankingColors.whiteTransparent20,
  },
  headerAccountContent: { flex: 1, paddingRight: Spacing.sm },
  headerAccountLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    marginBottom: Spacing.xs,
  },
  headerAccountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.whiteTransparent80,
    marginBottom: Spacing.xs,
  },
  headerBalance: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },

  searchSection: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
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
  searchInput: { flex: 1, color: BankingColors.text, fontSize: FontSize.base },
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
  appliedFiltersRow: { marginBottom: Spacing.md },
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
  chipsList: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
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

  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  billCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.card,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  billInfo: { flex: 1, minWidth: 0 },
  billNumber: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  beneficiary: { fontSize: FontSize.base, color: BankingColors.textSecondary },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.background,
    flexShrink: 0,
  },
  statusText: { fontSize: FontSize.sm, fontFamily: FontFamily.semibold },
  billDetails: { gap: Spacing.md, marginBottom: Spacing.lg },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: { fontSize: FontSize.base, color: BankingColors.textSecondary },
  detailValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
});
