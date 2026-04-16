import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import TText from '@/components/TText';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize, FontFamily } from "@/constants/typography";
import { useHaptic } from '@/utils/useHaptic';

interface SectionHeaderProps {
  icon?: LucideIcon;
  titleKey: string;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
}

export default function SectionHeader({
  icon: Icon,
  titleKey,
  showViewAll = false,
  onViewAllPress }: SectionHeaderProps) {
  const { triggerLightHaptic } = useHaptic();

  const handleViewAllPress = () => {
    triggerLightHaptic();
    onViewAllPress?.();
  };

  return (
    <View style={styles.container}>
      {Icon && <Icon size={20} color={BankingColors.warning} fill={BankingColors.warning} />}
      <TText tKey={titleKey} style={styles.title} />
      {showViewAll && onViewAllPress && (
        <TouchableOpacity 
          onPress={handleViewAllPress}
          style={styles.viewAllButton}
        >
          <TText tKey="common.viewAll" style={styles.viewAllText} />
          <ChevronRight size={16} color={BankingColors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginLeft: 'auto' },
  viewAllText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary } });
