import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors, Spacing, BorderRadius } from '@/constants';

interface NotificationSkeletonProps {
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
      <View style={styles.leftBar} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Animated.View style={[styles.titleLine1, { opacity }]} />
            <Animated.View style={[styles.titleLine2, { opacity }]} />
          </View>
          <Animated.View style={[styles.menuIcon, { opacity }]} />
        </View>
        
        <Animated.View style={[styles.responseSkeleton, { opacity }]} />
        
        <Animated.View style={[styles.timestampSkeleton, { opacity }]} />
      </View>
    </View>
  );
}

export default function NotificationSkeleton({ count = 5 }: NotificationSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: BankingColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.borderPale,
    position: 'relative' },
  leftBar: {
    width: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: BankingColors.borderDark },
  content: {
    flex: 1,
    paddingLeft: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.sm },
  titleLine1: {
    height: Spacing.lg,
    backgroundColor: BankingColors.borderDark,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
    width: '90%' },
  titleLine2: {
    height: Spacing.lg,
    backgroundColor: BankingColors.borderDark,
    borderRadius: BorderRadius.xs,
    width: '60%' },
  menuIcon: {
    width: Spacing.xl,
    height: Spacing.xl,
    backgroundColor: BankingColors.borderDark,
    borderRadius: BorderRadius.xs },
  responseSkeleton: {
    height: 60,
    backgroundColor: BankingColors.backgroundLight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm },
  timestampSkeleton: {
    height: Spacing.md,
    width: 120,
    backgroundColor: BankingColors.borderDark,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.xs } });
