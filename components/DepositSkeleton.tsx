import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors, Spacing, BorderRadius, Shadow } from '@/constants';
import { verticalScale, horizontalScale, moderateScale } from '@/utils/scale';

export default function DepositSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7] });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.iconContainer, { opacity }]} />
      
      <View style={styles.content}>
        <Animated.View style={[styles.titleLine, { opacity }]} />
        <Animated.View style={[styles.refLine, { opacity }]} />
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Animated.View style={[styles.labelLine, { opacity }]} />
            <Animated.View style={[styles.valueLine, { opacity }]} />
          </View>
          
          <View style={styles.detailRow}>
            <Animated.View style={[styles.labelLine, { opacity }]} />
            <Animated.View style={[styles.valueLine, { opacity }]} />
          </View>
        </View>
      </View>
      
      <Animated.View style={[styles.chevron, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: verticalScale(Spacing.lg),
    paddingHorizontal: horizontalScale(Spacing.md),
    marginBottom: Spacing.xs,
    ...Shadow.card,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: 'center' },
  iconContainer: {
    width: moderateScale(65),
    height: moderateScale(65),
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.backgroundGray,
  },
  content: {
    flex: 1,
    marginLeft: horizontalScale(Spacing.sm) },
  titleLine: {
    width: '70%',
    height: moderateScale(14),
    backgroundColor: BankingColors.backgroundGray,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs },
  refLine: {
    width: '50%',
    height: moderateScale(12),
    backgroundColor: BankingColors.backgroundGray,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md },
  details: {
    gap: Spacing.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  labelLine: {
    width: '35%',
    height: moderateScale(10),
    backgroundColor: BankingColors.backgroundGray,
    borderRadius: BorderRadius.sm },
  valueLine: {
    width: '40%',
    height: moderateScale(10),
    backgroundColor: BankingColors.backgroundGray,
    borderRadius: BorderRadius.sm },
  chevron: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.backgroundGray,
    marginRight: horizontalScale(Spacing.xs) } });
