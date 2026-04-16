import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share } from "react-native";
import TText from "@/components/TText";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize, FontFamily } from "@/constants";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  Share2,
  Download,
  Copy,
  Calendar,
  Building2,
  Hash,
  FileText,
  CreditCard,
  AlertTriangle } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { formatBalance } from "@/utils/account-formatters";

function formatDateConsistent(dateString?: string): string {
  if (!dateString) return "-";
  const raw = dateString.length > 10 ? dateString.substring(0, 10) : dateString;
  const parts = raw.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return raw;
}

export default function TransactionDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const transaction = useMemo(
    () => ({
      id: params.id as string,
      type: (params.type as "debit" | "credit") || "debit",
      amount: parseFloat(params.amount as string) || 0,
      currency: (params.currency as string) || "TND",
      description: (params.description as string) || "-",
      category: (params.category as string) || "",
      date: params.date as string,
      status:
        ((params.status as string) === "completed" ||
        (params.status as string) === "pending" ||
        (params.status as string) === "failed"
          ? (params.status as "completed" | "pending" | "failed")
          : "completed"),
      recipient: (params.recipient as string) || undefined,
      reference: (params.reference as string) || undefined,
      accountId: params.accountId as string }),
    [params]
  );

  const isCredit = transaction.type === "credit";
  const isDebit = !isCredit;
  const amountColor = isDebit ? "#D32F2F" : BankingColors.success;
  const iconBgColor = isCredit
    ? "rgba(14, 159, 110, 0.15)"
    : "rgba(211, 47, 47, 0.18)";
  const iconColor = isCredit ? BankingColors.success : "#D32F2F";

  const formatAmount = (amount: number) => {
    const sign = amount < 0 ? "\u2212" : "+";
    const raw = formatBalance(Math.abs(amount), transaction.currency || "TND");
    return `${sign}${raw}`;
  };

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

  const getStatusLabel = () => {
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
  };

  const getStatusIcon = () => {
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
  };

  const handleCopyReference = async () => {
    if (transaction.reference) {
      await Clipboard.setStringAsync(transaction.reference);
    }
  };

  const handleCopyId = async () => {
    if (transaction.id) {
      await Clipboard.setStringAsync(transaction.id);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${t("transactions.details.title")}\n${transaction.description}\n${formatAmount(transaction.amount)}\n${formatDateConsistent(transaction.date)}` });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("transactionDetails.title"),
          headerStyle: {
            backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontFamily: FontFamily.bold } }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerCard}>
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            {isCredit ? (
              <ArrowDownLeft size={28} color={iconColor} strokeWidth={2.5} />
            ) : (
              <ArrowUpRight size={28} color={iconColor} strokeWidth={2.5} />
            )}
          </View>

          <TText
            style={[styles.amount, { color: amountColor }]}
            testID="transaction-amount"
          >
            {formatAmount(transaction.amount)}
          </TText>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "14" },
            ]}
          >
            {getStatusIcon()}
            <TText style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel()}
            </TText>
          </View>
        </View>

        <View style={styles.section}>
          <TText style={styles.sectionTitle} tKey="transactionDetails.generalInfo" />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <FileText size={IconSize.md} color={BankingColors.primary} />
            </View>
            <View style={styles.detailContent}>
              <TText style={styles.detailLabel} tKey="transaction.description" />
              <TText style={styles.detailValue}>{transaction.description}</TText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={IconSize.md} color={BankingColors.primary} />
            </View>
            <View style={styles.detailContent}>
              <TText style={styles.detailLabel} tKey="transactionDetails.dateTime" />
              <TText style={styles.detailValueBold}>
                {formatDateConsistent(transaction.date)}
              </TText>
            </View>
          </View>

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}>
              <Hash size={IconSize.md} color={BankingColors.primary} />
            </View>
            <View style={styles.detailContent}>
              <TText
                style={styles.detailLabel}
                tKey="transactionDetails.transactionId"
              />
              <TText style={styles.detailValue} numberOfLines={1}>
                {transaction.id}
              </TText>
            </View>
            <TouchableOpacity
              onPress={handleCopyId}
              style={styles.copyButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Copy size={16} color={BankingColors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => router.navigate("/(root)/(tabs)/(menu)/claims-home")}         
          activeOpacity={0.7}
        >
          <AlertTriangle size={16} color={BankingColors.warning} />
          <TText style={styles.reportButtonText} tKey="transactions.details.reportIssue" />
        </TouchableOpacity>

        {transaction.status === "failed" && (
          <View style={styles.errorCard}>
            <XCircle size={IconSize.lg} color={BankingColors.error} />
            <View style={styles.alertContent}>
              <TText style={styles.alertTitle} tKey="transactionDetails.failedTitle" />
              <TText style={styles.alertMessage} tKey="transactionDetails.failedMessage" />
            </View>
          </View>
        )}

        {transaction.status === "pending" && (
          <View style={styles.warningCard}>
            <Clock size={IconSize.lg} color={BankingColors.warning} />
            <View style={styles.alertContent}>
              <TText
                style={[styles.alertTitle, { color: BankingColors.warning }]}
                tKey="transactionDetails.pendingTitle"
              />
              <TText style={styles.alertMessage} tKey="transactionDetails.pendingMessage" />
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F3F6" },
  scrollContent: {
    paddingBottom: Spacing.xxl },
  headerCard: {
    backgroundColor: BankingColors.surface,
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    ...Shadow.lg },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg },
  amount: {
    fontSize: 30,
    fontFamily: FontFamily.extrabold,
    letterSpacing: -0.5,
    marginBottom: Spacing.md },
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
  section: {
    backgroundColor: BankingColors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadow.md },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.lg },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  detailRowLast: {
    borderBottomWidth: 0 },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md },
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
  copyButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs },
  actionsRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md },
  primaryActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F97316",
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm },
  primaryActionText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: "#FFFFFF" },
  secondaryActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BankingColors.surface,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: BankingColors.primary,
    ...Shadow.sm },
  secondaryActionText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },
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
