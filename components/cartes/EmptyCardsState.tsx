import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize, FontFamily } from "@/constants/typography";
import TText from '@/components/TText';

export default function EmptyCardsState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.iconContainer}>
        <CreditCard size={64} color={BankingColors.primary} />
      </View>
      <TText style={styles.emptyTitle} tKey="cards.noCards" />
      <TText style={styles.emptyDescription} tKey="cards.noCardsDescription" />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BankingColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.md },
  emptyDescription: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22 } });
