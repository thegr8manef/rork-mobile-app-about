import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ToastAndroid } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";

import { useHaptic } from "@/utils/useHaptic";
import useShowMessage from "@/hooks/useShowMessage";
import { isAndroid } from "@/utils/scale";

import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize, FontFamily } from "@/constants";

import { formatBalance } from "@/utils/account-formatters";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Hash,
  AlertTriangle,
  Copy } from "lucide-react-native";

import CustomHeader from "@/components/home/Notification/CustomHeader";

type TransactionParams = {
  id?: string;
  accountId?: string;
  type?: "debit" | "credit" | string;
  amount?: string | number;
  currency?: string;
  description?: string;
  category?: string;
  ledgerDate?: string;
  valueDate?: string;
  status?: "completed" | "pending" | "failed" | string;
  recipient?: string;
  reference?: string;
  movementNumber?: string | number;
};

function safeStr(v: unknown, fallback = "-") {
  const s = typeof v === "string" ? v : "";
  return s.trim().length ? s : fallback;
}

function formatDateConsistent(dateString?: string): string {
  if (!dateString) return "-";
  const raw = dateString.length > 10 ? dateString.substring(0, 10) : dateString;
  const parts = raw.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return raw;
}

function parseAmount(amount?: string | number): number {
  if (typeof amount === "number") return Number.isFinite(amount) ? amount : 0;
  if (!amount) return 0;
  const n = Number(amount);
  return Number.isFinite(n) ? n : 0;
}

