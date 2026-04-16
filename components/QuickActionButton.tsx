import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { BankingColors, Spacing, FontSize, IconSize, FontFamily } from "@/constants";
import { LucideIcon } from 'lucide-react-native';

interface QuickActionButtonProps {
  icon: LucideIcon;
  title: string;
  onPress: () => void;
  color?: string;
}

export default function QuickActionButton({ 
  icon: Icon, 
  title, 
  onPress, 
  color = BankingColors.primary 
}: QuickActionButtonProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={IconSize.lg} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.lg },
  iconContainer: {
    width: IconSize.huge,
    height: IconSize.huge,
    borderRadius: IconSize.huge / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm },
  title: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: 'center' } });