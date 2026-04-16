import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BankingColors, Spacing } from '@/constants';

interface SavingPlansSkeletonProps {
  count?: number;
}

const StatsCardSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7] });

  return (
    <View style={styles.statsCard}>
      <Animated.View style={[styles.statsIcon, { opacity }]} />
      <Animated.View style={[styles.statsCount, { opacity }]} />
      <Animated.View style={[styles.statsLabel, { opacity }]} />
      <Animated.View style={[styles.statsMessage, { opacity }]} />
    </View>
  );
};

const SubscriptionCardSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7] });

  return (
    <View style={styles.subscriptionCard}>
      <View style={styles.subscriptionHeader}>
        <Animated.View style={[styles.subscriptionIcon, { opacity }]} />
        <View style={styles.subscriptionInfo}>
          <Animated.View style={[styles.subscriptionTitle, { opacity }]} />
          <Animated.View style={[styles.subscriptionSource, { opacity }]} />
        </View>
        <Animated.View style={[styles.statusBadge, { opacity }]} />
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Animated.View style={[styles.detailLabel, { opacity }]} />
          <Animated.View style={[styles.detailValue, { opacity }]} />
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Animated.View style={[styles.detailLabel, { opacity }]} />
          <Animated.View style={[styles.detailValue, { opacity }]} />
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Animated.View style={[styles.detailLabel, { opacity }]} />
          <Animated.View style={[styles.detailValue, { opacity }]} />
        </View>
      </View>
      
      <View style={styles.editHint}>
        <Animated.View style={[styles.editHintSkeleton, { opacity }]} />
      </View>
    </View>
  );
};

const SectionHeaderSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7] });

  return (
    <View style={styles.sectionHeader}>
      <Animated.View style={[styles.sectionIcon, { opacity }]} />
      <Animated.View style={[styles.sectionTitle, { opacity }]} />
    </View>
  );
};

export default function SavingPlansSkeleton({ count = 2 }: SavingPlansSkeletonProps) {
  return (
    <View style={styles.container}>
      <StatsCardSkeleton />
      
      <View style={styles.subscriptionsSection}>
        <SectionHeaderSkeleton />
        <View style={styles.subscriptionsList}>
          {Array.from({ length: count }).map((_, index) => (
            <SubscriptionCardSkeleton key={index} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: Spacing.lg },
  statsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BankingColors.border,
    marginBottom: Spacing.md },
  statsCount: {
    width: 50,
    height: 36,
    borderRadius: 8,
    backgroundColor: BankingColors.border,
    marginBottom: 4 },
  statsLabel: {
    width: 140,
    height: 16,
    borderRadius: 4,
    backgroundColor: BankingColors.border,
    marginBottom: Spacing.md },
  statsMessage: {
    width: 200,
    height: 14,
    borderRadius: 4,
    backgroundColor: BankingColors.border },
  subscriptionsSection: {
    marginTop: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md },
  sectionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BankingColors.border },
  sectionTitle: {
    width: 140,
    height: 18,
    borderRadius: 4,
    backgroundColor: BankingColors.border },
  subscriptionsList: {
    gap: Spacing.md },
  subscriptionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F0F0F0' },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md },
  subscriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BankingColors.border,
    marginRight: Spacing.md },
  subscriptionInfo: {
    flex: 1,
    gap: 6 },
  subscriptionTitle: {
    width: 100,
    height: 16,
    borderRadius: 4,
    backgroundColor: BankingColors.border },
  subscriptionSource: {
    width: 70,
    height: 12,
    borderRadius: 4,
    backgroundColor: BankingColors.border },
  statusBadge: {
    width: 60,
    height: 26,
    borderRadius: 16,
    backgroundColor: BankingColors.border },
  detailsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Spacing.md },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6 },
  detailLabel: {
    width: 50,
    height: 10,
    borderRadius: 3,
    backgroundColor: BankingColors.border },
  detailValue: {
    width: 60,
    height: 14,
    borderRadius: 4,
    backgroundColor: BankingColors.border },
  detailDivider: {
    width: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 4 },
  editHint: {
    alignItems: 'center',
    marginTop: Spacing.md },
  editHintSkeleton: {
    width: 100,
    height: 12,
    borderRadius: 4,
    backgroundColor: BankingColors.border } });
