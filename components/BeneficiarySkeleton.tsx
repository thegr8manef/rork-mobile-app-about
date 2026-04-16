import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors, Spacing, BorderRadius, Shadow, IconSize } from '@/constants';

interface BeneficiarySkeletonProps {
  count?: number;
}

function SkeletonItem() {
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.avatarSkeleton, { opacity }]} />
        <View style={styles.details}>
          <Animated.View style={[styles.nameSkeleton, { opacity }]} />
          <Animated.View style={[styles.bankSkeleton, { opacity }]} />
          <Animated.View style={[styles.accountSkeleton, { opacity }]} />
        </View>
      </View>
      <View style={styles.actions}>
        <Animated.View style={[styles.actionButtonSkeleton, { opacity }]} />
        <Animated.View style={[styles.actionButtonSkeleton, { opacity }]} />
      </View>
    </View>
  );
}

export default function BeneficiarySkeleton({ count = 3 }: BeneficiarySkeletonProps) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    gap: Spacing.xs },
  container: {
    backgroundColor: BankingColors.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.lg },
  content: {
    flexDirection: 'row',
    marginBottom: Spacing.md },
  avatarSkeleton: {
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    borderRadius: IconSize.xxxl / 2,
    backgroundColor: BankingColors.surfaceSecondary,
    marginRight: Spacing.md },
  details: {
    flex: 1,
    justifyContent: 'center' },
  nameSkeleton: {
    width: '60%',
    height: Spacing.lg,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs },
  bankSkeleton: {
    width: '40%',
    height: Spacing.md,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs },
  accountSkeleton: {
    width: '50%',
    height: Spacing.md,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm },
  actionButtonSkeleton: {
    width: IconSize.xxl + Spacing.xs,
    height: IconSize.xxl + Spacing.xs,
    borderRadius: (IconSize.xxl + Spacing.xs) / 2,
    backgroundColor: BankingColors.surfaceSecondary } });
