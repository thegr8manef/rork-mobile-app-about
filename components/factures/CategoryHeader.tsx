import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react-native';
import TText from '@/components/TText';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize, FontFamily } from "@/constants/typography";
import { IconSize } from '@/constants/sizes';

interface CategoryHeaderProps {
  icon: LucideIcon;
  iconColor: string;
  titleKey: string;
  subtitleKey: string;
  isExpanded: boolean;
  onPress: () => void;
}

export default function CategoryHeader({
  icon: Icon,
  iconColor,
  titleKey,
  subtitleKey,
  isExpanded,
  onPress }: CategoryHeaderProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Icon size={24} color={iconColor} />
      </View>
      <View style={styles.titleContainer}>
        <TText tKey={titleKey} style={styles.titleText} />
        <TText tKey={subtitleKey} style={styles.subtitle} />
      </View>
      {isExpanded ? (
        <ChevronUp size={20} color={BankingColors.textSecondary} />
      ) : (
        <ChevronDown size={20} color={BankingColors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md },
  iconContainer: {
    width: IconSize.huge,
    height: IconSize.huge,
    borderRadius: IconSize.lg,
    justifyContent: 'center',
    alignItems: 'center' },
  titleContainer: {
    flex: 1 },
  titleText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },
  subtitle: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary } });
