// app/(root)/(tabs)/(factures)/biller-payment-history.tsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity, // ✅ NEW — needed for onPress on cards
} from "react-native";
import { Stack } from "expo-router";
import { Filter, Receipt, Eye, Download, Share2 } from "lucide-react-native";
import { getFacturePdfBase64 } from "@/services/account.api";
import {
  savePdfBase64ToAppDir,
  savePdfToDownloads,
} from "@/utils/savePdfBase64";
import * as Sharing from "expo-sharing";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import { requestStoragePermission } from "@/utils/mediaPermission";
import useShowMessage from "@/hooks/useShowMessage";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/auth-store";
import TText from "@/components/TText";
import PaymentSkeleton from "@/components/factures/PaymentSkeleton";
import PaymentHistoryFilters from "@/components/factures/PaymentHistoryFilters";
import PaymentDetailSheet from "@/components/factures/PaymentDetailSheet"; // ✅ NEW

import { BankingColors } from "@/constants/banking-colors";
import { AvatarSize, BorderRadius } from "@/constants/sizes";
import { FontSize, Shadow, Spacing, FontFamily } from "@/constants";

import { Button, ButtonIcon } from "@/components/ui/button";
import { BillPayment } from "@/types/bill-payment.types";

import {
  useFetchAllBillers,
  useGetAllPaymentsInfinite,
  flattenInfinitePayments,
} from "@/hooks/use-billers";
import { formatBalance } from "@/utils/account-formatters";
import { normalizePaymentsWithDebug } from "@/utils/paymentsDebug";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "../(menu)/language";

export default function BillerPaymentHistoryScreen() {
  const { authState } = useAuth();
  const { t } = useTranslation();
  const { data: billers } = useFetchAllBillers();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({
    billerId: null,
    status: null,
    minAmount: null,
    maxAmount: null,
    startDate: null,
    endDate: null,
    limit: 10,
  });
  const [tempFilters, setTempFilters] = useState(filters);

  // ✅ NEW — detail sheet state
  const [selectedPayment, setSelectedPayment] = useState<BillPayment | null>(
    null,
  );
  const [sheetVisible, setSheetVisible] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [savedUris, setSavedUris] = useState<Record<string, string>>({});

  const { showComplete } = useDownloadNotification();
  const { showMessageError } = useShowMessage();

  const LIMIT = 10;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useGetAllPaymentsInfinite({
    limit: LIMIT,
    keyExtra: { scope: "history", ...filters },
  });

  const payments: BillPayment[] = useMemo(() => {
    const flat = flattenInfinitePayments(data as any) as any[];
    return normalizePaymentsWithDebug("HISTORY", flat, {
      dedupeKey: "id_or_reference",
    });
  }, [data]);

  const billersMemo = useMemo(
    () => (Array.isArray(billers) ? billers : []),
    [billers],
  );

  const getBillerById = useMemo(
    () => (billerId: string) =>
      billersMemo.find((b: any) => String(b?.id) === String(billerId)),
    [billersMemo],
  );

  // ✅ NEW — get biller label for selected payment
  const selectedBillerLabel = useMemo(() => {
    if (!selectedPayment?.billerId) return undefined;
    const biller = getBillerById(String(selectedPayment.billerId));
    return biller?.billerLabel;
  }, [selectedPayment, getBillerById]);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusTextKey = (status: "INIT" | "PAID" | "REJECTED") => {
    switch (status) {
      case "PAID":
        return "bills.success";
      case "REJECTED":
        return "bills.failed";
      case "INIT":
      default:
        return "bills.inProgress";
    }
  };

  const getStatusColor = (status: "INIT" | "PAID" | "REJECTED") => {
    switch (status) {
      case "PAID":
        return BankingColors.success;
      case "REJECTED":
        return BankingColors.error;
      case "INIT":
      default:
        return BankingColors.warning;
    }
  };

  // ✅ NEW — handlers
  const handleOpenDetail = useCallback((payment: BillPayment) => {
    setSelectedPayment(payment);
    setSheetVisible(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSheetVisible(false);
    setSelectedPayment(null);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setFilters(tempFilters);
    setShowFilters(false);
    refetch();
  }, [tempFilters, refetch]);

  const handleResetFilters = useCallback(() => {
    const reset: any = {
      billerId: null,
      status: null,
      minAmount: null,
      maxAmount: null,
      startDate: null,
      endDate: null,
      limit: 10,
    };
    setTempFilters(reset);
    setFilters(reset);
    setShowFilters(false);
    refetch();
  }, [refetch]);

  const handleInlineDownload = useCallback(
    async (payment: BillPayment) => {
      const id = (payment as any)?.id;
      if (!id || downloadingId) return;
      const { granted } = await requestStoragePermission();
      if (!granted) return;

      setDownloadingId(id);
      try {
        const base64 = await getFacturePdfBase64(id);
        const downloadUri = await savePdfToDownloads(
          base64,
          `facture_${id}.pdf`,
        );
        const appUri = await savePdfBase64ToAppDir(base64, `facture_${id}.pdf`);
        setSavedUris((prev) => ({ ...prev, [id]: appUri }));
        await showComplete(
          t("bills.download.savedTitle", "Reçu enregistré"),
          t(
            "bills.download.savedDesc",
            "Le reçu a été enregistré dans vos téléchargements.",
          ),
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
    async (payment: BillPayment) => {
      const id = (payment as any)?.id;
      if (!id || downloadingId) return;

      setDownloadingId(id);
      try {
        const base64 = await getFacturePdfBase64(id);
        const appUri = await savePdfBase64ToAppDir(base64, `facture_${id}.pdf`);
        const available = await Sharing.isAvailableAsync();
        if (!available) return;
        await Sharing.shareAsync(appUri, {
          mimeType: "application/pdf",
          dialogTitle: t("bills.share.dialogTitle", "Partager le reçu"),
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

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: BillPayment) => {
    const id = (item as any)?.id ?? "";
    const ref = (item as any)?.transactionReference ?? "";
    const date = (item as any)?.paymentDate ?? "";
    return `${id}-${ref}-${date}`;
  }, []);

  const renderPaymentItem = useCallback(
    ({ item: payment }: { item: BillPayment; index: number }) => {
      const biller = getBillerById(String((payment as BillPayment)?.billerId));
      const amount = parseFloat(
        (payment as BillPayment)?.paymentAmount ||
          (payment as BillPayment)?.requestedAmount ||
          "0",
      );

      const status = (payment as any)?.transactionStatus as
        | "INIT"
        | "PAID"
        | "REJECTED";

      const isPaid = status === "PAID";
      const paymentId = (payment as any)?.id;
      const isItemDownloading = downloadingId === paymentId;

      return (
        <TouchableOpacity
          style={styles.paymentCard}
          onPress={() => handleOpenDetail(payment)}
          activeOpacity={0.7}
        >
          <View style={styles.paymentHeader}>
            <View style={styles.paymentInfo}>
              <Text style={styles.billerName}>
                {biller?.billerLabel || t("bills.unknownBiller")}
              </Text>
            </View>

            <View
              style={[
                styles.headerStatusBadge,
                { backgroundColor: `${getStatusColor(status)}20` },
              ]}
            >
              <TText
                tKey={getStatusTextKey(status)}
                style={[
                  styles.headerStatusText,
                  { color: getStatusColor(status) },
                ]}
              />
            </View>
          </View>

          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <TText tKey="bills.amount" style={styles.detailLabel} />
              <Text style={styles.amount}>
                {formatBalance(amount ?? 0, "TND")}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <TText style={styles.detailLabel} tKey="common.ref" />
              <Text style={styles.detailValue}>
                {(payment as BillPayment)?.objectReference ||
                  (payment as BillPayment)?.objectId ||
                  "-"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <TText tKey="bills.paymentDate" style={styles.detailLabel} />
              <Text style={styles.detailValue}>
                {formatDate((payment as BillPayment)?.paymentDate)}
              </Text>
            </View>
          </View>

          {isPaid && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleOpenDetail(payment);
                }}
                activeOpacity={0.7}
              >
                <Eye size={14} color={BankingColors.primary} />
                <TText style={styles.cardActionText}>{t("common.view")}</TText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cardActionBtn,
                  !!downloadingId && styles.cardActionDisabled,
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleInlineDownload(payment);
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
                  !!downloadingId && styles.cardActionDisabled,
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleInlineShare(payment);
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
      getBillerById,
      t,
      handleOpenDetail,
      handleInlineDownload,
      handleInlineShare,
      downloadingId,
    ],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={BankingColors.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    if (isError) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Receipt
              size={AvatarSize.md}
              color={BankingColors.textLight}
              strokeWidth={1.5}
            />
          </View>
          <TText tKey="common.error" style={styles.emptyTitle} />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Receipt
            size={AvatarSize.md}
            color={BankingColors.textLight}
            strokeWidth={1.5}
          />
        </View>
        <TText tKey="bills.noPaymentsMade" style={styles.emptyTitle} />
        <TText
          tKey="bills.paymentHistoryWillAppear"
          style={styles.emptyDescription}
        />
      </View>
    );
  }, [isLoading, isError]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("bills.paymentHistory"),
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
          headerRight: () => (
            <Button
              onPress={() => setShowFilters(!showFilters)}
              variant="link"
              style={styles.filterButton}
            >
              <ButtonIcon as={Filter} color="#FFFFFF" />
            </Button>
          ),
        }}
      />

      {showFilters && (
        <PaymentHistoryFilters
          billers={billersMemo}
          selectedBillerId={tempFilters.billerId || null}
          selectedStatus={tempFilters.status || null}
          minAmount={tempFilters.minAmount || ""}
          maxAmount={tempFilters.maxAmount || ""}
          startDate={tempFilters.startDate || ""}
          endDate={tempFilters.endDate || ""}
          onBillerChange={(billerId) =>
            setTempFilters({ ...tempFilters, billerId })
          }
          onStatusChange={(status) =>
            setTempFilters({ ...tempFilters, status })
          }
          onMinAmountChange={(amount) =>
            setTempFilters({ ...tempFilters, minAmount: amount || null })
          }
          onMaxAmountChange={(amount) =>
            setTempFilters({ ...tempFilters, maxAmount: amount || null })
          }
          onStartDateChange={(date) =>
            setTempFilters({ ...tempFilters, startDate: date || null })
          }
          onEndDateChange={(date) =>
            setTempFilters({ ...tempFilters, endDate: date || null })
          }
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
      )}

      {isLoading ? (
        <View style={styles.content}>
          <PaymentSkeleton count={5} />
        </View>
      ) : (
        <FlatList
          data={payments}
          extraData={payments}
          renderItem={renderPaymentItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
        />
      )}

      {/* ✅ NEW — Detail bottom sheet */}
      <PaymentDetailSheet
        visible={sheetVisible}
        payment={selectedPayment}
        billerLabel={selectedBillerLabel}
        initialSavedUri={
          selectedPayment
            ? (savedUris[(selectedPayment as any)?.id] ?? null)
            : null
        }
        onClose={handleCloseDetail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { flex: 1, padding: Spacing.lg },
  listContent: { padding: Spacing.lg },
  filterButton: { marginRight: Spacing.sm },
  footer: { paddingVertical: Spacing.lg, alignItems: "center" as const },

  emptyState: {
    alignItems: "center" as const,
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xxxl,
    marginHorizontal: Spacing.lg,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
    marginTop: Spacing.xl,
  },
  emptyIconContainer: {
    width: AvatarSize.huge,
    height: AvatarSize.huge,
    borderRadius: AvatarSize.huge / 2,
    backgroundColor: BankingColors.surfaceSecondary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    textAlign: "center" as const,
  },
  emptyDescription: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 20,
  },

  paymentCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  paymentHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  paymentInfo: { flex: 1 },
  billerName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
  },

  headerStatusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  headerStatusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },

  paymentDetails: { gap: Spacing.sm },
  detailRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  detailLabel: { fontSize: FontSize.base, color: BankingColors.textGray },
  detailValue: {
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
    fontFamily: FontFamily.medium,
    flexShrink: 1,
    textAlign: "right" as const,
  },
  amount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary,
  },

  cardActions: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: Spacing.xl,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    marginHorizontal: Spacing.md,
  },
  cardActionBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  cardActionText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },
  cardActionDisabled: { opacity: 0.4 },
});