export default function TransactionDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams() as unknown as TransactionParams;

  const { triggerMediumHaptic } = useHaptic();
  const { showMessageError } = useShowMessage();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback(
    async (text: string, fieldId: string) => {
      try {
        await Clipboard.setStringAsync(text);
        triggerMediumHaptic();
        setCopiedField(fieldId);

        if (isAndroid) {
          ToastAndroid.show(t("common.copied", "Copié"), ToastAndroid.SHORT);
        }

        setTimeout(() => setCopiedField(null), 2000);
      } catch {
        showMessageError(t("common.error"), t("accountDetails.copyError"));
      }
    },
    [showMessageError, t, triggerMediumHaptic],
  );

  const transaction = useMemo(() => {
    const type =
      params.type === "credit" || params.type === "debit"
        ? params.type
        : "debit";

    const movementNumber =
      typeof params.movementNumber === "number"
        ? String(params.movementNumber)
        : safeStr(params.movementNumber, "");

    return {
      id: safeStr(params.id, ""),
      accountId: safeStr(params.accountId, ""),
      type: type as "debit" | "credit",
      amount: parseAmount(params.amount),
      currency: safeStr(params.currency, "TND"),
      description: safeStr(params.description, "-"),
      category: safeStr(params.category, ""),
      ledgerDate: safeStr(params.ledgerDate, ""),
      valueDate: safeStr(params.valueDate, ""),
      movementNumber,
      status:
        params.status === "completed" ||
        params.status === "pending" ||
        params.status === "failed"
          ? (params.status as "completed" | "pending" | "failed")
          : "completed" };
  }, [params]);

  const formatAmount = useCallback(
    (amount: number) => {
      const sign = amount < 0 ? "\u2212" : "+";
      const raw = formatBalance(Math.abs(amount), transaction.currency);
      return `${sign}${raw}`;
    },
    [transaction.currency],
  );

  const isCredit = transaction.type === "credit";

  const amountColor = isCredit ? BankingColors.success : "#D32F2F";
  const iconBgColor = isCredit
    ? "rgba(14, 159, 110, 0.15)"
    : "rgba(211, 47, 47, 0.18)";
  const iconColor = isCredit ? BankingColors.success : "#D32F2F";

  const statusColor = useMemo(() => {
    switch (transaction.status) {
      case "completed":
        return BankingColors.success;
      case "pending":
        return BankingColors.warning;
      case "failed":
        return BankingColors.error;
      default:
        return BankingColors.textSecondary;
    }
  }, [transaction.status]);

  const statusLabel = useMemo(() => {
    switch (transaction.status) {
      case "completed":
        return t("transactions.details.completed");
      case "pending":
        return t("transactions.details.pending");
      case "failed":
        return t("transactions.details.failed");
      default:
        return transaction.status;
    }
  }, [transaction.status, t]);

  const statusIcon = useMemo(() => {
    switch (transaction.status) {
      case "completed":
        return <CheckCircle size={16} color={BankingColors.success} />;
      case "pending":
        return <Clock size={16} color={BankingColors.warning} />;
      case "failed":
        return <XCircle size={16} color={BankingColors.error} />;
      default:
        return null;
    }
  }, [transaction.status]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="transactions.details.title"
            />
          ) }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerCard}>
          <View
            style={[styles.iconContainer, { backgroundColor: iconBgColor }]}
          >
            {isCredit ? (
              <ArrowDownLeft size={24} color={iconColor} strokeWidth={2.5} />
            ) : (
              <ArrowUpRight size={24} color={iconColor} strokeWidth={2.5} />
            )}
          </View>

          <Text style={[styles.amount, { color: amountColor }]}>
            {formatAmount(transaction.amount)}
          </Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "14" },
            ]}
          >
            {statusIcon}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("transactions.details.generalInfo")}
          </Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <FileText size={IconSize.md} color={BankingColors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                {t("transactions.details.description")}
              </Text>
              <Text style={styles.detailValue}>{transaction.description}</Text>
              {!!transaction.category && (
                <Text style={styles.detailSubValue}>
                  {transaction.category}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={IconSize.md} color={BankingColors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                {t("transactions.details.ledgerDate")}
              </Text>
              <Text style={styles.detailValueBold}>
                {formatDateConsistent(transaction.ledgerDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={IconSize.md} color={BankingColors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                {t("transactions.details.valueDate")}
              </Text>
              <Text style={styles.detailValueBold}>
                {formatDateConsistent(transaction.valueDate)}
              </Text>
            </View>
          </View>

          {/* <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}>
              <Hash size={IconSize.md} color={BankingColors.primary} />
            </View>

            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>N° transaction</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {transaction.movementNumber || "-"}
              </Text>
            </View>

            {!!transaction.movementNumber && (
              <TouchableOpacity
                onPress={() =>
                  copyToClipboard(transaction.movementNumber!, "movementNumber")
                }
                style={styles.copyButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {copiedField === "movementNumber" ? (
                  <CheckCircle size={16} color={BankingColors.success} />
                ) : (
                  <Copy size={16} color={BankingColors.primary} />
                )}
              </TouchableOpacity>
            )}
          </View> */}
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => router.navigate("/(root)/(tabs)/(menu)/claims-home")}
          activeOpacity={0.7}
        >
          <AlertTriangle size={16} color={BankingColors.warning} />
          <Text style={styles.reportButtonText}>
            {t("transactions.details.reportIssue")}
          </Text>
        </TouchableOpacity>

        {transaction.status === "failed" && (
          <View style={styles.errorCard}>
            <XCircle size={IconSize.lg} color={BankingColors.error} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {t("transactionDetails.failedTitle")}
              </Text>
              <Text style={styles.alertMessage}>
                {t("transactionDetails.failedMessage")}
              </Text>
            </View>
          </View>
        )}

        {transaction.status === "pending" && (
          <View style={styles.warningCard}>
            <Clock size={IconSize.lg} color={BankingColors.warning} />
            <View style={styles.alertContent}>
              <Text
                style={[styles.alertTitle, { color: BankingColors.warning }]}
              >
                {t("transactionDetails.pendingTitle")}
              </Text>
              <Text style={styles.alertMessage}>
                {t("transactionDetails.pendingMessage")}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F3F6" },
  scrollContent: {
    paddingBottom: Spacing.lg },
  headerCard: {
    backgroundColor: BankingColors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    ...Shadow.lg },
  section: {
    backgroundColor: BankingColors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadow.md },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm },
  amount: {
    fontSize: 32,
    fontFamily: FontFamily.extrabold,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderRadius: BorderRadius.full },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.md },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  detailRowLast: {
    borderBottomWidth: 0 },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm },
  detailContent: {
    flex: 1 },
  detailLabel: {
    fontSize: FontSize.sm,
    color: "#767676",
    marginBottom: 3,
    fontFamily: FontFamily.medium },
  detailValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  detailValueBold: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  detailSubValue: {
    marginTop: 4,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: "#767676" },
  copyButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingVertical: 12 },
  reportButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.warning },
  errorCard: {
    flexDirection: "row",
    backgroundColor: BankingColors.error + "12",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.error },
  warningCard: {
    flexDirection: "row",
    backgroundColor: BankingColors.warning + "12",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.warning },
  alertContent: {
    flex: 1,
    marginLeft: Spacing.md },
  alertTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.error,
    marginBottom: Spacing.xs },
  alertMessage: {
    fontSize: FontSize.sm,
    color: BankingColors.text,
    lineHeight: 20 } });
