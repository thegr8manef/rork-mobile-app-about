import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { BankingColors, Spacing, BorderRadius, Shadow } from "@/constants";
import { verticalScale } from "@/utils/scale";

function TitreSkeletonCard() {
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
      <View style={styles.cardHeader}>
        <Animated.View style={[styles.iconBox, { opacity }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.titleLine, { opacity }]} />
          <Animated.View style={[styles.refLine, { opacity }]} />
        </View>
      </View>

      <Animated.View style={[styles.latentBadge, { opacity }]} />

      <View style={styles.separator} />

      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.detailRow}>
          <Animated.View style={[styles.detailIcon, { opacity }]} />
          <Animated.View style={[styles.labelLine, { opacity }]} />
          <Animated.View style={[styles.valueLine, { opacity }]} />
        </View>
      ))}
    </View>
  );
}

export default function TitreSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {[...Array(count)].map((_, index) => (
        <TitreSkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md },
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: verticalScale(Spacing.lg),
    marginBottom: Spacing.md + 4,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.card },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.backgroundGray },
  headerText: {
    flex: 1 },
  titleLine: {
    width: "75%",
    height: 16,
    backgroundColor: BankingColors.backgroundGray,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs },
  refLine: {
    width: "45%",
    height: 13,
    backgroundColor: BankingColors.backgroundGray,
    borderRadius: BorderRadius.sm },
  latentBadge: {
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.backgroundGray,
    marginTop: Spacing.sm },
  separator: {
    height: 1,
    backgroundColor: BankingColors.border,
    marginVertical: Spacing.md },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm },
  detailIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: BankingColors.backgroundGray },
  labelLine: {
    flex: 1,
    height: 12,
    backgroundColor: BankingColors.backgroundGray,
    borderRadius: BorderRadius.sm },
  valueLine: {
    width: 80,
    height: 12,
    backgroundColor: BankingColors.backgroundGray,
    borderRadius: BorderRadius.sm } });
