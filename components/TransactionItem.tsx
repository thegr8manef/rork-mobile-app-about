import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Transaction } from "@/types/banking";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize, FontFamily } from "@/constants";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle } from "lucide-react-native";
import { formatBalance } from "@/utils/account-formatters";

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export default function TransactionItem({
  transaction,
  onPress }: TransactionItemProps) {
  const formatAmount = (amount: number, currency?: string) => {
    const curr = currency || "TND";
    if (typeof amount !== "number" || Number.isNaN(amount)) {
      return `0 ${curr}`;
    }
    const sign = amount < 0 ? "−" : "+";
    const raw = formatBalance(Math.abs(amount), curr);
    return `${sign}${raw}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const raw =
      dateString.length > 10 ? dateString.substring(0, 10) : dateString;
    const parts = raw.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return raw;
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "completed":
        return <CheckCircle size={IconSize.sm} color={BankingColors.success} />;
      case "pending":
        return <Clock size={IconSize.sm} color={BankingColors.warning} />;
      case "failed":
        return <XCircle size={IconSize.sm} color={BankingColors.error} />;
      default:
        return null;
    }
  };

  const getTransactionIcon = () => {
    if (transaction.type === "credit") {
      return <ArrowDownLeft size={IconSize.md} color={BankingColors.success} />;
    } else {
      return <ArrowUpRight size={IconSize.md} color={BankingColors.error} />;
    }
  };
  const formatCategory = (category: string | null | undefined): string => {
    if (!category) return "";

    const lower = category.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor:
              transaction.type === "credit"
                ? BankingColors.success + "20"
                : BankingColors.error + "20" },
        ]}
      >
        {getTransactionIcon()}
      </View>

      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description?.replace(/\s+/g, " ").trim()}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {formatCategory(transaction.category)}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <Text
            style={[
              styles.amount,
              {
                color:
                  transaction.type === "credit"
                    ? BankingColors.success
                    : BankingColors.text },
            ]}
          >
            {formatAmount(transaction.amount, transaction.currency)}
          </Text>
          <View style={styles.statusRow}>
            {getStatusIcon()}
            <Text style={styles.date}>
              {formatDate(transaction.ledgerDate)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    ...Shadow.sm },
  iconContainer: {
    width: IconSize.xl,
    height: IconSize.xl,
    borderRadius: IconSize.xl / 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center" },
  mainInfo: {
    flex: 1,
    marginRight: Spacing.sm, // ← was xs, give more breathing room
  },
  description: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 2 },
  category: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium },
  recipient: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary },
  rightSection: {
    alignItems: "flex-end",
    flexShrink: 0, // ← never shrinks, amount always visible
  },
  amount: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.xs,
    textAlign: "right" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs },
  date: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary } });
