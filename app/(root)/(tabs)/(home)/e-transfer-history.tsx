import React, { useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useAuth } from "@/hooks/auth-store";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  FontFamily,
} from "@/constants";
import { Clock, CheckCircle, XCircle, Building2 } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchETransferHistoryApi } from "@/services/mock-api";
import TText from "@/components/TText";
import TransactionSkeleton from "@/components/TransactionSkeleton";
import { formatBalance } from "@/utils/account-formatters";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "../(menu)/language";

type ETransferStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

interface ETransfer {
  id: string;
  orderId: string;
  amount: string;
  currency: string;
  creditorAccountId: string;
  creditorAccountTitle: string;
  status: ETransferStatus;
  createdAt: string;
  executedAt?: string;
}

export default function ETransferHistoryScreen() {
  const { authState } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const eTransfersQuery = useQuery({
    queryKey: ["eTransfers", authState.accessToken],
    queryFn: () => fetchETransferHistoryApi(authState.accessToken || ""),
    enabled: !!authState.accessToken,
    staleTime: 1000 * 60 * 5,
  });

  const transfers = (eTransfersQuery.data || []) as ETransfer[];

  const handleRefresh = async () => {
    setRefreshing(true);
    await eTransfersQuery.refetch();
    setRefreshing(false);
  };

  const getStatusIcon = (status: ETransferStatus) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle size={20} color={BankingColors.success} />;
      case "PENDING":
        return <Clock size={20} color={BankingColors.warning} />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle size={20} color={BankingColors.error} />;
      default:
        return <Clock size={20} color={BankingColors.textLight} />;
    }
  };

  const getStatusText = (status: ETransferStatus): string => {
    const statusMap: Record<ETransferStatus, string> = {
      COMPLETED: "etransfer.status.completed",
      PENDING: "etransfer.status.pending",
      FAILED: "etransfer.status.failed",
      CANCELLED: "etransfer.status.cancelled",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: ETransferStatus) => {
    switch (status) {
      case "COMPLETED":
        return BankingColors.success;
      case "PENDING":
        return BankingColors.warning;
      case "FAILED":
      case "CANCELLED":
        return BankingColors.error;
      default:
        return BankingColors.textLight;
    }
  };

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(selectedLanguage ?? undefined!, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderTransferCard = ({ item }: { item: ETransfer }) => (
    <View style={styles.transferCard}>
      <View style={styles.transferHeader}>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <TText
            tKey={getStatusText(item.status)}
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          />
        </View>
        <TText style={styles.transferId}>#{item.orderId.slice(-8)}</TText>
      </View>

      <View style={styles.transferBody}>
        <View style={styles.accountSection}>
          <View style={styles.accountIcon}>
            <Building2 size={18} color={BankingColors.primary} />
          </View>
          <View style={styles.accountInfo}>
            <TText
              tKey="etransfer.creditedAccount"
              style={styles.accountLabel}
            />
            <TText style={styles.accountTitle}>
              {item.creditorAccountTitle}
            </TText>
          </View>
        </View>

        <View style={styles.amountSection}>
          <TText tKey="etransfer.amount" style={styles.amountLabel} />
          <TText style={styles.amount}>
            {formatBalance(item.amount, item.currency || "TND")}
          </TText>
        </View>

        <View style={styles.dateSection}>
          <TText tKey="etransfer.creationDate" style={styles.dateLabel} />
          <TText style={styles.dateText}>{formatDate(item.createdAt)}</TText>
        </View>

        {item.executedAt && (
          <View style={styles.dateSection}>
            <TText tKey="etransfer.executionDate" style={styles.dateLabel} />
            <TText style={styles.dateText}>{formatDate(item.executedAt)}</TText>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Building2 size={64} color={BankingColors.textLight} />
      <TText tKey="etransfer.noTransfers" style={styles.emptyTitle} />
      <TText tKey="etransfer.transfersWillAppear" style={styles.emptyText} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transfers}
        renderItem={renderTransferCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          transfers.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={BankingColors.primary}
            colors={[BankingColors.primary]}
          />
        }
        ListEmptyComponent={!eTransfersQuery.isLoading ? renderEmpty : null}
      />

      {eTransfersQuery.isLoading && transfers.length === 0 && (
        <View style={styles.loadingContainer}>
          <TransactionSkeleton count={5} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  emptyListContent: {
    flex: 1,
  },
  transferCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  transferHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  statusContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },
  transferId: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  transferBody: {
    gap: Spacing.md,
  },
  accountSection: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.sm,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
    marginBottom: 2,
  },
  accountTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  amountSection: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  amountLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  amount: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary,
  },
  dateSection: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  dateLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  dateText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center" as const,
  },
  loadingContainer: {
    paddingTop: Spacing.lg,
  },
});
