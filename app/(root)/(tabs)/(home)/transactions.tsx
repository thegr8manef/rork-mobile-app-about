import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Keyboard,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import {
  getAccountMovements,
  MovementsQueryParams,
  downloadAccountStatementBase64,
  AccountStatementReportType } from "@/services/account.api";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";

import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize,
  AvatarSize,
  ButtonHeight, FontFamily } from "@/constants";

import TransactionItem from "@/components/TransactionItem";
import TransactionSkeleton from "@/components/TransactionSkeleton";
import TText from "@/components/TText";
import { Receipt, Download, Share2 } from "lucide-react-native";
import DateCardPicker from "@/components/DateCardPicker";
import { useTranslation } from "react-i18next";
import { toSelectableAccount } from "@/types/selectable-account";

import CustomHeaderTransactions from "@/components/home/Transaction/CustomHeaderTransactions";
import TransactionsSearchBar from "@/components/home/Transaction/TransactionsSearchBar";
import TransactionsFilterSheet from "@/components/home/Transaction/TransactionsFilterSheet";
import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { useHaptic } from "@/utils/useHaptic";
import {
  savePdfToDownloads,
  saveExcelToDownloads,
  savePdfBase64ToAppDir,
  saveFileBase64ToAppDir } from "@/utils/savePdfBase64";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import useShowMessage from "@/hooks/useShowMessage";
import { Movement } from "@/types/banking";
import { requestStoragePermission } from "@/utils/mediaPermission";
import { horizontalScale } from "@/utils/scale";
import { formatBalance } from "@/utils/account-formatters";

const PAGE_SIZE = 9;

type ActiveTab = "mouvements" | "extraits";
type ExtraitFormat = "PDF" | "Excel";

