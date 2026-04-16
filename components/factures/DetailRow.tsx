import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TText from '@/components/TText';
import { BankingColors } from '@/constants/banking-colors';
import { FontSize, FontFamily } from "@/constants/typography";

interface DetailRowProps {
  labelKey: string;
  value: string;
}

export default function DetailRow({ labelKey, value }: DetailRowProps) {
  return (
    <View style={styles.container}>
      <TText tKey={labelKey} style={styles.label} />
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start' },
  label: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    flex: 1 },
  value: {
    fontSize: FontSize.base,
    color: BankingColors.text,
    fontFamily: FontFamily.medium,
    flex: 1,
    textAlign: 'right' } });
