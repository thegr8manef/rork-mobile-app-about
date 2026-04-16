import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { Receipt, AlertCircle, RefreshCw } from "lucide-react-native";

import { useAccountMovements } from "@/hooks/use-accounts-api";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  AvatarSize,
  IconSize, FontFamily } from "@/constants";

import TText from "@/components/TText";
import TransactionSkeleton from "@/components/TransactionSkeleton";
import RecentTransactionsListItem from "@/components/home/recentTransactions/recentTransactionsListItem";
import * as Haptics from "expo-haptics";
import { horizontalScale } from "@/utils/scale";
import { useAppPreferencesStore } from "@/store/store";

export interface RecentTransactionsProps {
  accountId: string | null;
  limit?: number;
  isLoadingAccounts?: boolean;
  noAccounts?: boolean;
  onToggleBalance: () => void;
}

/**
 * Approximate height of a single TransactionItem row:
 * padding (Spacing.lg * 2) + icon (IconSize.xl) + margin (Spacing.xs * 2)
 * Used to give error/empty states a minHeight matching `limit` rows.
 */
const SINGLE_ROW_HEIGHT = Spacing.lg * 2 + IconSize.xl + Spacing.xs * 2;

export default function RecentTransactions({
  accountId,
  limit = 3,
  isLoadingAccounts = false,
  noAccounts = false,
  onToggleBalance }: RecentTransactionsProps) {
  const {
    data: movementsData,
    isLoading: isLoadingMovements,
    isFetching,
    isError,
    refetch } = useAccountMovements(accountId || null, { limit, page: 1 });

  const recentTransactions = useMemo(
    () => movementsData?.data || [],
    [movementsData?.data],
  );

  const showTransactionDetail = useAppPreferencesStore(
    (s) => s.showTransactionDetail,
  );
  // ✅ Only show skeleton when there is truly no data yet (first fetch).
  // isLoadingMovements (isPending) = no cache + fetching for the first time.
  // isFetching alone = background refetch on focus — cached data is already
  // available so we render it immediately and update silently underneath.
  const hasCache = movementsData !== undefined;
  const isLoading = isLoadingAccounts || isLoadingMovements || (!hasCache && isFetching);

  const hasError =
    isError || (!isLoading && !hasCache && !!accountId);
  const isReady =
    !!accountId && !isLoading && !hasError && hasCache;

  const handleRefetch = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    refetch();
  };

  // ✅ minHeight matching `limit` transaction rows so no layout shift
  const stateMinHeight = SINGLE_ROW_HEIGHT * limit;

  return (
    <View style={styles.section}>
      {/* ✅ Header is ALWAYS rendered — no shift between states */}
      <View style={styles.sectionHeader}>
        <TText tKey="home.recentTransactions" style={styles.sectionTitle} />
        {!hasError && !isLoading && recentTransactions.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              router.navigate(
                `/(root)/(tabs)/(home)/transactions?accountId=${accountId}` as any,
              )
            }
          >
            <TText tKey="common.viewAll" style={styles.seeAllText} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Loading ── */}
      {isLoading && <TransactionSkeleton count={limit} />}

      {/* ── Error ── */}
      {hasError && (
        <View style={[styles.stateContainer, { minHeight: stateMinHeight }]}>
          <View style={[styles.emptyIconContainer, styles.errorIconContainer]}>
            <AlertCircle
              size={AvatarSize.md}
              color={BankingColors.error}
              strokeWidth={1.5}
            />
          </View>
          <TText tKey="common.errorTitle" style={styles.emptyTitle} />
          <TText
            tKey="common.errorDescription"
            style={styles.emptyDescription}
          />
          <TouchableOpacity
            onPress={handleRefetch}
            style={styles.ctaButton}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <RefreshCw
                size={16}
                color={BankingColors.surface}
                style={{ marginRight: 8 }}
              />
              <TText tKey="common.retry" style={styles.ctaButtonText} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── No accounts ── */}
      {noAccounts && !isLoading && !hasError && (
        <View style={[styles.stateContainer, { minHeight: stateMinHeight }]}>
          <View style={[styles.emptyIconContainer, styles.errorIconContainer]}>
            <AlertCircle
              size={AvatarSize.md}
              color={BankingColors.error}
              strokeWidth={1.5}
            />
          </View>
          <TText tKey="accounts.noAccountTitle" style={styles.emptyTitle} />
          <TText tKey="accounts.noAccountDesc" style={styles.emptyDescription} />
        </View>
      )}

      {/* ── Success with data ── */}
      {isReady && recentTransactions.length > 0 && (
        <View style={styles.transactionsContainer}>
          {recentTransactions.map((movement, index) => (
            <RecentTransactionsListItem
              key={`${movement.movementNumber}-${movement.ledgerDate}-${index}`}
              movement={movement}
              accountId={accountId || ""}
              index={index}
              onPress={onToggleBalance}
            />
          ))}
        </View>
      )}

      {/* ── Empty ── */}
      {isReady && recentTransactions.length === 0 && (
        <View style={[styles.stateContainer, { minHeight: stateMinHeight }]}>
          <View style={styles.emptyIconContainer}>
            <Receipt
              size={AvatarSize.md}
              color={BankingColors.textLight}
              strokeWidth={1.5}
            />
          </View>
          <TText tKey="home.noTransactions" style={styles.emptyTitle} />
          <TText
            tKey={
              accountId
                ? "home.noRecentTransactionsForAccount"
                : "home.noRecentTransactions"
            }
            style={styles.emptyDescription}
          />
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.navigate("/(root)/(tabs)/(home)/send-money");
            }}
            style={styles.ctaButton}
            activeOpacity={0.8}
          >
            <TText
              tKey="home.startMakingTransactions"
              style={styles.ctaButtonText}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxxl,
    paddingHorizontal: horizontalScale(Spacing.md) },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  seeAllText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },
  transactionsContainer: {},

  /**
   * ✅ Unified state container for error & empty
   * - Same marginHorizontal as TransactionItem (Spacing.xs)
   * - minHeight is set dynamically to match `limit` rows
   * - Centered content so it looks clean
   */
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    marginHorizontal: Spacing.xs,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.sm },
  emptyIconContainer: {
    width: AvatarSize.xl,
    height: AvatarSize.xl,
    borderRadius: AvatarSize.xl / 2,
    backgroundColor: BankingColors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg },
  errorIconContainer: {
    backgroundColor: `${BankingColors.error}10` },
  emptyTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    textAlign: "center" },
  emptyDescription: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl },
  ctaButton: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
    minWidth: 200 },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center" },
  ctaButtonText: {
    color: BankingColors.surface,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    textAlign: "center" } });