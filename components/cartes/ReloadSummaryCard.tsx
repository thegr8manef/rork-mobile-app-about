import React from 'react';
import { View, StyleSheet } from 'react-native';
import TText from '@/components/TText';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius } from '@/constants/sizes';
import { formatBalance } from '@/utils/account-formatters';

interface ReloadSummaryCardProps {
  amount: string;
  currentBalance: number;
  currency: string;
}

export default function ReloadSummaryCard({
  amount,
  currentBalance,
  currency }: ReloadSummaryCardProps) {
  const formatCurrency = (value: number) => formatBalance(value, currency);

  const reloadAmount = parseFloat(amount);
  const newBalance = currentBalance - reloadAmount;

  return (
    <View style={styles.summaryCard}>
      <TText style={styles.summaryTitle} tKey="reloadCard.summary" />
      
      <View style={styles.summaryRow}>
        <TText style={styles.summaryLabel} tKey="reloadCard.amountToReload" />
        <TText style={styles.summaryValue}>
          {formatCurrency(reloadAmount)}
        </TText>
      </View>
      
      <View style={styles.summaryRow}>
        <TText style={styles.summaryLabel} tKey="reloadCard.currentBalance" />
        <TText style={styles.summaryValue}>
          {formatCurrency(currentBalance)}
        </TText>
      </View>
      
      <View style={[styles.summaryRow, styles.summaryTotal]}>
        <TText style={styles.summaryTotalLabel} tKey="reloadCard.newBalance" />
        <TText style={styles.summaryTotalValue}>
          {formatCurrency(newBalance)}
        </TText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border },
  summaryTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.lg },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md },
  summaryLabel: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary },
  summaryValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  summaryTotal: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border },
  summaryTotalLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  summaryTotalValue: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary } });
