import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { BankingColors, Spacing, BorderRadius, Shadow } from "@/constants";
import { height, verticalScale, isSmalWidth } from "@/utils/scale";

// ✅ Match AccountCard minHeight exactly
const CARD_MIN_HEIGHT = height / 6;

interface AccountSkeletonProps {
  count?: number;
}

function ShimmerBlock({
  style,
  opacity }: {
  style: any;
  opacity: Animated.Value;
}) {
  return <Animated.View style={[style, { opacity }]} />;
}

function SkeletonCard({ opacity }: { opacity: Animated.Value }) {
  return (
    <View style={styles.card}>
      {/* Header: account name + eye icon */}
      <View style={styles.header}>
        <View style={styles.accountInfo}>
          <ShimmerBlock opacity={opacity} style={styles.accountNameBlock} />
          <ShimmerBlock opacity={opacity} style={styles.accountNumberBlock} />
        </View>
        <ShimmerBlock opacity={opacity} style={styles.eyeBlock} />
      </View>

      {/* Balances row */}
      <View style={styles.balancesRow}>
        <View style={styles.balanceCol}>
          <ShimmerBlock opacity={opacity} style={styles.balanceLabelBlock} />
          <ShimmerBlock opacity={opacity} style={styles.balanceValueBlock} />
        </View>
        <View style={styles.balanceCol}>
          <ShimmerBlock opacity={opacity} style={styles.balanceLabelBlock} />
          <ShimmerBlock opacity={opacity} style={styles.balanceValueBlock} />
        </View>
      </View>
    </View>
  );
}

export default function AccountSkeleton({ count = 1 }: AccountSkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} opacity={opacity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * ✅ Match AccountCard container exactly:
   * - same borderRadius, padding, margins, minHeight, borderLeft
   * - NO width:'90%' — fill the parent (CARD_WIDTH from carousel)
   */
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.surfaceSecondary,
    ...Shadow.card,
    minHeight: CARD_MIN_HEIGHT },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm },
  accountInfo: {
    flex: 1 },
  accountNameBlock: {
    width: "55%",
    height: isSmalWidth ? Spacing.md : Spacing.lg,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs },
  accountNumberBlock: {
    width: "45%",
    height: Spacing.md,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.sm },
  eyeBlock: {
    width: Spacing.xxl,
    height: Spacing.xxl,
    borderRadius: Spacing.md,
    backgroundColor: BankingColors.surfaceSecondary },

  balancesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.lg,
    marginTop: Spacing.xs },
  balanceCol: {
    flex: 1 },
  balanceLabelBlock: {
    width: "65%",
    height: 10,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
    marginTop: verticalScale(4) },
  balanceValueBlock: {
    width: "85%",
    height: Spacing.xl,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.sm } });