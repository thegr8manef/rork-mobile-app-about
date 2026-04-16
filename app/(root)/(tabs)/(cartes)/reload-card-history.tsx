// app/(root)/(tabs)/(menu)/reload-card-history.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  RefreshCw,
  CreditCard,
  Calendar,
  ArrowLeft,
  Download,
  Share2,
  Eye,
  Inbox,
} from "lucide-react-native";
import { getRechargeCartePdfBase64 } from "@/services/account.api";
import {
  savePdfBase64ToAppDir,
  savePdfToDownloads,
} from "@/utils/savePdfBase64";
import * as Sharing from "expo-sharing";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import { requestStoragePermission } from "@/utils/mediaPermission";
import useShowMessage from "@/hooks/useShowMessage";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";

import TText from "@/components/TText";
import ApiErrorState from "@/components/Apierrorstate";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize } from "@/constants/sizes";

import { cardQueryKeys, useReloadCardHistory } from "@/hooks/use-card";
import type { ReloadCardHistoryItem } from "@/services/card.api";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { formatBalance } from "@/utils/account-formatters";
import ReloadHistorySkeleton from "@/components/cartes/ReloadHistorySkeleton";
import ReloadDetailSheet from "@/components/cartes/ReloadDetailSheet";

// ── Status filter ───────────────────────────────────────────────────

type StatusFilter =
  | "ALL"
  | "EXECUTED"
  | "EXECUTING"
  | "REJECTED"
  | "NOT_EXECUTED";

const STATUS_FILTERS: { key: StatusFilter; labelKey: string }[] = [
  { key: "ALL", labelKey: "reloadCard.filter.all" },
  { key: "EXECUTED", labelKey: "reloadCard.filter.executed" },
  { key: "EXECUTING", labelKey: "reloadCard.filter.executing" },
  { key: "REJECTED", labelKey: "reloadCard.filter.rejected" },
  { key: "NOT_EXECUTED", labelKey: "reloadCard.filter.notExecuted" },
];

// ── Helpers ─────────────────────────────────────────────────────────

const getStatusColor = (status?: string | null) => {
  switch (status) {
    case "EXECUTED":
      return BankingColors.success;
    case "EXECUTING":
      return BankingColors.warning;
    case "REJECTED":
      return BankingColors.error;
    default:
      return BankingColors.textSecondary;
  }
};

// ── Main Screen ─────────────────────────────────────────────────────

export default function ReloadCardHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const LOCALE_MAP: Record<string, string> = {
    fr: "fr-FR",
    en: "en-GB",
    ar: "ar-TN",
  };

  const formatDate = useCallback((dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    const locale = LOCALE_MAP[i18n.language] ?? "fr-FR";
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [i18n.language]);

  const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");
  const [selectedItem, setSelectedItem] =
    useState<ReloadCardHistoryItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [savedUris, setSavedUris] = useState<Record<string, string>>({});

  const { showComplete } = useDownloadNotification();
  const { showMessageError } = useShowMessage();

  useRefetchOnFocus([{ queryKey: cardQueryKeys.reloadHistory("all") }]);

  const {
    data: historyRes,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useReloadCardHistory("all");

  // ── Sort + filter ─────────────────────────────────────────────────

  const sortedHistory = useMemo(() => {
    const list = historyRes?.data ?? [];
    return [...list].sort((a, b) => {
      const aTime = a.executionDate ? new Date(a.executionDate).getTime() : 0;
      const bTime = b.executionDate ? new Date(b.executionDate).getTime() : 0;
      return bTime - aTime;
    });
  }, [historyRes?.data]);

  const filteredHistory = useMemo(() => {
    // console.log("activeFilter:", activeFilter);
    // console.log(
    //   "statuses:",
    //   sortedHistory.map((item) => item.status),
    // );

    if (activeFilter === "ALL") return sortedHistory;
    return sortedHistory.filter((item) => item.status === activeFilter);
  }, [sortedHistory, activeFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      ALL: sortedHistory.length,
      EXECUTED: 0,
      EXECUTING: 0,
      REJECTED: 0,
      NOT_EXECUTED: 0,
    };
    for (const item of sortedHistory) {
      const s = (item.status ?? "NOT_EXECUTED") as StatusFilter;
      if (s in counts) counts[s]++;
    }
    return counts;
  }, [sortedHistory]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleOpenDetail = useCallback((item: ReloadCardHistoryItem) => {
    setSelectedItem(item);
    setSheetVisible(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSheetVisible(false);
    setSelectedItem(null);
  }, []);

  const getStatusLabel = useCallback(
    (status?: string | null) => {
      switch (status) {
        case "EXECUTED":
          return t("reloadCard.status.executed");
        case "EXECUTING":
          return t("reloadCard.status.executing");
        case "REJECTED":
          return t("reloadCard.status.rejected");
        case "NOT_EXECUTED":
          return t("reloadCard.status.notExecuted");
        default:
          return status || "-";
      }
    },
    [t],
  );

  // Reset to ALL filter when the full list is empty so empty state is always consistent
  useEffect(() => {
    if (!isLoading && sortedHistory.length === 0 && activeFilter !== "ALL") {
      setActiveFilter("ALL");
    }
  }, [isLoading, sortedHistory.length]);

  const disableRefresh = isLoading || isFetching;

  // ── Inline download/share from list ───────────────────────────────

  const handleInlineDownload = useCallback(
    async (item: ReloadCardHistoryItem) => {
      if (!item.id || downloadingId) return;
      const { granted } = await requestStoragePermission();
      if (!granted) return;

      setDownloadingId(item.id);
      try {
        const base64 = await getRechargeCartePdfBase64(item.id);
        const downloadUri = await savePdfToDownloads(
          base64,
          `reload_${item.id}.pdf`,
        );
        const appUri = await savePdfBase64ToAppDir(
          base64,
          `reload_${item.id}.pdf`,
        );
        setSavedUris((prev) => ({ ...prev, [item.id]: appUri }));
        await showComplete(
          t("reloadCard.download.savedTitle"),
          t("reloadCard.download.savedDesc"),
          downloadUri,
        );
      } catch {
        showMessageError("pdf.downloadErrorMessage");
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadingId, t, showComplete, showMessageError],
  );

  const handleInlineShare = useCallback(
    async (item: ReloadCardHistoryItem) => {
      if (!item.id || downloadingId) return;

      setDownloadingId(item.id);
      try {
        const base64 = await getRechargeCartePdfBase64(item.id);
        const appUri = await savePdfBase64ToAppDir(
          base64,
          `reload_${item.id}.pdf`,
        );
        const available = await Sharing.isAvailableAsync();
        if (!available) return;
        await Sharing.shareAsync(appUri, {
          mimeType: "application/pdf",
          dialogTitle: t("reloadCard.share.dialogTitle"),
          UTI: "com.adobe.pdf",
        });
      } catch {
        showMessageError("pdf.downloadErrorMessage");
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadingId, t, showMessageError],
  );

  // ── Render item ───────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: ReloadCardHistoryItem }) => {
      const statusColor = getStatusColor(item.status);
      const isExecuted = item.status === "EXECUTED";
      const isItemDownloading = downloadingId === item.id;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleOpenDetail(item)}
          activeOpacity={0.7}
        >
          {/* Main row */}
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <CreditCard size={IconSize.md} color={BankingColors.primary} />
            </View>

            <View style={styles.cardInfo}>
              <TText
                style={styles.cardTitle}
                tKey="reloadCard.reloadCardTitle"
              />
              <View style={styles.cardMeta}>
                <Calendar size={12} color={BankingColors.textSecondary} />
                <TText style={styles.cardDate}>
                  {formatDate(item.executionDate)}
                </TText>
              </View>
              <TText style={styles.cardRib} numberOfLines={1}>
                RIB: {item.debtor?.rib ?? "-"}
              </TText>
              {!!item.cardNumber && (
                <TText style={styles.cardRib} numberOfLines={1}>
                  {t("reloadCard.history.cardNumber")}: {item.cardNumber}
                </TText>
              )}
            </View>

            <View style={styles.cardAmountCol}>
              <TText style={styles.cardAmount}>
                {formatBalance(item.amount, "TND")}
              </TText>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor + "15" },
                ]}
              >
                <TText style={[styles.statusText, { color: statusColor }]}>
                  {getStatusLabel(item.status)}
                </TText>
              </View>
            </View>
          </View>

          {/* Action row — only for EXECUTED items */}
          {isExecuted && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleOpenDetail(item);
                }}
                activeOpacity={0.7}
              >
                <Eye size={14} color={BankingColors.primary} />
                <TText style={styles.cardActionText}>{t("common.view")}</TText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cardActionBtn,
                  (isItemDownloading || !!downloadingId) &&
                    styles.cardActionDisabled,
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleInlineDownload(item);
                }}
                disabled={!!downloadingId}
                activeOpacity={0.7}
              >
                {isItemDownloading ? (
                  <ActivityIndicator
                    size="small"
                    color={BankingColors.primary}
                  />
                ) : (
                  <Download size={14} color={BankingColors.primary} />
                )}
                <TText style={styles.cardActionText}>
                  {t("common.download")}
                </TText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cardActionBtn,
                  (isItemDownloading || !!downloadingId) &&
                    styles.cardActionDisabled,
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleInlineShare(item);
                }}
                disabled={!!downloadingId}
                activeOpacity={0.7}
              >
                <Share2 size={14} color={BankingColors.primary} />
                <TText style={styles.cardActionText}>{t("common.share")}</TText>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [
      getStatusLabel,
      handleOpenDetail,
      handleInlineDownload,
      handleInlineShare,
      downloadingId,
      t,
    ],
  );

  // ── Empty state ───────────────────────────────────────────────────

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) return null;

    const isFiltered = activeFilter !== "ALL";

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Inbox size={48} color={BankingColors.textLight} />
        </View>

        <TText style={styles.emptyTitle}>
          {isFiltered
            ? t("reloadCard.history.emptyFilterTitle")
            : t("reloadCard.history.emptyTitle")}
        </TText>

        <TText style={styles.emptyDesc}>
          {isFiltered
            ? t("reloadCard.history.emptyFilterDesc")
            : t("reloadCard.history.emptyDesc")}
        </TText>

        {!isFiltered && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.navigate("/reload-card")}
            activeOpacity={0.7}
          >
            <TText style={styles.emptyButtonText}>
              {t("reloadCard.history.startReload")}
            </TText>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, activeFilter, t]);

  // ── Filter pills (header) ─────────────────────────────────────────
  // Hide filters entirely when there are no items — avoids confusion with empty state

  const ListHeaderComponent = useCallback(() => {
    if (sortedHistory.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScroll}
      >
        {STATUS_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = statusCounts[filter.key];

          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <TText
                style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive,
                ]}
                tKey={filter.labelKey}
              />
              {count > 0 && (
                <View
                  style={[
                    styles.filterCount,
                    isActive && styles.filterCountActive,
                  ]}
                >
                  <TText
                    style={[
                      styles.filterCountText,
                      isActive && styles.filterCountTextActive,
                    ]}
                  >
                    {String(count)}
                  </TText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }, [activeFilter, statusCounts, sortedHistory.length]);

  // ── Render ────────────────────────────────────────────────────────

  if (isError) {
    return (
      <ApiErrorState
        title={t("common.error")}
        description={t("reloadCard.history.loadError")}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
          headerShadowVisible: false,
          title: t("reloadCard.history.title"),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                if (disableRefresh) return;
                refetch();
              }}
              activeOpacity={0.7}
              style={{ paddingHorizontal: Spacing.md }}
            >
              <RefreshCw
                size={22}
                color={disableRefresh ? BankingColors.textLight : "#FFFFFF"}
                style={{ opacity: disableRefresh ? 0.5 : 1 }}
              />
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{ paddingHorizontal: Spacing.md }}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <ReloadHistorySkeleton count={5} />
        </View>
      ) : (
        <FlashList
          data={filteredHistory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xxxl,
            paddingTop: Spacing.md,
          }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Detail bottom sheet ── */}
      <ReloadDetailSheet
        visible={sheetVisible}
        item={selectedItem}
        initialSavedUri={
          selectedItem ? (savedUris[selectedItem.id] ?? null) : null
        }
        onClose={handleCloseDetail}
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  skeletonContainer: { paddingTop: Spacing.md },

  // ── Filter pills ──────────────────────────────────────────────────
  filterScroll: { flexGrow: 0, marginBottom: Spacing.lg },
  filterContainer: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
    backgroundColor: BankingColors.white,
    borderWidth: 1,
    borderColor: BankingColors.border,
    gap: Spacing.xs,
  },
  filterPillActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary,
  },
  filterPillText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  filterPillTextActive: { color: BankingColors.white },
  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BankingColors.border,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  filterCountActive: { backgroundColor: BankingColors.white + "30" },
  filterCountText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold,
    color: BankingColors.textSecondary,
  },
  filterCountTextActive: { color: BankingColors.white },

  // ── Card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  cardDate: { fontSize: FontSize.sm, color: BankingColors.textSecondary },
  cardRib: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: Spacing.xs,
  },
  cardAmountCol: { alignItems: "flex-end" },
  cardAmount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },

  // ── Card actions ──────────────────────────────────────────────────
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.xl,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    marginHorizontal: Spacing.md,
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  cardActionText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },
  cardActionDisabled: { opacity: 0.4 },

  // ── Empty state ───────────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    paddingTop: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BankingColors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  emptyButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
});
