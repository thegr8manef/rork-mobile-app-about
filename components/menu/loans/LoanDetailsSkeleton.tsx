import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BankingColors, BorderRadius, Spacing } from "@/constants";

const { width: SCREEN_W } = Dimensions.get("window");

type ShimmerProps = {
  height: number;
  width?: number | string;
  radius?: number;
  style?: any;
};

function ShimmerBlock({
  height,
  width = "100%",
  radius = 12,
  style }: ShimmerProps) {
  const translateX = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: SCREEN_W,
        duration: 1400, // a bit smoother
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  return (
    <View
      style={[
        styles.blockBase,
        { height, width, borderRadius: radius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmerWrap,
          {
            transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.28)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
}

function RowPair() {
  return (
    <View style={styles.detailRow}>
      <ShimmerBlock height={10} width="42%" radius={8} />
      <ShimmerBlock height={12} width="34%" radius={8} />
    </View>
  );
}

export default function LoanDetailsSkeleton() {
  const rows1 = useMemo(() => Array.from({ length: 3 }).map((_, i) => i), []);
  const rows2 = useMemo(() => Array.from({ length: 2 }).map((_, i) => i), []);

  return (
    <View style={styles.container}>
      {/* Space under header */}
      <View style={{ height: Spacing.lg }} />

      {/* Credit type badge (orange card in screenshot) */}
      <View style={styles.badge}>
        <ShimmerBlock
          height={44}
          width={44}
          radius={22}
          style={{ opacity: 0.55 }}
        />
        <View style={{ flex: 1, gap: 8 }}>
          <ShimmerBlock height={10} width="38%" radius={8} />
          <ShimmerBlock height={16} width="78%" radius={10} />
        </View>
      </View>

      {/* Circular progress ring */}
      <View style={styles.progressWrap}>
        <View style={styles.circleOuter}>
          {/* ring */}
          <ShimmerBlock height={220} width={220} radius={110} />

          {/* inner hole */}
          <View style={styles.circleInner} />

          {/* small top cap (like the little orange segment on top) */}
          <View style={styles.circleCap} />
        </View>

        {/* center text lines */}
        <View style={{ marginTop: Spacing.md, alignItems: "center", gap: 8 }}>
          <ShimmerBlock height={12} width={150} radius={8} />
          <ShimmerBlock height={18} width={110} radius={10} />
        </View>
      </View>

      {/* Summary row (2 columns) */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <ShimmerBlock height={10} width="70%" radius={8} />
          <View style={{ height: 10 }} />
          <ShimmerBlock height={18} width="80%" radius={10} />
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <ShimmerBlock height={10} width="70%" radius={8} />
          <View style={{ height: 10 }} />
          <ShimmerBlock height={18} width="80%" radius={10} />
        </View>
      </View>

      {/* Details card 1 */}
      <View style={styles.detailsCard}>
        <ShimmerBlock height={14} width="55%" radius={10} />
        <View style={{ height: Spacing.md }} />

        {rows1.map((i) => (
          <View key={i}>
            <RowPair />
            {i !== rows1.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>

      {/* Details card 2 */}
      <View style={styles.detailsCard}>
        <ShimmerBlock height={14} width="45%" radius={10} />
        <View style={{ height: Spacing.md }} />

        {rows2.map((i) => (
          <View key={i}>
            <RowPair />
            {i !== rows2.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.lg },

  // Shimmer base
  blockBase: {
    backgroundColor: BankingColors.borderGray, // cleaner than border
    opacity: 0.5,
    overflow: "hidden" },
  shimmerWrap: {
    ...StyleSheet.absoluteFillObject },
  shimmer: {
    flex: 1,
    width: SCREEN_W * 0.65 },

  // Badge
  badge: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border },

  // Progress
  progressWrap: {
    alignItems: "center",
    marginTop: Spacing.xl },
  circleOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center" },
  circleInner: {
    position: "absolute",
    width: 165,
    height: 165,
    borderRadius: 82.5,
    backgroundColor: BankingColors.background },
  circleCap: {
    position: "absolute",
    top: 10,
    width: 34,
    height: 14,
    borderRadius: 8,
    backgroundColor: BankingColors.borderGray,
    opacity: 0.6 },

  // Summary
  summaryCard: {
    marginTop: Spacing.xl,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.border },
  summaryCol: {
    flex: 1,
    alignItems: "center" },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: "80%",
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: Spacing.md },

  // Cards
  detailsCard: {
    marginTop: Spacing.lg,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12 },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)" } });