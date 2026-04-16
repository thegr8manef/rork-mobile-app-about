import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize, FontFamily } from "@/constants/typography";
import { IconSize } from '@/constants/sizes';

interface BillerHeaderProps {
  billerName: string;
  category?: string;
}

export default function BillerHeader({ billerName, category }: BillerHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{billerName.charAt(0)}</Text>
      </View>
      <Text style={styles.name}>{billerName}</Text>
      {category && <Text style={styles.category}>{category}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  iconContainer: {
    width: IconSize.massive,
    height: IconSize.massive,
    borderRadius: IconSize.xxl,
    backgroundColor: BankingColors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md },
  icon: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },
  name: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },
  category: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary } });
