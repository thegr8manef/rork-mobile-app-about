import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { BankingColors, Spacing, BorderRadius, Shadow } from "@/constants";

type Props = {
  count?: number;
};

const useShimmerOpacity = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.7] });
};

const AlertCardSkeleton: React.FC = () => {
  const opacity = useShimmerOpacity();

  return (
    <View style={styles.card}>
      {/* Header with title and switch */}
      <View style={styles.header}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.switchSkeleton, { opacity }]} />
      </View>

      {/* Details rows */}
      <View style={styles.details}>
        {/* Compte row */}
        <View style={styles.detailRow}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeletonLong, { opacity }]} />
        </View>

        {/* Montant minimum row */}
        <View style={styles.detailRow}>
          <Animated.View style={[styles.labelSkeletonMedium, { opacity }]} />
          <Animated.View style={[styles.valueSkeletonShort, { opacity }]} />
        </View>

        {/* Montant maximum row */}
        <View style={styles.detailRow}>
          <Animated.View style={[styles.labelSkeletonMedium, { opacity }]} />
          <Animated.View style={[styles.valueSkeletonShort, { opacity }]} />
        </View>

        {/* Date de fin row */}
        <View style={[styles.detailRow, { marginBottom: 0 }]}>
          <Animated.View style={[styles.labelSkeleton, { opacity }]} />
          <Animated.View style={[styles.valueSkeletonMedium, { opacity }]} />
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Animated.View style={[styles.buttonSkeleton, { opacity }]} />
        <Animated.View style={[styles.buttonSkeleton, { opacity }]} />
      </View>
    </View>
  );
};

export const AlertSkeleton: React.FC<Props> = ({ count = 3 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <AlertCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },

  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg },

  titleSkeleton: {
    width: 80,
    height: 22,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },

  switchSkeleton: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#FF5733" },

  details: {
    marginBottom: Spacing.lg },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md },

  labelSkeleton: {
    width: 90,
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },

  labelSkeletonMedium: {
    width: 140,
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },

  valueSkeletonShort: {
    width: 70,
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },

  valueSkeletonMedium: {
    width: 100,
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },

  valueSkeletonLong: {
    width: 200,
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },

  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md },

  buttonSkeleton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.border } });