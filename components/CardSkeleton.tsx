import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { BankingColors } from '@/constants/banking-colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;

interface CardSkeletonProps {
  count?: number;
  showActions?: boolean;
  showUsageLimits?: boolean;
  showTransactions?: boolean;
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
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.bankInfoRow}>
          <Animated.View style={[styles.bankLogoSkeleton, { opacity }]} />
          <Animated.View style={[styles.bankNameSkeleton, { opacity }]} />
        </View>
        <View style={styles.activationRow}>
          <Animated.View style={[styles.activationTextSkeleton, { opacity }]} />
          <Animated.View style={[styles.switchSkeleton, { opacity }]} />
        </View>
      </View>

      <Animated.View style={[styles.cardNameSkeleton, { opacity }]} />
      <Animated.View style={[styles.cardNumberSkeleton, { opacity }]} />

      <View style={styles.cardFooter}>
        <View>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeleton, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

function SkeletonActions() {
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
    <View style={styles.actionsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.actionItem}>
          <Animated.View style={[styles.actionIconSkeleton, { opacity }]} />
          <Animated.View style={[styles.actionTextSkeleton, { opacity }]} />
        </View>
      ))}
    </View>
  );
}

function SkeletonUsageLimits() {
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
    <View style={styles.usageLimitsContainer}>
      <View style={styles.usageHeaderRow}>
        <Animated.View style={[styles.usageTitleSkeleton, { opacity }]} />
        <Animated.View style={[styles.usageAmountSkeleton, { opacity }]} />
      </View>

      <Animated.View style={[styles.progressBarSkeleton, { opacity }]} />

      <View style={styles.usageItemsContainer}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.usageItem}>
            <View style={styles.usageItemLeft}>
              <Animated.View style={[styles.usageIconSkeleton, { opacity }]} />
              <Animated.View style={[styles.usageTextSkeleton, { opacity }]} />
            </View>
            <Animated.View style={[styles.usageValueSkeleton, { opacity }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SkeletonTransactionItem() {
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
    <View style={styles.transactionItem}>
      <Animated.View style={[styles.transactionIconSkeleton, { opacity }]} />
      
      <View style={styles.transactionContent}>
        <View style={styles.transactionMainInfo}>
          <Animated.View style={[styles.transactionDescriptionSkeleton, { opacity }]} />
          <Animated.View style={[styles.transactionCategorySkeleton, { opacity }]} />
          <Animated.View style={[styles.transactionRecipientSkeleton, { opacity }]} />
        </View>
        
        <View style={styles.transactionRightSection}>
          <Animated.View style={[styles.transactionAmountSkeleton, { opacity }]} />
          <Animated.View style={[styles.transactionDateSkeleton, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

export default function CardSkeleton({ 
  count = 1, 
  showActions = true,
  showUsageLimits = true,
  showTransactions = true 
}: CardSkeletonProps) {
  return (
    <View style={styles.container}>
      <View style={styles.cardsSection}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index}>
            <SkeletonCard />
          </View>
        ))}
      </View>

      {showActions && (
        <View style={styles.actionsSection}>
          <SkeletonActions />
        </View>
      )}

      {showUsageLimits && (
        <View style={styles.usageLimitsSection}>
          <SkeletonUsageLimits />
        </View>
      )}

      {showTransactions && (
        <View style={styles.transactionsSection}>
          {[1, 2, 3].map((i) => (
            <SkeletonTransactionItem key={i} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },
  cardsSection: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    gap: 16 },
  cardContainer: {
    width: CARD_WIDTH,
    height: 200,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: 16,
    padding: 20 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24 },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 },
  bankLogoSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: BankingColors.overlayLight },
  bankNameSkeleton: {
    width: 80,
    height: 12,
    borderRadius: 4,
    backgroundColor: BankingColors.overlayLight },
  activationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 },
  activationTextSkeleton: {
    width: 60,
    height: 10,
    borderRadius: 4,
    backgroundColor: BankingColors.overlayLight },
  switchSkeleton: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: BankingColors.overlayLight },
  cardNameSkeleton: {
    width: '50%',
    height: 14,
    borderRadius: 4,
    backgroundColor: BankingColors.overlayLight,
    marginBottom: 16 },
  cardNumberSkeleton: {
    width: '70%',
    height: 20,
    borderRadius: 4,
    backgroundColor: BankingColors.overlayLight,
    marginBottom: 24 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between' },
  labelSkeleton: {
    width: 80,
    height: 10,
    borderRadius: 4,
    backgroundColor: BankingColors.overlayLight,
    marginBottom: 4 },
  valueSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 4,
    backgroundColor: BankingColors.overlayLight },
  actionsSection: {
    marginBottom: 24,
    paddingHorizontal: 32 },
  actionsRow: {
    flexDirection: 'row',
    gap: 16 },
  actionItem: {
    alignItems: 'center',
    minWidth: 70 },
  actionIconSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BankingColors.surfaceSecondary,
    marginBottom: 8 },
  actionTextSkeleton: {
    width: 60,
    height: 10,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },
  usageLimitsSection: {
    paddingHorizontal: 32,
    marginBottom: 24 },
  usageLimitsContainer: {
    backgroundColor: BankingColors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3 },
  usageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12 },
  usageTitleSkeleton: {
    width: 140,
    height: 16,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },
  usageAmountSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },
  progressBarSkeleton: {
    height: 8,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary,
    marginBottom: 24 },
  usageItemsContainer: {
    gap: 20 },
  usageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  usageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1 },
  usageIconSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankingColors.surfaceSecondary },
  usageTextSkeleton: {
    width: 120,
    height: 14,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },
  usageValueSkeleton: {
    width: 80,
    height: 16,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },
  transactionsSection: {
    paddingHorizontal: 32 },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BankingColors.surface,
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2 },
  transactionIconSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankingColors.surfaceSecondary,
    marginRight: 12 },
  transactionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  transactionMainInfo: {
    flex: 1,
    marginRight: 12 },
  transactionDescriptionSkeleton: {
    width: '60%',
    height: 16,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: 4,
    marginBottom: 6 },
  transactionCategorySkeleton: {
    width: '40%',
    height: 12,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: 4,
    marginBottom: 6 },
  transactionRecipientSkeleton: {
    width: '50%',
    height: 12,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: 4 },
  transactionRightSection: {
    alignItems: 'flex-end' },
  transactionAmountSkeleton: {
    width: 80,
    height: 16,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: 4,
    marginBottom: 6 },
  transactionDateSkeleton: {
    width: 60,
    height: 12,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: 4 } });
