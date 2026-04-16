import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import {
  BankingColors,
  Spacing,
  BorderRadius,
  Shadow,
  IconSize } from "@/constants";

interface TransactionSkeletonProps {
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

function SkeletonRow({ opacity }: { opacity: Animated.Value }) {
  return (
    <View style={styles.row}>
      {/* Left: icon circle */}
      <ShimmerBlock opacity={opacity} style={styles.iconCircle} />

      <View style={styles.content}>
        {/* Middle: 2 text lines */}
        <View style={styles.textCol}>
          <ShimmerBlock opacity={opacity} style={styles.titleBlock} />
          <ShimmerBlock opacity={opacity} style={styles.subtitleBlock} />
        </View>

        {/* Right: amount + date */}
        <View style={styles.rightCol}>
          <ShimmerBlock opacity={opacity} style={styles.amountBlock} />
          <ShimmerBlock opacity={opacity} style={styles.dateBlock} />
        </View>
      </View>
    </View>
  );
}

export default function TransactionSkeleton({
  count = 3 }: TransactionSkeletonProps) {
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
        <SkeletonRow key={i} opacity={opacity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * ✅ Match RecentTransactionsListItem container exactly:
   * - same padding, marginHorizontal, marginVertical, borderRadius, shadow
   */
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    ...Shadow.sm },
  iconCircle: {
    width: IconSize.xl,
    height: IconSize.xl,
    borderRadius: IconSize.xl / 2,
    backgroundColor: BankingColors.surfaceSecondary,
    marginRight: Spacing.md },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center" },
  textCol: {
    flex: 1,
    marginRight: Spacing.md,
    justifyContent: "center" },
  titleBlock: {
    width: "65%",
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm },
  subtitleBlock: {
    width: "45%",
    height: 12,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.sm },
  rightCol: {
    alignItems: "flex-end",
    justifyContent: "center" },
  amountBlock: {
    width: 85,
    height: 14,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm },
  dateBlock: {
    width: 65,
    height: 12,
    backgroundColor: BankingColors.surfaceSecondary,
    borderRadius: BorderRadius.sm } });