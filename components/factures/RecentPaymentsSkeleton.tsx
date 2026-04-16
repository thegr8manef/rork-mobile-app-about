import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { BorderRadius, AvatarSize } from '@/constants/sizes';
import { Shadow } from '@/constants/shadows';

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
    <View style={styles.card}>
      <Animated.View style={[styles.logoSkeleton, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.referenceSkeleton, { opacity }]} />
        <Animated.View style={[styles.dateSkeleton, { opacity }]} />
      </View>
      <View style={styles.right}>
        <Animated.View style={[styles.amountSkeleton, { opacity }]} />
        <Animated.View style={[styles.statusSkeleton, { opacity }]} />
      </View>
    </View>
  );
}

export default function RecentPaymentsSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.card },
  logoSkeleton: {
    width: AvatarSize.md,
    height: AvatarSize.md,
    borderRadius: AvatarSize.md / 2,
    backgroundColor: BankingColors.surfaceSecondary,
    marginRight: Spacing.md },
  content: {
    flex: 1,
    gap: Spacing.xs },
  referenceSkeleton: {
    width: '60%',
    height: 16,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  dateSkeleton: {
    width: '40%',
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.xs },
  amountSkeleton: {
    width: 80,
    height: 18,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  statusSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BankingColors.surfaceSecondary } });
