import React, { ReactNode } from 'react';
import { View, StyleSheet, ImageSourcePropType, Image } from 'react-native';
import { FileX, LucideIcon } from 'lucide-react-native';
import TText from '@/components/TText';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize, FontFamily } from "@/constants/typography";
import { IconSize, BorderRadius } from '@/constants/sizes';

interface EmptyStateProps {
  titleKey: string;
  descriptionKey?: string;
  children?: ReactNode;
  icon?: LucideIcon;
  image?: ImageSourcePropType;
  iconColor?: string;
}

export default function EmptyState({ 
  titleKey, 
  descriptionKey, 
  children, 
  icon: Icon = FileX,
  image,
  iconColor = BankingColors.disabled }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="contain" />
        ) : (
          <Icon size={48} color={iconColor} />
        )}
      </View>
      <TText tKey={titleKey} style={styles.title} />
      {descriptionKey && (
        <TText tKey={descriptionKey} style={styles.description} />
      )}
      {children && <View style={styles.actionsContainer}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: IconSize.huge,
    paddingHorizontal: Spacing.xl,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    marginVertical: Spacing.lg },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BankingColors.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center' as const },
  description: {
    fontSize: FontSize.base,
    color: BankingColors.textGray,
    textAlign: 'center' as const,
    lineHeight: 22 },
  image: {
    width: 60,
    height: 60 },
  actionsContainer: {
    marginTop: Spacing.xl } });
