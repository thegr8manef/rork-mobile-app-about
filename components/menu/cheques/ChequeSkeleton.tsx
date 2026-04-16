import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors, Spacing, BorderRadius, Shadow } from '@/constants';

interface ChequeSkeletonProps {
  count?: number;
}

function SkeletonCard() {
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
      <View style={styles.header}>
        <View style={styles.info}>
          <Animated.View style={[styles.chequeNumberSkeleton, { opacity }]} />
          <Animated.View style={[styles.beneficiarySkeleton, { opacity }]} />
        </View>
        <Animated.View style={[styles.statusBadgeSkeleton, { opacity }]} />
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeleton, { opacity }]} />
        </View>
        <View style={styles.detailRow}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeleton, { opacity }]} />
        </View>
        <View style={styles.detailRow}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeleton, { opacity }]} />
        </View>
      </View>

      <Animated.View style={[styles.buttonSkeleton, { opacity }]} />
    </View>
  );
}

export default function ChequeSkeleton({ count = 3 }: ChequeSkeletonProps) {
  return (
    <View style={styles.wrapper}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: Spacing.lg },
  container: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.card },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg },
  info: {
    flex: 1 },
  chequeNumberSkeleton: {
    width: '50%',
    height: 18,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs },
  beneficiarySkeleton: {
    width: '70%',
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  statusBadgeSkeleton: {
    width: 80,
    height: 28,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.lg },
  details: {
    gap: Spacing.md,
    marginBottom: Spacing.lg },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  labelSkeleton: {
    width: '35%',
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  valueSkeleton: {
    width: '40%',
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  buttonSkeleton: {
    width: '100%',
    height: 44,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.md } });
