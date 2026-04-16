import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import TText from '@/components/TText';

interface CardActionButtonProps {
  icon: LucideIcon;
  iconColor: string;
  backgroundColor: string;
  labelKey: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function CardActionButton({
  icon: Icon,
  iconColor,
  backgroundColor,
  labelKey,
  onPress,
  disabled = false }: CardActionButtonProps) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.actionIcon, { backgroundColor }]}>
        <Icon size={20} color={iconColor} />
      </View>
      <TText style={styles.actionText} tKey={labelKey} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    minWidth: 70 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm },
  actionText: {
    fontSize: FontSize.xs,
    color: BankingColors.text,
    textAlign: 'center',
    lineHeight: 14 } });
