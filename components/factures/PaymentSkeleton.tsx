import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { BorderRadius } from '@/constants/sizes';
import { Shadow } from '@/constants/shadows';

interface PaymentSkeletonProps {
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
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Animated.View style={[styles.billerNameSkeleton, { opacity }]} />
          <Animated.View style={[styles.referenceSkeleton, { opacity }]} />
        </View>
        <Animated.View style={[styles.statusIconSkeleton, { opacity }]} />
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeleton, { opacity }]} />
        </View>

        <View style={styles.detailRow}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueLongSkeleton, { opacity }]} />
        </View>

        <View style={styles.detailRow}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.statusBadgeSkeleton, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

export default function PaymentSkeleton({ count = 3 }: PaymentSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg },
  paymentCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md },
  paymentInfo: {
    flex: 1 },
  billerNameSkeleton: {
    width: '60%',
    height: 18,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs },
  referenceSkeleton: {
    width: '40%',
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  statusIconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BankingColors.surfaceSecondary },
  paymentDetails: {
    gap: Spacing.sm },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  labelSkeleton: {
    width: 80,
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  valueSkeleton: {
    width: 100,
    height: 16,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  valueLongSkeleton: {
    width: 140,
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  statusBadgeSkeleton: {
    width: 70,
    height: 24,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.md } });
