import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors, Spacing, BorderRadius, Shadow } from '@/constants';

interface DocumentSkeletonProps {
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
      <Animated.View style={[styles.iconContainer, { opacity }]} />
      
      <View style={styles.content}>
        <Animated.View style={[styles.nameSkeleton, { opacity }]} />
        <Animated.View style={[styles.dateSkeleton, { opacity }]} />
        <Animated.View style={[styles.sizeSkeleton, { opacity }]} />
      </View>
      
      <Animated.View style={[styles.buttonSkeleton, { opacity }]} />
    </View>
  );
}

export default function DocumentSkeleton({ count = 5 }: DocumentSkeletonProps) {
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
    gap: Spacing.md },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.surfaceSecondary,
    marginRight: Spacing.md },
  content: {
    flex: 1 },
  nameSkeleton: {
    width: '70%',
    height: 16,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs },
  dateSkeleton: {
    width: '40%',
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs,
    marginBottom: 6 },
  sizeSkeleton: {
    width: '30%',
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs },
  buttonSkeleton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.surfaceSecondary } });
