import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { BankingColors, Spacing, BorderRadius } from "@/constants";

type Props = { count?: number };

function Shimmer({ style, opacity }: { style: any; opacity: Animated.Value }) {
  return <Animated.View style={[style, { opacity }]} />;
}

function SkeletonCard({ opacity }: { opacity: Animated.Value }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Shimmer opacity={opacity} style={styles.iconCircle} />
        <View style={styles.info}>
          <Shimmer opacity={opacity} style={styles.titleBar} />
          <Shimmer opacity={opacity} style={styles.dateBar} />
          <Shimmer opacity={opacity} style={styles.ribBar} />
        </View>
        <View style={styles.amountCol}>
          <Shimmer opacity={opacity} style={styles.amountBar} />
          <Shimmer opacity={opacity} style={styles.statusPill} />
        </View>
      </View>
      {/* Action row skeleton */}
      <View style={styles.actionRowSkeleton}>
        <Shimmer opacity={opacity} style={styles.actionBtn} />
        <Shimmer opacity={opacity} style={styles.actionBtn} />
        <Shimmer opacity={opacity} style={styles.actionBtn} />
      </View>
    </View>
  );
}

export default function ReloadHistorySkeleton({ count = 5 }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
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
    <View style={styles.container}>
      {/* Filter pills skeleton */}
      <View style={styles.filterRow}>
        <Shimmer opacity={opacity} style={styles.filterPill} />
        <Shimmer opacity={opacity} style={styles.filterPillWide} />
        <Shimmer opacity={opacity} style={styles.filterPill} />
        <Shimmer opacity={opacity} style={styles.filterPillWide} />
      </View>

      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} opacity={opacity} />
      ))}
    </View>
  );
}

const BONE = BankingColors.surfaceSecondary ?? BankingColors.border;

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg, gap: Spacing.md },

  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm },
  filterPill: {
    height: 34,
    width: 70,
    borderRadius: 17,
    backgroundColor: BONE },
  filterPillWide: {
    height: 34,
    width: 100,
    borderRadius: 17,
    backgroundColor: BONE },

  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BONE },
  info: { flex: 1, gap: 8 },
  titleBar: {
    height: 14,
    width: "70%",
    borderRadius: 4,
    backgroundColor: BONE },
  dateBar: {
    height: 12,
    width: "50%",
    borderRadius: 4,
    backgroundColor: BONE },
  ribBar: {
    height: 12,
    width: "60%",
    borderRadius: 4,
    backgroundColor: BONE },
  amountCol: { alignItems: "flex-end", gap: 8 },
  amountBar: {
    height: 14,
    width: 80,
    borderRadius: 4,
    backgroundColor: BONE },
  statusPill: {
    height: 22,
    width: 64,
    borderRadius: 11,
    backgroundColor: BONE },

  actionRowSkeleton: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border },
  actionBtn: {
    height: 30,
    width: 80,
    borderRadius: 6,
    backgroundColor: BONE } });