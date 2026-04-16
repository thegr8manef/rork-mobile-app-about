import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";

import { formatBalance } from "@/utils/account-formatters";
import {
  BankingColors,
  BorderRadius,
  FontSize,
  IconSize,
  Spacing,
  FontFamily,
} from "@/constants";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import {
  useCheques,
  useChequeImage,
  chequeQueryKeys,
} from "@/hooks/use-cheques";

import AccountDetailsHeader from "@/components/home/AccountDetail/AccountDetailsHeader";
import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";

import ChequeCard from "@/components/menu/cheques/ChequeCard";
import ChequesTabs from "@/components/menu/cheques/ChequesTabs";
import ChequeSkeleton from "@/components/menu/cheques/ChequeSkeleton";
import ChequeFilterSheet, {
  ChequeStatus,
} from "@/components/menu/cheques/ChequeFilterSheet";

import {
  SelectableAccount,
  toSelectableAccount,
} from "@/types/selectable-account";
import { CheckRecord, ChequeFilterParams } from "@/types/cheque.type";

import TText from "@/components/TText";
import ApiErrorState from "@/components/Apierrorstate";
import ScreenState from "@/components/ScreenState";
import ChequeDetailModal from "@/components/menu/cheques/Chequedetailmodal";
import ChequeImageViewModal from "@/components/menu/cheques/Chequeimageviewmodal";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

type TabKey = "payer" | "encaisser";

type TabFilters = {
  searchQuery: string; // UI typing text
  appliedSearchQuery: string; // debounced text used by API
  selectedStatus: ChequeStatus;
  startDate: Date | null;
  endDate: Date | null;
  minAmount: string;
  maxAmount: string;
};

const initialTabFilters: Record<TabKey, TabFilters> = {
  payer: {
    searchQuery: "",
    appliedSearchQuery: "",
    selectedStatus: "all",
    startDate: null,
    endDate: null,
    minAmount: "",
    maxAmount: "",
  },
  encaisser: {
    searchQuery: "",
    appliedSearchQuery: "",
    selectedStatus: "all",
    startDate: null,
    endDate: null,
    minAmount: "",
    maxAmount: "",
  },
};

export default function ChequesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // ✅ Moved to top level — fixes "Rendered more hooks than during the previous render" error
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const [activeTab, setActiveTab] = useState<TabKey>("payer");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  // Modal states
  const [selectedChequeId, setSelectedChequeId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImageViewModal, setShowImageViewModal] = useState(false);

  /** ✅ per-tab filters */
  const [filtersByTab, setFiltersByTab] =
    useState<Record<TabKey, TabFilters>>(initialTabFilters);

  const currentFilters = filtersByTab[activeTab];

  /** Bottom sheet temp states */
  const [tempSelectedStatus, setTempSelectedStatus] =
    useState<ChequeStatus>("all");
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [tempMinAmount, setTempMinAmount] = useState("");
  const [tempMaxAmount, setTempMaxAmount] = useState("");

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);

  // ✅ prevent blinking: keep last non-empty list while background fetch happens
  const hasLoadedOnceRef = useRef(false);
  const lastNonEmptyChequesRef = useRef<CheckRecord[]>([]);

  /** ✅ pending state to show skeleton INSTEAD OF list when any filter changes */
  const [isFilterPending, setIsFilterPending] = useState(false);

  const sens = activeTab === "payer" ? "D" : "C";

  const formatDateForApi = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split("T")[0];
  };

  const getOutcomeFilter = (status: ChequeStatus): string | undefined => {
    if (status === "all") return undefined;
    return status;
  };

  /* ---------- ACCOUNTS ---------- */
  const { data: accountsResponse, isLoading: isAccountsLoading } =
    useCustomerAccounts();

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

  /**
   * ✅ Display RIB in header instead of account number
   * We override common "number" fields that AccountDetailsHeader might use.
   */
  const headerAccount = useMemo(() => {
    if (!selectedAccount) return selectedAccount;

    const rib =
      (selectedAccount as any).rib ??
      (selectedAccount as any).RIB ??
      (selectedAccount as any).iban ??
      (selectedAccount as any).IBAN ??
      (selectedAccount as any).accountRib ??
      (selectedAccount as any).accountIban;

    if (!rib) return selectedAccount;

    return {
      ...selectedAccount,
      // common fields that headers often display
      accountNumber: rib,
      number: rib,
      rib,
      iban: rib,
    } as any;
  }, [selectedAccount]);

  /** active filters indicator */
  const hasActiveFilters = useMemo(() => {
    return (
      currentFilters.selectedStatus !== "all" ||
      currentFilters.startDate !== null ||
      currentFilters.endDate !== null ||
      currentFilters.minAmount !== "" ||
      currentFilters.maxAmount !== "" ||
      currentFilters.appliedSearchQuery.trim() !== ""
    );
  }, [
    currentFilters.selectedStatus,
    currentFilters.startDate,
    currentFilters.endDate,
    currentFilters.minAmount,
    currentFilters.maxAmount,
    currentFilters.appliedSearchQuery,
  ]);

  /* ---------- CHEQUES FILTERS ---------- */
  const chequeFilters: Omit<ChequeFilterParams, "page" | "limit"> =
    useMemo(() => {
      const filters: Omit<ChequeFilterParams, "page" | "limit"> = {
        accountIds: selectedAccount?.id,
        sens,
      };

      if (currentFilters.appliedSearchQuery.trim()) {
        filters.chequeNumber = currentFilters.appliedSearchQuery.trim();
      }

      const outcomeFilter = getOutcomeFilter(currentFilters.selectedStatus);
      if (outcomeFilter) filters.outcome = outcomeFilter;

      const startDateStr = formatDateForApi(currentFilters.startDate);
      if (startDateStr) filters.startDate = startDateStr;

      const endDateStr = formatDateForApi(currentFilters.endDate);
      if (endDateStr) filters.endDate = endDateStr;

      if (currentFilters.minAmount) {
        const min = parseFloat(currentFilters.minAmount);
        if (!isNaN(min)) filters.minAmount = min;
      }

      if (currentFilters.maxAmount) {
        const max = parseFloat(currentFilters.maxAmount);
        if (!isNaN(max)) filters.maxAmount = max;
      }

      return filters;
    }, [
      selectedAccount?.id,
      sens,
      currentFilters.appliedSearchQuery,
      currentFilters.selectedStatus,
      currentFilters.startDate,
      currentFilters.endDate,
      currentFilters.minAmount,
      currentFilters.maxAmount,
    ]);

  /* ---------- CHEQUES ---------- */
  const {
    data: chequesData,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isError,
  } = useCheques(chequeFilters);

  useRefetchOnFocus([
    {
      queryKey: chequeQueryKeys.cheques(chequeFilters),
      enabled: !!chequeFilters.accountIds,
    },
  ]);

  useEffect(() => {}, [
    activeTab,
    selectedAccount?.id,
    chequeFilters,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    chequesData?.pages,
  ]);

  useEffect(() => {
    if (!isFetching) {
      setIsFilterPending(false);
    }
  }, [isFetching]);

  const cheques: CheckRecord[] = useMemo(() => {
    if (!chequesData?.pages) return [];
    return chequesData.pages.flatMap((page) => page.data);
  }, [chequesData?.pages]);

  // keep last non-empty list
  useEffect(() => {
    if (cheques.length > 0) {
      lastNonEmptyChequesRef.current = cheques;
      hasLoadedOnceRef.current = true;
    }
  }, [cheques]);

  const chequesForRender = useMemo(() => {
    if (cheques.length > 0) return cheques;
    if (isFetching && hasLoadedOnceRef.current)
      return lastNonEmptyChequesRef.current;
    return cheques;
  }, [cheques, isFetching]);

  // skeleton only on first load
  const showFirstLoadSkeleton =
    isFetching &&
    !isFetchingNextPage &&
    chequesForRender.length === 0 &&
    !hasLoadedOnceRef.current;

  /** ✅ Skeleton should replace list whenever:
   * - first load
   * - OR user applied any filter and we are pending/fetching
   */
  const showFilteringSkeleton =
    !showFirstLoadSkeleton &&
    (isFilterPending || (isFetching && hasLoadedOnceRef.current));

  /* ---------- CHEQUE IMAGE ---------- */
  const { data: chequeImageBase64, isLoading: isLoadingImage } = useChequeImage(
    selectedChequeId ?? "",
  );

  const selectedChequeRaw = useMemo(() => {
    return chequesForRender.find((c) => c.id === selectedChequeId) || null;
  }, [chequesForRender, selectedChequeId]);

  /**
   * ✅ Hide "N° demande" by removing likely fields.
   * Works if card/modal render this row conditionally when value exists.
   */
  const sanitizeCheque = useCallback((c: CheckRecord | null) => {
    if (!c) return null;
    const clone: any = { ...c };

    // Common field names teams use for "request number"
    delete clone.requestNumber;
    delete clone.requestNo;
    delete clone.demandeNumber;
    delete clone.demandeNo;
    delete clone.numeroDemande;
    delete clone.numDemande;
    delete clone.requestId;
    delete clone.demandeId;

    return clone as CheckRecord;
  }, []);

  const selectedCheque = useMemo(
    () => sanitizeCheque(selectedChequeRaw),
    [sanitizeCheque, selectedChequeRaw],
  );

  const handleOpenDetailModal = useCallback((chequeId: string) => {
    setSelectedChequeId(chequeId);
    setShowDetailModal(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setTimeout(() => setSelectedChequeId(null), 300);
  }, []);

  const handleOpenImageViewModal = useCallback(() => {
    setShowDetailModal(false);
    setTimeout(() => setShowImageViewModal(true), 300);
  }, []);

  const handleCloseImageViewModal = useCallback(() => {
    setShowImageViewModal(false);
    setTimeout(() => setShowDetailModal(true), 300);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /** ✅ Search triggers filter pending (shows skeleton instead of list) */
  const handleSearchChange = useCallback(
    (text: string) => {
      setIsFilterPending(true);

      setFiltersByTab((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], searchQuery: text },
      }));

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      searchTimeoutRef.current = setTimeout(() => {
        setFiltersByTab((prev) => ({
          ...prev,
          [activeTab]: { ...prev[activeTab], appliedSearchQuery: text },
        }));
      }, 500);
    },
    [activeTab],
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  /** Open filter sheet (load temp values from current tab) */
  const openFilterSheet = useCallback(() => {
    setTempSelectedStatus(currentFilters.selectedStatus);
    setTempStartDate(currentFilters.startDate);
    setTempEndDate(currentFilters.endDate);
    setTempMinAmount(currentFilters.minAmount);
    setTempMaxAmount(currentFilters.maxAmount);
    filterSheetRef.current?.present();
  }, [
    currentFilters.selectedStatus,
    currentFilters.startDate,
    currentFilters.endDate,
    currentFilters.minAmount,
    currentFilters.maxAmount,
  ]);

  /** Apply sheet filters to current tab only (triggers skeleton) */
  const applyFilters = useCallback(() => {
    setIsFilterPending(true);

    setFiltersByTab((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        selectedStatus: tempSelectedStatus,
        startDate: tempStartDate,
        endDate: tempEndDate,
        minAmount: tempMinAmount,
        maxAmount: tempMaxAmount,
      },
    }));

    filterSheetRef.current?.dismiss();
  }, [
    activeTab,
    tempSelectedStatus,
    tempStartDate,
    tempEndDate,
    tempMinAmount,
    tempMaxAmount,
  ]);

  /** Clear sheet filters in current tab only (triggers skeleton) */
  const clearFilters = useCallback(() => {
    setIsFilterPending(true);

    setTempSelectedStatus("all");
    setTempStartDate(null);
    setTempEndDate(null);
    setTempMinAmount("");
    setTempMaxAmount("");

    setFiltersByTab((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        searchQuery: "",
        appliedSearchQuery: "",
        selectedStatus: "all",
        startDate: null,
        endDate: null,
        minAmount: "",
        maxAmount: "",
      },
    }));

    filterSheetRef.current?.dismiss();
  }, [activeTab]);

  /** Clear search only (triggers skeleton) */
  const clearSearchOnly = useCallback(() => {
    setIsFilterPending(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setFiltersByTab((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        searchQuery: "",
        appliedSearchQuery: "",
      },
    }));
  }, [activeTab]);

  /** Tab switch changes sens => triggers skeleton */
  const handleChangeTab = useCallback((tab: TabKey) => {
    setIsFilterPending(true);
    setActiveTab(tab);
  }, []);

  /** Account switch changes accountIds => triggers skeleton */
  const handleSelectAccount = useCallback((accountId: string) => {
    setIsFilterPending(true);
    setSelectedAccountId(accountId);
    setShowAccountModal(false);
  }, []);

  // ✅ No longer calls a hook inside — uses selectedLanguage from top-level
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      selectedLanguage ?? undefined,
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
  };

  /* =========================
   * FRIENDLY STATES (keep header visible)
   * ========================= */
  if (isAccountsLoading || !selectedAccount || !headerAccount) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BankingColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <AccountDetailsHeader
              insetsTop={insets.top}
              account={headerAccount}
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

      <ChequesTabs
        activeTab={activeTab}
        onChange={handleChangeTab}
        styles={styles}
      />

      {/* ✅ Count for active tab only */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {cheques.length + " "}
          {t("cheques.payer")}
        </Text>
      </View>

      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color={BankingColors.textSecondary} />

          <TextInput
            style={styles.searchInput}
            placeholder={t("cheques.filter.searchPlaceholder")}
            placeholderTextColor={BankingColors.textLight}
            value={currentFilters.searchQuery}
            onChangeText={handleSearchChange}
          />

          {currentFilters.searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearchOnly}>
              <X size={18} color={BankingColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            hasActiveFilters && styles.filterButtonActive,
          ]}
          onPress={openFilterSheet}
          activeOpacity={0.8}
        >
          <SlidersHorizontal
            size={24}
            color={
              hasActiveFilters ? BankingColors.white : BankingColors.primary
            }
          />
        </TouchableOpacity>
      </View>

      {/* ✅ LIST AREA: skeleton INSTEAD OF list when filtering */}
      {showFirstLoadSkeleton || showFilteringSkeleton ? (
        <View style={styles.container}>
          <ChequeSkeleton count={3} />
        </View>
      ) : (
        <FlashList
          data={chequesForRender}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          renderItem={({ item }) => {
            const chequeForCard = sanitizeCheque(item);

            return (
              <ChequeCard
                cheque={chequeForCard as CheckRecord}
                isPayer={activeTab === "payer"}
                styles={styles}
                formatCurrency={formatBalance}
                formatDate={formatDate}
                onPreview={() => handleOpenDetailModal(item.id)}
                isLoading={false}
              />
            );
          }}
          ListEmptyComponent={
            isError ? (
              <ApiErrorState
                title={t("common.error")}
                description={t("cheques.loadingError")}
                onRetry={() => refetch()}
              />
            ) : (
              <ScreenState
                variant="empty"
                title={t("cheques.noChequesTitle")}
                description={t("cheques.noChequesDescription")}
              />
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={BankingColors.primary} />
                <TText tKey="common.loading" style={styles.loadingMoreText} />
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
        />
      )}

      <AccountSelectorBottomSheet
        visible={showAccountModal}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccount?.id}
        onSelect={handleSelectAccount}
        onClose={() => setShowAccountModal(false)}
        title={t("cheques.selectAccount")}
        unavailable={selectableAccounts.length === 0 && !isAccountsLoading}
      />

      <ChequeFilterSheet
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
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {/* ===== CHEQUE DETAIL MODAL ===== */}
      <ChequeDetailModal
        visible={showDetailModal}
        cheque={selectedCheque}
        isPayer={activeTab === "payer"}
        formatCurrency={formatBalance}
        formatDate={formatDate}
        onClose={handleCloseDetailModal}
        onViewImage={handleOpenImageViewModal}
        chequeImageBase64={chequeImageBase64}
        isLoadingImage={isLoadingImage}
      />

      {/* ===== CHEQUE IMAGE VIEW MODAL ===== */}
      <ChequeImageViewModal
        visible={showImageViewModal}
        chequeNumber={selectedCheque?.checkNumber}
        imageBase64={chequeImageBase64}
        onClose={handleCloseImageViewModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },

  customHeader: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerInner: {
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
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
  headerAccountContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  headerAccountLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    marginBottom: Spacing.xs,
  },
  headerAccountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.white,
    marginBottom: Spacing.xs,
  },
  headerBalance: {
    fontSize: FontSize.xl + 2,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },

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
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: BankingColors.primary,
  },
  tabText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: "#666666",
  },
  tabTextActive: {
    color: BankingColors.primary,
    fontFamily: FontFamily.bold,
  },

  /** ✅ Count row (single line) */
  countRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  countText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.semibold,
  },

  searchFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: BankingColors.text,
    paddingVertical: Spacing.xs,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary,
  },
  filterButtonActive: {
    backgroundColor: BankingColors.primary,
  },

  content: {
    padding: Spacing.lg,
  },

  loadingMore: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingMoreText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },

  chequeCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg + 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chequeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  chequeInfo: {
    flex: 1,
    minWidth: 0,
  },
  chequeNumberLabel: {
    fontSize: FontSize.sm + 1,
    color: "#595959",
    marginBottom: Spacing.xs,
  },
  chequeNumber: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.lg,
    flexShrink: 0,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
  },

  chequeDetails: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    gap: Spacing.md,
  },
  detailLabel: {
    fontSize: FontSize.base,
    color: "#595959",
    flexShrink: 0,
    maxWidth: "45%",
  },
  detailValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    flex: 1,
    flexWrap: "wrap",
    textAlign: "right" as const,
  },
});
