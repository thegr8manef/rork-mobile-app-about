import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Briefcase, AlertCircle } from "lucide-react-native";

import {
  BankingColors,
  BorderRadius,
  FontSize,
  IconSize,
  Spacing,
  FontFamily,
} from "@/constants";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { useLoans, useLoanDetails } from "@/hooks/use-loans";

import AccountDetailsHeader from "@/components/home/AccountDetail/AccountDetailsHeader";
import { CircularProgress } from "@/components/menu/loans/CircularProgress";
import TText from "@/components/TText";
import ApiErrorState from "@/components/Apierrorstate";
import ScreenState from "@/components/ScreenState";
import LoanDetailsSkeleton from "@/components/menu/loans/LoanDetailsSkeleton";

import {
  SelectableAccount,
  toSelectableAccount,
} from "@/types/selectable-account";

import {
  getLoanProgressFromDetails,
  getLoanProgressFromList,
} from "@/utils/loan-progress";
import { formatBalance } from "@/utils/account-formatters";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

/* ---------------- HELPERS ---------------- */

function LoanHeaderSkeleton({ insetsTop }: { insetsTop: number }) {
  return (
    <View style={[styles.headerSkeletonWrap, { paddingTop: insetsTop + 10 }]}>
      <View style={styles.headerSkeletonRow}>
        <View style={styles.headerSkeletonBack} />
        <View style={styles.headerSkeletonCard}>
          <View style={styles.headerSkeletonLineLg} />
          <View style={styles.headerSkeletonLineSm} />
        </View>
      </View>
      <View style={styles.headerSkeletonBalance} />
    </View>
  );
}

/* ---------------- DETAIL ROW ---------------- */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <TText style={styles.detailLabel}>{label}</TText>
      <TText style={styles.detailValue} numberOfLines={2}>
        {value}
      </TText>
    </View>
  );
}

