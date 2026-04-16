import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TextInput,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building2,
  ChevronDown,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Search,
  X,
} from "lucide-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

import {
  BankingColors,
  BorderRadius,
  FontSize,
  Spacing,
  Shadow,
  FontFamily,
} from "@/constants";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";
import { horizontalScale, verticalScale } from "@/utils/scale";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { chequeQueryKeys, useChequeBookRequests } from "@/hooks/use-cheques";

import CustomHeader from "@/components/home/Notification/CustomHeader";
import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";
import TText from "@/components/TText";

import {
  SelectableAccount,
  toSelectableAccount,
} from "@/types/selectable-account";
import { CheckbookRequest } from "@/types/cheque.type";
import ChequebookRequestsFilterSheet, {
  ChequeStatus,
} from "@/components/menu/cheques/ChequebookRequestsFilterSheet";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

/** --------- STATUS CONFIG (UI badge) --------- */
const STATUS_CONFIG: Record<
  string,
  { color: string; icon: any; labelKey: string }
> = {
  PENDING: {
    color: "#F59E0B",
    icon: Clock,
    labelKey: "cheques.history.status.pending",
  },
  IN_PROGRESS: {
    color: "#3B82F6",
    icon: AlertCircle,
    labelKey: "cheques.history.status.inProgress",
  },
  COMPLETED: {
    color: "#10B981",
    icon: CheckCircle2,
    labelKey: "cheques.history.status.completed",
  },
  EXECUTED: {
    color: "#10B981",
    icon: CheckCircle2,
    labelKey: "cheques.history.status.confirmed",
  },
  REJECTED: {
    color: "#EF4444",
    icon: XCircle,
    labelKey: "cheques.history.status.rejected",
  },
};
// ✅ Pure function at module level — no hooks
const formatDate = (dateStr?: string, locale?: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(locale ?? "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
function getStatusConfig(status?: string) {
  const normalized = (status || "PENDING").toUpperCase();
  return STATUS_CONFIG[normalized] || STATUS_CONFIG.PENDING;
}

function safeLower(v?: string) {
  return (v || "").toString().toLowerCase();
}

function toDateOnlyTimestamp(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** --------- CARD --------- */
function RequestCard({
  request,
  t,
  locale,
}: {
  request: CheckbookRequest;
  t: (k: string, o?: any) => string;
  locale: string;
}) {
  const cfg = getStatusConfig(request.requestStatus);
  const Icon = cfg.icon;

  const requestNumber =
    (request as any).requestNumber ||
    (request as any).requestNo ||
    (request as any).reference ||
    request.id;

  const branch =
    request.branch?.designation ||
    request.branch?.code ||
    (request as any).branchDesignation ||
    "-";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <FileText size={20} color={BankingColors.primary} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>
            {t("cheques.history.requestNo")}
          </Text>
          <Text style={styles.subtitle}>
            {t("cheques.history.requestDate")}{" "}
            {formatDate(request.requestDate, locale)}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: cfg.color + "15" }]}>
          <Icon size={14} color={cfg.color} />
          <Text
            style={[styles.badgeText, { color: cfg.color }]}
            numberOfLines={1}
          >
            {t(cfg.labelKey)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>{t("cheques.history.status")}</Text>
          <Text style={styles.value}>{t(cfg.labelKey)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t("cheques.history.branch")}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {branch}
          </Text>
        </View>

        {(request.requestStatus || "").toUpperCase() === "REJECTED" && (
          <View style={styles.rejectedMessageBox}>
            <Text style={styles.rejectedMessageText}>
              {t("cheques.history.status.rejectedMessage")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ChequebookRequestsHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const filterSheetRef = useRef<BottomSheetModal>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  useRefetchOnFocus([
    {
      queryKey: chequeQueryKeys.chequeBookRequests(selectedAccountId ?? ""),
      enabled: !!selectedAccountId,
    },
  ]);

  /** Search */
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

  /** Filters (applied) */
  const [selectedStatus, setSelectedStatus] = useState<ChequeStatus>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  /** Filters (temp) */
  const [tempSelectedStatus, setTempSelectedStatus] =
    useState<ChequeStatus>("all");
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  /** accounts */
  const {
    data: accountsResponse,
    isLoading: isAccountsLoading,
    isError: isAccountsError,
    refetch: refetchAccounts,
  } = useCustomerAccounts();

  const selectableAccounts: SelectableAccount[] = useMemo(
    () => (accountsResponse?.data ?? []).map(toSelectableAccount),
    [accountsResponse?.data],
  );

  const selectedAccount = useMemo(
    () => selectableAccounts.find((a) => a.id === selectedAccountId) || null,
    [selectableAccounts, selectedAccountId],
  );

  useEffect(() => {
    if (!selectedAccountId && selectableAccounts.length > 0) {
      setSelectedAccountId(selectableAccounts[0].id);
    }
  }, [selectableAccounts, selectedAccountId]);

  /** requests by account */
  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    refetch,
    isRefetching,
  } = useChequeBookRequests(selectedAccountId || "");

  const requests = useMemo<CheckbookRequest[]>(
    () => requestsData?.data || [],
    [requestsData?.data],
  );

  /** handle search debounce */
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setAppliedSearchQuery(text.trim());
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  /** filtered + sorted newest first */
  const filteredRequests = useMemo(() => {
    const q = safeLower(appliedSearchQuery);

    const startTs = startDate
      ? new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
        ).getTime()
      : null;

    const endTs = endDate
      ? new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
        ).getTime()
      : null;

    return requests
      .filter((r) => {
        const statusOk =
          selectedStatus === "all" ||
          safeLower(r.requestStatus) === safeLower(selectedStatus);

        const requestNumber =
          (r as any).requestNumber ||
          (r as any).requestNo ||
          (r as any).reference ||
          r.id;

        const branch =
          r.branch?.designation ||
          r.branch?.code ||
          (r as any).branchDesignation ||
          "";

        const searchOk =
          !q ||
          safeLower(String(requestNumber)).includes(q) ||
          safeLower(String(branch)).includes(q);

        const reqTs = toDateOnlyTimestamp(r.requestDate);
        const dateOk =
          (!startTs || (reqTs !== null && reqTs >= startTs)) &&
          (!endTs || (reqTs !== null && reqTs <= endTs));

        return statusOk && searchOk && dateOk;
      })
      .sort((a, b) => {
        const aTs = toDateOnlyTimestamp(a.requestDate) ?? 0;
        const bTs = toDateOnlyTimestamp(b.requestDate) ?? 0;
        return bTs - aTs;
      });
  }, [requests, selectedStatus, appliedSearchQuery, startDate, endDate]);

  const hasActiveFilters = useMemo(() => {
    return (
      selectedStatus !== "all" ||
      startDate !== null ||
      endDate !== null ||
      appliedSearchQuery.trim() !== ""
    );
  }, [selectedStatus, startDate, endDate, appliedSearchQuery]);

  const openFilterSheet = useCallback(() => {
    setTempSelectedStatus(selectedStatus);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    filterSheetRef.current?.present();
  }, [selectedStatus, startDate, endDate]);

  const applyFilters = useCallback(() => {
    setSelectedStatus(tempSelectedStatus);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
  }, [tempSelectedStatus, tempStartDate, tempEndDate]);

  const clearFilters = useCallback(() => {
    setTempSelectedStatus("all");
    setTempStartDate(null);
    setTempEndDate(null);

    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);

    setSearchQuery("");
    setAppliedSearchQuery("");
  }, []);

  const handleSelectAccount = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setShowAccountModal(false);
  }, []);

  const isLoading =
    isAccountsLoading || (isRequestsLoading && !requests.length);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <FileText size={48} color={BankingColors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>{t("cheques.history.noRequests")}</Text>
      <Text style={styles.emptyDescription}>
        {t("cheques.history.noRequestsDescription")}
      </Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <TText tKey="cheques.createChequebook" style={styles.primaryBtnText} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cheques.history.title"
            />
          ),
        }}
      />

      <View
        style={[
          styles.content,
          isLarge && contentMaxWidth
            ? { alignSelf: "center", width: "100%", maxWidth: contentMaxWidth }
            : null,
        ]}
      >
        {/* ✅ Account selector ONLY (no filter icon here anymore) */}
        <View style={styles.accountBar}>
          <TText tKey="cheques.selectAccount" style={styles.selectorLabel} />

          <TouchableOpacity
            style={styles.accountPicker}
            onPress={() => setShowAccountModal(true)}
            activeOpacity={0.75}
          >
            {selectedAccount ? (
              <View style={styles.accountInfo}>
                <View style={styles.accountIconSmall}>
                  <Building2 size={18} color={BankingColors.primary} />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountName} numberOfLines={1}>
                    {selectedAccount.accountTitle}
                  </Text>
                  <Text style={styles.accountNumber} numberOfLines={1}>
                    {selectedAccount.ribFormatAccount}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.placeholder}>
                {isAccountsLoading
                  ? t("common.loading")
                  : t("cheques.selectAccount")}
              </Text>
            )}

            <ChevronDown size={20} color={BankingColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ✅ Search bar + Filter icon on same row (like the other screen) */}
        <View style={styles.searchFilterRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={BankingColors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t("cheques.history.searchPlaceholder")}
              placeholderTextColor={BankingColors.textLight}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setAppliedSearchQuery("");
                }}
                activeOpacity={0.8}
              >
                <X size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              hasActiveFilters && styles.filterBtnActive,
            ]}
            onPress={openFilterSheet}
            activeOpacity={0.85}
          >
            <Filter
              size={20}
              color={
                hasActiveFilters ? BankingColors.white : BankingColors.primary
              }
            />
          </TouchableOpacity>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BankingColors.primary} />
            <Text style={styles.loadingText}>{t("common.loading")}</Text>
          </View>
        ) : isAccountsError ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t("common.error")}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => refetchAccounts()}
            >
              <Text style={styles.retryText}>{t("common.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <RequestCard
                request={item}
                t={t}
                locale={selectedLanguage ?? undefined}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              filteredRequests.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[BankingColors.primary]}
                tintColor={BankingColors.primary}
              />
            }
          />
        )}
      </View>

      {/* account selector */}
      <AccountSelectorBottomSheet
        visible={showAccountModal}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccount?.id}
        onSelect={handleSelectAccount}
        onClose={() => setShowAccountModal(false)}
        title={t("cheques.selectAccount")}
        unavailable={selectableAccounts.length === 0 && !isAccountsLoading}
      />

      {/* filter sheet */}
      <ChequebookRequestsFilterSheet
        sheetRef={filterSheetRef}
        tempSelectedStatus={tempSelectedStatus}
        setTempSelectedStatus={setTempSelectedStatus}
        tempStartDate={tempStartDate}
        setTempStartDate={setTempStartDate}
        tempEndDate={tempEndDate}
        setTempEndDate={setTempEndDate}
        onApply={applyFilters}
        onClear={clearFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { flex: 1 },

  accountBar: {
    paddingHorizontal: horizontalScale(Spacing.lg),
    paddingTop: verticalScale(Spacing.md),
    paddingBottom: verticalScale(Spacing.md),
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },

  selectorLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs,
  },

  accountPicker: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    gap: Spacing.sm,
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  accountIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  accountDetails: { flex: 1, minWidth: 0 },
  accountName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  accountNumber: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
  },
  placeholder: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.textLight,
  },

  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: horizontalScale(Spacing.lg),
    paddingVertical: verticalScale(Spacing.md),
    gap: Spacing.md,
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: BankingColors.text,
    paddingVertical: 2,
  },

  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary,
  },
  filterBtnActive: {
    backgroundColor: BankingColors.primary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  loadingText: { fontSize: FontSize.md, color: BankingColors.textSecondary },

  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.white,
  },
  retryText: {
    color: BankingColors.text,
    fontFamily: FontFamily.semibold,
  },

  listContent: {
    padding: horizontalScale(Spacing.lg),
    paddingBottom: verticalScale(Spacing.lg),
    gap: Spacing.md,
  },
  listEmpty: { flexGrow: 1 },

  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
    maxWidth: 140,
  },
  badgeText: { fontSize: FontSize.xs, fontFamily: FontFamily.medium },

  cardBody: {
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },
  label: { fontSize: FontSize.sm, color: BankingColors.textSecondary },
  value: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
  },
  rejectedMessageBox: {
    marginTop: Spacing.sm,
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  rejectedMessageText: {
    fontSize: FontSize.sm,
    color: "#B91C1C",
    fontFamily: FontFamily.medium,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BankingColors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  primaryBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary,
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
});
