import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize, FontFamily } from "@/constants";
import { Eye, EyeOff } from "lucide-react-native";
import { Account } from "@/types/account.type";
import { height, isSmalWidth, verticalScale } from "@/utils/scale";
import TText from "./TText";
import { formatBalance } from "@/utils/account-formatters";

interface AccountCardProps {
  account: Account;
  showBalance?: boolean;
  onToggleBalance?: () => void;
  onPress?: () => void;
}

export default function AccountCard({
  account,
  showBalance = false,
  onToggleBalance,
  onPress }: AccountCardProps) {
  const masked = "••••••"; // will use same style as balance
            // console.log('account.accountTitle:', account.accountTitle)

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: BankingColors.primary }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.accountName} numberOfLines={1} ellipsizeMode="middle">
            {account.accountLabel ?? account.accountTitle}
          </Text>

          <Text style={styles.accountNumber} numberOfLines={1} ellipsizeMode="middle">
            {account.accountRib}
          </Text>
        </View>

        {!!onToggleBalance && (
          <TouchableOpacity onPress={onToggleBalance} style={styles.eyeButton} hitSlop={10}>
            {showBalance ? (
              <Eye size={IconSize.md} color={BankingColors.textSecondary} />
            ) : (
              <EyeOff size={IconSize.md} color={BankingColors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* BALANCES */}
      <View style={styles.balancesRow}>
        <View style={styles.balanceContainer}>
          <TText style={styles.balanceLabel} tKey="balance.available" numberOfLines={1} />
          
          

          <Text
            style={[
              styles.balance,
              parseFloat(account.availableBalance) < 0 && styles.balanceNegative,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {showBalance
              ? formatBalance(account.availableBalance, account.currencyAccount.alphaCode)
              : masked}
          </Text>
        </View>

        <View style={styles.balanceContainer}>
          <TText style={styles.balanceLabel} tKey="account.balance" numberOfLines={1} />

          <Text
            style={[
              styles.balance,
              parseFloat(account.indicativeBalance) < 0 && styles.balanceNegative,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {showBalance
              ? formatBalance(account.indicativeBalance, account.currencyAccount.alphaCode)
              : masked}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: BankingColors.borderNeutral,
    ...Shadow.card,
    minHeight: height / 6 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    gap: Spacing.sm },

  // IMPORTANT: minWidth: 0 enables truncation in flex row
  headerLeft: {
    flex: 1,
    minWidth: 0 },

accountName: {
  flexShrink: 1,
  fontSize: FontSize.base,
  fontFamily: FontFamily.semibold,
  color: BankingColors.text,
  marginBottom: 4 },

  // Middle ellipsis keeps beginning+end visible (nice for RIB)
  accountNumber: {
    fontSize: isSmalWidth ? FontSize.xs : FontSize.sm,
    color: BankingColors.textDark,
    fontFamily: FontFamily.semibold },

  // Eye ALWAYS on top-right with stable touch target
  eyeButton: {
  
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start" },

  balancesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.lg },

  // IMPORTANT: minWidth: 0 avoids pushing the other column out
  balanceContainer: {
    flex: 1,
    minWidth: 0 },

  balanceLabel: {
    fontSize: isSmalWidth ? FontSize.xs : FontSize.sm,
    color: BankingColors.textDark,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingVertical: verticalScale(4),
    fontFamily: FontFamily.bold },

  // Same style used for both amount and masked "••••••"
  balance: {
    fontSize: isSmalWidth ? FontSize.sm : FontSize.md,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.text },

  balanceNegative: {
    color: BankingColors.error } });

