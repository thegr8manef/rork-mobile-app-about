import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { BorderRadius, IconSize, AvatarSize } from '@/constants/sizes';
import { Shadow } from '@/constants/shadows';

function CategorySkeletonItem() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryLeft}>
          <Animated.View style={[styles.iconSkeleton, { opacity }]} />
          <View style={styles.categoryText}>
            <Animated.View style={[styles.titleSkeleton, { opacity }]} />
            <Animated.View style={[styles.subtitleSkeleton, { opacity }]} />
          </View>
        </View>
        <Animated.View style={[styles.chevronSkeleton, { opacity }]} />
      </View>
    </View>
  );
}

export default function BillersSkeleton() {
  return (
    <View style={styles.container}>
      <CategorySkeletonItem />
      <CategorySkeletonItem />
      <CategorySkeletonItem />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md },
  categoryCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.card },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md },
  iconSkeleton: {
    width: IconSize.xxl,
    height: IconSize.xxl,
    borderRadius: IconSize.xl,
    backgroundColor: BankingColors.surfaceSecondary },
  categoryText: {
    flex: 1,
    gap: Spacing.xs },
  titleSkeleton: {
    width: '60%',
    height: 18,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  subtitleSkeleton: {
    width: '80%',
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  chevronSkeleton: {
    width: IconSize.md,
    height: IconSize.md,
    borderRadius: IconSize.sm,
    backgroundColor: BankingColors.surfaceSecondary } });