/* ================= SCREEN ================= */
export default function LoanDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { loanId, loanSnapshot, prefetched } = useLocalSearchParams<{
    loanId?: string;
    loanSnapshot?: string;
    prefetched?: string;
  }>();

  const [showTransitionSkeleton, setShowTransitionSkeleton] = useState(
    prefetched === "1",
  );

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleDateString(selectedLanguage ?? undefined, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";
  useEffect(() => {
    if (prefetched !== "1") return;
    const tt = setTimeout(() => setShowTransitionSkeleton(false), 350);
    return () => clearTimeout(tt);
  }, [prefetched]);

  const loanFromParams = useMemo(() => {
    if (!loanSnapshot) return null;
    try {
      return JSON.parse(loanSnapshot);
    } catch {
      return null;
    }
  }, [loanSnapshot]);

  /* ---------- ACCOUNTS ---------- */
  const { data: accountsResponse, isLoading: isAccountsLoading } =
    useCustomerAccounts();

  const selectableAccounts: SelectableAccount[] = useMemo(() => {
    return (accountsResponse?.data ?? []).map(toSelectableAccount);
  }, [accountsResponse?.data]);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

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

  /* ---------- LOANS ---------- */
  const loansQuery = useLoans();
  const loans = loansQuery.data?.data ?? [];

  const effectiveLoanId = useMemo(() => {
    if (typeof loanId === "string" && loanId.length > 0) return loanId;
    if (loans.length > 0) return loans[0].id;
    return "";
  }, [loanId, loans]);

  const loanFromList = useMemo(
    () => loans.find((l) => l.id === effectiveLoanId) || loanFromParams,
    [loans, effectiveLoanId, loanFromParams],
  );

  const loanDetailsQuery = useLoanDetails(effectiveLoanId);
  const loan = loanDetailsQuery.data;

  /* ---------- PROGRESS ---------- */
  const progress = useMemo(() => {
    if (loanFromList) {
      return getLoanProgressFromList(
        loanFromList.duration,
        loanFromList.installmentDetails?.numberRemainingInstallments,
      );
    }

    return getLoanProgressFromDetails({
      duration: loan?.duration,
      totalInstallmentsNumber:
        loan?.installmentDetails?.totalInstallmentsNumber,
      lastTriggeredInstallment:
        loan?.installmentDetails?.lastTriggeredInstallment,
    });
  }, [loanFromList, loan]);

  /* ---------- LOADING / ERROR / EMPTY ---------- */
  const isLoading =
    isAccountsLoading || loansQuery.isLoading || loanDetailsQuery.isLoading;
  const isError = loansQuery.isError || loanDetailsQuery.isError;

  // ✅ header always visible from the beginning (like Bills)
  const headerNode = useMemo(() => {
    if (!selectedAccount) return <LoanHeaderSkeleton insetsTop={insets.top} />;

    return (
      <AccountDetailsHeader
        insetsTop={insets.top}
        account={selectedAccount}
        onBack={() => router.back()}
        styles={styles}
        showBalance={true}
        onToggleBalance={() => {}}
      />
    );
  }, [selectedAccount, insets.top]);

  if (showTransitionSkeleton || isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => headerNode,
          }}
        />
        <LoanDetailsSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => headerNode,
          }}
        />
        <ApiErrorState
          title={t("common.error")}
          description={t("loans.loadingError")}
          onRetry={() => {
            loansQuery.refetch();
            loanDetailsQuery.refetch();
          }}
        />
      </View>
    );
  }

  if (!effectiveLoanId) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => headerNode,
          }}
        />
        <ScreenState
          variant="empty"
          title={t("loans.noCredits")}
          description={t("loans.noCreditsDescription")}
        />
      </View>
    );
  }

  const currency = loan?.currency?.alphaCode ?? "TND";
  const hasUnpaid =
    loan?.unpaidAmount !== undefined &&
    loan?.unpaidAmount !== null &&
    parseFloat(String(loan.unpaidAmount)) > 0;

  /* ================= RENDER ================= */
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => headerNode,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {loan && (
          <>
            {/* ═══ HERO: Credit type + Progress ═══════════════ */}
            <View style={styles.heroSection}>
              {/* Credit type badge */}
              <LinearGradient
                colors={[BankingColors.primary, "#D97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.creditTypeBadge}
              >
                <View style={styles.creditTypeIconCircle}>
                  <Briefcase size={18} color={BankingColors.primary} />
                </View>
                <View style={styles.creditTypeTextBlock}>
                  <TText style={styles.creditTypeLabel}>
                    {t("loanDetails.creditType")}
                  </TText>
                  <TText style={styles.creditTypeName} numberOfLines={2}>
                    {loan.loanType?.label}
                  </TText>
                </View>
              </LinearGradient>

              {/* Circular progress */}
              <View style={styles.progressCard}>
                <CircularProgress
                  remainingMonths={progress.remainingMonths}
                  totalMonths={progress.totalMonths}
                  size={160}
                  strokeWidth={10}
                />
              </View>

              {/* Principal + Remaining summary */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <TText style={styles.summaryLabel}>
                    {t("loanDetails.principalAmount")}
                  </TText>
                  <TText style={styles.summaryValue}>
                    {formatBalance(loan.loanAmount, currency)}
                  </TText>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItem}>
                  <TText style={styles.summaryLabel}>
                    {t("loanDetails.remainingBalance")}
                  </TText>
                  <TText
                    style={[
                      styles.summaryValue,
                      { color: BankingColors.primary },
                    ]}
                  >
                    {formatBalance(loan.outstandingCapital, currency)}
                  </TText>
                </View>
              </View>
            </View>

            {/* ═══ UNPAID ALERT (if any) ══════════════════════ */}
            {hasUnpaid && (
              <View style={styles.unpaidCard}>
                <AlertCircle size={18} color={BankingColors.error} />
                <View style={styles.unpaidTextBlock}>
                  <TText style={styles.unpaidLabel}>
                    {t("loanDetails.unpaidAmount")}
                  </TText>
                  <TText style={styles.unpaidValue}>
                    {formatBalance(loan.unpaidAmount, currency)} {currency}
                  </TText>
                </View>
              </View>
            )}

            {/* ═══ DETAILS CARD ═══════════════════════════════ */}
            <View style={styles.detailsCard}>
              <TText style={styles.sectionTitle}>
                {t("loanDetails.details") || "Détails du crédit"}
              </TText>

              <DetailRow
                label={t("loanDetails.reference")}
                value={loan.fileNumber}
              />

              <View style={styles.separator} />

              <DetailRow
                label={t("loanDetails.releaseDate")}
                value={formatDate(loan.unlockDate)}
              />

              <View style={styles.separator} />

              <DetailRow
                label={t("loanDetails.duration")}
                value={`${loan.duration} ${t("loans.months")}`}
              />
            </View>

            {/* ═══ INSTALLMENTS CARD ═════════════════════════ */}
            <View style={styles.detailsCard}>
              <TText style={styles.sectionTitle}>
                {t("loanDetails.installments") || "Échéances"}
              </TText>

              <DetailRow
                label={t("loanDetails.firstInstallment")}
                value={formatDate(
                  loan.installmentDetails?.firstInstallmentDate,
                )}
              />

              <View style={styles.separator} />

              <DetailRow
                label={t("loanDetails.lastInstallment")}
                value={formatDate(loan.installmentDetails?.lastInstallmentDate)}
              />

              {!hasUnpaid && (
                <>
                  <View style={styles.separator} />
                  <DetailRow
                    label={t("loanDetails.unpaidAmount")}
                    value={`${formatBalance(loan.unpaidAmount, currency)}`}
                  />
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },

  // ── Header skeleton ────────────────────────────────────────
  headerSkeletonWrap: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerSkeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerSkeletonBack: {
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    borderRadius: IconSize.xxxl / 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  headerSkeletonCard: {
    flex: 1,
    height: IconSize.xxxl,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  headerSkeletonLineLg: {
    height: 10,
    width: "60%",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  headerSkeletonLineSm: {
    height: 8,
    width: "45%",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  headerSkeletonBalance: {
    marginTop: Spacing.md,
    height: 16,
    width: "35%",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.24)",
  },

  // ── Hero section ──────────────────────────────────────────
  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // ── Credit type badge ─────────────────────────────────────
  creditTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: "hidden",
  },
  creditTypeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  creditTypeTextBlock: { flex: 1 },
  creditTypeLabel: {
    fontSize: Spacing.md,
    fontFamily: FontFamily.medium,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  creditTypeName: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: "#fff",
    marginTop: 2,
    lineHeight: 22,
  },

  // ── Progress ──────────────────────────────────────────────
  progressCard: {
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },

  // ── Summary row (principal + remaining) ───────────────────
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 6,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.text,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: Spacing.md,
  },

  // ── Unpaid alert ──────────────────────────────────────────
  unpaidCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  unpaidTextBlock: { flex: 1 },
  unpaidLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: BankingColors.error,
  },
  unpaidValue: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.error,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },

  // ── Details card ──────────────────────────────────────────
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },

  // ── Detail row ────────────────────────────────────────────
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.xl,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    flexShrink: 1,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "right",
    flexShrink: 0,
    fontVariant: ["tabular-nums"],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
  },

  // ── Header styles (for AccountDetailsHeader) ──────────────
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
});