const getSixMonthsAgo = (): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerLightHaptic } = useHaptic();
  const { showComplete } = useDownloadNotification();
  const { showMessageSuccess, showMessageError } = useShowMessage();

  const filterSheetRef = useRef<BottomSheetModal>(null);
  const [isAccountPickerVisible, setIsAccountPickerVisible] = useState(false);

  const { accountId } = useLocalSearchParams<{ accountId?: string }>();

  const [activeTab, setActiveTab] = useState<ActiveTab>("mouvements");

  const { data: accountsResponse, isLoading: isLoadingAccounts } =
    useCustomerAccounts();

  const accounts = useMemo(
    () => (accountsResponse?.data || []).map(toSelectableAccount),
    [accountsResponse?.data],
  );

  const [selectedAccount, setSelectedAccount] = useState<
    (typeof accounts)[0] | null
  >(null);

  const currentAccount = selectedAccount || accounts[0];

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const toggleBalance = () => setShowBalance((v) => !v);
  const [tempSelectedMonth, setTempSelectedMonth] = useState("all");
  const [tempMinAmount, setTempMinAmount] = useState("");
  const [tempMaxAmount, setTempMaxAmount] = useState("");

  const [extraitFormat, setExtraitFormat] = useState<ExtraitFormat>("PDF");

  const [extraitStartDate, setExtraitStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [extraitEndDate, setExtraitEndDate] = useState<Date>(new Date());

  const [savedFileUri, setSavedFileUri] = useState<string | null>(null);

  const minDate = useMemo(() => getSixMonthsAgo(), []);
  const maxDate = useMemo(() => new Date(), []);

  const formatDateParam = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const clampDate = useCallback(
    (date: Date): Date => {
      if (date < minDate) return minDate;
      if (date > maxDate) return maxDate;
      return date;
    },
    [minDate, maxDate],
  );

  const handleStartDateChange = useCallback(
    (date: Date) => {
      const clamped = clampDate(date);
      setExtraitStartDate(clamped);
      if (clamped > extraitEndDate) {
        setExtraitEndDate(clamped);
      }
      setSavedFileUri(null);
    },
    [clampDate, extraitEndDate],
  );

  const handleEndDateChange = useCallback(
    (date: Date) => {
      const clamped = clampDate(date);
      setExtraitEndDate(clamped);
      if (clamped < extraitStartDate) {
        setExtraitStartDate(clamped);
      }
      setSavedFileUri(null);
    },
    [clampDate, extraitStartDate],
  );

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!currentAccount?.id) throw new Error("No account selected");

      if (Platform.OS !== "web") {
        const { granted } = await requestStoragePermission();
        if (!granted) {
          console.log("[Extrait] Storage permission denied, blocking download");
          throw new Error("STORAGE_PERMISSION_DENIED");
        }
      }

      const reportType: AccountStatementReportType =
        extraitFormat === "PDF" ? "PDF" : "EXCEL";

      const base64 = await downloadAccountStatementBase64({
        accountId: currentAccount.id,
        startDate: formatDateParam(extraitStartDate),
        endDate: formatDateParam(extraitEndDate),
        reportType });

      const ext = reportType === "PDF" ? "pdf" : "xlsx";
      const mimeType =
        reportType === "PDF"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const fileName = `extrait_${currentAccount.id}_${formatDateParam(extraitStartDate)}_${formatDateParam(extraitEndDate)}.${ext}`;

      if (Platform.OS === "web") {
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = (globalThis as any).document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      let downloadUri: string;
      let appUri: string;

      if (reportType === "PDF") {
        downloadUri = await savePdfToDownloads(base64, fileName);
        appUri = await savePdfBase64ToAppDir(base64, fileName);
      } else {
        // Save to public Downloads (visible in file manager)
        downloadUri = await saveExcelToDownloads(base64, fileName);
        // Also save app-internal copy for sharing & opening
        appUri = await saveFileBase64ToAppDir(base64, fileName);
      }

      setSavedFileUri(appUri);

      showMessageSuccess("extraits.downloadSuccess");

      // Use the app-internal URI for the notification open action
      // (avoids getContentUriAsync failing on public storage paths)
      await showComplete(
        t("extraits.notificationTitle", "Extrait enregistré"),
        t(
          "extraits.notificationDesc",
          "L'extrait a été enregistré dans vos téléchargements.",
        ),
        appUri,
        mimeType,
      );
    },
    onError: (error: any) => {
      if (error?.message === "STORAGE_PERMISSION_DENIED") return;
      console.log("❌ [Extrait] Download failed:", error?.message ?? error);
      showMessageError("extraits.downloadError");
    } });

  const handleShareFile = useCallback(async () => {
    if (!savedFileUri) return;

    try {
      triggerLightHaptic();
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showMessageError("cheques.share.notAvailable");
        return;
      }

      const mimeType =
        extraitFormat === "PDF"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      await Sharing.shareAsync(savedFileUri, {
        mimeType,
        dialogTitle: t("extraits.shareTitle", "Partager l'extrait") });
    } catch (e) {
      console.log("[Extrait] share error:", e);
      showMessageError("common.tryAgainLater");
    }
  }, [savedFileUri, extraitFormat, triggerLightHaptic, showMessageError, t]);

  const monthNameKeys = [
    "transaction.filters.january",
    "transaction.filters.february",
    "transaction.filters.march",
    "transaction.filters.april",
    "transaction.filters.may",
    "transaction.filters.june",
    "transaction.filters.july",
    "transaction.filters.august",
    "transaction.filters.september",
    "transaction.filters.october",
    "transaction.filters.november",
    "transaction.filters.december",
  ];

  const months = useMemo(() => {
    const items: { key: string; label: string }[] = [
      { key: "all", label: t("transaction.filters.allMonths") },
    ];

    const base = new Date();
    base.setDate(1);
    base.setHours(0, 0, 0, 0);

    for (let i = 0; i < 6; i++) {
      const d = new Date(base);
      d.setMonth(base.getMonth() - i);

      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mm = String(m).padStart(2, "0");

      items.push({
        key: `${y}-${mm}`,
        label: `${t(monthNameKeys[m - 1])} ${y}` });
    }

    return items;
  }, [t]);

  const getDateRangeForMonth = (monthKey: string) => {
    if (monthKey === "all") return {};

    let year: number | null = null;
    let month: number | null = null;

    if (monthKey.includes("-")) {
      const [y, mm] = monthKey.split("-");
      const yy = Number(y);
      const m = Number(mm);
      if (Number.isFinite(yy) && Number.isFinite(m) && m >= 1 && m <= 12) {
        year = yy;
        month = m;
      }
    } else {
      const m = Number(monthKey);
      if (Number.isFinite(m) && m >= 1 && m <= 12) {
        year = new Date().getFullYear();
        month = m;
      }
    }

    if (!year || !month) return {};
    const lastDay = new Date(year, month, 0).getDate();
    const mm = String(month).padStart(2, "0");

    return {
      startDate: `${year}-${mm}-01`,
      endDate: `${year}-${mm}-${String(lastDay).padStart(2, "0")}` };
  };

  useEffect(() => {
    if (!accounts.length) return;

    if (accountId) {
      const found = accounts.find((a) => a.id === accountId);
      if (found) {
        setSelectedAccount(found);
        return;
      }
    }

    setSelectedAccount(accounts[0]);
  }, [accounts, accountId]);

const toNumberOrUndefined = (v: string): number | undefined => {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return undefined; // ✅ empty string → undefined, not 0
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

  const minAmountNum = useMemo(() => toNumberOrUndefined(minAmount), [minAmount]);
  const maxAmountNum = useMemo(() => toNumberOrUndefined(maxAmount), [maxAmount]);
const buildMovementsPath = (
  accountId: string,
  params: Record<string, any>,
) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });

  return `/api/accounts/${accountId}/movements?${qs.toString()}`;
};
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        "accountMovements",
        currentAccount?.id,
        selectedMonth,
        minAmount || "",
        maxAmount || "",
      ],
      initialPageParam: 1,
      enabled: !!currentAccount?.id,
  queryFn: ({ pageParam = 1 }) => {
  const params: MovementsQueryParams = {
    page: pageParam as number,
    limit: PAGE_SIZE,
    ...getDateRangeForMonth(selectedMonth),
    ...(minAmountNum !== undefined ? { minAmount: minAmountNum } : {}),
    ...(maxAmountNum !== undefined ? { maxAmount: maxAmountNum } : {}) } as any;
  const dateRange = getDateRangeForMonth(selectedMonth);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📅 selectedMonth  :", selectedMonth);
  console.log("📅 dateRange sent :", dateRange);  // ← vérifie startDate/endDate
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // 🔍 Better logs
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 [Movements Query] Params");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏦 accountId    :", currentAccount?.id);
  console.log("📄 page         :", params.page);
  console.log("📦 limit        :", params.limit);
  console.log("📅 selectedMonth:", selectedMonth);
  console.log("📅 dateRange    :", getDateRangeForMonth(selectedMonth));
  console.log("💰 minAmount    :", minAmountNum ?? "—");
  console.log("💰 maxAmount    :", maxAmountNum ?? "—");
  console.log("🔑 queryKey     :", [
    "accountMovements",
    currentAccount?.id,
    selectedMonth,
    minAmount || "",
    maxAmount || "",
  ]);
  console.log("📦 full params  :", JSON.stringify(params, null, 2));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
const accountId = currentAccount!.id;
const fullPath = buildMovementsPath(accountId, params);
console.log("🌐 full path    :", fullPath);

  return getAccountMovements(currentAccount!.id, params);
},
      getNextPageParam: (lastPage: any, pages) => {
        return lastPage?.data?.length === PAGE_SIZE
          ? pages.length + 1
          : undefined;
      },
staleTime: 0, // toujours refetch quand les params changent
gcTime: 1000 * 60 * 5 });

  const allMovements = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );
  // console.log("🚀 ~ TransactionsScreen ~ allMovements:", allMovements)

const transactions = useMemo(() => {
  return (allMovements as Movement[]).map((m, index) => ({
    movementNumber: String(m.movementNumber ?? ""), // keep 0 => "0"
    id: String(index ?? ""),
    accountId: currentAccount?.id || "",
     type: m.movementSide === "C" ? ("credit" as const) : ("debit" as const),
      amount:
        m.movementSide === "C"
          ? parseFloat(m.amount)
          : -parseFloat(m.amount),
    currency: m.currency?.alphaCode ?? "TND", // string فقط
    description: m.eventOperation ?? "",
    category: m.operationNature ?? "",
    ledgerDate: m.ledgerDate ?? "",
    valueDate: m.valueDate ?? "",
    status: "completed" as const,
    recipient: m.additionalDescription ?? undefined,
    reference: String(m.movementNumber ?? "") }));
}, [allMovements, currentAccount?.id]);


  const searchedTransactions = useMemo(
    () =>
      searchQuery
        ? transactions.filter((txn) =>
            txn.description.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : transactions,
    [transactions, searchQuery],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectAccount = useCallback(
    (accId: string) => {
      const account = accounts.find((acc) => acc.id === accId);
      if (account?.id !== currentAccount?.id) {
        setSelectedAccount(account || null);
        setSavedFileUri(null);
      }
      setIsAccountPickerVisible(false);
    },
    [accounts, currentAccount?.id],
  );

  const handleApplyFilters = useCallback(() => {
    Keyboard.dismiss()
    setSelectedMonth(tempSelectedMonth);
    setMinAmount(tempMinAmount);
    setMaxAmount(tempMaxAmount);
  }, [tempSelectedMonth, tempMinAmount, tempMaxAmount]);

  const handleClearFilters = useCallback(() => {
    setTempSelectedMonth("all");
    setTempMinAmount("");
    setTempMaxAmount("");

    setSelectedMonth("all");
    setMinAmount("");
    setMaxAmount("");
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (selectedMonth && selectedMonth !== "all") || minAmount || maxAmount,
    );
  }, [selectedMonth, minAmount, maxAmount]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (selectedMonth && selectedMonth !== "all") {
      const monthObj = months.find((m) => m.key === selectedMonth);
      chips.push({
        key: "month",
        label: `${t("common.month")}: ${monthObj?.label || selectedMonth}` });
    }
    if (minAmount) {
      chips.push({
        key: "min",
        label: `${t("common.minimum")}: ${minAmount}` });
    }
    if (maxAmount) {
      chips.push({
        key: "max",
        label: `${t("common.maximum")}: ${maxAmount}` });
    }
    return chips;
  }, [selectedMonth, minAmount, maxAmount, months, t]);

  const removeFilter = useCallback((key: string) => {
    if (key === "month") {
      setSelectedMonth("all");
      setTempSelectedMonth("all");
    }
    if (key === "min") {
      setMinAmount("");
      setTempMinAmount("");
    }
    if (key === "max") {
      setMaxAmount("");
      setTempMaxAmount("");
    }
  }, []);

  const maskAccountNumber = (number: string) => {
    if (!number) return "";
    const length = number.length;
    if (length <= 4) return number;
    const firstFour = number.substring(0, 4);
    const lastFour = number.substring(length - 4);
    const masked = "*".repeat(Math.min(length - 8, 16));
    return `${firstFour}${masked}${lastFour}`;
  };



  const handleTabChange = useCallback(
    (tab: ActiveTab) => {
      triggerLightHaptic();
      setActiveTab(tab);
    },
    [triggerLightHaptic],
  );

  const handleDownloadExtrait = useCallback(() => {
    triggerLightHaptic();
    setSavedFileUri(null);
    downloadMutation.mutate();
  }, [triggerLightHaptic, downloadMutation]);

  const renderMovementsTab = () => (
    <>
      <TransactionsSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onOpenFilters={() => {
          Keyboard.dismiss();
          filterSheetRef.current?.present();
        }}
        hasActiveFilters={hasActiveFilters}
        activeFilterChips={activeFilterChips}
        onRemoveFilter={removeFilter}
      />

      {isLoading || isLoadingAccounts ? (
        <View style={{ paddingHorizontal: horizontalScale(16) }}>
        <TransactionSkeleton count={8} />

        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + Spacing.xxxl,
            paddingHorizontal: 10 }}
          data={searchedTransactions}
          renderItem={({ item }) => (
            <TransactionItem
              //@ts-ignore
              transaction={item}
              onPress={() =>
                router.navigate({
                  pathname: "/transaction-details",
                  params: item })
              }
            />
          )}
          keyExtractor={(i) => i.id}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: Spacing.xl }}>
                <TransactionSkeleton count={3} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            allMovements.length === 0 ? (
              <View style={styles.emptyState}>
                <Receipt
                  size={AvatarSize.lg}
                  color={BankingColors.textLight}
                  strokeWidth={1.5}
                />
                <TText tKey="transaction.noFound" style={styles.emptyText} />
                <TText
                  tKey="transactions.transactionsWillAppear"
                  style={styles.emptySubtext}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <TText tKey="transactions.noResults" style={styles.emptyText} />
                <TText
                  tKey={
                    searchQuery
                      ? "transactions.adjustSearch"
                      : "transactions.adjustFilters"
                  }
                  style={styles.emptySubtext}
                />
              </View>
            )
          }
        />
      )}
    </>
  );

  const renderExtraitsTab = () => (
    <ScrollView
      style={styles.extraitsContainer}
      contentContainerStyle={[
        styles.extraitsContent,
        { paddingBottom: insets.bottom + Spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.extraitsTitleSection}>
        <TText style={styles.extraitsTitleText} tKey="extraits.title" />
        <View style={styles.extraitsTitleUnderline} />
      </View>

      <TText style={styles.extraitsDescription} tKey="extraits.description" />

      <TText style={styles.extraitsSectionLabel} tKey="extraits.selectFormat" />

      <View style={styles.formatSelector}>
        <TouchableOpacity
          style={[
            styles.formatOption,
            extraitFormat === "PDF" && styles.formatOptionActive,
          ]}
          onPress={() => {
            triggerLightHaptic();
            setExtraitFormat("PDF");
            setSavedFileUri(null);
          }}
          activeOpacity={0.7}
        >
          <TText
            style={[
              styles.formatOptionText,
              extraitFormat === "PDF" && styles.formatOptionTextActive,
            ]}
          >
            PDF
          </TText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.formatOption,
            extraitFormat === "Excel" && styles.formatOptionActive,
          ]}
          onPress={() => {
            triggerLightHaptic();
            setExtraitFormat("Excel");
            setSavedFileUri(null);
          }}
          activeOpacity={0.7}
        >
          <TText
            style={[
              styles.formatOptionText,
              extraitFormat === "Excel" && styles.formatOptionTextActive,
            ]}
          >
            Excel
          </TText>
        </TouchableOpacity>
      </View>

      <TText style={styles.extraitsSectionLabel} tKey="extraits.selectDate" />

      <View style={styles.dateRow}>
        <DateCardPicker
          label={t("extraits.startDate")}
          date={extraitStartDate}
          onDateChange={handleStartDateChange}
          pickerTitle={t("extraits.startDate")}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
        <DateCardPicker
          label={t("extraits.endDate")}
          date={extraitEndDate}
          onDateChange={handleEndDateChange}
          pickerTitle={t("extraits.endDate")}
          minimumDate={extraitStartDate}
          maximumDate={maxDate}
        />
      </View>

      {!savedFileUri ? (
        <TouchableOpacity
          style={[
            styles.downloadButton,
            downloadMutation.isPending && styles.downloadButtonDisabled,
          ]}
          onPress={handleDownloadExtrait}
          disabled={downloadMutation.isPending}
          activeOpacity={0.8}
        >
          {downloadMutation.isPending ? (
            <ActivityIndicator size="small" color={BankingColors.white} />
          ) : (
            <Download size={20} color={BankingColors.white} />
          )}
          <TText style={styles.downloadButtonText}>
            {downloadMutation.isPending
              ? t("extraits.downloading")
              : extraitFormat === "PDF"
                ? t("extraits.downloadPdf")
                : t("extraits.downloadExcel")}
          </TText>
        </TouchableOpacity>
      ) : (
        <View style={styles.postDownloadRow}>
          <TouchableOpacity
            style={[styles.downloadButton, styles.shareButton]}
            onPress={handleShareFile}
            activeOpacity={0.8}
          >
            <Share2 size={20} color={BankingColors.white} />
            <TText style={styles.downloadButtonText}>
              {t("extraits.share", "Partager")}
            </TText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.downloadButton, styles.downloadAgainButton]}
            onPress={handleDownloadExtrait}
            disabled={downloadMutation.isPending}
            activeOpacity={0.8}
          >
            {downloadMutation.isPending ? (
              <ActivityIndicator size="small" color={BankingColors.primary} />
            ) : (
              <Download size={20} color={BankingColors.primary} />
            )}
            <TText style={styles.downloadAgainText}>
              {t("extraits.downloadAgain", "Re-télécharger")}
            </TText>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeaderTransactions
              insetsTop={insets.top}
              account={currentAccount}
              onBack={() => router.back()}
              onOpenPicker={() => setIsAccountPickerVisible(true)}
              styles={styles}
              formatBalance={formatBalance}
              showBalance={showBalance}
              onToggleBalance={toggleBalance}
            />
          ) }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "mouvements" && styles.tabActive]}
          onPress={() => handleTabChange("mouvements")}
        >
          <TText
            style={[
              styles.tabText,
              activeTab === "mouvements" && styles.tabTextActive,
            ]}
            tKey="transactions.tabs.movements"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "extraits" && styles.tabActive]}
          onPress={() => handleTabChange("extraits")}
        >
          <TText
            style={[
              styles.tabText,
              activeTab === "extraits" && styles.tabTextActive,
            ]}
            tKey="transactions.tabs.extraits"
          />
        </TouchableOpacity>
      </View>

      {activeTab === "mouvements" ? renderMovementsTab() : renderExtraitsTab()}

      <TransactionsFilterSheet
        sheetRef={filterSheetRef}
        months={months}
        tempSelectedMonth={tempSelectedMonth}
        setTempSelectedMonth={setTempSelectedMonth}
        tempMinAmount={tempMinAmount}
        setTempMinAmount={setTempMinAmount}
        tempMaxAmount={tempMaxAmount}
        setTempMaxAmount={setTempMaxAmount}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <AccountSelectorBottomSheet
        visible={isAccountPickerVisible}
        accounts={accounts}
        selectedAccountId={currentAccount?.id}
        onSelect={handleSelectAccount}
        onClose={() => setIsAccountPickerVisible(false)}
        title={t("transactions.selectAccount")}
        unavailable={accounts.length === 0 && !isLoadingAccounts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },
  customHeader: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center" },
  headerAccountCard: {
    backgroundColor: BankingColors.whiteTransparent15,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BankingColors.whiteTransparent20 },
  headerAccountContent: {
    flex: 1 },
  headerAccountLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    marginBottom: 2 },
  headerAccountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.whiteTransparent80,
    marginBottom: Spacing.xs },
  headerBalance: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.white },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  tab: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent" },
  tabActive: {
    borderBottomColor: BankingColors.primary },
  tabText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: "#666666" },
  tabTextActive: {
    color: BankingColors.primary,
    fontFamily: FontFamily.bold },

  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40 },
  emptyText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md },
  emptySubtext: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: FontSize.xl },

  extraitsContainer: {
    flex: 1 },
  extraitsContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl },
  extraitsTitleSection: {
    marginBottom: Spacing.md },
  extraitsTitleText: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 6 },
  extraitsTitleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: BankingColors.primary,
    borderRadius: 2 },
  extraitsDescription: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl },
  extraitsSectionLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.md },
  formatSelector: {
    flexDirection: "row",
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: BankingColors.border },
  formatOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.md },
  formatOptionActive: {
    backgroundColor: BankingColors.white,
    ...Shadow.sm },
  formatOptionText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  formatOptionTextActive: {
    color: BankingColors.text,
    fontFamily: FontFamily.bold },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm },
  dateHint: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xl + Spacing.md,
    fontStyle: "italic" },

  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.md },
  downloadButtonDisabled: {
    opacity: 0.7 },
  downloadButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white },

  postDownloadRow: {
    gap: Spacing.md,
    marginTop: Spacing.md },
  shareButton: {
    backgroundColor: BankingColors.primary },
  downloadAgainButton: {
    backgroundColor: BankingColors.white,
    borderWidth: 1,
    borderColor: BankingColors.border },
  downloadAgainText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary } });