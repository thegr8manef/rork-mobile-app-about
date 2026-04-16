import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors, Spacing, BorderRadius, Shadow } from '@/constants';

interface SchoolingFolderSkeletonProps {
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
      <Animated.View style={[styles.iconSkeleton, { opacity }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeleton, { opacity }]} />
        </View>
        <View style={styles.row}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeleton, { opacity }]} />
        </View>
        <View style={styles.row}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeleton, { opacity }]} />
        </View>
        <View style={styles.row}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeleton, { opacity }]} />
        </View>
      </View>
      <Animated.View style={[styles.chevronSkeleton, { opacity }]} />
    </View>
  );
}

export default function SchoolingFolderSkeleton({ count = 2 }: SchoolingFolderSkeletonProps) {
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.lg },
  container: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.card,
    borderWidth: 1,
    borderColor: BankingColors.border },
  iconSkeleton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.surfaceSecondary,
    marginRight: Spacing.md },
  content: {
    flex: 1,
    gap: Spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4 },
  labelSkeleton: {
    width: '45%',
    height: 12,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  valueSkeleton: {
    width: '40%',
    height: 12,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  chevronSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BankingColors.surfaceSecondary } });
