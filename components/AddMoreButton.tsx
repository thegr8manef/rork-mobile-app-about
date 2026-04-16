import React from 'react';
import { TouchableOpacity, StyleProp, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';

import TText from './TText';
import { BankingColors, BorderRadius, FontSize, Spacing, FontFamily } from "@/constants";

type AddMoreButtonProps = {
  onPress: () => void;
  iconSize?: number;
  iconColor?: string;
  tKey?: string;
};

export const AddMoreButton: React.FC<AddMoreButtonProps> = ({
  onPress,
  iconSize = 20,
  iconColor = BankingColors.primary,
  tKey }) => {
  return (
    <TouchableOpacity
      style={styles.addMoreButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Plus size={iconSize} color={iconColor} />
      <TText tKey={tKey} style={styles.addMoreButtonText} />
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  addMoreButton: {
    flexDirection: 'row' as const,
    marginBottom: Spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: BankingColors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: BankingColors.primary,
    borderStyle: 'dashed' as const,
    marginTop: Spacing.sm,
    gap: Spacing.sm },
  addMoreButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary } });
