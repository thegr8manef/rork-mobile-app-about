import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BankingColors, gradientColors } from "@/constants/banking-colors";
import {
  ChevronLeft,
  Filter,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  useSchoolingFiles,
  useSchoolingTransferHistory,
} from "@/hooks/use-schooling";
import SchoolingFileSelectorBottomSheet from "@/components/SchoolingFileSelectorBottomSheet";
import SchoolingTransferFilterSheet, {
  TransferStatus,
} from "@/components/SchoolingTransferFilterSheet";
import { getCurrencyDecimals } from "@/utils/currency-helper";
import { formatBalance } from "@/utils/account-formatters";
import { FontFamily } from "@/constants";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

type ApiCurrency = {
  alphaCode?: string;
  numericCode?: string | number;
  designation?: string;
  numberOfDecimals?: number;
};

function normalizeStatus(s?: string) {
  return (s ?? "").toUpperCase().trim();
}

export function formatAmountWithCurrency(
  amountStr?: string | number,
  currency?: ApiCurrency,
) {
  const alpha = (currency?.alphaCode ?? "TND").toUpperCase().trim();
  return formatBalance(amountStr, alpha);
}

/** normalize backend date strings */
function parseBackendDate(input?: string) {
  if (!input) return null;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [dd, mm, yyyy] = input.split("/");
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(input)) {
    return new Date(input.replace(" ", "T"));
  }

  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getStatusColor(status?: string) {
  switch (normalizeStatus(status)) {
    case "EXECUTED":
      return "#10B981";
    case "INIT":
      return "#F59E0B";
    case "REJECTED":
      return "#EF4444";
    case "EXECUTING":
      return "#3B82F6";
    default:
      return BankingColors.textSecondary;
  }
}

export default function SchoolingTransferHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const fileSelectorRef = useRef<BottomSheetModal>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);

  const [selectedFolderId, setSelectedFolderId] = useState<string>("");

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TransferStatus>("all");

  const [tempSelectedMonth, setTempSelectedMonth] = useState<string>("all");
  const [tempMinAmount, setTempMinAmount] = useState("");
  const [tempMaxAmount, setTempMaxAmount] = useState("");
  const [tempSelectedStatus, setTempSelectedStatus] =
    useState<TransferStatus>("all");

  const { data: filesData, isLoading: isLoadingFiles } = useSchoolingFiles();
  const schoolingFiles = filesData?.data || [];

  const {
    data: historyInfinite,
    isLoading: isLoadingHistory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useSchoolingTransferHistory({
    schoolingFileId: selectedFolderId,
    limit: 10,
    enabled: !!selectedFolderId,
  });
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  function formatDateFR(dateStr?: string) {
    const d = parseBackendDate(dateStr);
    if (!d) return "—";
    return d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const transfers = useMemo(() => {
    const pages = historyInfinite?.pages ?? [];
    const all = pages.flatMap((p) => p.items ?? []);

    const seen = new Set<string>();
    return all.filter((x) => {
      const id = x?.id;
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [historyInfinite?.pages]);
  console.log("🚀 ~ SchoolingTransferHistoryScreen ~ transfers:", transfers);

  const filteredTransfers = useMemo(() => {
    const wantedStatus = normalizeStatus(selectedStatus);

    return transfers
      .filter((transfer) => {
        const dateObj = parseBackendDate((transfer as any).transferDate);
        const monthKey = dateObj
          ? String(dateObj.getMonth() + 1).padStart(2, "0")
          : null;

        const matchesMonth =
          selectedMonth === "all" || monthKey === selectedMonth;

        const amountN = Number((transfer as any).transferAmount);
        const matchesMinAmount =
          !minAmount ||
          (Number.isFinite(amountN) && amountN >= Number(minAmount));
        const matchesMaxAmount =
          !maxAmount ||
          (Number.isFinite(amountN) && amountN <= Number(maxAmount));

        const status = normalizeStatus((transfer as any).abtStatus);
        const matchesStatus = wantedStatus === "ALL" || status === wantedStatus;

        return (
          matchesMonth && matchesMinAmount && matchesMaxAmount && matchesStatus
        );
      })
      .sort((a, b) => {
        const dateA = parseBackendDate((a as any).transferDate)?.getTime() ?? 0;
        const dateB = parseBackendDate((b as any).transferDate)?.getTime() ?? 0;
        return dateB - dateA; // newest first
      });
  }, [transfers, selectedMonth, minAmount, maxAmount, selectedStatus]);

  const months = [
    { key: "all", label: t("months.all") },
    { key: "01", label: t("months.jan") },
    { key: "02", label: t("months.feb") },
    { key: "03", label: t("months.mar") },
    { key: "04", label: t("months.apr") },
    { key: "05", label: t("months.may") },
    { key: "06", label: t("months.jun") },
    { key: "07", label: t("months.jul") },
    { key: "08", label: t("months.aug") },
    { key: "09", label: t("months.sep") },
    { key: "10", label: t("months.oct") },
    { key: "11", label: t("months.nov") },
    { key: "12", label: t("months.dec") },
  ];

  const selectedFolder = schoolingFiles.find((f) => f.id === selectedFolderId);

  const handleApplyFilters = useCallback(() => {
    setSelectedMonth(tempSelectedMonth);
    setMinAmount(tempMinAmount);
    setMaxAmount(tempMaxAmount);
    setSelectedStatus(tempSelectedStatus);
  }, [tempSelectedMonth, tempMinAmount, tempMaxAmount, tempSelectedStatus]);

  const handleClearFilters = useCallback(() => {
    setTempSelectedMonth("all");
    setTempMinAmount("");
    setTempMaxAmount("");
    setTempSelectedStatus("all");

    setSelectedMonth("all");
    setMinAmount("");
    setMaxAmount("");
    setSelectedStatus("all");
  }, []);

  const handleConsulter = (transfer: any) => {
    const folder = schoolingFiles.find((f) => f.id === transfer.fileId);

    router.push({
      pathname: "/(root)/(tabs)/(menu)/schooling-transfer-detail",
      params: {
        id: transfer.id,
        schoolingFileId: transfer.fileId,
        transferMode: transfer.transferMode,
        transferType: transfer.transferType,
        amount: String(transfer.transferAmount ?? ""),
        currency: transfer.transferCurrency?.alphaCode || "TND",
        status: transfer.abtStatus,
        comment: transfer.comment !== null ? "-" : "-",
        executionDate: transfer.transferDate,
        feeType: transfer.feeType,
        attachment: "",
        studentName: folder?.studentName || transfer.studentFullName || "",
        fileRef: folder?.fileRef || transfer.fileRef || "",
        swiftMessage: transfer.swiftMessage || "",
        swiftStatus: transfer.swiftStatus || "",
      },
    });
  };

  const renderHeader = () => (
    <LinearGradient
      colors={gradientColors as any}
      style={[styles.customHeader, { paddingTop: insets.top + 10 }]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.headerFolderCard}
            onPress={() => fileSelectorRef.current?.present()}
            activeOpacity={0.9}
          >
            <View style={styles.headerFolderContent}>
              <TText style={styles.headerFolderLabel}>
                {selectedFolder
                  ? `${t("schooling.refNo")}${selectedFolder.fileRef}`
                  : t("schoolingHistory.selectFolder")}
              </TText>

              {selectedFolder && (
                <TText style={styles.headerStudentName}>
                  {selectedFolder.studentName}
                </TText>
              )}

              {selectedFolder && (
                <TText style={styles.headerSchoolName}>
                  {selectedFolder.studyInstitutionName}
                </TText>
              )}
            </View>

            <ChevronDown size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, header: renderHeader }} />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TText style={styles.searchText}>
            {filteredTransfers.length}{" "}
            {filteredTransfers.length > 1
              ? t("schoolingHistory.transfers")
              : t("schoolingHistory.transfer")}
          </TText>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setTempSelectedMonth(selectedMonth);
            setTempMinAmount(minAmount);
            setTempMaxAmount(maxAmount);
            setTempSelectedStatus(selectedStatus);
            filterSheetRef.current?.present();
          }}
        >
          <Filter size={20} color={BankingColors.primary} />
        </TouchableOpacity>
      </View>

      {isLoadingHistory || isLoadingFiles ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BankingColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTransfers}
          keyExtractor={(item: any, index) =>
            item?.id ?? `${item?.fileId ?? "x"}-${index}`
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: transfer }: any) => {
            const folder = schoolingFiles.find((f) => f.id === transfer.fileId);
            const statusKey = normalizeStatus(transfer.abtStatus);

            return (
              <TouchableOpacity
                style={styles.transferCard}
                onPress={() => handleConsulter(transfer)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: BankingColors.error + "20" },
                  ]}
                >
                  <ArrowUpRight size={20} color={BankingColors.error} />
                </View>

                <View style={styles.content}>
                  <View style={styles.mainInfo}>
                    <TText style={styles.description} numberOfLines={1}>
                      {transfer.transferType ||
                        t("schooling.schoolingTransfer")}
                    </TText>

                    <TText style={styles.category}>
                      {folder ? folder.studentName : transfer.fileId}
                    </TText>

                    <TText style={styles.recipient} numberOfLines={1}>
                      {transfer.transferMode} • {transfer.channel}
                    </TText>
                  </View>

                  <View style={styles.rightSection}>
                    <TText style={styles.amount}>
                      {formatAmountWithCurrency(
                        transfer.transferAmount,
                        transfer.transferCurrency,
                      )}
                    </TText>

                    <View style={styles.statusBadge}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(statusKey) },
                        ]}
                      />
                      <TText
                        style={[
                          styles.statusLabel,
                          { color: getStatusColor(statusKey) },
                        ]}
                      >
                        {t(`schoolingHistory.status.${statusKey}`, {
                          defaultValue: statusKey,
                        })}
                      </TText>
                    </View>

                    <TText style={styles.date}>
                      {formatDateFR(transfer.transferDate)}
                    </TText>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.2}
          onRefresh={() => refetch()}
          refreshing={false}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={BankingColors.primary} />
              </View>
            ) : null
          }
        />
      )}

      <SchoolingFileSelectorBottomSheet
        visible={false}
        files={schoolingFiles}
        selectedFileId={selectedFolderId}
        onSelect={(fileId) => {
          setSelectedFolderId(fileId);
          fileSelectorRef.current?.dismiss();
        }}
        onClose={() => fileSelectorRef.current?.dismiss()}
        title={t("schoolingHistory.selectFolder")}
      />

      <SchoolingTransferFilterSheet
        sheetRef={filterSheetRef}
        months={months}
        tempSelectedMonth={tempSelectedMonth}
        setTempSelectedMonth={setTempSelectedMonth}
        tempMinAmount={tempMinAmount}
        setTempMinAmount={setTempMinAmount}
        tempMaxAmount={tempMaxAmount}
        setTempMaxAmount={setTempMaxAmount}
        tempSelectedStatus={tempSelectedStatus}
        setTempSelectedStatus={setTempSelectedStatus}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <BottomSheetModal
        ref={fileSelectorRef}
        snapPoints={["80%"]}
        enablePanDownToClose
      >
        <View style={{ flex: 1, paddingTop: 20 }}>
          <SchoolingFileSelectorBottomSheet
            visible={true}
            files={schoolingFiles}
            selectedFileId={selectedFolderId}
            onSelect={(fileId) => {
              setSelectedFolderId(fileId);
              fileSelectorRef.current?.dismiss();
            }}
            onClose={() => fileSelectorRef.current?.dismiss()}
            title={t("schoolingHistory.selectFolder")}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  customHeader: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerFolderCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerFolderContent: { flex: 1 },
  headerFolderLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  headerStudentName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 2,
  },
  headerSchoolName: { fontSize: 11, color: "rgba(255, 255, 255, 0.7)" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: BankingColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BankingColors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingBottom: 20 },

  transferCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainInfo: { flex: 1, marginRight: 12 },
  description: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 2,
  },
  category: { fontSize: 12, color: BankingColors.textLight, marginBottom: 2 },
  recipient: { fontSize: 12, color: BankingColors.textSecondary },

  rightSection: { alignItems: "flex-end" },
  amount: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 4,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontFamily: FontFamily.medium },
  date: { fontSize: 12, color: BankingColors.textLight },
});
